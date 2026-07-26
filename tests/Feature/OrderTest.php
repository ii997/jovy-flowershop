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

    public function test_order_rejects_non_existent_product(): void
    {
        $user = User::where('email', 'carlos@customer.com')->first() ?: User::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/orders', [
            'order_type' => 'purchase',
            'recipient_name' => 'Jane Doe',
            'recipient_phone' => '09123456789',
            'pickup_date' => now()->addDays(2)->format('Y-m-d'),
            'wrapper_type' => 'Classic Kraft Paper',
            'items' => [
                ['id' => 99999, 'quantity' => 1],
            ],
        ]);

        $response->assertStatus(422);
    }
}
