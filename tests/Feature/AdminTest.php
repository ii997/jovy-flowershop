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

    public function test_admin_can_create_product_with_size_field(): void
    {
        $admin = User::where('email', 'admin@jovy.com')->first();

        $response = $this->actingAs($admin)->postJson('/api/admin/products', [
            'name' => 'Size Test Bouquet',
            'category' => 'Test',
            'image' => '/images/test.png',
            'description' => 'Testing size field',
            'size' => '30cm x 20cm',
            'occasions' => ['Birthday'],
            'seasons' => ['All Year'],
            'stems' => ['Red Roses' => 2, 'Eucalyptus' => 3],
        ]);

        $response->assertStatus(200);

        $product = \App\Models\Product::where('name', 'Size Test Bouquet')->first();
        $this->assertNotNull($product);
        $this->assertEquals('30cm x 20cm', $product->size);
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
            'size' => '30cm x 20cm',
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

    public function test_product_price_is_derived_from_flower_stems(): void
    {
        $admin = User::where('email', 'admin@jovy.com')->first();

        // Red Roses = 18.00, Eucalyptus = 5.00 (from FlowerSeeder)
        $response = $this->actingAs($admin)->postJson('/api/admin/products', [
            'name' => 'Stem Priced Bouquet',
            'price' => 999.99, // posted price must be ignored — fully derived
            'category' => 'Test',
            'image' => '/images/test.png',
            'description' => 'Price derived from stems',
            'size' => 'Size M',
            'occasions' => ['Birthday'],
            'seasons' => ['All Year'],
            'stems' => ['Red Roses' => 2, 'Eucalyptus' => 3],
        ]);

        $response->assertStatus(200);

        $product = \App\Models\Product::where('name', 'Stem Priced Bouquet')->first();
        $this->assertNotNull($product);
        // 2 * 18.00 + 3 * 5.00 = 51.00
        $this->assertEquals(51.00, $product->price);
    }

    public function test_updating_stems_recalculates_product_price(): void
    {
        $admin = User::where('email', 'admin@jovy.com')->first();

        $product = \App\Models\Product::create([
            'name' => 'Recalc Bouquet',
            'category' => 'Test',
            'image' => '/images/test.png',
            'description' => 'x',
            'size' => 'Size S',
            'occasions' => ['Birthday'],
            'seasons' => ['All Year'],
            'gallery' => ['/images/test.png'],
            'price' => 0.00,
            'stems' => ['Red Roses' => 2], // 36.00
        ]);

        $response = $this->actingAs($admin)->postJson("/api/admin/products/{$product->id}/update", [
            'name' => 'Recalc Bouquet',
            'category' => 'Test',
            'image' => '/images/test.png',
            'description' => 'x',
            'size' => 'Size M',
            'occasions' => ['Birthday'],
            'seasons' => ['All Year'],
            'price' => 999.99, // ignored
            'stems' => ['Red Roses' => 1], // 18.00
        ]);

        $response->assertStatus(200);
        $product->refresh();
        $this->assertEquals(18.00, $product->price);
    }

    public function test_updating_flower_price_reprices_dependent_products(): void
    {
        $admin = User::where('email', 'admin@jovy.com')->first();
        $redRoses = \App\Models\Flower::where('name', 'Red Roses')->first();

        $product = \App\Models\Product::create([
            'name' => 'Flower Propagation Bouquet',
            'category' => 'Test',
            'image' => '/images/test.png',
            'description' => 'x',
            'size' => 'Size S',
            'occasions' => ['Birthday'],
            'seasons' => ['All Year'],
            'gallery' => ['/images/test.png'],
            'price' => 36.00,
            'stems' => ['Red Roses' => 2],
        ]);

        // Red Roses unit price 18.00 -> 25.00  =>  2 * 25.00 = 50.00
        $response = $this->actingAs($admin)->putJson("/api/admin/flowers/{$redRoses->id}", [
            'name' => 'Red Roses',
            'price' => 25.00,
            'quantity' => $redRoses->quantity,
            'available' => true,
        ]);

        $response->assertStatus(200);
        $product->refresh();
        $this->assertEquals(50.00, $product->price);
    }

    public function test_product_without_stems_is_rejected(): void
    {
        $admin = User::where('email', 'admin@jovy.com')->first();

        $response = $this->actingAs($admin)->postJson('/api/admin/products', [
            'name' => 'No Stems Bouquet',
            'category' => 'Test',
            'image' => '/images/test.png',
            'description' => 'No stems — must be rejected',
            'size' => 'Size S',
            'occasions' => ['Birthday'],
            'seasons' => ['All Year'],
        ]);

        $response->assertStatus(422);
    }

    public function test_update_product_price_endpoint_is_removed(): void
    {
        $admin = User::where('email', 'admin@jovy.com')->first();
        $product = \App\Models\Product::first();

        $response = $this->actingAs($admin)->postJson("/api/admin/products/{$product->id}/price", [
            'price' => 5.00,
        ]);

        $response->assertStatus(404);
    }
}
