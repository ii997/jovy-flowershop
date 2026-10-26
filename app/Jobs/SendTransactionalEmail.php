<?php

namespace App\Jobs;

use App\Mail\TransactionalNotificationMail;
use App\Models\NotificationDelivery;
use App\Services\NotificationService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

class SendTransactionalEmail implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public function __construct(public int $deliveryId)
    {
        $this->onQueue(config('mail.queue', 'default'));
    }

    public function backoff(): array
    {
        return [10, 30, 60];
    }

    public function handle(): void
    {
        $delivery = NotificationDelivery::find($this->deliveryId);
        if (! $delivery || $delivery->status === 'sent') {
            return;
        }

        $delivery->update([
            'status' => 'sending',
            'attempts' => $this->attempts(),
        ]);

        try {
            $orderReference = $delivery->order_id ? '#JFS-'.$delivery->order_id : 'N/A';
            $supportPhone = data_get($this->settings(), 'phone');

            Mail::to($delivery->recipient)->send(new TransactionalNotificationMail(
                title: $delivery->subject ?: 'Jovy\'s Flowershop update',
                body: $delivery->message,
                orderReference: $orderReference,
                supportPhone: $supportPhone,
            ));

            $delivery->update([
                'status' => 'sent',
                'sent_at' => now(),
                'error_details' => null,
            ]);
        } catch (Throwable $exception) {
            $delivery->update([
                'status' => $this->attempts() < $this->tries ? 'retrying' : 'failed',
                'error_details' => NotificationService::safeFailureReason('email', $exception),
            ]);

            throw $exception;
        }
    }

    public function failed(?Throwable $exception): void
    {
        $delivery = NotificationDelivery::find($this->deliveryId);
        $delivery?->update([
            'status' => 'failed',
            'attempts' => $this->tries,
            'error_details' => NotificationService::safeFailureReason('email', $exception),
        ]);

        Log::error('Transactional email permanently failed.', [
            'delivery_id' => $this->deliveryId,
            'reason' => NotificationService::safeFailureReason('email', $exception),
        ]);
    }

    private function settings(): array
    {
        $path = storage_path('app/settings.json');

        return file_exists($path) ? (json_decode(file_get_contents($path), true) ?: []) : [];
    }
}
