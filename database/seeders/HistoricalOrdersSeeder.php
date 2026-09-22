<?php

namespace Database\Seeders;

use App\Models\Order;
use App\Models\PaymentTransaction;
use App\Models\Product;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class HistoricalOrdersSeeder extends Seeder
{
    /**
     * Run the database seeds for 2024, 2025, and 2026.
     */
    public function run(): void
    {
        $products = Product::all();
        if ($products->isEmpty()) {
            $this->call(DatabaseSeeder::class);
            $products = Product::all();
        }

        if ($products->isEmpty()) {
            return;
        }

        $users = User::all();
        $sampleNames = [
            'Maria Santos', 'Juan Dela Cruz', 'Ana Reyes', 'Carlo Mendoza',
            'Bea Alonzo', 'Daniel Padilla', 'Kathryn Bernardo', 'Enrique Gil',
            'Liza Soberano', 'Sarah Geronimo', 'James Reid', 'Nadine Lustre',
            'Alden Richards', 'Maine Mendoza', 'Piolo Pascual', 'Marian Rivera',
            'Dingdong Dantes', 'Heart Evangelista', 'Angel Locsin', 'Anne Curtis'
        ];

        // Seed parameters per year
        // 2024: baseline 25-45 orders/month, spikes in Feb (65), May (55), Dec (50)
        // 2025: baseline 40-65 orders/month, spikes in Feb (95), May (85), Dec (80)
        // 2026: baseline 60-90 orders/month, spikes in Feb (130), May (115) (up to current month: Sep 2026)
        $years = [
            2024 => ['months' => 12, 'growth' => 1.0],
            2025 => ['months' => 12, 'growth' => 1.5],
            2026 => ['months' => 9, 'growth' => 2.1],
        ];

        foreach ($years as $year => $config) {
            // Check if orders for this year already exist
            $existing = Order::whereYear('created_at', $year)->count();
            if ($existing >= 50) {
                continue;
            }

            for ($m = 1; $m <= $config['months']; $m++) {
                // Determine monthly multiplier based on seasonal peaks
                $seasonalMultiplier = 1.0;
                if ($m === 2) { // Valentine's peak
                    $seasonalMultiplier = 2.4;
                } elseif ($m === 5) { // Mother's Day peak
                    $seasonalMultiplier = 1.9;
                } elseif ($m === 12) { // Christmas / Year-end
                    $seasonalMultiplier = 1.7;
                } elseif ($m === 6 || $m === 11) { // Graduation / All Saints
                    $seasonalMultiplier = 1.2;
                }

                $baseCount = (int) round(rand(18, 25) * $config['growth'] * $seasonalMultiplier);

                for ($i = 0; $i < $baseCount; $i++) {
                    $day = rand(1, Carbon::create($year, $m, 1)->daysInMonth);
                    $hour = rand(8, 19);
                    $minute = rand(0, 59);
                    $second = rand(0, 59);
                    $orderDate = Carbon::create($year, $m, $day, $hour, $minute, $second);

                    $prod = $products->random();
                    $quantity = rand(1, 2);
                    $unitPrice = (float) $prod->price;
                    $total = $unitPrice * $quantity;

                    $customer = $users->isNotEmpty() && rand(0, 10) > 3 ? $users->random() : null;
                    $name = $customer ? $customer->name : $sampleNames[array_rand($sampleNames)];
                    $phone = '09' . rand(100000000, 999999999);

                    $order = new Order();
                    $order->user_id = $customer?->id;
                    $order->order_type = 'purchase';
                    $order->recipient_name = $name;
                    $order->recipient_phone = $phone;
                    $order->pickup_date = $orderDate->copy()->addDays(rand(0, 2))->format('Y-m-d');
                    $order->status = 'delivered';
                    $order->payment_status = 'verified';
                    $order->total_price = $total;
                    $order->items = [
                        [
                            'id' => $prod->id,
                            'name' => $prod->name,
                            'price' => $unitPrice,
                            'quantity' => $quantity,
                            'image' => $prod->image,
                        ]
                    ];
                    $order->created_at = $orderDate;
                    $order->updated_at = $orderDate;
                    $order->save();

                    PaymentTransaction::create([
                        'order_id' => $order->id,
                        'type' => 'payment',
                        'amount' => $total,
                        'method' => rand(0, 1) ? 'gcash' : 'cash',
                        'reference_no' => 'TXN-' . $year . str_pad($m, 2, '0', STR_PAD_LEFT) . '-' . str_pad($order->id, 5, '0', STR_PAD_LEFT),
                        'receipt_image' => null,
                        'created_at' => $orderDate,
                        'updated_at' => $orderDate,
                    ]);
                }
            }
        }
    }
}
