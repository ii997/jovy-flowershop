<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Product;
use App\Models\Order;
use App\Models\PaymentTransaction;
use App\Models\OrderCancellation;
use App\Models\Notification;
use App\Enums\UserRole;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class DummyDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $customer = User::where('role', UserRole::Customer)->first();
        $admin = User::where('role', UserRole::Admin)->first();

        if (!$customer) {
            $customer = User::create([
                'name' => 'Kael Fronda',
                'email' => 'customer@jovy.com',
                'password' => bcrypt('password'),
                'role' => UserRole::Customer,
            ]);
        }

        if (!$admin) {
            $admin = User::create([
                'name' => 'Jovelyn Velesrubio',
                'email' => 'admin@jovy.com',
                'password' => bcrypt('password'),
                'role' => UserRole::Admin,
            ]);
        }

        // Prevent duplicate seeding of dummy orders
        if (Order::count() > 0) {
            return;
        }

        $products = Product::all();
        if ($products->isEmpty()) {
            return;
        }

        $now = Carbon::now();

        // 1. Order: Verified GCash Payment
        $prod1 = $products->firstWhere('name', 'Crimson Romance') ?? $products[0];
        $order1 = Order::create([
            'user_id' => $customer->id,
            'order_type' => 'Custom Bouquet',
            'recipient_name' => 'Kael Fronda',
            'recipient_phone' => '09171234567',
            'pickup_date' => $now->copy()->addDays(2)->format('Y-m-d'),
            'gift_message' => 'Happy Anniversary my love!',
            'items' => [
                [
                    'id' => $prod1->id,
                    'name' => $prod1->name,
                    'price' => $prod1->price,
                    'quantity' => 1,
                    'image' => $prod1->image,
                    'stems' => $prod1->stems,
                ]
            ],
            'total_price' => $prod1->price,
            'status' => 'preparing',
            'payment_status' => 'verified',
            'payment_receipt' => '/images/bouquet1.jpg',
            'payment_details' => [
                'reference_no' => 'GCASH-982187654',
                'amount' => $prod1->price,
                'method' => 'GCash',
            ],
        ]);

        PaymentTransaction::create([
            'order_id' => $order1->id,
            'type' => 'payment',
            'amount' => $prod1->price,
            'method' => 'GCash',
            'reference_no' => 'GCASH-982187654',
            'receipt_image' => '/images/bouquet1.jpg',
            'admin_notes' => 'Payment fully verified via GCash gateway.',
            'verified_by' => $admin->id,
            'verified_at' => $now->copy()->subMinutes(30),
        ]);

        Notification::create([
            'user_id' => $customer->id,
            'title' => '✔ Payment Verified',
            'message' => "Payment for order #JFS-{$order1->id} has been confirmed. Thank you!",
            'type' => 'payment_verified',
            'is_admin' => false,
        ]);

        // 2. Order: Awaiting GCash Review
        $prod2 = $products->firstWhere('name', 'Blushing Meadows') ?? $products[0];
        $order2 = Order::create([
            'user_id' => $customer->id,
            'order_type' => 'Custom Bouquet',
            'recipient_name' => 'Sara Santos',
            'recipient_phone' => '09187654321',
            'pickup_date' => $now->copy()->addDays(3)->format('Y-m-d'),
            'gift_message' => 'Happy Birthday dear daughter!',
            'items' => [
                [
                    'id' => $prod2->id,
                    'name' => $prod2->name,
                    'price' => $prod2->price,
                    'quantity' => 1,
                    'image' => $prod2->image,
                    'stems' => $prod2->stems,
                ]
            ],
            'total_price' => $prod2->price,
            'status' => 'pending',
            'payment_status' => 'awaiting_verification',
            'payment_receipt' => '/images/bouquet2.jpg',
            'payment_details' => [
                'reference_no' => 'GCASH-110298381',
                'amount' => $prod2->price,
                'method' => 'GCash',
            ],
        ]);

        PaymentTransaction::create([
            'order_id' => $order2->id,
            'type' => 'payment',
            'amount' => $prod2->price,
            'method' => 'GCash',
            'reference_no' => 'GCASH-110298381',
            'receipt_image' => '/images/bouquet2.jpg',
        ]);

        Notification::create([
            'user_id' => $customer->id,
            'title' => '✿ Payment Submitted',
            'message' => "Proof of payment for order #JFS-{$order2->id} has been submitted for verification.",
            'type' => 'payment_submitted',
            'is_admin' => false,
        ]);

        // 3. Order: Delivered Cash Payment
        $prod3 = $products->firstWhere('name', 'Golden Radiance') ?? $products[0];
        $order3 = Order::create([
            'user_id' => $customer->id,
            'order_type' => 'Custom Bouquet',
            'recipient_name' => 'Manuel Fronda',
            'recipient_phone' => '09228881234',
            'pickup_date' => $now->copy()->subDays(5)->format('Y-m-d'),
            'items' => [
                [
                    'id' => $prod3->id,
                    'name' => $prod3->name,
                    'price' => $prod3->price,
                    'quantity' => 1,
                    'image' => $prod3->image,
                    'stems' => $prod3->stems,
                ]
            ],
            'total_price' => $prod3->price,
            'status' => 'delivered',
            'payment_status' => 'verified',
            'payment_details' => [
                'reference_no' => 'CASH-COLLECTED',
                'amount' => $prod3->price,
                'method' => 'Cash',
            ],
        ]);

        PaymentTransaction::create([
            'order_id' => $order3->id,
            'type' => 'payment',
            'amount' => $prod3->price,
            'method' => 'Cash',
            'reference_no' => 'CASH-COLLECTED',
            'admin_notes' => 'Cash paid in full upon store pick-up.',
            'verified_by' => $admin->id,
            'verified_at' => $now->copy()->subDays(5),
        ]);

        // 4. Order: Cancelled and Refunded
        $prod4 = $products->firstWhere('name', 'Sweet Spring') ?? $products[0];
        $order4 = Order::create([
            'user_id' => $customer->id,
            'order_type' => 'Custom Bouquet',
            'recipient_name' => 'Kael Fronda',
            'recipient_phone' => '09171234567',
            'pickup_date' => $now->copy()->subDays(1)->format('Y-m-d'),
            'items' => [
                [
                    'id' => $prod4->id,
                    'name' => $prod4->name,
                    'price' => $prod4->price,
                    'quantity' => 1,
                    'image' => $prod4->image,
                    'stems' => $prod4->stems,
                ]
            ],
            'total_price' => $prod4->price,
            'status' => 'cancelled',
            'payment_status' => 'refunded',
            'payment_receipt' => '/images/bouquet3.jpg',
            'payment_details' => [
                'reference_no' => 'GCASH-REFUNDED-882',
                'amount' => $prod4->price,
                'method' => 'GCash',
            ],
        ]);

        PaymentTransaction::create([
            'order_id' => $order4->id,
            'type' => 'payment',
            'amount' => $prod4->price,
            'method' => 'GCash',
            'reference_no' => 'GCASH-998877112',
            'receipt_image' => '/images/bouquet3.jpg',
            'verified_by' => $admin->id,
            'verified_at' => $now->copy()->subDays(2),
        ]);

        PaymentTransaction::create([
            'order_id' => $order4->id,
            'type' => 'refund',
            'amount' => $prod4->price,
            'method' => 'GCash',
            'reference_no' => 'GCASH-REFUNDED-882',
            'admin_notes' => 'Refund processed in full due to sudden customer cancellation.',
            'verified_by' => $admin->id,
            'verified_at' => $now->copy()->subDays(1),
        ]);

        OrderCancellation::create([
            'order_id' => $order4->id,
            'cancelled_by' => $customer->id,
            'reason' => 'Change of plans, won\'t be able to pick up.',
            'refund_amount' => $prod4->price,
            'refund_method' => 'original_payment',
        ]);

        // 5. Order: Pending Payment
        $prod5 = $products->firstWhere('name', 'Midnight Orchid') ?? $products[0];
        Order::create([
            'user_id' => $customer->id,
            'order_type' => 'Custom Bouquet',
            'recipient_name' => 'Clara Gomez',
            'recipient_phone' => '09299901122',
            'pickup_date' => $now->copy()->addDays(5)->format('Y-m-d'),
            'items' => [
                [
                    'id' => $prod5->id,
                    'name' => $prod5->name,
                    'price' => $prod5->price,
                    'quantity' => 1,
                    'image' => $prod5->image,
                    'stems' => $prod5->stems,
                ]
            ],
            'total_price' => $prod5->price,
            'status' => 'pending',
            'payment_status' => 'pending',
        ]);
    }
}
