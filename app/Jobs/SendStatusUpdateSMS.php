<?php

namespace App\Jobs;

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
        public ?string $phone = null
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

            // Re-throw exception if attempts remain so Laravel Queue retries with backoff (skipped in unit testing)
            if ($currentAttempt < $this->tries && ! app()->environment('testing')) {
                throw new \RuntimeException($errorMsg);
            }
        } else {
            Log::info("SMS successfully sent for Order #JFS-{$order->id} to {$recipientPhone} on attempt {$currentAttempt}.");
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(?Throwable $exception): void
    {
        $errorDetails = $exception ? $exception->getMessage() : 'Job exceeded maximum retry attempts.';
        Log::error("SMS Job permanently failed for Order #JFS-{$this->orderId}. Reason: {$errorDetails}");

        $order = Order::find($this->orderId);
        $phone = $this->phone ?: ($order ? $order->recipient_phone : 'unknown');

        SmsLog::create([
            'order_id' => $this->orderId,
            'phone_number' => NotificationService::formatPhoneNumber($phone),
            'message' => "Order #JFS-{$this->orderId} status notification failed.",
            'gateway' => 'none',
            'status' => 'failed',
            'attempts' => $this->tries,
            'error_details' => "Job failed after {$this->tries} attempts: ".$errorDetails,
        ]);
    }

    /**
     * Construct human-friendly SMS message according to status event.
     */
    protected function buildSmsMessage(Order $order, string $eventType): string
    {
        return match ($eventType) {
            'new_order_alert' => SmsTemplates::newOrderAlert($order->id, $order->recipient_name, (float) $order->total_price),
            'payment_review_alert' => SmsTemplates::paymentReviewAlert($order->id),
            'order_cancelled_customer' => SmsTemplates::customerCancelledAlert($order->id, $order->recipient_name),
            'confirmed' => SmsTemplates::orderConfirmed($order->id),
            'preparing', 'shipped' => SmsTemplates::orderPreparing($order->id),
            'delivered' => SmsTemplates::orderDelivered($order->id),
            'payment_received', 'payment_verified' => SmsTemplates::paymentVerified($order->id, (float) $order->total_price),
            'payment_failed', 'payment_rejected' => SmsTemplates::paymentRejected($order->id),
            'payment_underpaid' => SmsTemplates::paymentUnderpaid($order->id),
            'payment_overpaid' => SmsTemplates::paymentOverpaid($order->id),
            'cancelled' => SmsTemplates::orderCancelled($order->id),
            default => SmsTemplates::statusUpdate($order->id, $order->status),
        };
    }
}
