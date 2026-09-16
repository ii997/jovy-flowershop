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
                'image' => '/images/bouquet1.jpg',
                'description' => 'A luxurious bouquet of deep red roses hand-arranged in a minimalist cream ceramic vase.',
                'rating' => 5.0,
                'occasions' => ['Birthday', 'Anniversary', "Valentine's"],
                'seasons' => ['Spring', 'Summer', 'All Year'],
                'availability' => true,
                'gallery' => ['/images/bouquet1.jpg', '/images/roses.png'],
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
                'availability' => true,
                'gallery' => ['/images/orchids.png'],
                'stems' => ['Purple Orchids' => 2, 'Fern Fronds' => 4],
            ],
            [
                'name' => 'Blushing Meadows',
                'price' => 65.00,
                'category' => 'Seasonal Tulips',
                'image' => '/images/bouquet2.jpg',
                'description' => 'A fresh bouquet of soft blushing pink and cream tulips wrapped in rustic kraft paper.',
                'rating' => 4.8,
                'occasions' => ['Birthday', "Valentine's"],
                'seasons' => ['Spring'],
                'availability' => true,
                'gallery' => ['/images/bouquet2.jpg', '/images/tulips.png'],
                'stems' => ['Pink Tulips' => 15, 'Cream Tulips' => 10],
            ],
            [
                'name' => 'Golden Radiance',
                'price' => 2150.00,
                'category' => 'Cheerful Blooms',
                'image' => '/images/boquet6.jpg',
                'description' => 'Bright and sunny golden sunflowers presented elegantly in a clear glass mason jar.',
                'rating' => 4.7,
                'occasions' => ['Birthday', 'Anniversary'],
                'seasons' => ['Summer', 'Autumn'],
                'availability' => true,
                'gallery' => ['/images/boquet6.jpg', '/images/sunflowers.png'],
                'stems' => ['Sunflowers' => 5, 'Chamomiles' => 10, 'Greenery' => 4],
            ],
            [
                'name' => 'Pure Harmony',
                'price' => 1250.00,
                'category' => 'Wedding',
                'image' => '/images/wedding.png',
                'description' => 'A lavish luxury wedding bouquet of premium white roses, delicate white peonies, and eucalyptus leaves.',
                'rating' => 5.0,
                'occasions' => ['Wedding', 'Anniversary'],
                'seasons' => ['Spring', 'Summer', 'All Year'],
                'availability' => true,
                'gallery' => ['/images/wedding.png', '/images/boquet10.jpg'],
                'stems' => ['White Roses' => 18, 'White Peonies' => 12, 'Eucalyptus' => 8],
            ],
            [
                'name' => 'Serene Tribute',
                'price' => 2050.00,
                'category' => 'Funeral',
                'image' => '/images/funeral1.jpg',
                'description' => 'A respectful sympathy flower arrangement with premium white lilies, soft white roses, and greens in a basket.',
                'rating' => 4.9,
                'occasions' => ['Funeral'],
                'seasons' => ['All Year'],
                'availability' => true,
                'gallery' => ['/images/funeral1.jpg', '/images/funeral.png'],
                'stems' => ['White Lilies' => 6, 'White Roses' => 10, 'Palm Leaves' => 4],
            ],
            [
                'name' => 'Condolence Standing Spray',
                'price' => 2450.00,
                'category' => 'Funeral',
                'image' => '/images/funeral2.jpg',
                'description' => 'An elegant standing funeral floral easel with white chrysanthemums, carnations, and lush sympathy greenery.',
                'rating' => 5.0,
                'occasions' => ['Funeral'],
                'seasons' => ['All Year'],
                'availability' => true,
                'gallery' => ['/images/funeral2.jpg', '/images/funeral1.jpg'],
                'stems' => ['Chrysanthemum' => 15, 'Carnation' => 12, 'Palm Leaves' => 6],
            ],
            [
                'name' => 'Peace & Grace Wreath',
                'price' => 2800.00,
                'category' => 'Funeral',
                'image' => '/images/funeral3.jpg',
                'description' => 'A heart-shaped condolence memorial wreath crafted with white blossoms and delicate ribbons.',
                'rating' => 4.9,
                'occasions' => ['Funeral'],
                'seasons' => ['All Year'],
                'availability' => true,
                'gallery' => ['/images/funeral3.jpg', '/images/funeral4.jpg'],
                'stems' => ['White Roses' => 16, 'Carnation' => 10, 'Palm Leaves' => 8],
            ],
            [
                'name' => 'White Lily Sympathy Basket',
                'price' => 1950.00,
                'category' => 'Funeral',
                'image' => '/images/funeral4.jpg',
                'description' => 'A peaceful tribute basket arrangement of fragrant white lilies and greenery.',
                'rating' => 4.8,
                'occasions' => ['Funeral'],
                'seasons' => ['All Year'],
                'availability' => true,
                'gallery' => ['/images/funeral4.jpg'],
                'stems' => ['Liliums' => 6, 'White Roses' => 8, 'Greenery' => 5],
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
                'availability' => true,
                'gallery' => ['/images/autumn.png'],
                'stems' => ['Orange Dahlias' => 8, 'Golden Chrysanthemums' => 12, 'Berries' => 6],
            ],
            [
                'name' => 'Sweet Spring',
                'price' => 1270.00,
                'category' => 'Seasonal Tulips',
                'image' => '/images/bouquet3.jpg',
                'description' => 'A bright spring arrangement of pink and purple tulips. Hand-tied and beautifully wrapped.',
                'rating' => 4.7,
                'occasions' => ['Birthday', 'Anniversary'],
                'seasons' => ['Spring'],
                'availability' => false,
                'gallery' => ['/images/bouquet3.jpg', '/images/tulips.png'],
                'stems' => ['Pink Tulips' => 10, 'Purple Tulips' => 10],
            ],
            [
                'name' => 'Lavender Serenity',
                'price' => 1260.00,
                'category' => 'Bouquets',
                'image' => '/images/boquet7.jpg',
                'description' => 'A calming arrangement of dried lavender bundles, white statice, and silver foliage in a linen-wrapped vase.',
                'rating' => 4.6,
                'occasions' => ['Birthday', 'Anniversary'],
                'seasons' => ['Summer', 'All Year'],
                'availability' => true,
                'gallery' => ['/images/boquet7.jpg'],
                'stems' => ['Lavender' => 20, 'White Statice' => 8, 'Silver Foliage' => 6],
            ],
            [
                'name' => 'Tropical Sunrise',
                'price' => 2260.00,
                'category' => 'Exotic Plants',
                'image' => '/images/boquet8.jpg',
                'description' => 'Vibrant birds of paradise, proteas, and monstera leaves arranged in a modern ceramic block.',
                'rating' => 4.8,
                'occasions' => ['Birthday', 'Anniversary'],
                'seasons' => ['Summer'],
                'availability' => true,
                'gallery' => ['/images/boquet8.jpg', '/images/orchids.png'],
                'stems' => ['Birds of Paradise' => 3, 'Proteas' => 4, 'Monstera Leaves' => 5],
            ],
            [
                'name' => 'Pink Whispers',
                'price' => 1285.00,
                'category' => 'Classic Roses',
                'image' => '/images/boquet5.jpg',
                'description' => 'Delicate blush pink roses paired with baby\'s breath and silver dusty miller in a vintage apothecary jar.',
                'rating' => 4.9,
                'occasions' => ["Valentine's", 'Anniversary', 'Wedding'],
                'seasons' => ['Spring', 'All Year'],
                'availability' => true,
                'gallery' => ['/images/boquet5.jpg'],
                'stems' => ['Blush Pink Roses' => 10, "Baby's Breath" => 8, 'Dusty Miller' => 4],
            ],
            [
                'name' => 'Daisy Dreams',
                'price' => 1145.00,
                'category' => 'Cheerful Blooms',
                'image' => '/images/boquet9.jpg',
                'description' => 'A playful mix of white and yellow daisies, blue cornflowers, and fresh greenery in a cheerful ceramic pot.',
                'rating' => 4.5,
                'occasions' => ['Birthday'],
                'seasons' => ['Spring', 'Summer'],
                'availability' => true,
                'gallery' => ['/images/boquet9.jpg'],
                'stems' => ['White Daisies' => 15, 'Yellow Daisies' => 10, 'Cornflowers' => 6, 'Greenery' => 5],
            ],
            [
                'name' => 'Pastel Elegance',
                'price' => 1550.00,
                'category' => 'Bouquets',
                'image' => '/images/boquet10.jpg',
                'description' => 'A charming pastel hand-tied bouquet wrapped in premium Korean paper with silk ribbon.',
                'rating' => 4.9,
                'occasions' => ['Birthday', 'Anniversary', 'Graduation'],
                'seasons' => ['Spring', 'Summer', 'All Year'],
                'availability' => true,
                'gallery' => ['/images/boquet10.jpg', '/images/boquet4.jpg'],
                'stems' => ['Carnation' => 10, 'Roses' => 8, 'Greenery' => 4],
            ],
            [
                'name' => 'Artisan Bloom Wrap',
                'price' => 1380.00,
                'category' => 'Bouquets',
                'image' => '/images/boquet4.jpg',
                'description' => 'A bespoke artisan florist creation featuring seasonal focal blooms and textured fillers.',
                'rating' => 4.8,
                'occasions' => ['Birthday', 'Anniversary'],
                'seasons' => ['All Year'],
                'availability' => true,
                'gallery' => ['/images/boquet4.jpg'],
                'stems' => ['Roses' => 6, 'Chrysanthemum' => 9, 'Greenery' => 4],
            ],
        ];

        foreach ($products as $prod) {
            Product::create($prod);
        }

        $this->call(DummyDataSeeder::class);
    }
}

