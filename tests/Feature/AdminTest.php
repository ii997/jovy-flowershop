<?php

namespace Tests\Feature;

use App\Models\User;
use App\Enums\UserRole;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
    }

    public function test_non_admin_cannot_access_admin_stats(): void
    {
        $customer = User::where('email', 'carlos@customer.com')->first() ?: User::factory()->create();

        $response = $this->actingAs($customer)->getJson('/api/admin/stats');
        $response->assertStatus(403);
    }

    public function test_staff_cannot_access_admin_only_endpoints(): void
    {
        $staff = User::where('email', 'staff@jovy.com')->first();

        $response = $this->actingAs($staff)->postJson('/api/admin/products', [
            'name' => 'Test Bouquet',
            'price' => 50.00,
            'category' => 'Test',
            'image' => '/images/test.png',
            'description' => 'Test description',
            'dimensions' => '30cm x 20cm',
            'occasions' => ['Birthday'],
            'seasons' => ['All Year'],
        ]);

        $response->assertStatus(403);
    }

    public function test_admin_can_access_stats(): void
    {
        $admin = User::where('email', 'admin@jovy.com')->first();

        $response = $this->actingAs($admin)->getJson('/api/admin/stats');
        $response->assertStatus(200);
        $response->assertJsonStructure([
            'gross_sales',
            'total_orders',
            'active_listings',
            'revenue_tracking',
            'trends',
        ]);
    }

    public function test_staff_can_view_orders(): void
    {
        $staff = User::where('email', 'staff@jovy.com')->first();

        $response = $this->actingAs($staff)->getJson('/api/admin/orders');
        $response->assertStatus(200);
    }

    public function test_admin_can_update_order_status(): void
    {
        $admin = User::where('email', 'admin@jovy.com')->first();
        $product = \App\Models\Product::first();

        // Create an order first
        $order = \App\Models\Order::create([
            'user_id' => $admin->id,
            'order_type' => 'purchase',
            'recipient_name' => 'Test',
            'recipient_phone' => '09123456789',
            'pickup_date' => now()->addDays(1)->format('Y-m-d'),
            'wrapper_type' => 'Paper',
            'items' => [['id' => $product->id, 'name' => $product->name, 'price' => $product->price, 'quantity' => 1]],
            'total_price' => $product->price,
            'status' => 'confirmed',
        ]);

        $response = $this->actingAs($admin)->postJson("/api/admin/orders/{$order->id}/status", [
            'status' => 'preparing',
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('status', 'preparing');
    }

    public function test_guest_cannot_access_admin_routes(): void
    {
        $response = $this->getJson('/api/admin/stats');
        $response->assertStatus(401); // Redirected to login by auth middleware
    }
}
