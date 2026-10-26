<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\Order;
use App\Models\PaymentTransaction;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class TrendsSeeder extends Seeder
{
    private const REFERENCE_PREFIX = 'TREND-DUMMY-';

    public function run(): void
    {
        if (PaymentTransaction::where('reference_no', 'like', self::REFERENCE_PREFIX.'%')->exists()) {
            $this->command?->info('Historical trend data already exists. Nothing was added.');

            return;
        }

        $products = Product::query()->get();
        if ($products->isEmpty()) {
            $this->command?->warn('No products found. Seed products before generating trend data.');

            return;
        }

        $admin = User::query()->where('role', UserRole::Admin)->first();
        $customers = $this->customers();

        if (! $admin || $customers->isEmpty()) {
            $this->command?->warn('Seed an admin and at least one customer before generating trend data.');

            return;
        }

        mt_srand(20261026);
        $now = Carbon::now();
        $month = $now->copy()->subYears(5)->startOfMonth();
        $lastMonth = $now->copy()->startOfMonth();
        $orderNumber = 1;

        DB::transaction(function () use ($admin, $customers, $products, $month, $lastMonth, $now, &$orderNumber): void {
            while ($month->lessThanOrEqualTo($lastMonth)) {
                $ordersThisMonth = mt_rand(4, 8);
                $lastDay = $month->isSameMonth($now) ? max(1, $now->day - 1) : $month->daysInMonth;

                for ($sequence = 1; $sequence <= $ordersThisMonth; $sequence++) {
                    $product = $products[mt_rand(0, $products->count() - 1)];
                    $quantity = mt_rand(1, 2);
                    $total = round((float) $product->price * $quantity, 2);
                    $createdAt = $month->copy()
                        ->addDays(mt_rand(0, max(0, $lastDay - 1)))
                        ->setTime(mt_rand(8, 18), mt_rand(0, 59));

                    if ($createdAt->greaterThanOrEqualTo($now)) {
                        $createdAt = $now->copy()->subHours(2);
                    }

                    $verifiedAt = $createdAt->copy()->addHours(mt_rand(1, 6));
                    if ($verifiedAt->greaterThan($now)) {
                        $verifiedAt = $now->copy()->subHour();
                    }

                    $customer = $customers[($orderNumber - 1) % $customers->count()];
                    $reference = self::REFERENCE_PREFIX.$month->format('Ym').'-'.str_pad((string) $sequence, 2, '0', STR_PAD_LEFT);
                    $items = [[
                        'id' => $product->id,
                        'name' => $product->name,
                        'price' => (float) $product->price,
                        'quantity' => $quantity,
                    ]];

                    $order = new Order([
                        'user_id' => $customer->id,
                        'order_type' => 'purchase',
                        'recipient_name' => $customer->name,
                        'recipient_phone' => '09'.str_pad((string) (170000000 + $orderNumber), 9, '0', STR_PAD_LEFT),
                        'pickup_date' => $createdAt->toDateString(),
                        'items' => $items,
                        'total_price' => $total,
                        'status' => 'delivered',
                        'payment_status' => 'verified',
                    ]);
                    $order->created_at = $createdAt;
                    $order->updated_at = $verifiedAt;
                    $order->save();

                    $payment = new PaymentTransaction([
                        'order_id' => $order->id,
                        'type' => 'payment',
                        'amount' => $total,
                        'method' => $orderNumber % 2 === 0 ? 'GCash' : 'Cash',
                        'reference_no' => $reference,
                        'admin_notes' => 'Generated historical trend data.',
                        'verified_by' => $admin->id,
                        'verified_at' => $verifiedAt,
                    ]);
                    $payment->created_at = $verifiedAt;
                    $payment->updated_at = $verifiedAt;
                    $payment->save();

                    $orderNumber++;
                }

                $month->addMonth();
            }
        });

        $createdOrders = $orderNumber - 1;
        $this->command?->info("Created {$createdOrders} historical trend orders.");
    }

    private function customers()
    {
        return collect(range(1, 8))->map(function (int $number): User {
            return User::firstOrCreate(
                ['email' => "trend.customer.{$number}@jovy.test"],
                [
                    'name' => "Trend Customer {$number}",
                    'password' => bcrypt('password'),
                    'role' => UserRole::Customer,
                ]
            );
        });
    }
}
