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

    public function test_admin_can_create_product(): void
    {
        $admin = User::where('email', 'admin@jovy.com')->first();

        $response = $this->actingAs($admin)->postJson('/api/admin/products', [
            'name' => 'Test Bouquet',
            'category' => 'Test',
            'image' => '/images/test.png',
            'description' => 'Testing product creation',
            'occasions' => ['Birthday'],
            'seasons' => ['All Year'],
            'stems' => ['Red Roses' => 2, 'Eucalyptus' => 3],
        ]);

        $response->assertStatus(200);

        $product = \App\Models\Product::where('name', 'Test Bouquet')->first();
        $this->assertNotNull($product);
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
            'recent_orders',
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

    public function test_product_price_is_derived_from_stems_catalog(): void
    {
        $admin = User::where('email', 'admin@jovy.com')->first();

        // Red Roses = 18.00, Eucalyptus = 5.00 (from FlowerSeeder)
        $response = $this->actingAs($admin)->postJson('/api/admin/products', [
            'name' => 'Stem Priced Bouquet',
            'price' => 999.99, // posted price must be ignored — fully derived
            'category' => 'Test',
            'image' => '/images/test.png',
            'description' => 'Price derived from stems',
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
            'occasions' => ['Birthday'],
            'seasons' => ['All Year'],
            'gallery' => ['/images/test.png'],
            'price' => 0.00,
            'stems' => ['Red Roses' => 2], // 36.00
        ]);

        $response = $this->actingAs($admin)->putJson("/api/admin/products/{$product->id}", [
            'name' => 'Recalc Bouquet',
            'category' => 'Test',
            'image' => '/images/test.png',
            'description' => 'x',
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

    public function test_admin_can_create_product_with_size_variant_stems(): void
    {
        $admin = User::where('email', 'admin@jovy.com')->first();

        // Create Anthurium flower with size Medium
        \App\Models\Flower::firstOrCreate(
            ['name' => 'Anthurium', 'size' => 'Medium'],
            ['price' => 150.00, 'quantity' => 20, 'available' => true]
        );

        $response = $this->actingAs($admin)->postJson('/api/admin/products', [
            'name' => 'Anthurium Arrangement',
            'category' => 'Exotic Plants',
            'image' => '/images/bouquet1.jpg',
            'description' => 'Arrangement with size-variant flowers',
            'occasions' => ['Birthday', 'Anniversary'],
            'seasons' => ['All Year'],
            'stems' => ['Anthurium (Medium)' => 2],
        ]);

        $response->assertStatus(200);
        $product = \App\Models\Product::where('name', 'Anthurium Arrangement')->first();
        $this->assertNotNull($product);
        $this->assertEquals(300.00, $product->price);
    }

    public function test_admin_can_toggle_holiday_surge_pricing_and_exempt_funeral_products(): void
    {
        $admin = User::where('email', 'admin@jovy.com')->first();
        $customer = User::where('email', 'carlos@customer.com')->first() ?: User::factory()->create();

        // 1. Save settings with surge_pricing = true
        $res = $this->actingAs($admin)->postJson('/api/admin/settings', [
            'store_name' => "Jovy's Flowershop",
            'store_phone' => "+639097850776",
            'store_address' => "Brgy. Poblacion, Kidapawan City, Cotabato",
            'maintenance_mode' => false,
            'surge_pricing' => true,
            'qr_image' => "",
            'downpayment_pct' => 30,
        ]);
        $res->assertStatus(200);

        // Verify getSettings returns surge_pricing = true
        $settingsRes = $this->getJson('/api/settings');
        $settingsRes->assertStatus(200)->assertJson(['surge_pricing' => true]);

        // 2. Create one standard bouquet and one funeral bouquet
        $flower = \App\Models\Flower::first();
        $regularProduct = \App\Models\Product::create([
            'name' => 'Valentine Rose Surprise',
            'category' => 'Bouquets',
            'image' => '/images/boquet4.jpg',
            'description' => 'Romantic bouquet',
            'occasions' => ['Birthday', 'Anniversary'],
            'seasons' => ['All Year'],
            'price' => 1000.00,
            'rating' => 5.0,
            'availability' => true,
            'quantity' => 10,
            'gallery' => ['/images/boquet4.jpg'],
            'stems' => [$flower->name => 5],
        ]);

        $funeralProduct = \App\Models\Product::create([
            'name' => 'Peaceful Memorial Wreath',
            'category' => 'Funeral & Sympathy',
            'image' => '/images/funeral1.jpg',
            'description' => 'Sympathy arrangement',
            'occasions' => ['Funeral'],
            'seasons' => ['All Year'],
            'price' => 1500.00,
            'rating' => 5.0,
            'availability' => true,
            'quantity' => 5,
            'gallery' => ['/images/funeral1.jpg'],
            'stems' => [$flower->name => 5],
        ]);

        // 3. Test /api/products returns doubled price for standard and regular price for funeral
        $catalogRes = $this->getJson('/api/products');
        $catalogRes->assertStatus(200);
        $items = collect($catalogRes->json('data'));

        $regularInCatalog = $items->firstWhere('id', $regularProduct->id);
        $funeralInCatalog = $items->firstWhere('id', $funeralProduct->id);

        $this->assertEquals(2000.00, $regularInCatalog['price']);
        $this->assertTrue($regularInCatalog['is_surge_applied']);
        $this->assertEquals(1000.00, $regularInCatalog['base_price']);

        $this->assertEquals(1500.00, $funeralInCatalog['price']);
        $this->assertFalse($funeralInCatalog['is_surge_applied']);

        // 4. Test checkout order creation charges 2x for regular and 1x for funeral
        $orderRes = $this->actingAs($customer)->postJson('/api/orders', [
            'order_type' => 'purchase',
            'recipient_name' => 'Jane Doe',
            'recipient_phone' => '09123456789',
            'pickup_date' => now()->addDays(1)->format('Y-m-d'),
            'items' => [
                ['id' => $regularProduct->id, 'quantity' => 1],
                ['id' => $funeralProduct->id, 'quantity' => 1],
            ],
        ]);

        $orderRes->assertStatus(200);
        // Total should be: 2000 (regular doubled) + 1500 (funeral standard) = 3500
        $this->assertEquals(3500.00, (float) $orderRes->json('total_price'));

        // 5. Test Undas / All Souls' Day mode: surge_pricing = true AND surge_exempt_funeral = false
        $this->actingAs($admin)->postJson('/api/admin/settings', [
            'store_name' => "Jovy's Flowershop",
            'store_phone' => "+639097850776",
            'store_address' => "Brgy. Poblacion, Kidapawan City, Cotabato",
            'maintenance_mode' => false,
            'surge_pricing' => true,
            'surge_exempt_funeral' => false,
            'qr_image' => "",
            'downpayment_pct' => 30,
        ]);

        $settingsRes2 = $this->getJson('/api/settings');
        $settingsRes2->assertStatus(200)->assertJson([
            'surge_pricing' => true,
            'surge_exempt_funeral' => false,
        ]);

        $catalogRes2 = $this->getJson('/api/products');
        $items2 = collect($catalogRes2->json('data'));
        $regularInCatalog2 = $items2->firstWhere('id', $regularProduct->id);
        $funeralInCatalog2 = $items2->firstWhere('id', $funeralProduct->id);

        // Both regular and funeral are doubled in Undas mode
        $this->assertEquals(2000.00, $regularInCatalog2['price']);
        $this->assertTrue($regularInCatalog2['is_surge_applied']);
        $this->assertEquals(3000.00, $funeralInCatalog2['price']);
        $this->assertTrue($funeralInCatalog2['is_surge_applied']);

        // Order in Undas mode: 2000 + 3000 = 5000
        $orderRes2 = $this->actingAs($customer)->postJson('/api/orders', [
            'order_type' => 'purchase',
            'recipient_name' => 'Jane Doe Undas',
            'recipient_phone' => '09123456789',
            'pickup_date' => now()->addDays(1)->format('Y-m-d'),
            'items' => [
                ['id' => $regularProduct->id, 'quantity' => 1],
                ['id' => $funeralProduct->id, 'quantity' => 1],
            ],
        ]);
        $orderRes2->assertStatus(200);
        $this->assertEquals(5000.00, (float) $orderRes2->json('total_price'));

        // 6. Clean up settings back to false
        $this->actingAs($admin)->postJson('/api/admin/settings', [
            'store_name' => "Jovy's Flowershop",
            'store_phone' => "+639097850776",
            'store_address' => "Brgy. Poblacion, Kidapawan City, Cotabato",
            'maintenance_mode' => false,
            'surge_pricing' => false,
            'surge_exempt_funeral' => true,
            'qr_image' => "",
            'downpayment_pct' => 30,
        ]);
    }

    public function test_monthly_product_sales_returns_sorted_top_sellers_with_categories(): void
    {
        $admin = User::where('email', 'admin@jovy.com')->first();
        $customer = User::where('email', 'carlos@customer.com')->first() ?: User::factory()->create();

        $productA = \App\Models\Product::create([
            'name' => 'Birthday Grand Bouquet',
            'category' => 'Bouquets',
            'occasions' => ['Birthday', 'Anniversary'],
            'seasons' => ['All Year'],
            'gallery' => [],
            'price' => 1500.00,
            'image' => '/images/bouquet1.jpg',
            'description' => 'Test bouquet',
            'stems' => ['Roses' => 10],
            'availability' => true,
        ]);

        $productB = \App\Models\Product::create([
            'name' => 'Funeral Standing Spray',
            'category' => 'Funeral & Sympathy',
            'occasions' => ['Funeral'],
            'seasons' => ['All Year'],
            'gallery' => [],
            'price' => 3000.00,
            'image' => '/images/funeral1.jpg',
            'description' => 'Test funeral spray',
            'stems' => ['Anthurium' => 10],
            'availability' => true,
        ]);

        // Create orders in Jan 2025: Product A (3 units = 4500), Product B (1 unit = 3000)
        $order1 = new \App\Models\Order([
            'user_id' => $customer->id,
            'recipient_name' => 'Jan Recipient',
            'recipient_phone' => '09171112222',
            'order_type' => 'purchase',
            'pickup_date' => '2025-01-15',
            'total_price' => 4500.00,
            'status' => 'confirmed',
            'items' => [
                ['id' => $productA->id, 'name' => $productA->name, 'price' => 1500.00, 'quantity' => 3],
            ],
        ]);
        $order1->created_at = '2025-01-15 10:00:00';
        $order1->save();

        $order2 = new \App\Models\Order([
            'user_id' => $customer->id,
            'recipient_name' => 'Jan Recipient 2',
            'recipient_phone' => '09171112222',
            'order_type' => 'purchase',
            'pickup_date' => '2025-01-20',
            'total_price' => 3000.00,
            'status' => 'confirmed',
            'items' => [
                ['id' => $productB->id, 'name' => $productB->name, 'price' => 3000.00, 'quantity' => 1],
            ],
        ]);
        $order2->created_at = '2025-01-20 14:00:00';
        $order2->save();

        $response = $this->actingAs($admin)->getJson('/api/admin/stats/monthly-products?month=2025-01');
        $response->assertStatus(200);

        $data = $response->json();
        $this->assertEquals('2025-01', $data['month']);
        $this->assertCount(2, $data['products']);

        // First item should be Product A (revenue 4500 > 3000)
        $this->assertEquals($productA->id, $data['products'][0]['id']);
        $this->assertEquals(4500.00, $data['products'][0]['revenue']);
        $this->assertEquals(3, $data['products'][0]['units_sold']);
        $this->assertContains('Birthday', $data['products'][0]['occasions']);
        $this->assertEquals('Bouquets', $data['products'][0]['category']);

        // Second item should be Product B
        $this->assertEquals($productB->id, $data['products'][1]['id']);
        $this->assertEquals(3000.00, $data['products'][1]['revenue']);
        $this->assertEquals(1, $data['products'][1]['units_sold']);
        $this->assertEquals('Funeral & Sympathy', $data['products'][1]['category']);
    }
}

