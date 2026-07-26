<?php

namespace Tests\Feature;

use App\Jobs\SendStatusUpdateSMS;
use App\Models\Order;
use App\Models\SmsLog;
use App\Services\NotificationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class SmsNotificationJobTest extends TestCase
{
    use RefreshDatabase;

    public function test_order_status_change_dispatches_sms_job_on_sms_queue()
    {
        Queue::fake();

        $order = Order::create([
            'user_id' => null,
            'order_type' => 'purchase',
            'recipient_name' => 'John Doe',
            'recipient_phone' => '09171234567',
            'pickup_date' => now()->addDays(2)->format('Y-m-d'),
            'items' => [],
            'total_price' => 1500.00,
            'status' => 'confirmed',
            'payment_status' => 'pending',
        ]);

        NotificationService::send(
            null,
            'Order Status Updated',
            'Your order is now being prepared.',
            'preparing',
            false,
            true,
            $order->recipient_phone,
            $order->id
        );

        Queue::assertPushedOn('sms', SendStatusUpdateSMS::class, function ($job) use ($order) {
            return $job->orderId === $order->id && $job->eventType === 'preparing';
        });
    }

    public function test_send_status_update_sms_job_executes_and_logs_sent_sms()
    {
        Http::fake([
            'https://api.httpsms.com/*' => Http::response(['status' => 'success'], 200),
        ]);

        config([
            'sms.default' => 'httpsms',
            'sms.gateways.httpsms.key' => 'fake_api_key',
            'sms.gateways.httpsms.from' => '+639170000000',
            'services.httpsms.key' => 'fake_api_key',
            'services.httpsms.from' => '+639170000000',
        ]);

        $order = Order::create([
            'user_id' => null,
            'order_type' => 'purchase',
            'recipient_name' => 'Jane Smith',
            'recipient_phone' => '09179876543',
            'pickup_date' => now()->addDays(1)->format('Y-m-d'),
            'items' => [],
            'total_price' => 2000.00,
            'status' => 'confirmed',
            'payment_status' => 'pending',
        ]);

        $job = new SendStatusUpdateSMS($order->id, 'confirmed', $order->recipient_phone);
        $job->handle();

        $this->assertDatabaseHas('sms_logs', [
            'order_id' => $order->id,
            'gateway' => 'httpsms',
            'status' => 'sent',
        ]);
    }

    public function test_send_status_update_sms_job_executes_via_textbee_when_textbee_is_default()
    {
        Http::fake([
            'https://api.textbee.dev/*' => Http::response(['status' => 'success'], 200),
        ]);

        config([
            'sms.default' => 'textbee',
            'sms.gateways.textbee.key' => 'valid_textbee_key',
            'sms.gateways.textbee.device_id' => 'valid_device_id',
            'services.textbee.key' => 'valid_textbee_key',
            'services.textbee.device_id' => 'valid_device_id',
        ]);

        $order = Order::create([
            'user_id' => null,
            'order_type' => 'purchase',
            'recipient_name' => 'Bob Builder',
            'recipient_phone' => '09179998888',
            'pickup_date' => now()->addDays(1)->format('Y-m-d'),
            'items' => [],
            'total_price' => 2500.00,
            'status' => 'confirmed',
            'payment_status' => 'pending',
        ]);

        $job = new SendStatusUpdateSMS($order->id, 'confirmed', $order->recipient_phone);
        $job->handle();

        $this->assertDatabaseHas('sms_logs', [
            'order_id' => $order->id,
            'gateway' => 'textbee',
            'status' => 'sent',
        ]);
    }

    public function test_sms_fallback_to_textbee_when_httpsms_fails()
    {
        Http::fake([
            'https://api.httpsms.com/*' => Http::response(['message' => 'Unauthorized'], 401),
            'https://api.textbee.dev/*' => Http::response(['status' => 'success'], 200),
        ]);

        config([
            'sms.default' => 'httpsms',
            'sms.gateways.httpsms.key' => 'invalid_key',
            'sms.gateways.httpsms.from' => '+639170000000',
            'sms.gateways.textbee.key' => 'valid_textbee_key',
            'sms.gateways.textbee.device_id' => 'valid_device_id',
            'services.httpsms.key' => 'invalid_key',
            'services.httpsms.from' => '+639170000000',
            'services.textbee.key' => 'valid_textbee_key',
            'services.textbee.device_id' => 'valid_device_id',
        ]);

        $order = Order::create([
            'user_id' => null,
            'order_type' => 'purchase',
            'recipient_name' => 'Alice Park',
            'recipient_phone' => '09181112222',
            'pickup_date' => now()->addDays(3)->format('Y-m-d'),
            'items' => [],
            'total_price' => 3500.00,
            'status' => 'delivered',
            'payment_status' => 'verified',
        ]);

        $job = new SendStatusUpdateSMS($order->id, 'delivered', $order->recipient_phone);
        $job->handle();

        $this->assertDatabaseHas('sms_logs', [
            'order_id' => $order->id,
            'gateway' => 'textbee',
            'status' => 'sent',
        ]);
    }
}
