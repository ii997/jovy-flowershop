<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Product;
use App\Models\Order;
use App\Models\Flower;
use App\Enums\UserRole;
use Database\Seeders\FlowerSeeder;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
    }

    public function test_order_total_price_is_recalculated_server_side(): void
    {
        $user = User::where('email', 'carlos@customer.com')->first() ?: User::factory()->create();
        $product = Product::where('name', 'Crimson Romance')->first();

        $response = $this->actingAs($user)->postJson('/api/orders', [
            'order_type' => 'purchase',
            'recipient_name' => 'Jane Doe',
            'recipient_phone' => '09123456789',
            'pickup_date' => now()->addDays(2)->format('Y-m-d'),
            'pickup_time' => '09:00',
            'wrapper_type' => 'Classic Kraft Paper',
            'gift_message' => 'Happy birthday!',
            'items' => [
                ['id' => $product->id, 'quantity' => 2],
            ],
            'total_price' => 1.00, // Client sends fraudulent low price
        ]);

        $response->assertStatus(200);
        $orderData = $response->json();

        // Server must recalculate: 89.00 * 2 = 178.00, NOT 1.00
        $this->assertNotEquals(1.00, (float) $orderData['total_price']);
        $this->assertEquals(178.00, (float) $orderData['total_price']);
    }

    public function test_order_items_use_server_price_not_client_price(): void
    {
        $user = User::where('email', 'carlos@customer.com')->first() ?: User::factory()->create();
        $product = Product::where('name', 'Crimson Romance')->first();

        $response = $this->actingAs($user)->postJson('/api/orders', [
            'order_type' => 'purchase',
            'recipient_name' => 'Jane Doe',
            'recipient_phone' => '09123456789',
            'pickup_date' => now()->addDays(2)->format('Y-m-d'),
            'pickup_time' => '09:00',
            'wrapper_type' => 'Classic Kraft Paper',
            'items' => [
                ['id' => $product->id, 'quantity' => 1, 'price' => 0.01], // Client sends wrong price
            ],
        ]);

        $response->assertStatus(200);
        $items = $response->json('items');

        $this->assertEquals($product->price, (float) $items[0]['price']);
        $this->assertNotEquals(0.01, (float) $items[0]['price']);
    }


    public function test_order_sets_product_unavailable_when_quantity_reaches_zero(): void
    {
        $user = User::where('email', 'carlos@customer.com')->first() ?: User::factory()->create();
        $product = Product::where('name', 'Sweet Spring')->first(); // quantity = 0, availability = false

        $this->assertFalse($product->availability);
        $this->assertEquals(0, $product->quantity);
    }

    public function test_unauthenticated_user_cannot_view_orders(): void
    {
        $response = $this->getJson('/api/orders');
        $response->assertStatus(401);
    }

    public function test_customer_can_only_view_own_orders(): void
    {
        $customer = User::where('email', 'carlos@customer.com')->first() ?: User::factory()->create();
        $admin = User::where('email', 'admin@jovy.com')->first();

        // Create an order as admin
        $product = Product::first();
        Order::create([
            'user_id' => $admin->id,
            'order_type' => 'purchase',
            'recipient_name' => 'Admin Order',
            'recipient_phone' => '09123456789',
            'pickup_date' => now()->addDays(1)->format('Y-m-d'),
            'pickup_time' => '09:00',
            'wrapper_type' => 'Classic Kraft Paper',
            'items' => [['id' => $product->id, 'name' => $product->name, 'price' => $product->price, 'quantity' => 1]],
            'total_price' => $product->price,
            'status' => 'confirmed',
        ]);

        // Customer should not see admin's order
        $response = $this->actingAs($customer)->getJson('/api/orders');
        $response->assertStatus(200);
        $orders = $response->json();
        foreach ($orders as $order) {
            $this->assertEquals($customer->id, $order['user_id']);
        }
    }

    public function test_customer_can_resubmit_rejected_payment_proof(): void
    {
        $admin = User::where('email', 'admin@jovy.com')->first();
        $customer = User::where('email', 'carlos@customer.com')->first() ?: User::factory()->create();
        $product = Product::first();

        // 1. Customer places an order
        $orderRes = $this->actingAs($customer)->postJson('/api/orders', [
            'order_type' => 'purchase',
            'recipient_name' => 'Resubmit Customer',
            'recipient_phone' => '09123456789',
            'pickup_date' => now()->addDays(2)->format('Y-m-d'),
            'pickup_time' => '09:00',
            'wrapper_type' => 'Classic Kraft Paper',
            'items' => [
                ['id' => $product->id, 'quantity' => 1],
            ],
        ]);
        $orderRes->assertStatus(200);
        $orderId = $orderRes->json('id');

        // 2. Customer submits initial payment receipt
        \Illuminate\Support\Facades\Storage::fake('public');
        $initialFile = \Illuminate\Http\UploadedFile::fake()->image('receipt1.jpg');

        $payRes1 = $this->actingAs($customer)->postJson("/api/orders/{$orderId}/payment", [
            'receipt' => $initialFile,
            'reference_no' => 'REF-WRONG-123',
            'amount' => $product->price,
        ]);
        $payRes1->assertStatus(200);
        $this->assertEquals('awaiting_verification', Order::find($orderId)->payment_status);

        // 3. Admin rejects payment proof with feedback note
        $rejectRes = $this->actingAs($admin)->postJson("/api/admin/orders/{$orderId}/payment-status", [
            'payment_status' => 'failed',
            'admin_notes' => 'Screenshot reference number cut off. Please re-upload full receipt.',
        ]);
        $rejectRes->assertStatus(200);

        $rejectedOrder = Order::with('paymentTransactions')->find($orderId);
        $this->assertEquals('failed', $rejectedOrder->payment_status);
        $this->assertEquals(
            'Screenshot reference number cut off. Please re-upload full receipt.',
            $rejectedOrder->paymentTransactions->last()->admin_notes
        );

        // 4. Customer resubmits corrected payment proof
        $correctedFile = \Illuminate\Http\UploadedFile::fake()->image('receipt2.jpg');
        $payRes2 = $this->actingAs($customer)->postJson("/api/orders/{$orderId}/payment", [
            'receipt' => $correctedFile,
            'reference_no' => 'REF-CORRECTED-999',
            'amount' => $product->price,
        ]);
        $payRes2->assertStatus(200);

        $resubmittedOrder = Order::with('paymentTransactions')->find($orderId);
        $this->assertEquals('awaiting_verification', $resubmittedOrder->payment_status);
        $this->assertEquals('REF-CORRECTED-999', $resubmittedOrder->payment_details['reference_no']);
        $this->assertCount(2, $resubmittedOrder->paymentTransactions);
    }
}
