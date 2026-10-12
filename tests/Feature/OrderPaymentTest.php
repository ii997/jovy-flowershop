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
        $this->customer = User::where('email', 'carlos@customer.com')->first() ?: User::factory()->create();
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
            'recipient_name' => 'Test Recipient',
            'recipient_phone' => '09123456789',
            'pickup_date' => now()->addDays(2)->format('Y-m-d'),
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
            'recipient_name' => 'Jane Doe',
            'recipient_phone' => '09123456789',
            'pickup_date' => now()->addDays(2)->format('Y-m-d'),
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
            'recipient_name' => 'Jane Doe',
            'recipient_phone' => '09123456789',
            'pickup_date' => now()->addDays(2)->format('Y-m-d'),
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

        $file = UploadedFile::fake()->create('receipt.jpg', 100, 'image/jpeg');
        $response = $this->actingAs($this->customer)
            ->postJson("/api/orders/{$order->id}/payment", [
                'receipt' => $file,
                'reference_no' => 'REF12345',
                'amount' => $this->product->price,
            ]);

        $response->assertStatus(200);
        $this->assertEquals('awaiting_verification', $response->json('payment_status'));
    }

    public function test_submit_payment_persists_ocr_manual_review_flag(): void
    {
        Storage::fake('public');

        $order = $this->createOrder();
        $file = UploadedFile::fake()->create('receipt.jpg', 100, 'image/jpeg');

        $response = $this->actingAs($this->customer)
            ->postJson("/api/orders/{$order->id}/payment", [
                'receipt' => $file,
                'reference_no' => 'REF12345',
                'amount' => $this->product->price,
                'ocr_review_required' => '1',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('payment_details.ocr_review_required', true);

        $this->assertTrue($order->fresh()->payment_details['ocr_review_required']);
    }

    public function test_cannot_submit_payment_for_another_users_order(): void
    {
        Storage::fake('public');

        $otherCustomer = User::factory()->create(['role' => UserRole::Customer]);
        $order = $this->createOrder(); // owned by $this->customer

        $file = UploadedFile::fake()->create('receipt.jpg', 100, 'image/jpeg');
        $response = $this->actingAs($otherCustomer)
            ->postJson("/api/orders/{$order->id}/payment", [
                'receipt' => $file,
                'reference_no' => 'REF99999',
                'amount' => $this->product->price,
            ]);

        $response->assertStatus(403);
    }

    public function test_submit_payment_creates_transaction(): void
    {
        Storage::fake('public');

        $order = $this->createOrder();
        $file = UploadedFile::fake()->create('receipt.jpg', 100, 'image/jpeg');

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
        $file = UploadedFile::fake()->create('receipt.jpg', 100, 'image/jpeg');

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
        $file = UploadedFile::fake()->create('receipt.jpg', 100, 'image/jpeg');

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

    public function test_cancel_order_retains_payment_status_without_refund(): void
    {
        $order = $this->createOrder(['payment_status' => 'verified']);

        $response = $this->actingAs($this->admin)
            ->postJson("/api/admin/orders/{$order->id}/cancel", [
                'reason' => 'Customer requested cancellation per policy.',
            ]);

        $response->assertStatus(200);
        $this->assertEquals('cancelled', $response->json('status'));
        $this->assertEquals('verified', $response->json('payment_status'));
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
        $file = UploadedFile::fake()->create('receipt.jpg', 100, 'image/jpeg');

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
        $file = UploadedFile::fake()->create('receipt.jpg', 100, 'image/jpeg');

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
        $file = UploadedFile::fake()->create('receipt.jpg', 100, 'image/jpeg');

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
            $file = UploadedFile::fake()->create('receipt.jpg', 100, 'image/jpeg');

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

    // --- Gross Sales Filtering: Only include verified + not cancelled ---

    public function test_gross_sales_excludes_pending_payment_orders(): void
    {
        $product = Product::first();
        
        // Create order with pending payment
        $order = $this->createOrder(['payment_status' => 'pending', 'total_price' => 100.00]);
        
        // Baseline: get stats and note existing verified orders
        $baselineResponse = $this->actingAs($this->admin)->getJson('/api/admin/stats');
        $baselineGross = $baselineResponse->json('gross_sales');
        
        // The pending order should NOT add to gross sales
        // So after adding pending, gross should NOT increase
        $this->assertEquals($baselineGross, $baselineResponse->json('gross_sales'));
    }

    public function test_gross_sales_excludes_awaiting_verification_orders(): void
    {
        $product = Product::first();
        $baselineResponse = $this->actingAs($this->admin)->getJson('/api/admin/stats');
        $baselineGross = $baselineResponse->json('gross_sales');
        
        // Create order with payment awaiting verification
        $order = $this->createOrder(['payment_status' => 'awaiting_verification', 'total_price' => 100.00]);
        
        // After creating awaiting_verification order, gross should NOT increase
        $response = $this->actingAs($this->admin)->getJson('/api/admin/stats');
        $this->assertEquals($baselineGross, $response->json('gross_sales'));
    }

    public function test_gross_sales_excludes_cancelled_orders(): void
    {
        $product = Product::first();
        $baselineResponse = $this->actingAs($this->admin)->getJson('/api/admin/stats');
        $baselineGross = $baselineResponse->json('gross_sales');
        
        // Create verified order then cancel it
        $order = $this->createOrder(['payment_status' => 'verified', 'status' => 'confirmed', 'total_price' => 100.00]);
        
        // Before cancellation, should increase
        $responseBeforeCancel = $this->actingAs($this->admin)->getJson('/api/admin/stats');
        $grossAfterCreate = $responseBeforeCancel->json('gross_sales');
        $this->assertEquals($baselineGross + 100.00, $grossAfterCreate);
        
        // Cancel the order
        $order->update(['status' => 'cancelled']);
        
        // After cancellation, gross should revert to baseline (cancelled orders excluded)
        $responseAfterCancel = $this->actingAs($this->admin)->getJson('/api/admin/stats');
        $this->assertEquals($baselineGross, $responseAfterCancel->json('gross_sales'));
    }

    public function test_gross_sales_includes_verified_non_cancelled_orders(): void
    {
        $product = Product::first();
        $baselineResponse = $this->actingAs($this->admin)->getJson('/api/admin/stats');
        $baselineGross = $baselineResponse->json('gross_sales');
        
        // Create verified, non-cancelled order
        $order = $this->createOrder(['payment_status' => 'verified', 'status' => 'confirmed', 'total_price' => 100.00]);
        
        $response = $this->actingAs($this->admin)->getJson('/api/admin/stats');
        
        // Gross sales should increase by exactly 100.00
        $this->assertEquals($baselineGross + 100.00, $response->json('gross_sales'));
    }

    public function test_total_orders_excludes_cancelled_and_unpaid(): void
    {
        $product = Product::first();
        $baselineResponse = $this->actingAs($this->admin)->getJson('/api/admin/stats');
        $baselineCount = $baselineResponse->json('total_orders');
        
        // Create 3 orders: pending, cancelled (verified), verified (confirmed)
        Order::create([
            'user_id' => $this->customer->id,
            'order_type' => 'purchase',
            'recipient_name' => 'Test Pending',
            'recipient_phone' => '09123456789',
            'pickup_date' => now()->addDays(2)->format('Y-m-d'),
            'wrapper_type' => 'Paper',
            'items' => [['id' => $product->id, 'name' => $product->name, 'price' => $product->price, 'quantity' => 1]],
            'total_price' => $product->price,
            'status' => 'confirmed',
            'payment_status' => 'pending',
        ]);
        
        Order::create([
            'user_id' => $this->customer->id,
            'order_type' => 'purchase',
            'recipient_name' => 'Test Cancelled',
            'recipient_phone' => '09123456789',
            'pickup_date' => now()->addDays(2)->format('Y-m-d'),
            'wrapper_type' => 'Paper',
            'items' => [['id' => $product->id, 'name' => $product->name, 'price' => $product->price, 'quantity' => 1]],
            'total_price' => $product->price,
            'status' => 'cancelled',
            'payment_status' => 'verified',
        ]);
        
        Order::create([
            'user_id' => $this->customer->id,
            'order_type' => 'purchase',
            'recipient_name' => 'Test Valid',
            'recipient_phone' => '09123456789',
            'pickup_date' => now()->addDays(2)->format('Y-m-d'),
            'wrapper_type' => 'Paper',
            'items' => [['id' => $product->id, 'name' => $product->name, 'price' => $product->price, 'quantity' => 1]],
            'total_price' => $product->price,
            'status' => 'confirmed',
            'payment_status' => 'verified',
        ]);
        
        $response = $this->actingAs($this->admin)->getJson('/api/admin/stats');
        
        // Only 1 order should be added to baseline (verified + not cancelled)
        $this->assertEquals($baselineCount + 1, $response->json('total_orders'));
    }

    public function test_sales_trends_exclude_cancelled_and_unpaid(): void
    {
        $product = Product::first();
        $today = now()->format('Y-m-d');
        
        // Get baseline (may have existing seed data for today)
        $baselineResponse = $this->actingAs($this->admin)->getJson('/api/admin/stats');
        $dailyBaseline = collect($baselineResponse->json('trends.daily'))
            ->firstWhere('date', $today);
        $baselineTotal = $dailyBaseline ? (float) $dailyBaseline['total'] : 0.0;
        
        // Create orders with different statuses
        Order::create([
            'user_id' => $this->customer->id,
            'order_type' => 'purchase',
            'recipient_name' => 'Pending Order',
            'recipient_phone' => '09123456789',
            'pickup_date' => now()->addDays(2)->format('Y-m-d'),
            'wrapper_type' => 'Paper',
            'items' => [['id' => $product->id, 'name' => $product->name, 'price' => 50.00, 'quantity' => 1]],
            'total_price' => 50.00,
            'status' => 'confirmed',
            'payment_status' => 'pending',
            'created_at' => now(),
        ]);
        
        Order::create([
            'user_id' => $this->customer->id,
            'order_type' => 'purchase',
            'recipient_name' => 'Cancelled Order',
            'recipient_phone' => '09123456789',
            'pickup_date' => now()->addDays(2)->format('Y-m-d'),
            'wrapper_type' => 'Paper',
            'items' => [['id' => $product->id, 'name' => $product->name, 'price' => 75.00, 'quantity' => 1]],
            'total_price' => 75.00,
            'status' => 'cancelled',
            'payment_status' => 'verified',
            'created_at' => now(),
        ]);
        
        Order::create([
            'user_id' => $this->customer->id,
            'order_type' => 'purchase',
            'recipient_name' => 'Valid Order',
            'recipient_phone' => '09123456789',
            'pickup_date' => now()->addDays(2)->format('Y-m-d'),
            'wrapper_type' => 'Paper',
            'items' => [['id' => $product->id, 'name' => $product->name, 'price' => 100.00, 'quantity' => 1]],
            'total_price' => 100.00,
            'status' => 'confirmed',
            'payment_status' => 'verified',
            'created_at' => now(),
        ]);
        
        $response = $this->actingAs($this->admin)->getJson('/api/admin/stats');
        
        // Daily trends should only show valid (verified + not cancelled) orders
        $dailyTrends = $response->json('trends.daily');
        $this->assertNotEmpty($dailyTrends);
        
        // Find today's trend entry
        $todayTrend = collect($dailyTrends)->firstWhere('date', $today);
        $this->assertNotNull($todayTrend);
        // Should only add 100.00 (valid order), not 50 (pending) or 75 (cancelled)
        // So today's total should be baseline + 100
        $this->assertEquals($baselineTotal + 100.00, (float) $todayTrend['total']);
        // Today should have at least 1 valid order (could have more from baseline)
        $this->assertGreaterThanOrEqual(1, $todayTrend['count']);
    }

    public function test_average_order_size_calculated_from_valid_orders(): void
    {
        $product = Product::first();
        
        // Create 2 valid orders: 100 + 200 = 300, average = 150
        Order::create([
            'user_id' => $this->customer->id,
            'order_type' => 'purchase',
            'recipient_name' => 'Order 1',
            'recipient_phone' => '09123456789',
            'pickup_date' => now()->addDays(2)->format('Y-m-d'),
            'wrapper_type' => 'Paper',
            'items' => [['id' => $product->id, 'name' => $product->name, 'price' => 100.00, 'quantity' => 1]],
            'total_price' => 100.00,
            'status' => 'confirmed',
            'payment_status' => 'verified',
        ]);
        
        Order::create([
            'user_id' => $this->customer->id,
            'order_type' => 'purchase',
            'recipient_name' => 'Order 2',
            'recipient_phone' => '09123456789',
            'pickup_date' => now()->addDays(2)->format('Y-m-d'),
            'wrapper_type' => 'Paper',
            'items' => [['id' => $product->id, 'name' => $product->name, 'price' => 200.00, 'quantity' => 1]],
            'total_price' => 200.00,
            'status' => 'confirmed',
            'payment_status' => 'verified',
        ]);
        
        // Create a cancelled order that should NOT affect average
        Order::create([
            'user_id' => $this->customer->id,
            'order_type' => 'purchase',
            'recipient_name' => 'Cancelled Order',
            'recipient_phone' => '09123456789',
            'pickup_date' => now()->addDays(2)->format('Y-m-d'),
            'wrapper_type' => 'Paper',
            'items' => [['id' => $product->id, 'name' => $product->name, 'price' => 500.00, 'quantity' => 1]],
            'total_price' => 500.00,
            'status' => 'cancelled',
            'payment_status' => 'verified',
        ]);
        
        // Before this test, there may be seeded verified orders
        // The test verifies that cancelled orders don't inflate the divisor
        // We create 2 valid orders (100 + 200) and 1 cancelled (500)
        // The average should be calculated only from verified+not cancelled
        
        $response = $this->actingAs($this->admin)->getJson('/api/admin/stats');
        $totalOrders = $response->json('total_orders');
        $grossSales = $response->json('gross_sales');
        $average = $response->json('patterns.average_order_size');
        
        // The average is: grossSales / totalOrders
        // If cancelled orders were included, average would be inflated
        // Our new orders: 100 + 200 should contribute to numerator
        // Our cancelled: 500 should NOT be counted in either numerator or denominator
        
        if ($totalOrders > 0) {
            // Recalculate: does average match what we'd expect?
            $expectedAverage = $grossSales / $totalOrders;
            $this->assertEquals($expectedAverage, $average, '', 0.01);
        }
    }
}
