<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Notification;
use App\Models\Order;
use App\Models\Product;
use App\Enums\UserRole;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class NotificationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Setup settings.json mock
        $settingsPath = storage_path('app/settings.json');
        if (!file_exists(dirname($settingsPath))) {
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

        // Seed products and inventory
        $this->seed(\Database\Seeders\DatabaseSeeder::class);
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
            'ids' => [$notification->id]
        ]);

        $response->assertStatus(200);
        $this->assertNotNull($notification->fresh()->read_at);
    }

    public function test_checkout_triggers_notifications_and_dispatches_sms(): void
    {
        Http::fake([
            'api.httpsms.com/*' => Http::response(['status' => 'success'], 200),
        ]);

        $customer = User::factory()->create(['role' => UserRole::Customer]);
        $product = Product::first(); // Grab seeded product
        $product->availability = true;
        $product->save();

        $response = $this->actingAs($customer)->postJson('/api/orders', [
            'order_type' => 'purchase',
            'recipient_name' => 'John Doe',
            'recipient_phone' => '+639170000000',
            'delivery_type' => 'pickup',
            'delivery_date' => now()->addDays(2)->format('Y-m-d'),
            'wrapper_type' => 'Classic Kraft Paper',
            'gift_message' => 'Happy Birthday!',
            'items' => [
                ['id' => $product->id, 'quantity' => 1]
            ]
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

        // Verify httpSMS request was dispatched twice (one to customer, one to admin)
        Http::assertSentCount(2);

        // Verify SMS log records created in database
        $this->assertDatabaseHas('sms_logs', [
            'phone_number' => '+639170000000',
            'gateway' => 'httpsms',
            'status' => 'sent',
        ]);
    }

    public function test_sms_delivery_failure_creates_in_app_warning_alert_for_admin(): void
    {
        Http::fake([
            'api.httpsms.com/*' => Http::response(['message' => 'Gateway Offline'], 500),
        ]);

        $customer = User::factory()->create(['role' => UserRole::Customer]);
        $product = Product::first(); // Grab seeded product
        $product->availability = true;
        $product->save();

        $response = $this->actingAs($customer)->postJson('/api/orders', [
            'order_type' => 'purchase',
            'recipient_name' => 'John Doe',
            'recipient_phone' => '+639170000000',
            'delivery_type' => 'pickup',
            'delivery_date' => now()->addDays(2)->format('Y-m-d'),
            'wrapper_type' => 'Classic Kraft Paper',
            'gift_message' => 'Happy Birthday!',
            'items' => [
                ['id' => $product->id, 'quantity' => 1]
            ]
        ]);

        $response->assertStatus(200);

        // Verify the gateway failure warning was logged for admin
        $this->assertDatabaseHas('notifications', [
            'user_id' => null,
            'title' => '⚠️ SMS Gateway Alert',
            'type' => 'sms_failure',
            'is_admin' => true,
        ]);

        // Verify failure was logged in sms_logs table
        $this->assertDatabaseHas('sms_logs', [
            'phone_number' => '+639170000000',
            'gateway' => 'none',
            'status' => 'failed',
        ]);
    }

    public function test_sms_falls_back_to_textbee_when_httpsms_fails(): void
    {
        config([
            'services.httpsms.key' => 'httpsms-key',
            'services.httpsms.from' => '+639171111111',
            'services.textbee.key' => 'textbee-api-key',
            'services.textbee.device_id' => 'textbee-device-123',
        ]);

        Http::fake([
            'api.httpsms.com/*' => Http::response(['message' => 'Service Unavailable'], 503),
            'api.textbee.dev/*' => Http::response(['success' => true], 200),
        ]);

        $customer = User::factory()->create(['role' => UserRole::Customer]);
        $product = Product::first();
        $product->availability = true;
        $product->save();

        $response = $this->actingAs($customer)->postJson('/api/orders', [
            'order_type' => 'purchase',
            'recipient_name' => 'John Doe',
            'recipient_phone' => '+639170000000',
            'delivery_type' => 'pickup',
            'delivery_date' => now()->addDays(2)->format('Y-m-d'),
            'wrapper_type' => 'Classic Kraft Paper',
            'gift_message' => 'Happy Birthday!',
            'items' => [
                ['id' => $product->id, 'quantity' => 1]
            ]
        ]);

        $response->assertStatus(200);

        // Verify httpSMS was tried, then TextBee was called as fallback
        Http::assertSent(function ($request) {
            return str_contains($request->url(), 'api.textbee.dev/api/v1/gateway/devices/textbee-device-123/send-sms')
                && $request->hasHeader('x-api-key', 'textbee-api-key')
                && $request['recipients'][0] === '+639170000000';
        });

        // Verify TextBee fallback was logged in sms_logs table
        $this->assertDatabaseHas('sms_logs', [
            'phone_number' => '+639170000000',
            'gateway' => 'textbee',
            'status' => 'sent',
        ]);

        // Verify no failure alert was logged since fallback succeeded
        $this->assertDatabaseMissing('notifications', [
            'type' => 'sms_failure',
        ]);
    }

    public function test_both_sms_gateways_failing_triggers_admin_warning(): void
    {
        config([
            'services.httpsms.key' => 'httpsms-key',
            'services.httpsms.from' => '+639171111111',
            'services.textbee.key' => 'textbee-api-key',
            'services.textbee.device_id' => 'textbee-device-123',
        ]);

        Http::fake([
            'api.httpsms.com/*' => Http::response(['message' => 'Service Unavailable'], 503),
            'api.textbee.dev/*' => Http::response(['message' => 'Device Offline'], 500),
        ]);

        $customer = User::factory()->create(['role' => UserRole::Customer]);
        $product = Product::first();
        $product->availability = true;
        $product->save();

        $response = $this->actingAs($customer)->postJson('/api/orders', [
            'order_type' => 'purchase',
            'recipient_name' => 'John Doe',
            'recipient_phone' => '+639170000000',
            'delivery_type' => 'pickup',
            'delivery_date' => now()->addDays(2)->format('Y-m-d'),
            'wrapper_type' => 'Classic Kraft Paper',
            'gift_message' => 'Happy Birthday!',
            'items' => [
                ['id' => $product->id, 'quantity' => 1]
            ]
        ]);

        $response->assertStatus(200);

        // Verify failure warning logged for admin when both primary & fallback fail
        $this->assertDatabaseHas('notifications', [
            'user_id' => null,
            'title' => '⚠️ SMS Gateway Alert',
            'type' => 'sms_failure',
            'is_admin' => true,
        ]);

        $this->assertDatabaseHas('sms_logs', [
            'phone_number' => '+639170000000',
            'gateway' => 'none',
            'status' => 'failed',
        ]);
    }

    public function test_phone_number_formatting_utility(): void
    {
        $this->assertEquals('+639171234567', \App\Services\NotificationService::formatPhoneNumber('09171234567'));
        $this->assertEquals('+639171234567', \App\Services\NotificationService::formatPhoneNumber('9171234567'));
        $this->assertEquals('+639171234567', \App\Services\NotificationService::formatPhoneNumber('+639171234567'));
        $this->assertEquals('+639171234567', \App\Services\NotificationService::formatPhoneNumber(' 0917-123-4567 '));
    }
}
