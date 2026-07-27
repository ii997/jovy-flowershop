<?php

namespace App\Jobs;

use App\Models\Order;
use App\Models\SmsLog;
use App\Services\NotificationService;
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

        if (!$order) {
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

        if (!$success) {
            $errorMsg = "SMS dispatch attempt {$currentAttempt} failed for Order #JFS-{$order->id} to {$recipientPhone}.";
            Log::warning($errorMsg);

            // Re-throw exception if attempts remain so Laravel Queue retries with backoff (skipped in unit testing)
            if ($currentAttempt < $this->tries && !app()->environment('testing')) {
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
            'error_details' => "Job failed after {$this->tries} attempts: " . $errorDetails,
        ]);
    }

    /**
     * Construct human-friendly SMS message according to status event.
     */
    protected function buildSmsMessage(Order $order, string $eventType): string
    {
        return match ($eventType) {
            'new_order_alert' => "Jovy's Flowershop Alert: New order #JFS-{$order->id} submitted by {$order->recipient_name}. Total: ₱{$order->total_price}.",
            'order_cancelled_customer' => "Jovy's Flowershop Alert: Order #JFS-{$order->id} was cancelled by customer {$order->recipient_name}.",
            'confirmed' => "Jovy's Flowershop: Order #JFS-{$order->id} has been confirmed. Thank you!",
            'preparing', 'shipped' => "Jovy's Flowershop: Order #JFS-{$order->id} is now being prepared for pickup!",
            'delivered' => "Jovy's Flowershop: Order #JFS-{$order->id} is ready for pickup / completed. Thank you for choosing us!",
            'payment_received', 'payment_verified' => "Jovy's Flowershop: Payment for Order #JFS-{$order->id} (₱{$order->total_price}) has been verified.",
            'payment_failed', 'payment_rejected' => "Jovy's Flowershop: Payment proof for Order #JFS-{$order->id} could not be verified. Please re-submit proof.",
            'payment_underpaid' => "Jovy's Flowershop: Payment for Order #JFS-{$order->id} is underpaid. Please re-submit payment for remaining balance.",
            'payment_overpaid' => "Jovy's Flowershop: Payment for Order #JFS-{$order->id} was overpaid. Excess amount will be refunded.",
            'cancelled' => "Jovy's Flowershop: Order #JFS-{$order->id} has been cancelled.",
            default => "Jovy's Flowershop: Update for Order #JFS-{$order->id}. Status: " . ucfirst($order->status),
        };
    }
}
