<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Product;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call(FlowerSeeder::class);
        $this->call(UserSeeder::class);

        // Prevent duplicate seeding
        if (Product::count() > 0) {
            return;
        }

        $products = [
            [
                'name' => 'Crimson Romance',
                'price' => 89.00,
                'category' => 'Classic Roses',
                'image' => '/images/roses.png',
                'description' => 'A luxurious bouquet of deep red roses hand-arranged in a minimalist cream ceramic vase.',
                'rating' => 5.0,
                'occasions' => ['Birthday', 'Anniversary', "Valentine's"],
                'seasons' => ['Spring', 'Summer', 'All Year'],
                'size' => '45cm H x 30cm W',
                'availability' => true,
                'gallery' => ['/images/roses.png', '/images/tulips.png'],
                'stems' => ['Red Roses' => 12, 'Eucalyptus' => 5],
            ],
            [
                'name' => 'Midnight Orchid',
                'price' => 120.00,
                'category' => 'Exotic Plants',
                'image' => '/images/orchids.png',
                'description' => 'A rare midnight purple orchid plant potted in a matte geometric ceramic dish.',
                'rating' => 4.9,
                'occasions' => ['Anniversary', 'Birthday'],
                'seasons' => ['Winter', 'All Year'],
                'size' => '55cm H x 25cm W',
                'availability' => true,
                'gallery' => ['/images/orchids.png'],
                'stems' => ['Purple Orchids' => 2, 'Fern Fronds' => 4],
            ],
            [
                'name' => 'Blushing Meadows',
                'price' => 65.00,
                'category' => 'Seasonal Tulips',
                'image' => '/images/tulips.png',
                'description' => 'A fresh bouquet of soft blushing pink and cream tulips wrapped in rustic kraft paper.',
                'rating' => 4.8,
                'occasions' => ['Birthday', "Valentine's"],
                'seasons' => ['Spring'],
                'size' => '40cm H x 28cm W',
                'availability' => true,
                'gallery' => ['/images/tulips.png', '/images/roses.png'],
                'stems' => ['Pink Tulips' => 15, 'Cream Tulips' => 10],
            ],
            [
                'name' => 'Golden Radiance',
                'price' => 2150.00,
                'category' => 'Cheerful Blooms',
                'image' => '/images/sunflowers.png',
                'description' => 'Bright and sunny golden sunflowers presented elegantly in a clear glass mason jar.',
                'rating' => 4.7,
                'occasions' => ['Birthday', 'Anniversary'],
                'seasons' => ['Summer', 'Autumn'],
                'size' => '50cm H x 35cm W',
                'availability' => true,
                'gallery' => ['/images/sunflowers.png'],
                'stems' => ['Sunflowers' => 5, 'Chamomiles' => 10, 'Greenery' => 4],
            ],
            [
                'name' => 'Pure Harmony',
                'price' => 1250.00,
                'category' => 'Exotics',
                'image' => '/images/wedding.png',
                'description' => 'A lavish luxury wedding bouquet of premium white roses, delicate white peonies, and eucalyptus leaves.',
                'rating' => 5.0,
                'occasions' => ['Wedding'],
                'seasons' => ['Spring', 'Summer', 'All Year'],
                'size' => '35cm H x 35cm W',
                'availability' => true,
                'gallery' => ['/images/wedding.png'],
                'stems' => ['White Roses' => 18, 'White Peonies' => 12, 'Eucalyptus' => 8],
            ],
            [
                'name' => 'Serene Tribute',
                'price' => 2050.00,
                'category' => 'Bouquets',
                'image' => '/images/funeral.png',
                'description' => 'A respectful sympathy flower arrangement with premium white lilies, soft white roses, and greens in a basket.',
                'rating' => 4.9,
                'occasions' => ['Funeral'],
                'seasons' => ['All Year'],
                'size' => '60cm H x 40cm W',
                'availability' => true,
                'gallery' => ['/images/funeral.png'],
                'stems' => ['White Lilies' => 6, 'White Roses' => 10, 'Palm Leaves' => 4],
            ],
            [
                'name' => 'Autumn Whisper',
                'price' => 1175.00,
                'category' => 'Bouquets',
                'image' => '/images/autumn.png',
                'description' => 'An autumn harvest layout of deep orange dahlias, golden chrysanthemums, and berries in a rustic wooden crate.',
                'rating' => 4.8,
                'occasions' => ['Birthday', 'Anniversary'],
                'seasons' => ['Autumn'],
                'size' => '45cm H x 32cm W',
                'availability' => true,
                'gallery' => ['/images/autumn.png'],
                'stems' => ['Orange Dahlias' => 8, 'Golden Chrysanthemums' => 12, 'Berries' => 6],
            ],
            [
                'name' => 'Sweet Spring',
                'price' => 1270.00,
                'category' => 'Seasonal Tulips',
                'image' => '/images/tulips.png',
                'description' => 'A bright spring arrangement of pink and purple tulips. Hand-tied and beautifully wrapped.',
                'rating' => 4.7,
                'occasions' => ['Birthday', 'Anniversary'],
                'seasons' => ['Spring'],
                'size' => '42cm H x 30cm W',
                'availability' => false,
                'gallery' => ['/images/tulips.png'],
                'stems' => ['Pink Tulips' => 10, 'Purple Tulips' => 10],
            ],
            [
                'name' => 'Lavender Serenity',
                'price' => 1260.00,
                'category' => 'Bouquets',
                'image' => '/images/sunflowers.png',
                'description' => 'A calming arrangement of dried lavender bundles, white statice, and silver foliage in a linen-wrapped vase.',
                'rating' => 4.6,
                'occasions' => ['Birthday', 'Anniversary'],
                'seasons' => ['Summer', 'All Year'],
                'size' => '38cm H x 25cm W',
                'availability' => true,
                'gallery' => ['/images/sunflowers.png'],
                'stems' => ['Lavender' => 20, 'White Statice' => 8, 'Silver Foliage' => 6],
            ],
            [
                'name' => 'Tropical Sunrise',
                'price' => 2260.00,
                'category' => 'Exotic Plants',
                'image' => '/images/orchids.png',
                'description' => 'Vibrant birds of paradise, proteas, and monstera leaves arranged in a modern ceramic block.',
                'rating' => 4.8,
                'occasions' => ['Birthday', 'Anniversary'],
                'seasons' => ['Summer'],
                'size' => '60cm H x 35cm W',
                'availability' => true,
                'gallery' => ['/images/orchids.png'],
                'stems' => ['Birds of Paradise' => 3, 'Proteas' => 4, 'Monstera Leaves' => 5],
            ],
            [
                'name' => 'Pink Whispers',
                'price' => 1285.00,
                'category' => 'Classic Roses',
                'image' => '/images/roses.png',
                'description' => 'Delicate blush pink roses paired with baby\'s breath and silver dusty miller in a vintage apothecary jar.',
                'rating' => 4.9,
                'occasions' => ['Valentine\'s', 'Anniversary', 'Wedding'],
                'seasons' => ['Spring', 'All Year'],
                'size' => '42cm H x 28cm W',
                'availability' => true,
                'gallery' => ['/images/roses.png'],
                'stems' => ['Blush Pink Roses' => 10, "Baby's Breath" => 8, 'Dusty Miller' => 4],
            ],
            [
                'name' => 'Daisy Dreams',
                'price' => 1145.00,
                'category' => 'Cheerful Blooms',
                'image' => '/images/sunflowers.png',
                'description' => 'A playful mix of white and yellow daisies, blue cornflowers, and fresh greenery in a cheerful ceramic pot.',
                'rating' => 4.5,
                'occasions' => ['Birthday'],
                'seasons' => ['Spring', 'Summer'],
                'size' => '35cm H x 30cm W',
                'availability' => true,
                'gallery' => ['/images/sunflowers.png'],
                'stems' => ['White Daisies' => 15, 'Yellow Daisies' => 10, 'Cornflowers' => 6, 'Greenery' => 5],
            ],
        ];

        foreach ($products as $prod) {
            Product::create($prod);
        }

    
       
    }
}

