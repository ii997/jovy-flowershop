<?php

namespace Tests\Feature;

use App\Jobs\SendStatusUpdateSMS;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class SmsNotificationJobTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['sms.test_mode' => false]);
    }

    public function test_order_status_change_dispatches_sms_job_on_sms_queue()
    {
        Queue::fake();

        $order = Order::create([
            'user_id' => null,
            'order_type' => 'purchase',
            'recipient_name' => 'John Doe',
            'recipient_phone' => '09171234567',
            'pickup_date' => now()->addDays(2)->format('Y-m-d'),
            'pickup_time' => '09:00',
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
            'pickup_time' => '09:00',
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
            'pickup_time' => '09:00',
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

    public function test_send_status_update_sms_job_executes_via_android_gateway()
    {
        Http::fake([
            'https://api.sms-gate.app/*' => Http::response(['status' => 'success', 'id' => 'msg-123'], 200),
        ]);

        config([
            'sms.default' => 'android_gateway',
            'sms.gateways.android_gateway.endpoint' => 'https://api.sms-gate.app/3rdparty/v1/message',
            'sms.gateways.android_gateway.login' => 'F4ZI0I',
            'sms.gateways.android_gateway.password' => 'peyymjprxx3cu7',
            'sms.gateways.android_gateway.sim_number' => 1,
        ]);

        $order = Order::create([
            'user_id' => null,
            'order_type' => 'purchase',
            'recipient_name' => 'Charlie Day',
            'recipient_phone' => '09175556666',
            'pickup_date' => now()->addDays(1)->format('Y-m-d'),
            'pickup_time' => '09:00',
            'items' => [],
            'total_price' => 3000.00,
            'status' => 'confirmed',
            'payment_status' => 'pending',
        ]);

        $job = new SendStatusUpdateSMS($order->id, 'confirmed', $order->recipient_phone);
        $job->handle();

        $this->assertDatabaseHas('sms_logs', [
            'order_id' => $order->id,
            'gateway' => 'android_gateway',
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
            'pickup_time' => '09:00',
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

    public function test_customer_cancellation_dispatches_sms_job_to_admin()
    {
        Queue::fake();

        $settingsPath = storage_path('app/settings.json');
        if (! file_exists(dirname($settingsPath))) {
            mkdir(dirname($settingsPath), 0755, true);
        }
        file_put_contents($settingsPath, json_encode(['phone' => '+639179998888']));

        $user = User::factory()->create();

        $order = Order::create([
            'user_id' => $user->id,
            'order_type' => 'purchase',
            'recipient_name' => 'Jane Smith',
            'recipient_phone' => '09171234567',
            'pickup_date' => now()->addDays(2)->format('Y-m-d'),
            'pickup_time' => '09:00',
            'items' => [],
            'total_price' => 1200.00,
            'status' => 'confirmed',
            'payment_status' => 'pending',
        ]);

        $response = $this->actingAs($user)->postJson("/api/orders/{$order->id}/cancel", [
            'reason' => 'Need to cancel this order due to schedule conflict.',
        ]);

        $response->assertStatus(200);

        Queue::assertPushedOn('sms', SendStatusUpdateSMS::class, function ($job) use ($order) {
            return $job->orderId === $order->id && $job->eventType === 'order_cancelled_customer' && $job->phone === '+639179998888';
        });

        if (file_exists($settingsPath)) {
            unlink($settingsPath);
        }
    }

    public function test_new_order_submission_dispatches_sms_alert_to_admin()
    {
        Queue::fake();

        $settingsPath = storage_path('app/settings.json');
        if (! file_exists(dirname($settingsPath))) {
            mkdir(dirname($settingsPath), 0755, true);
        }
        file_put_contents($settingsPath, json_encode(['phone' => '+639179998888']));

        $user = User::factory()->create();
        $product = Product::create([
            'name' => 'Rose Bouquet',
            'slug' => 'rose-bouquet',
            'price' => 1500.00,
            'description' => 'Fresh red roses',
            'category' => 'Bouquet',
            'availability' => true,
            'image' => '/images/rose.jpg',
            'stock_quantity' => 10,
            'occasions' => ['Birthday'],
            'seasons' => ['Spring'],
            'gallery' => ['/images/rose.jpg'],
            'stems' => ['Roses' => 12],
        ]);

        $response = $this->actingAs($user)->postJson('/api/orders', [
            'order_type' => 'purchase',
            'recipient_name' => 'Maria Clara',
            'recipient_phone' => '09171234567',
            'pickup_date' => now()->addDays(2)->format('Y-m-d'),
            'pickup_time' => '09:00',
            'items' => [
                ['id' => $product->id, 'quantity' => 1],
            ],
        ]);

        $response->assertStatus(200);
        $orderId = $response->json('id');

        Queue::assertPushedOn('sms', SendStatusUpdateSMS::class, function ($job) use ($orderId) {
            return $job->orderId === $orderId && $job->eventType === 'new_order_alert' && $job->phone === '+639179998888';
        });

        if (file_exists($settingsPath)) {
            unlink($settingsPath);
        }
    }

    public function test_payment_proof_upload_dispatches_sms_review_alert_to_admin()
    {
        Queue::fake();

        $settingsPath = storage_path('app/settings.json');
        if (! file_exists(dirname($settingsPath))) {
            mkdir(dirname($settingsPath), 0755, true);
        }
        file_put_contents($settingsPath, json_encode(['phone' => '+639179998888']));

        $user = User::factory()->create();

        $order = Order::create([
            'user_id' => $user->id,
            'order_type' => 'purchase',
            'recipient_name' => 'John Doe',
            'recipient_phone' => '09171234567',
            'pickup_date' => now()->addDays(2)->format('Y-m-d'),
            'pickup_time' => '09:00',
            'items' => [],
            'total_price' => 1500.00,
            'status' => 'confirmed',
            'payment_status' => 'pending',
        ]);

        Storage::fake('public');
        $file = UploadedFile::fake()->image('receipt.jpg');

        $response = $this->actingAs($user)->postJson("/api/orders/{$order->id}/payment", [
            'reference_no' => 'GCASH-123456',
            'receipt' => $file,
            'amount' => 1500.00,
        ]);

        $response->assertStatus(200);

        Queue::assertPushedOn('sms', SendStatusUpdateSMS::class, function ($job) use ($order) {
            return $job->orderId === $order->id && $job->eventType === 'payment_review_alert' && $job->phone === '+639179998888';
        });

        if (file_exists($settingsPath)) {
            unlink($settingsPath);
        }
    }
}
