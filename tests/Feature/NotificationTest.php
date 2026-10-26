<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Jobs\SendStatusUpdateSMS;
use App\Jobs\SendTransactionalEmail;
use App\Mail\TransactionalNotificationMail;
use App\Models\Notification;
use App\Models\NotificationDelivery;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use App\Services\NotificationService;
use App\Services\SmsTemplates;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class NotificationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Setup settings.json mock
        $settingsPath = storage_path('app/settings.json');
        if (! file_exists(dirname($settingsPath))) {
            mkdir(dirname($settingsPath), 0755, true);
        }
        file_put_contents($settingsPath, json_encode([
            'name' => "Jovy's Flowershop",
            'phone' => '+639171234567',
            'address' => '123 Rizal Ave, Makati',
            'downpayment_pct' => 30,
        ]));

        config(['services.httpsms.key' => 'test-api-key']);
        config(['services.httpsms.from' => '+639171111111']);
        config(['sms.test_mode' => false]);

        // Seed products and inventory
        $this->seed(DatabaseSeeder::class);
    }

    protected function tearDown(): void
    {
        $settingsPath = storage_path('app/settings.json');
        if (file_exists($settingsPath)) {
            unlink($settingsPath);
        }
        parent::tearDown();
    }

    public function test_customers_can_fetch_their_notifications_only(): void
    {
        $customer = User::factory()->create(['role' => UserRole::Customer]);
        $otherCustomer = User::factory()->create(['role' => UserRole::Customer]);

        // Create notification for customer
        Notification::create([
            'user_id' => $customer->id,
            'title' => 'Customer Alert',
            'message' => 'Your order is ready',
            'type' => 'test',
            'is_admin' => false,
        ]);

        // Create admin notification
        Notification::create([
            'user_id' => null,
            'title' => 'Admin Alert',
            'message' => 'New Order Submitted',
            'type' => 'test',
            'is_admin' => true,
        ]);

        // Create other customer notification
        Notification::create([
            'user_id' => $otherCustomer->id,
            'title' => 'Other Customer Alert',
            'message' => 'Other order',
            'type' => 'test',
            'is_admin' => false,
        ]);

        $response = $this->actingAs($customer)->getJson('/api/notifications');

        $response->assertStatus(200)
            ->assertJsonCount(1)
            ->assertJsonFragment(['title' => 'Customer Alert'])
            ->assertJsonMissing(['title' => 'Admin Alert'])
            ->assertJsonMissing(['title' => 'Other Customer Alert']);
    }

    public function test_admins_can_fetch_admin_and_personal_notifications(): void
    {
        $admin = User::factory()->create(['role' => UserRole::Admin]);
        $customer = User::factory()->create(['role' => UserRole::Customer]);

        Notification::create([
            'user_id' => $customer->id,
            'title' => 'Customer Alert',
            'message' => 'Your order is ready',
            'type' => 'test',
            'is_admin' => false,
        ]);

        Notification::create([
            'user_id' => null,
            'title' => 'Admin Alert',
            'message' => 'New Order Submitted',
            'type' => 'test',
            'is_admin' => true,
        ]);

        $response = $this->actingAs($admin)->getJson('/api/notifications');

        $response->assertStatus(200)
            ->assertJsonCount(1)
            ->assertJsonFragment(['title' => 'Admin Alert'])
            ->assertJsonMissing(['title' => 'Customer Alert']);
    }

    public function test_users_can_mark_notifications_as_read(): void
    {
        $customer = User::factory()->create(['role' => UserRole::Customer]);
        $notification = Notification::create([
            'user_id' => $customer->id,
            'title' => 'Unread Notification',
            'message' => 'Hello',
            'type' => 'test',
            'is_admin' => false,
        ]);

        $this->assertNull($notification->read_at);

        $response = $this->actingAs($customer)->postJson('/api/notifications/read', [
            'ids' => [$notification->id],
        ]);

        $response->assertStatus(200);
        $this->assertNotNull($notification->fresh()->read_at);
    }

    public function test_checkout_triggers_notifications_and_dispatches_sms(): void
    {
        Queue::fake();

        $customer = User::factory()->create(['role' => UserRole::Customer]);
        $product = Product::first(); // Grab seeded product
        $product->availability = true;
        $product->save();

        $response = $this->actingAs($customer)->postJson('/api/orders', [
            'order_type' => 'purchase',
            'recipient_name' => 'John Doe',
            'recipient_phone' => '+639170000000',
            'pickup_date' => now()->addDays(2)->format('Y-m-d'),
            'wrapper_type' => 'Classic Kraft Paper',
            'gift_message' => 'Happy Birthday!',
            'items' => [
                ['id' => $product->id, 'quantity' => 1],
            ],
        ]);

        $response->assertStatus(200);

        // Verify customer notification exists in DB
        $this->assertDatabaseHas('notifications', [
            'user_id' => $customer->id,
            'title' => 'Order Submitted Successfully',
            'is_admin' => false,
        ]);

        // Verify admin notification exists in DB
        $this->assertDatabaseHas('notifications', [
            'user_id' => null,
            'title' => 'New Order Submitted',
            'is_admin' => true,
        ]);

        // Verify SendStatusUpdateSMS job was dispatched to queue
        Queue::assertPushedOn('sms', SendStatusUpdateSMS::class);
        Queue::assertPushed(SendTransactionalEmail::class);

        $this->assertDatabaseHas('notification_deliveries', [
            'channel' => 'email',
            'event' => 'confirmed',
            'status' => 'queued',
        ]);
        $this->assertDatabaseHas('notification_deliveries', [
            'channel' => 'sms',
            'event' => 'confirmed',
            'status' => 'queued',
        ]);
    }

    public function test_sms_delivery_failure_logs_failed_sms_log(): void
    {
        Http::fake([
            '*' => Http::response(['message' => 'Gateway Offline'], 500),
        ]);

        config([
            'sms.default' => 'httpsms',
            'services.httpsms.key' => 'key',
            'services.httpsms.from' => '+639170000000',
            'services.textbee.key' => 'key',
            'services.textbee.device_id' => 'dev1',
        ]);

        $success = NotificationService::sendSmsDirect('+639170000000', 'Test Failure');

        $this->assertFalse($success);

        // Verify failure was logged in sms_logs table
        $this->assertDatabaseHas('sms_logs', [
            'phone_number' => '+639170000000',
            'gateway' => 'none',
            'status' => 'failed',
        ]);
    }

    public function test_transactional_email_job_sends_to_customer_account_email(): void
    {
        Mail::fake();

        $customer = User::factory()->create([
            'role' => UserRole::Customer,
            'email' => 'customer@example.com',
        ]);
        $order = Order::create([
            'user_id' => $customer->id,
            'order_type' => 'purchase',
            'recipient_name' => 'Jane Doe',
            'recipient_phone' => '09170000000',
            'pickup_date' => now()->addDays(2)->format('Y-m-d'),
            'items' => [],
            'total_price' => 500,
            'status' => 'confirmed',
            'payment_status' => 'pending',
        ]);

        NotificationService::sendCustomer(
            $order,
            'Order Confirmed',
            'Your order is confirmed.',
            'confirmed',
            "order:{$order->id}:confirmed"
        );

        $delivery = NotificationDelivery::where('channel', 'email')->firstOrFail();
        (new SendTransactionalEmail($delivery->id))->handle();

        Mail::assertSent(TransactionalNotificationMail::class, function (TransactionalNotificationMail $mail) {
            return $mail->hasTo('customer@example.com')
                && $mail->title === 'Order Confirmed';
        });
        $this->assertDatabaseHas('notification_deliveries', [
            'id' => $delivery->id,
            'status' => 'sent',
        ]);
    }

    public function test_customer_notification_is_idempotent_for_the_same_transaction(): void
    {
        Queue::fake();

        $customer = User::factory()->create([
            'role' => UserRole::Customer,
            'email' => 'customer@example.com',
        ]);
        $order = Order::create([
            'user_id' => $customer->id,
            'order_type' => 'purchase',
            'recipient_name' => 'Jane Doe',
            'recipient_phone' => '09170000000',
            'pickup_date' => now()->addDays(2)->format('Y-m-d'),
            'items' => [],
            'total_price' => 500,
            'status' => 'confirmed',
            'payment_status' => 'pending',
        ]);

        NotificationService::sendCustomer($order, 'Order Confirmed', 'Confirmed.', 'confirmed', 'order:1:confirmed');
        NotificationService::sendCustomer($order, 'Order Confirmed', 'Confirmed.', 'confirmed', 'order:1:confirmed');

        $this->assertDatabaseHas('notifications', [
            'user_id' => $customer->id,
            'transaction_key' => 'order:1:confirmed',
        ]);
        $this->assertSame(1, Notification::where('user_id', $customer->id)->count());
        $this->assertDatabaseCount('notification_deliveries', 2);
        Queue::assertPushed(SendTransactionalEmail::class, 1);
        Queue::assertPushed(SendStatusUpdateSMS::class, 1);
    }

    public function test_receipt_upload_has_a_customer_specific_sms_template(): void
    {
        $message = SmsTemplates::forEvent(42, 'payment_uploaded');

        $this->assertStringContainsString('Payment proof for Order #JFS-42 was received', $message);
        $this->assertStringNotContainsString('Status: Payment_uploaded', $message);
    }

    public function test_sms_falls_back_to_httpsms_when_textbee_fails(): void
    {
        config([
            'sms.default' => 'textbee',
            'services.httpsms.key' => 'httpsms-key',
            'services.httpsms.from' => '+639171111111',
            'services.textbee.key' => 'textbee-api-key',
            'services.textbee.device_id' => 'textbee-device-123',
        ]);

        Http::fake([
            '*textbee.dev*' => Http::response(['message' => 'Service Unavailable'], 503),
            '*httpsms.com*' => Http::response(['success' => true], 200),
        ]);

        $success = NotificationService::sendSmsDirect('+639170000000', 'Test Fallback');

        $this->assertTrue($success);

        // Verify httpSMS fallback was logged in sms_logs table
        $this->assertDatabaseHas('sms_logs', [
            'phone_number' => '+639170000000',
            'gateway' => 'httpsms',
            'status' => 'sent',
        ]);
    }

    public function test_phone_number_formatting_utility(): void
    {
        $this->assertEquals('+639171234567', NotificationService::formatPhoneNumber('09171234567'));
        $this->assertEquals('+639171234567', NotificationService::formatPhoneNumber('9171234567'));
        $this->assertEquals('+639171234567', NotificationService::formatPhoneNumber('+639171234567'));
        $this->assertEquals('+639171234567', NotificationService::formatPhoneNumber(' 0917-123-4567 '));
    }

    public function test_sms_test_mode_logs_to_laravel_log_and_database(): void
    {
        config(['sms.test_mode' => 'testing']);

        $customer = User::factory()->create(['role' => UserRole::Customer]);
        $order = Order::create([
            'user_id' => $customer->id,
            'recipient_name' => 'Jane Doe',
            'recipient_phone' => '09170000000',
            'pickup_date' => now()->addDays(2)->format('Y-m-d'),
            'total_price' => 500,
            'downpayment_amount' => 150,
            'status' => 'confirmed',
            'order_type' => 'purchase',
            'items' => [],
        ]);

        $success = NotificationService::sendSmsDirect('+639170000000', 'Test Mode Message', $order->id);

        $this->assertTrue($success);

        $this->assertDatabaseHas('sms_logs', [
            'phone_number' => '+639170000000',
            'message' => 'Test Mode Message',
            'gateway' => 'log',
            'status' => 'sent',
            'order_id' => $order->id,
        ]);
    }
}
