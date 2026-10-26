<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Order;
use App\Models\PaymentTransaction;
use App\Models\Product;
use App\Models\User;
use Database\Seeders\TrendsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Tests\TestCase;

class TrendsSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_trends_seeder_creates_five_years_of_verified_history_and_is_idempotent(): void
    {
        User::factory()->create(['role' => UserRole::Admin]);
        Product::create([
            'name' => 'Trend Bouquet',
            'price' => 500,
            'category' => 'Bouquets',
            'image' => '/images/bouquet1.jpg',
            'description' => 'Trend test product',
            'rating' => 5,
            'occasions' => ['Birthday'],
            'seasons' => ['All Year'],
            'availability' => true,
            'gallery' => [],
            'stems' => [],
        ]);

        Artisan::call('db:seed', ['--class' => TrendsSeeder::class, '--no-interaction' => true]);

        $trendPayments = PaymentTransaction::where('reference_no', 'like', 'TREND-DUMMY-%');
        $this->assertGreaterThanOrEqual(60, $trendPayments->count());
        $this->assertSame(0, (clone $trendPayments)
            ->whereNull('verified_at')
            ->count());

        $trendOrders = Order::whereHas('paymentTransactions', function ($query): void {
            $query->where('reference_no', 'like', 'TREND-DUMMY-%');
        })->get();
        $oldestOrder = $trendOrders->sortBy('created_at')->first();

        $this->assertNotNull($oldestOrder);
        $this->assertTrue($oldestOrder->created_at->lessThanOrEqualTo(now()->subYears(4)->startOfMonth()));
        $this->assertSame(0, $trendOrders->filter(
            fn (Order $order): bool => $order->status === 'cancelled' || $order->payment_status !== 'verified'
        )->count());

        $count = $trendPayments->count();
        Artisan::call('db:seed', ['--class' => TrendsSeeder::class, '--no-interaction' => true]);

        $this->assertSame($count, PaymentTransaction::where('reference_no', 'like', 'TREND-DUMMY-%')->count());
    }
}
