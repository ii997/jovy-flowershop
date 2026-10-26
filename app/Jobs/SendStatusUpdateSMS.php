<?php

namespace App\Jobs;

use App\Models\NotificationDelivery;
use App\Models\Order;
use App\Models\SmsLog;
use App\Services\NotificationService;
use App\Services\SmsTemplates;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Throwable;

class SendStatusUpdateSMS implements ShouldQueue
{
    use InteractsWithQueue, Queueable, SerializesModels;

    /**
     * The number of times the job may be attempted.
     */
    public int $tries = 3;

    /**
     * Delete the job if its models no longer exist.
     */
    public bool $deleteWhenMissingModels = true;

    /**
     * Calculate the number of seconds to wait before retrying the job.
     */
    public function backoff(): array
    {
        return [10, 30, 60];
    }

    /**
     * Create a new job instance.
     */
    public function __construct(
        public int $orderId,
        public string $eventType,
        public ?string $phone = null,
        public ?int $deliveryId = null,
    ) {
        $this->onQueue(config('sms.queue', 'sms'));
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $currentAttempt = $this->attempts();
        Log::info("SMS Job Attempt {$currentAttempt}/{$this->tries} for Order #JFS-{$this->orderId} (Event: {$this->eventType})");

        $order = Order::find($this->orderId);

        if (! $order) {
            Log::warning("SMS Job cancelled: Order #JFS-{$this->orderId} not found.");

            return;
        }

        $recipientPhone = $this->phone ?: $order->recipient_phone;

        if (empty($recipientPhone)) {
            Log::warning("SMS Job cancelled: No recipient phone number for Order #JFS-{$order->id}.");

            return;
        }

        $message = $this->buildSmsMessage($order, $this->eventType);

        $delivery = $this->deliveryId ? NotificationDelivery::find($this->deliveryId) : null;
        if ($delivery?->status === 'sent') {
            return;
        }
        $delivery?->update([
            'status' => 'sending',
            'attempts' => $currentAttempt,
        ]);

        // Dispatch SMS via NotificationService and pass order context and current attempt
        $success = NotificationService::sendSmsDirect(
            $recipientPhone,
            $message,
            $order->id,
            $currentAttempt
        );

        if (! $success) {
            $errorMsg = "SMS dispatch attempt {$currentAttempt} failed for Order #JFS-{$order->id} to {$recipientPhone}.";
            Log::warning($errorMsg);
            $delivery?->update([
                'status' => $currentAttempt < $this->tries ? 'retrying' : 'failed',
                'error_details' => NotificationService::safeFailureReason('sms'),
            ]);

            // Re-throw exception if attempts remain so Laravel Queue retries with backoff (skipped in unit testing)
            if ($currentAttempt < $this->tries && ! app()->environment('testing')) {
                throw new \RuntimeException($errorMsg);
            }
        } else {
            $delivery?->update([
                'status' => 'sent',
                'sent_at' => now(),
                'error_details' => null,
            ]);
            Log::info("SMS successfully sent for Order #JFS-{$order->id} to {$recipientPhone} on attempt {$currentAttempt}.");
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(?Throwable $exception): void
    {
        $errorDetails = NotificationService::safeFailureReason('sms', $exception);
        Log::error("SMS Job permanently failed for Order #JFS-{$this->orderId}.", [
            'reason' => $errorDetails,
        ]);

        $order = Order::find($this->orderId);
        $phone = $this->phone ?: ($order ? $order->recipient_phone : 'unknown');

        SmsLog::create([
            'order_id' => $this->orderId,
            'phone_number' => NotificationService::formatPhoneNumber($phone),
            'message' => "Order #JFS-{$this->orderId} status notification failed.",
            'gateway' => 'none',
            'status' => 'failed',
            'attempts' => $this->tries,
            'error_details' => "Job failed after {$this->tries} attempts: {$errorDetails}",
        ]);

        if ($this->deliveryId) {
            NotificationDelivery::whereKey($this->deliveryId)->update([
                'status' => 'failed',
                'attempts' => $this->tries,
                'error_details' => $errorDetails,
            ]);
        }
    }

    /**
     * Construct human-friendly SMS message according to status event.
     */
    protected function buildSmsMessage(Order $order, string $eventType): string
    {
        return SmsTemplates::forEvent($order->id, $eventType, $order->recipient_name, (float) $order->total_price);
    }
}
