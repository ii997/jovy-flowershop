<?php

namespace Tests\Unit;

use App\Models\Flower;
use App\Support\ProductPricing;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductPricingTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Seed flowers with custom rules
        Flower::create(['name' => 'Roses', 'price' => 20.00, 'unit_type' => 'stem', 'quantity' => 100]);
        Flower::create(['name' => 'Chrysanthemum', 'price' => 35.00, 'unit_type' => 'stem', 'bundle_qty' => 3, 'bundle_price' => 100.00, 'quantity' => 100]);
        Flower::create(['name' => 'Anthurium', 'price' => 150.00, 'unit_type' => 'stem', 'size' => 'Medium', 'quantity' => 50]);
        Flower::create(['name' => 'Anthurium (Small)', 'price' => 100.00, 'unit_type' => 'stem', 'size' => 'Small', 'quantity' => 50]);
        Flower::create(['name' => 'Anthurium (Medium)', 'price' => 150.00, 'unit_type' => 'stem', 'size' => 'Medium', 'quantity' => 50]);
        Flower::create(['name' => 'Anthurium (Large)', 'price' => 200.00, 'unit_type' => 'stem', 'size' => 'Large', 'quantity' => 50]);
        Flower::create(['name' => "Lady's Spread", 'price' => 250.00, 'unit_type' => 'kilo', 'quantity' => 50]);
        Flower::create(['name' => 'Liliums', 'price' => 250.00, 'unit_type' => 'stick', 'quantity' => 50]);
        Flower::create(['name' => 'Carnation', 'price' => 60.00, 'unit_type' => 'stick', 'quantity' => 50]);
        Flower::create(['name' => 'Sunflower', 'price' => 150.00, 'unit_type' => 'stick', 'quantity' => 50]);
    }

    public function test_standard_unit_pricing(): void
    {
        $price = ProductPricing::computePrice([
            'Roses' => 5, // 5 * 20 = 100
            'Liliums' => 2, // 2 * 250 = 500
            'Carnation' => 3, // 3 * 60 = 180
            'Sunflower' => 1, // 1 * 150 = 150
        ]);

        $this->assertEquals(930.00, $price);
    }

    public function test_chrysanthemum_bundle_pricing(): void
    {
        // 1 stem = 35
        $this->assertEquals(35.00, ProductPricing::computePrice(['Chrysanthemum' => 1]));

        // 3 stems = bundle of 3 for 100
        $this->assertEquals(100.00, ProductPricing::computePrice(['Chrysanthemum' => 3]));

        // 4 stems = 1 bundle (100) + 1 single (35) = 135
        $this->assertEquals(135.00, ProductPricing::computePrice(['Chrysanthemum' => 4]));

        // 6 stems = 2 bundles (2 * 100) = 200
        $this->assertEquals(200.00, ProductPricing::computePrice(['Chrysanthemum' => 6]));
    }

    public function test_anthurium_size_dependent_pricing(): void
    {
        $smallPrice = ProductPricing::computePrice(['Anthurium (Small)' => 2]); // 2 * 100 = 200
        $mediumPrice = ProductPricing::computePrice(['Anthurium (Medium)' => 2]); // 2 * 150 = 300
        $largePrice = ProductPricing::computePrice(['Anthurium (Large)' => 2]); // 2 * 200 = 400

        $this->assertEquals(200.00, $smallPrice);
        $this->assertEquals(300.00, $mediumPrice);
        $this->assertEquals(400.00, $largePrice);
    }

    public function test_ladys_spread_fractional_kilo_pricing(): void
    {
        // 0.2 kg @ 250/kg = 50
        $this->assertEquals(50.00, ProductPricing::computePrice(["Lady's Spread" => 0.2]));

        // 1.5 kg @ 250/kg = 375
        $this->assertEquals(375.00, ProductPricing::computePrice(["Lady's Spread" => 1.5]));
    }

    public function test_mixed_premade_bouquet_pricing(): void
    {
        $recipe = [
            'Roses' => 5,                        // 5 * 20 = 100
            'Chrysanthemum' => 4,                // 100 + 35 = 135
            'Anthurium (Medium)' => 1,           // 1 * 150 = 150
            "Lady's Spread" => 0.2,              // 0.2 * 250 = 50
        ];

        // Total = 100 + 135 + 150 + 50 = 435.00
        $this->assertEquals(435.00, ProductPricing::computePrice($recipe));
    }
}
