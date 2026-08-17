<?php

namespace Database\Seeders;

use App\Models\Flower;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class FlowerSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $flowers = [
            // General inventory flowers with pricing rules
            ['name' => 'Roses',              'price' => 20.00, 'unit_type' => 'stem',  'quantity' => 120, 'available' => true],
            ['name' => 'Chrysanthemum',      'price' => 35.00, 'unit_type' => 'stem',  'bundle_qty' => 3, 'bundle_price' => 100.00, 'quantity' => 200, 'available' => true],
            ['name' => 'Anthurium',          'price' => 150.00,'unit_type' => 'stem',  'size' => 'Medium', 'quantity' => 50,  'available' => true],
            ['name' => 'Anthurium (Small)',  'price' => 100.00,'unit_type' => 'stem',  'size' => 'Small',  'quantity' => 30,  'available' => true],
            ['name' => 'Anthurium (Medium)', 'price' => 150.00,'unit_type' => 'stem',  'size' => 'Medium', 'quantity' => 50,  'available' => true],
            ['name' => 'Anthurium (Large)',  'price' => 200.00,'unit_type' => 'stem',  'size' => 'Large',  'quantity' => 20,  'available' => true],
            ['name' => "Lady's Spread",      'price' => 250.00,'unit_type' => 'kilo',  'quantity' => 30,  'available' => true],
            ['name' => 'Liliums',            'price' => 250.00,'unit_type' => 'stick', 'quantity' => 80,  'available' => true],
            ['name' => 'Carnation',          'price' => 60.00, 'unit_type' => 'stick', 'quantity' => 250, 'available' => true],
            ['name' => 'Sunflower',          'price' => 150.00,'unit_type' => 'stick', 'quantity' => 90,  'available' => true],

            // Stem flowers referenced by product recipes
            ['name' => 'Red Roses',           'price' => 18.00, 'quantity' => 200, 'available' => true],
            ['name' => 'White Roses',         'price' => 18.00, 'quantity' => 200, 'available' => true],
            ['name' => 'Blush Pink Roses',    'price' => 20.00, 'quantity' => 150, 'available' => true],
            ['name' => 'Eucalyptus',          'price' => 5.00,  'quantity' => 300, 'available' => true],
            ['name' => 'Purple Orchids',      'price' => 30.00, 'quantity' => 80,  'available' => true],
            ['name' => 'Fern Fronds',         'price' => 4.00,  'quantity' => 200, 'available' => true],
            ['name' => 'Pink Tulips',         'price' => 8.00,  'quantity' => 200, 'available' => true],
            ['name' => 'Cream Tulips',        'price' => 8.00,  'quantity' => 150, 'available' => true],
            ['name' => 'Purple Tulips',       'price' => 9.00,  'quantity' => 120, 'available' => true],
            ['name' => 'Sunflowers',          'price' => 12.00, 'quantity' => 100, 'available' => true],
            ['name' => 'White Peonies',       'price' => 22.00, 'quantity' => 80,  'available' => true],
            ['name' => 'White Lilies',        'price' => 16.00, 'quantity' => 90,  'available' => true],
            ['name' => 'Palm Leaves',         'price' => 6.00,  'quantity' => 150, 'available' => true],
            ['name' => 'Orange Dahlias',      'price' => 10.00, 'quantity' => 100, 'available' => true],
            ['name' => 'Golden Chrysanthemums','price' => 8.00,  'quantity' => 150, 'available' => true],
            ['name' => 'Berries',             'price' => 7.00,  'quantity' => 120, 'available' => true],
            ['name' => 'Lavender',            'price' => 6.00,  'quantity' => 200, 'available' => true],
            ['name' => 'White Statice',       'price' => 5.00,  'quantity' => 150, 'available' => true],
            ['name' => 'Silver Foliage',      'price' => 4.00,  'quantity' => 180, 'available' => true],
            ['name' => 'Birds of Paradise',   'price' => 28.00, 'quantity' => 60,  'available' => true],
            ['name' => 'Proteas',             'price' => 25.00, 'quantity' => 50,  'available' => true],
            ['name' => 'Monstera Leaves',     'price' => 8.00,  'quantity' => 100, 'available' => true],
            ['name' => 'Chamomiles',          'price' => 5.00,  'quantity' => 200, 'available' => true],
            ['name' => 'Greenery',            'price' => 4.00,  'quantity' => 300, 'available' => true],
            ['name' => 'Dusty Miller',        'price' => 5.00,  'quantity' => 150, 'available' => true],
            ['name' => 'White Daisies',       'price' => 5.00,  'quantity' => 200, 'available' => true],
            ['name' => 'Yellow Daisies',      'price' => 5.00,  'quantity' => 200, 'available' => true],
            ['name' => 'Cornflowers',         'price' => 7.00,  'quantity' => 150, 'available' => true],
            ['name' => "Baby's Breath",       'price' => 4.00,  'quantity' => 250, 'available' => true],
        ];

        foreach ($flowers as $flower) {
            Flower::create($flower);
        }
    }
}
