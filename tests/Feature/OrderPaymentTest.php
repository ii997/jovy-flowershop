<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Order;
use App\Models\Product;
use App\Models\PaymentTransaction;
use App\Models\OrderCancellation;
use App\Enums\UserRole;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class OrderPaymentTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $staff;
    protected User $customer;
    protected Product $product;
    private ?string $originalSettings = null;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);

        $this->admin = User::where('email', 'admin@jovy.com')->first();
        $this->staff = User::where('email', 'staff@jovy.com')->first();
        $this->customer = User::where('email', 'customer@jovy.com')->first();
        $this->product = Product::where('name', 'Crimson Romance')->first();

        // Backup existing settings.json
        $settingsPath = storage_path('app/settings.json');
        if (file_exists($settingsPath)) {
            $this->originalSettings = file_get_contents($settingsPath);
            @unlink($settingsPath);
        }
    }

    protected function tearDown(): void
    {
        // Restore original settings.json
        $settingsPath = storage_path('app/settings.json');
        if ($this->originalSettings !== null) {
            file_put_contents($settingsPath, $this->originalSettings);
        } else {
            @unlink($settingsPath);
        }
        parent::tearDown();
    }

    protected function createOrder(array $overrides = []): Order
    {
        $defaults = [
            'user_id' => $this->customer->id,
            'order_type' => 'purchase',
            'delivery_type' => 'delivery',
            'recipient_name' => 'Test Recipient',
            'recipient_phone' => '09123456789',
            'delivery_address' => '123 Flower St.',
            'delivery_date' => now()->addDays(2)->format('Y-m-d'),
            'wrapper_type' => 'Classic Kraft Paper',
            'items' => [['id' => $this->product->id, 'name' => $this->product->name, 'price' => $this->product->price, 'quantity' => 1]],
            'total_price' => $this->product->price,
            'status' => 'confirmed',
            'payment_status' => 'pending',
        ];

        return Order::create(array_merge($defaults, $overrides));
    }

    // --- Payment Status Defaults ---

    public function test_order_defaults_payment_status_pending(): void
    {
        $response = $this->actingAs($this->customer)->postJson('/api/orders', [
            'order_type' => 'purchase',
            'delivery_type' => 'delivery',
            'recipient_name' => 'Jane Doe',
            'recipient_phone' => '09123456789',
            'delivery_address' => '123 Flower St.',
            'delivery_date' => now()->addDays(2)->format('Y-m-d'),
            'wrapper_type' => 'Classic Kraft Paper',
            'items' => [['id' => $this->product->id, 'quantity' => 1]],
        ]);

        $response->assertStatus(200);
        $this->assertEquals('pending', $response->json('payment_status'));
    }

    public function test_reservation_defaults_payment_status_pending(): void
    {
        $response = $this->actingAs($this->customer)->postJson('/api/orders', [
            'order_type' => 'reservation',
            'delivery_type' => 'delivery',
            'recipient_name' => 'Jane Doe',
            'recipient_phone' => '09123456789',
            'delivery_address' => '123 Flower St.',
            'delivery_date' => now()->addDays(2)->format('Y-m-d'),
            'wrapper_type' => 'Classic Kraft Paper',
            'items' => [['id' => $this->product->id, 'quantity' => 1]],
        ]);

        $response->assertStatus(200);
        $this->assertEquals('pending', $response->json('payment_status'));
    }

    // --- Payment Submission ---

    public function test_submit_payment_sets_awaiting_verification(): void
    {
        Storage::fake('public');

        $order = $this->createOrder();

        $file = UploadedFile::fake()->image('receipt.jpg', 800, 600);
        $response = $this->actingAs($this->customer)
            ->postJson("/api/orders/{$order->id}/payment", [
                'receipt' => $file,
                'reference_no' => 'REF12345',
                'amount' => $this->product->price,
            ]);

        $response->assertStatus(200);
        $this->assertEquals('awaiting_verification', $response->json('payment_status'));
    }

    public function test_submit_payment_creates_transaction(): void
    {
        Storage::fake('public');

        $order = $this->createOrder();
        $file = UploadedFile::fake()->image('receipt.jpg', 800, 600);

        $this->actingAs($this->customer)
            ->postJson("/api/orders/{$order->id}/payment", [
                'receipt' => $file,
                'reference_no' => 'REF12345',
                'amount' => $this->product->price,
            ]);

        $this->assertDatabaseHas('payment_transactions', [
            'order_id' => $order->id,
            'type' => 'payment',
            'reference_no' => 'REF12345',
        ]);
    }

    public function test_duplicate_payment_rejected_if_verified(): void
    {
        Storage::fake('public');

        $order = $this->createOrder(['payment_status' => 'verified']);
        $file = UploadedFile::fake()->image('receipt.jpg');

        $response = $this->actingAs($this->customer)
            ->postJson("/api/orders/{$order->id}/payment", [
                'receipt' => $file,
            ]);

        $response->assertStatus(422);
        $response->assertSee('Payment has already been verified');
    }

    public function test_payment_amount_below_total_rejected(): void
    {
        Storage::fake('public');

        $order = $this->createOrder();
        $file = UploadedFile::fake()->image('receipt.jpg');

        $response = $this->actingAs($this->customer)
            ->postJson("/api/orders/{$order->id}/payment", [
                'receipt' => $file,
                'amount' => 1.00,
            ]);

        $response->assertStatus(422);
        $response->assertSee('less than the order total');
    }

    // --- Admin Payment Verification ---

    public function test_admin_verify_payment(): void
    {
        $order = $this->createOrder(['payment_status' => 'awaiting_verification']);

        $response = $this->actingAs($this->admin)
            ->postJson("/api/admin/orders/{$order->id}/payment-status", [
                'payment_status' => 'verified',
                'admin_notes' => 'Receipt looks good.',
            ]);

        $response->assertStatus(200);
        $this->assertEquals('verified', $response->json('payment_status'));
    }

    public function test_verify_payment_records_verified_by(): void
    {
        $order = $this->createOrder(['payment_status' => 'awaiting_verification']);

        // First submit payment to create a transaction
        $tx = PaymentTransaction::create([
            'order_id' => $order->id,
            'type' => 'payment',
            'amount' => $this->product->price,
        ]);

        $response = $this->actingAs($this->admin)
            ->postJson("/api/admin/orders/{$order->id}/payment-status", [
                'payment_status' => 'verified',
            ]);

        $response->assertStatus(200);
        $response->assertJsonPath('payment_status', 'verified');

        // Verify the transaction was updated via the API response
        $transactions = $response->json('payment_transactions');
        $this->assertNotEmpty($transactions);

        // Also verify via database
        $tx->refresh();
        $this->assertNotNull($tx->verified_by);
        $this->assertEquals($this->admin->id, $tx->verified_by);
    }

    public function test_non_staff_cannot_update_payment_status(): void
    {
        $order = $this->createOrder(['payment_status' => 'awaiting_verification']);

        $response = $this->actingAs($this->customer)
            ->postJson("/api/admin/orders/{$order->id}/payment-status", [
                'payment_status' => 'verified',
            ]);

        $response->assertStatus(403);
    }

    // --- Order Cancellation ---

    public function test_cancel_order_requires_reason(): void
    {
        $order = $this->createOrder();

        $response = $this->actingAs($this->admin)
            ->postJson("/api/admin/orders/{$order->id}/cancel", [
                'reason' => '',
            ]);

        $response->assertStatus(422);
    }

    public function test_cancel_order_creates_cancellation_record(): void
    {
        $order = $this->createOrder();

        $this->actingAs($this->admin)
            ->postJson("/api/admin/orders/{$order->id}/cancel", [
                'reason' => 'Customer requested cancellation via phone.',
            ]);

        $this->assertDatabaseHas('order_cancellations', [
            'order_id' => $order->id,
            'cancelled_by' => $this->admin->id,
            'reason' => 'Customer requested cancellation via phone.',
        ]);
    }

    public function test_cancel_order_sets_status_cancelled(): void
    {
        $order = $this->createOrder();

        $response = $this->actingAs($this->admin)
            ->postJson("/api/admin/orders/{$order->id}/cancel", [
                'reason' => 'Customer requested cancellation via phone.',
            ]);

        $response->assertStatus(200);
        $this->assertEquals('cancelled', $response->json('status'));
    }

    public function test_cancel_order_with_refund_sets_refunded(): void
    {
        $order = $this->createOrder(['payment_status' => 'verified']);

        $response = $this->actingAs($this->admin)
            ->postJson("/api/admin/orders/{$order->id}/cancel", [
                'reason' => 'Customer requested cancellation with refund.',
                'refund_amount' => $this->product->price,
                'refund_method' => 'original_payment',
            ]);

        $response->assertStatus(200);
        $this->assertEquals('cancelled', $response->json('status'));
        $this->assertEquals('refunded', $response->json('payment_status'));
    }

    public function test_double_cancellation_rejected(): void
    {
        $order = $this->createOrder(['status' => 'cancelled']);

        $response = $this->actingAs($this->admin)
            ->postJson("/api/admin/orders/{$order->id}/cancel", [
                'reason' => 'Trying to cancel again.',
            ]);

        $response->assertStatus(422);
    }

    public function test_cancel_order_min_reason_length(): void
    {
        $order = $this->createOrder();

        $response = $this->actingAs($this->admin)
            ->postJson("/api/admin/orders/{$order->id}/cancel", [
                'reason' => 'ABC',
            ]);

        $response->assertStatus(422);
    }

    public function test_non_staff_cannot_cancel_order(): void
    {
        $order = $this->createOrder();

        $response = $this->actingAs($this->customer)
            ->postJson("/api/admin/orders/{$order->id}/cancel", [
                'reason' => 'Customer wants to cancel.',
            ]);

        $response->assertStatus(403);
    }

    // --- Fulfillment Status (regression) ---

    public function test_fulfillment_status_still_works(): void
    {
        $order = $this->createOrder();

        $response = $this->actingAs($this->admin)
            ->postJson("/api/admin/orders/{$order->id}/status", [
                'status' => 'preparing',
            ]);

        $response->assertStatus(200);
        $this->assertEquals('preparing', $response->json('status'));
    }

    public function test_fulfillment_status_rejects_paid(): void
    {
        $order = $this->createOrder();

        $response = $this->actingAs($this->admin)
            ->postJson("/api/admin/orders/{$order->id}/status", [
                'status' => 'paid',
            ]);

        $response->assertStatus(422);
    }

    public function test_fulfillment_status_rejects_cancelled(): void
    {
        $order = $this->createOrder();

        $response = $this->actingAs($this->admin)
            ->postJson("/api/admin/orders/{$order->id}/status", [
                'status' => 'cancelled',
            ]);

        $response->assertStatus(422);
    }

    // --- Customer Order Cancellation ---

    public function test_customer_can_cancel_own_order(): void
    {
        $order = $this->createOrder();

        $response = $this->actingAs($this->customer)
            ->postJson("/api/orders/{$order->id}/cancel", [
                'reason' => 'I changed my mind about this purchase.',
            ]);

        $response->assertStatus(200);
        $this->assertEquals('cancelled', $response->json('status'));
        $this->assertDatabaseHas('order_cancellations', [
            'order_id' => $order->id,
            'cancelled_by' => $this->customer->id,
            'reason' => 'I changed my mind about this purchase.',
        ]);
    }

    public function test_customer_cannot_cancel_others_order(): void
    {
        $otherUser = User::factory()->create(['role' => UserRole::Customer]);
        $order = $this->createOrder(); // belongs to $this->customer

        $response = $this->actingAs($otherUser)
            ->postJson("/api/orders/{$order->id}/cancel", [
                'reason' => 'Trying to cancel another user\'s order.',
            ]);

        $response->assertStatus(403);
    }

    public function test_customer_cannot_cancel_processed_order(): void
    {
        $order = $this->createOrder(['status' => 'preparing']);

        $response = $this->actingAs($this->customer)
            ->postJson("/api/orders/{$order->id}/cancel", [
                'reason' => 'Too late to cancel.',
            ]);

        $response->assertStatus(422);
    }

    public function test_customer_cancel_restores_inventory(): void
    {
        // Let's set up flower stems if applicable
        $flower = \App\Models\Flower::create([
            'name' => 'Red Rose',
            'quantity' => 10,
            'availability' => true,
        ]);
        $this->product->stems = ['Red Rose' => 2];
        $this->product->save();

        $order = $this->createOrder([
            'items' => [['id' => $this->product->id, 'name' => $this->product->name, 'price' => $this->product->price, 'quantity' => 2]]
        ]);

        // Simulating the decrement that happened in store API
        $flower->quantity = 6;
        $flower->save();

        $response = $this->actingAs($this->customer)
            ->postJson("/api/orders/{$order->id}/cancel", [
                'reason' => 'Please refund and cancel.',
            ]);

        $response->assertStatus(200);
        $flower->refresh();

        // Should restore 4 stems
        $this->assertEquals(10, $flower->quantity);
    }

    // --- Delivered Order Lock Protection ---

    public function test_delivered_order_status_cannot_be_modified(): void
    {
        $order = $this->createOrder(['status' => 'delivered']);

        $response = $this->actingAs($this->admin)
            ->postJson("/api/admin/orders/{$order->id}/status", [
                'status' => 'preparing',
            ]);

        $response->assertStatus(422);
    }

    public function test_delivered_order_payment_status_cannot_be_modified(): void
    {
        $order = $this->createOrder(['status' => 'delivered']);

        $response = $this->actingAs($this->admin)
            ->postJson("/api/admin/orders/{$order->id}/payment-status", [
                'payment_status' => 'verified',
            ]);

        $response->assertStatus(422);
    }

    public function test_delivered_order_cannot_be_cancelled(): void
    {
        $order = $this->createOrder(['status' => 'delivered']);

        $response = $this->actingAs($this->admin)
            ->postJson("/api/admin/orders/{$order->id}/cancel", [
                'reason' => 'Customer requested cancellation.',
            ]);

        $response->assertStatus(422);
    }

    public function test_customer_cannot_submit_payment_for_delivered_order(): void
    {
        Storage::fake('public');
        $order = $this->createOrder(['status' => 'delivered']);
        $file = UploadedFile::fake()->image('receipt.jpg');

        $response = $this->actingAs($this->customer)
            ->postJson("/api/orders/{$order->id}/payment", [
                'receipt' => $file,
                'reference_no' => '123456',
                'amount' => $order->total_price,
            ]);

        $response->assertStatus(422);
    }

    // --- Reservation Downpayment Validation Tests ---

    public function test_reservation_requires_at_least_30_percent_downpayment(): void
    {
        Storage::fake('public');
        $order = $this->createOrder([
            'order_type' => 'reservation',
            'total_price' => 1000.00
        ]);
        $file = UploadedFile::fake()->image('receipt.jpg');

        // Try submitting 250 (25%, which is less than 300 required)
        $response = $this->actingAs($this->customer)
            ->postJson("/api/orders/{$order->id}/payment", [
                'receipt' => $file,
                'reference_no' => '1234567',
                'amount' => 250.00,
            ]);

        $response->assertStatus(422);
    }

    public function test_reservation_accepts_30_percent_downpayment(): void
    {
        Storage::fake('public');
        $order = $this->createOrder([
            'order_type' => 'reservation',
            'total_price' => 1000.00
        ]);
        $file = UploadedFile::fake()->image('receipt.jpg');

        // Submit exactly 300 (30% downpayment)
        $response = $this->actingAs($this->customer)
            ->postJson("/api/orders/{$order->id}/payment", [
                'receipt' => $file,
                'reference_no' => '1234567',
                'amount' => 300.00,
            ]);

        $response->assertStatus(200);
        $this->assertEquals('awaiting_verification', $response->json('payment_status'));
    }

    public function test_reservation_respects_custom_configured_downpayment_pct(): void
    {
        Storage::fake('public');
        $path = storage_path('app/settings.json');
        $oldSettings = file_exists($path) ? file_get_contents($path) : null;

        // Configure to 20% downpayment
        $settings = [
            'store_name' => "Jovy's Flowershop",
            'store_phone' => "+63-2-555-1234",
            'store_address' => "123 Rizal Avenue",
            'maintenance_mode' => false,
            'same_day_delivery' => true,
            'delivery_fee' => 150,
            'qr_image' => "",
            'downpayment_pct' => 20
        ];

        $dir = dirname($path);
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }
        file_put_contents($path, json_encode($settings));

        try {
            $order = $this->createOrder([
                'order_type' => 'reservation',
                'total_price' => 1000.00
            ]);
            $file = UploadedFile::fake()->image('receipt.jpg');

            // 1. Check that 15% (150) fails
            $responseFail = $this->actingAs($this->customer)
                ->postJson("/api/orders/{$order->id}/payment", [
                    'receipt' => $file,
                    'reference_no' => '12345678',
                    'amount' => 150.00,
                ]);
            $responseFail->assertStatus(422);

            // 2. Check that 20% (200) succeeds
            $responseOk = $this->actingAs($this->customer)
                ->postJson("/api/orders/{$order->id}/payment", [
                    'receipt' => $file,
                    'reference_no' => '12345679',
                    'amount' => 200.00,
                ]);
            $responseOk->assertStatus(200);
            $this->assertEquals('awaiting_verification', $responseOk->json('payment_status'));

        } finally {
            // Restore original settings
            if ($oldSettings !== null) {
                file_put_contents($path, $oldSettings);
            } else {
                @unlink($path);
            }
        }
    }
}
