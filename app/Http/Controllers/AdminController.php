<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Product;
use App\Models\Flower;
use App\Models\OrderCancellation;
use App\Models\PaymentTransaction;
use App\Enums\UserRole;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use App\Services\NotificationService;
use App\Support\ProductPricing;
use Carbon\Carbon;

class AdminController extends Controller
{
    public function stats()
    {
        // Gross sales: only orders with verified payment AND not cancelled
        $grossSales = Order::where('payment_status', 'verified')
            ->where('status', '!=', 'cancelled')
            ->sum('total_price');
        
        // Total valid orders: verified payment + not cancelled
        $totalOrders = Order::where('payment_status', 'verified')
            ->where('status', '!=', 'cancelled')
            ->count();
        
        $activeListings = Product::where('availability', true)->count();
        $recentOrders = Order::orderBy('created_at', 'desc')->take(5)->get();

        // Revenue tracking uses payment_status (decoupled from fulfillment)
        $paidGross = Order::where('payment_status', 'verified')->sum('total_price');
        $pendingGross = Order::where('payment_status', 'awaiting_verification')->sum('total_price');

        // Only count items from verified, non-cancelled orders for product breakdown
        $ordersItems = Order::where('payment_status', 'verified')
            ->where('status', '!=', 'cancelled')
            ->pluck('items');
        $productCounts = [];
        $occasionsBreakdown = [];
        $seasonsBreakdown = [];

        // Collect unique product IDs to batch-load product data
        $allProductIds = [];
        foreach ($ordersItems as $items) {
            if (is_array($items)) {
                foreach ($items as $item) {
                    $prodId = $item['id'] ?? null;
                    if ($prodId) {
                        $allProductIds[$prodId] = $prodId;
                    }
                }
            }
        }

        // Pre-load Product models to get real occasions/seasons (not stored in items JSON)
        $productDataMap = collect();
        if (!empty($allProductIds)) {
            $productDataMap = Product::withTrashed()->whereIn('id', $allProductIds)->get()->keyBy('id');
        }

        foreach ($ordersItems as $items) {
            if (is_array($items)) {
                foreach ($items as $item) {
                    $qty = $item['quantity'] ?? 1;

                    // Product counts
                    $prodId = $item['id'] ?? null;
                    if ($prodId) {
                        $prodName = $item['name'] ?? ("Product #" . $prodId);
                        $prodPrice = (float) ($item['price'] ?? 0);
                        if (!isset($productCounts[$prodId])) {
                            $productCounts[$prodId] = [
                                'id' => $prodId,
                                'name' => $prodName,
                                'count' => 0,
                                'revenue' => 0,
                            ];
                        }
                        $productCounts[$prodId]['count'] += $qty;
                        $productCounts[$prodId]['revenue'] += ($prodPrice * $qty);
                    }

                    // Occasions and seasons breakdowns from actual Product models
                    $product = $productDataMap->get($prodId);
                    $occasions = $product ? ($product->occasions ?? []) : [];
                    $seasons = $product ? ($product->seasons ?? []) : [];
                    foreach ($occasions as $occ) {
                        $occasionsBreakdown[$occ] = ($occasionsBreakdown[$occ] ?? 0) + $qty;
                    }
                    foreach ($seasons as $sea) {
                        $seasonsBreakdown[$sea] = ($seasonsBreakdown[$sea] ?? 0) + $qty;
                    }
                }
            }
        }
        usort($productCounts, fn($a, $b) => $b['count'] - $a['count']);
        $topProducts = array_slice(array_values($productCounts), 0, 10);

        $driver = DB::connection()->getDriverName();
        $dateExpr = $driver === 'sqlite' ? "strftime('%Y-%m-%d', COALESCE(payment_transactions.verified_at, orders.updated_at, orders.created_at))" : "DATE(COALESCE(payment_transactions.verified_at, orders.updated_at, orders.created_at))";
        $hourExpr = $driver === 'sqlite' ? "strftime('%H', COALESCE(payment_transactions.verified_at, orders.updated_at, orders.created_at))" : "DATE_FORMAT(COALESCE(payment_transactions.verified_at, orders.updated_at, orders.created_at), '%H')";
        $monthExpr = $driver === 'sqlite' ? "strftime('%Y-%m', orders.created_at)" : "DATE_FORMAT(orders.created_at, '%Y-%m')";
        $yearExpr = $driver === 'sqlite' ? "strftime('%Y', orders.created_at)" : "YEAR(orders.created_at)";

        // Base verified & non-cancelled orders query using verified credit timestamp
        $verifiedOrdersBase = DB::table('orders')
            ->leftJoin('payment_transactions', function ($join) {
                $join->on('orders.id', '=', 'payment_transactions.order_id')
                    ->where('payment_transactions.type', '=', 'payment');
            })
            ->where('orders.payment_status', 'verified')
            ->where('orders.status', '!=', 'cancelled');

        // 1. Daily trends (grouped by calendar day of payment approval, last 30 days)
        $dailyTrends = (clone $verifiedOrdersBase)
            ->select(
                DB::raw("{$dateExpr} as date"),
                DB::raw('SUM(orders.total_price) as total'),
                DB::raw('COUNT(DISTINCT orders.id) as count')
            )
            ->groupBy('date')
            ->orderBy('date', 'asc')
            ->limit(30)
            ->get();

        // 2. Hourly breakdown across 24 hours (12:00 AM - 11:59 PM) for today
        $todayDate = now()->format('Y-m-d');
        $rawHourly = (clone $verifiedOrdersBase)
            ->whereRaw("{$dateExpr} = ?", [$todayDate])
            ->select(
                DB::raw("{$hourExpr} as hour"),
                DB::raw('SUM(orders.total_price) as total'),
                DB::raw('COUNT(DISTINCT orders.id) as count')
            )
            ->groupBy('hour')
            ->orderBy('hour', 'asc')
            ->get()
            ->keyBy(function ($item) {
                return str_pad((string) (int) $item->hour, 2, '0', STR_PAD_LEFT);
            });

        $hourlyTrends = [];
        for ($h = 0; $h < 24; $h++) {
            $hKey = str_pad((string) $h, 2, '0', STR_PAD_LEFT);
            $matching = $rawHourly->get($hKey);
            $hourlyTrends[] = [
                'hour' => (int) $h,
                'hour_label' => date('g A', strtotime("{$h}:00")),
                'total' => $matching ? (string) $matching->total : '0.00',
                'count' => $matching ? (int) $matching->count : 0,
            ];
        }

        $monthlyTrends = DB::table('orders')
            ->where('payment_status', 'verified')
            ->where('status', '!=', 'cancelled')
            ->select(DB::raw("{$monthExpr} as month"), DB::raw('SUM(total_price) as total'), DB::raw('COUNT(id) as count'))
            ->groupBy('month')->orderBy('month', 'asc')->get();

        $yearlyTrends = DB::table('orders')
            ->where('payment_status', 'verified')
            ->where('status', '!=', 'cancelled')
            ->select(DB::raw("{$yearExpr} as year"), DB::raw('SUM(total_price) as total'), DB::raw('COUNT(id) as count'))
            ->groupBy('year')->orderBy('year', 'asc')->get();

        // Build Year-over-Year (YoY) matrix for 2024, 2025, 2026 performance comparison
        $years = ['2024', '2025', '2026'];
        $monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        $yoyData = [];
        foreach ($monthNames as $mIdx => $mName) {
            $monthNum = str_pad((string) ($mIdx + 1), 2, '0', STR_PAD_LEFT);
            $entry = ['month' => $mName, 'month_num' => $monthNum];
            foreach ($years as $yr) {
                $matching = $monthlyTrends->firstWhere('month', "{$yr}-{$monthNum}");
                $entry["{$yr}_sales"] = $matching ? (float) $matching->total : 0.0;
                $entry["{$yr}_orders"] = $matching ? (int) $matching->count : 0;
            }
            $yoyData[] = $entry;
        }

        $averageOrderSize = $totalOrders > 0 ? ($grossSales / $totalOrders) : 0;
        $customerOrderCounts = DB::table('orders')
            ->select('user_id', DB::raw('COUNT(id) as count'))
            ->whereNotNull('user_id')
            ->groupBy('user_id')->get();

        $totalCustomers = $customerOrderCounts->count();
        $repeatCustomers = $customerOrderCounts->filter(fn($c) => $c->count > 1)->count();
        $repeatRate = $totalCustomers > 0 ? (($repeatCustomers / $totalCustomers) * 100) : 0;

        return response()->json([
            'gross_sales' => (float) $grossSales,
            'total_orders' => (int) $totalOrders,
            'active_listings' => (int) $activeListings,
            'recent_orders' => $recentOrders,
            'revenue_tracking' => ['paid' => (float) $paidGross, 'pending' => (float) $pendingGross],
            'top_products' => $topProducts,
            'occasions_breakdown' => $occasionsBreakdown,
            'seasons_breakdown' => $seasonsBreakdown,
            'trends' => [
                'hourly' => $hourlyTrends,
                'daily' => $dailyTrends,
                'monthly' => $monthlyTrends,
                'yearly' => $yearlyTrends,
                'yoy' => $yoyData,
            ],
            'patterns' => ['average_order_size' => (float) $averageOrderSize, 'repeat_rate' => (float) $repeatRate, 'total_customers' => (int) $totalCustomers],
        ]);
    }

    public function monthlyProductSales(Request $request)
    {
        $request->validate([
            'month' => 'required|string|regex:/^\d{4}-\d{2}$/',
        ]);

        $month = $request->input('month');
        $driver = DB::connection()->getDriverName();
        $monthExpr = $driver === 'sqlite' ? "strftime('%Y-%m', created_at)" : "DATE_FORMAT(created_at, '%Y-%m')";

        $orders = Order::whereRaw("{$monthExpr} = ?", [$month])
            ->where('payment_status', 'verified')
            ->where('status', '!=', 'cancelled')
            ->select('id', 'items', 'total_price', 'created_at')
            ->get();

        $productCounts = [];
        $allProductIds = [];

        foreach ($orders as $order) {
            $items = is_string($order->items) ? json_decode($order->items, true) : $order->items;
            if (is_array($items)) {
                foreach ($items as $item) {
                    $prodId = $item['id'] ?? null;
                    if ($prodId) {
                        $allProductIds[$prodId] = $prodId;
                        $qty = (int) ($item['quantity'] ?? 1);
                        $price = (float) ($item['price'] ?? 0);
                        $name = $item['name'] ?? ("Product #" . $prodId);

                        if (!isset($productCounts[$prodId])) {
                            $productCounts[$prodId] = [
                                'id' => $prodId,
                                'name' => $name,
                                'price' => $price,
                                'units_sold' => 0,
                                'revenue' => 0.0,
                            ];
                        }
                        $productCounts[$prodId]['units_sold'] += $qty;
                        $productCounts[$prodId]['revenue'] += ($price * $qty);
                    }
                }
            }
        }

        // Fetch product metadata (category, occasions, image, price) from DB
        $productsMeta = collect();
        if (!empty($allProductIds)) {
            $productsMeta = Product::withTrashed()
                ->whereIn('id', array_keys($allProductIds))
                ->get()
                ->keyBy('id');
        }

        $result = [];
        foreach ($productCounts as $prodId => $data) {
            $meta = $productsMeta->get($prodId);
            $result[] = [
                'id' => $prodId,
                'name' => $meta ? $meta->name : $data['name'],
                'image' => $meta ? $meta->image : null,
                'price' => $meta ? (float) $meta->price : (float) ($data['price'] ?? 0),
                'category' => $meta ? ($meta->category ?? 'Uncategorized') : 'Uncategorized',
                'occasions' => $meta ? ($meta->occasions ?? []) : [],
                'units_sold' => (int) $data['units_sold'],
                'revenue' => (float) round($data['revenue'], 2),
            ];
        }

        // Sort by revenue descending (top sellers first)
        usort($result, fn($a, $b) => $b['revenue'] <=> $a['revenue'] ?: $b['units_sold'] <=> $a['units_sold']);

        return response()->json([
            'month' => $month,
            'total_products' => count($result),
            'products' => array_values($result),
        ]);
    }

    public function orders(Request $request)
    {
        $perPage = (int) $request->input('per_page', 50);
        $perPage = max(1, min(200, $perPage));

        return response()->json(
            Order::with('paymentTransactions', 'cancellation')
                ->orderBy('created_at', 'desc')
                ->paginate($perPage)
        );
    }

    public function storeManualOrder(Request $request)
    {
        $validated = $request->validate([
            'recipient_name' => 'required|string|max:255',
            'recipient_phone' => 'nullable|string|max:20',
            'order_type' => 'nullable|string|in:walk-in,purchase,reservation',
            'pickup_date' => 'nullable|date',
            'pickup_time' => 'nullable|date_format:H:i',
            'payment_method' => 'required|string|in:cash,gcash',
            'status' => 'required|string|in:confirmed,delivered',
            'gift_message' => 'nullable|string|max:500',
            'items' => 'required|array|min:1',
            'items.*.id' => 'required|integer|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
        ]);

        $order = DB::transaction(function () use ($validated, $request) {
            $totalPrice = 0;
            $processedItems = [];

            foreach ($validated['items'] as $item) {
                $product = Product::where('id', $item['id'])->lockForUpdate()->firstOrFail();

                $qty = (int) $item['quantity'];
                $itemPrice = ProductPricing::getEffectivePrice($product);
                $itemTotal = $itemPrice * $qty;
                $totalPrice += $itemTotal;

                $processedItems[] = [
                    'id' => $product->id,
                    'name' => $product->name,
                    'price' => $itemPrice,
                    'quantity' => $qty,
                ];

                // Deduct stems from flower stock
                if (!empty($product->stems)) {
                    foreach ($product->stems as $flowerName => $countNeeded) {
                        $flower = Flower::findByNameOrVariant($flowerName, true);
                        if ($flower) {
                            $qtyToDeduct = $countNeeded * $qty;
                            $flower->quantity = max(0, $flower->quantity - $qtyToDeduct);
                            $flower->save();
                        }
                    }
                }
            }

            $orderType = $validated['order_type'] ?? 'walk-in';
            $pickupDate = !empty($validated['pickup_date']) ? $validated['pickup_date'] : now()->toDateString();
            $pickupTime = !empty($validated['pickup_time']) ? $validated['pickup_time'] : now()->format('H:i');
            $recipientPhone = !empty($validated['recipient_phone']) ? $validated['recipient_phone'] : '09000000000';

            $order = Order::create([
                'user_id' => Auth::id() ?? 1,
                'order_type' => $orderType,
                'recipient_name' => $validated['recipient_name'],
                'recipient_phone' => $recipientPhone,
                'pickup_date' => $pickupDate,
                'pickup_time' => $pickupTime,
                'gift_message' => $validated['gift_message'] ?? null,
                'items' => $processedItems,
                'total_price' => $totalPrice,
                'status' => $validated['status'],
                'payment_status' => 'verified',
            ]);

            PaymentTransaction::create([
                'order_id' => $order->id,
                'type' => 'payment',
                'amount' => $totalPrice,
                'method' => $validated['payment_method'],
                'reference_no' => 'WALK-IN-' . strtoupper(Str::random(6)),
                'receipt_image' => null,
                'admin_notes' => 'Walk-in order created at store register. Payment verified.',
                'verified_by' => Auth::id(),
                'verified_at' => now(),
            ]);

            return $order;
        });

        return response()->json($order->load('paymentTransactions'), 201);
    }

    public function updateOrderStatus(Request $request, $id)
    {
        $validated = $request->validate([
            'status' => 'required|string|in:confirmed,preparing,delivered,ready_for_pickup',
        ]);
        $order = Order::findOrFail($id);
        if ($order->status === 'delivered') {
            abort(422, 'Cannot modify a delivered order.');
        }
        if ($order->status === 'cancelled') {
            abort(422, 'Cannot modify a cancelled order.');
        }
        $order->status = $validated['status'];
        $order->save();

        // Send fulfillment updates to Customer (In-App + SMS)
        $title = 'Order Status Updated';
        $message = "Your order #JFS-{$order->id} status is now: " . ucfirst($order->status) . ".";

        if ($order->status === 'preparing') {
            $title = '✿ Order Preparing';
            $message = "Your order #JFS-{$order->id} is now being prepared. We will notify you when it is ready for pickup.";
        } elseif ($order->status === 'delivered') {
            $title = '✔ Order Picked Up';
            $message = "Your order #JFS-{$order->id} has been picked up successfully. Thank you for ordering from Jovy's Flowershop.";
        } elseif ($order->status === 'ready_for_pickup') {
            $title = '✔ Order Ready for Pickup';
            $pickupTime = $order->pickup_time ? Carbon::parse($order->pickup_time)->format('g:i A') : 'your scheduled time';
            $message = "Your order #JFS-{$order->id} is now ready for pickup! You may claim it at the store at {$pickupTime}.";
        } elseif ($order->status === 'confirmed') {
            $title = 'Order Confirmed';
            $message = "Your order/reservation #JFS-{$order->id} has been confirmed.";
        }

        NotificationService::send(
            $order->user_id,
            $title,
            $message,
            $order->status,
            false,
            true,
            $order->recipient_phone,
            $order->id
        );

        return response()->json($order->load('paymentTransactions', 'cancellation'));
    }

    public function updatePaymentStatus(Request $request, $id)
    {
        $validated = $request->validate([
            'payment_status' => 'required|string|in:pending,awaiting_verification,verified,failed',
            'admin_notes' => 'nullable|string|max:500',
        ]);

        $order = Order::findOrFail($id);
        if ($order->status === 'delivered') {
            abort(422, 'Cannot update payment status of a delivered order.');
        }
        if ($order->status === 'cancelled') {
            abort(422, 'Cannot update payment status of a cancelled order.');
        }
        $order->payment_status = $validated['payment_status'];

        $notes = isset($validated['admin_notes']) ? strip_tags($validated['admin_notes']) : null;

        $latestTx = $order->paymentTransactions()->latest()->first();
        if ($latestTx) {
            if ($validated['payment_status'] === 'verified') {
                $latestTx->verified_by = $request->user()->id;
                $latestTx->verified_at = now();
            }
            if ($notes) {
                $latestTx->admin_notes = $notes;
            }
            $latestTx->save();
        }

        $order->save();

        // Send payment updates to Customer (In-App + SMS)
        if ($order->payment_status === 'verified') {
            NotificationService::send(
                $order->user_id,
                '✔ Payment Verified',
                "Payment for order #JFS-{$order->id} has been confirmed. Thank you!",
                'payment_verified',
                false,
                true,
                $order->recipient_phone,
                $order->id
            );
        } elseif ($order->payment_status === 'failed') {
            $notes = strip_tags($validated['admin_notes'] ?? 'No reason provided');
            $lowerNotes = strtolower($notes);
            
            $title = '❌ Payment Proof Rejected';
            $message = "Payment proof for order #JFS-{$order->id} has been rejected. Reason: {$notes}. Please submit a valid proof.";
            $type = 'payment_rejected';

            if (str_contains($lowerNotes, 'underpaid') || str_contains($lowerNotes, 'underpayment')) {
                $title = '⚠️ Payment Alert: Underpaid';
                $message = "Payment status for order #JFS-{$order->id} updated: Underpaid. Notes: {$notes}. Please submit correct proof of payment for the remaining balance.";
                $type = 'payment_underpaid';
            } elseif (str_contains($lowerNotes, 'overpaid') || str_contains($lowerNotes, 'overpayment')) {
                $title = 'ℹ Payment Alert: Overpaid';
                $message = "Payment status for order #JFS-{$order->id} updated: Overpaid. Notes: {$notes}. Excess amount will be refunded.";
                $type = 'payment_overpaid';
            }

            NotificationService::send(
                $order->user_id,
                $title,
                $message,
                $type,
                false,
                true,
                $order->recipient_phone,
                $order->id
            );
        }

        return response()->json($order->load('paymentTransactions', 'cancellation'));
    }

    public function cancelOrder(Request $request, $id)
    {
        $validated = $request->validate([
            'reason' => 'required|string|min:5|max:1000',
        ]);

        $order = Order::findOrFail($id);

        if ($order->status === 'delivered') {
            abort(422, 'Cannot cancel a delivered order.');
        }

        if ($order->status === 'cancelled') {
            abort(422, 'This order has already been cancelled.');
        }

        DB::transaction(function () use ($order, $validated, $request) {
            OrderCancellation::create([
                'order_id' => $order->id,
                'cancelled_by' => $request->user()->id,
                'reason' => strip_tags($validated['reason']),
            ]);

            // Restore products inventory and flower stems count
            if ($order->items && is_array($order->items)) {
                foreach ($order->items as $item) {
                    $product = Product::where('id', $item['id'])->lockForUpdate()->first();
                    if ($product) {
                        $otherActive = Order::whereIn('status', ['confirmed', 'preparing', 'ready'])
                            ->where('id', '!=', $order->id)
                            ->whereJsonContains('items', [['id' => $product->id]])
                            ->exists();
                        if (!$otherActive) {
                            $product->availability = true;
                        }
                        $product->save();

                        if (!empty($product->stems) && is_array($product->stems)) {
                            foreach ($product->stems as $flowerName => $countNeeded) {
                                $flower = Flower::findByNameOrVariant($flowerName, true);
                                if ($flower) {
                                    $qtyToRestore = $countNeeded * (int) ($item['quantity'] ?? 1);
                                    $flower->quantity += $qtyToRestore;
                                    $flower->save();
                                }
                            }
                        }
                    }
                }
            }

            $order->status = 'cancelled';
            $order->save();
        });

        // Notify Customer (In-App + SMS)
        NotificationService::send(
            $order->user_id,
            'Order Cancelled by Shop',
            "Your order #JFS-{$order->id} has been cancelled by the shop. Reason: " . strip_tags($validated['reason']) . ".",
            'cancelled',
            false,
            true,
            $order->recipient_phone,
            $order->id
        );

        return response()->json($order->load('paymentTransactions', 'cancellation'));
    }

    public function toggleProductAvailability($id)
    {
        $product = Product::findOrFail($id);
        $product->availability = !$product->availability;
        $product->save();
        return response()->json($product);
    }

    public function updateProductDetails(Request $request, $id)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'category' => 'required|string|max:255',
            'image' => 'nullable|string|max:255',
            'description' => 'required|string',
            'occasions' => 'required|array',
            'seasons' => 'required|array',
            'stems' => 'required|array|min:1',
        ]);
        $product = Product::findOrFail($id);
        $product->name = $validated['name'];
        $product->price = ProductPricing::computePrice($validated['stems']);
        $product->category = $validated['category'];
        $product->description = $validated['description'];
        $product->occasions = $validated['occasions'];
        $product->seasons = $validated['seasons'];
        if (!empty($validated['image'])) $product->image = $validated['image'];
        $product->stems = $validated['stems'];
        $product->save();
        return response()->json($product);
    }

    public function storeProduct(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'category' => 'required|string|max:255',
            'image' => 'required|string|max:255',
            'description' => 'required|string',
            'occasions' => 'required|array',
            'seasons' => 'required|array',
            'stems' => 'required|array|min:1',
        ]);

        $product = DB::transaction(function () use ($validated) {
            if (!empty($validated['stems'])) {
                foreach ($validated['stems'] as $flowerName => $countNeeded) {
                    $flower = Flower::findByNameOrVariant($flowerName, true);
                    if (!$flower) {
                        throw ValidationException::withMessages(['stems' => ["Flower '{$flowerName}' is not registered in the database."]]);
                    }
                    if ($flower->quantity < $countNeeded) {
                        throw ValidationException::withMessages(['stems' => ["Insufficient stock for '{$flowerName}'. Available: {$flower->quantity}, requested: {$countNeeded}."]]);
                    }
                    $flower->quantity -= $countNeeded;
                    $flower->save();
                }
            }
            $product = Product::create([
                'name' => $validated['name'],
                'category' => $validated['category'],
                'image' => $validated['image'],
                'description' => $validated['description'],
                'occasions' => $validated['occasions'],
                'seasons' => $validated['seasons'],
                'gallery' => [$validated['image']],
                'price' => ProductPricing::computePrice($validated['stems']),
                'rating' => 5.00,
                'availability' => true,
                'quantity' => 0,
                'stems' => $validated['stems'] ?? null,
            ]);
            return $product;
        });

        return response()->json($product);
    }

    public function destroyProduct($id)
    {
        $product = Product::findOrFail($id);
        $product->delete();
        return response()->json(['message' => 'Product archived successfully', 'id' => (int) $id]);
    }

    public function restoreProduct($id)
    {
        $product = Product::withTrashed()->findOrFail($id);
        $product->restore();
        return response()->json(['message' => 'Product restored successfully', 'product' => $product]);
    }

    public function uploadImage(Request $request)
    {
        $request->validate(['image' => 'required|image|mimes:jpeg,png,webp,jpg|max:2048']);
        $path = $request->file('image')->store('products', 'public');
        return response()->json(['url' => '/storage/' . $path]);
    }

    public function flowers(Request $request)
    {
        $query = Flower::orderBy('name');
        if ($request->boolean('with_archived')) {
            $query->withTrashed();
        }
        return response()->json($query->get());
    }

    public function destroyFlower($id)
    {
        $flower = Flower::findOrFail($id);
        $flower->delete();
        return response()->json(['message' => 'Flower archived successfully', 'id' => (int) $id]);
    }

    public function restoreFlower($id)
    {
        $flower = Flower::withTrashed()->findOrFail($id);
        $flower->restore();
        return response()->json(['message' => 'Flower restored successfully', 'flower' => $flower]);
    }

    public function storeFlower(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'price' => 'required|numeric|min:0',
            'unit_type' => 'nullable|string|in:stem,stick,kilo',
            'size' => 'nullable|string|max:50',
            'bundle_qty' => 'nullable|integer|min:1',
            'bundle_price' => 'nullable|numeric|min:0',
            'quantity' => 'required|integer|min:0',
            'available' => 'boolean',
        ]);
        $flower = Flower::create($validated);
        return response()->json($flower, 201);
    }

    public function updateFlower(Request $request, $id)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'price' => 'required|numeric|min:0',
            'unit_type' => 'nullable|string|in:stem,stick,kilo',
            'size' => 'nullable|string|max:50',
            'bundle_qty' => 'nullable|integer|min:1',
            'bundle_price' => 'nullable|numeric|min:0',
            'quantity' => 'required|integer|min:0',
            'available' => 'boolean',
        ]);
        $flower = Flower::findOrFail($id);
        $oldName = $flower->name;
        $oldPrice = (float) $flower->price;
        $oldSize = $flower->size;
        $oldBundleQty = $flower->bundle_qty;
        $oldBundlePrice = $flower->bundle_price !== null ? (float) $flower->bundle_price : null;

        $flower->update($validated);

        $priceChanged = (float) $flower->price !== $oldPrice
            || $flower->size !== $oldSize
            || $flower->bundle_qty !== $oldBundleQty
            || ($flower->bundle_price !== null ? (float)$flower->bundle_price : null) !== $oldBundlePrice;
        $nameChanged = $flower->name !== $oldName;

        // Bouquet prices are derived from flower unit/bundle prices, so any change to a
        // flower's price (or name — which is the stems map key) must re-price every
        // product that references it. Otherwise stored prices go stale.
        if ($priceChanged || $nameChanged) {
            foreach (Product::all() as $product) {
                $stems = $product->stems;
                if (!is_array($stems)) {
                    continue;
                }

                $touched = false;
                if ($nameChanged && array_key_exists($oldName, $stems)) {
                    $stems[$flower->name] = $stems[$oldName];
                    unset($stems[$oldName]);
                    $touched = true;
                }
                if ($touched || array_key_exists($flower->name, $stems)) {
                    if ($touched) {
                        $product->stems = $stems;
                    }
                    $product->price = ProductPricing::computePrice($product->stems);
                    $product->save();
                }
            }
        }

        return response()->json($flower);
    }

    public function toggleFlowerAvailability($id)
    {
        $flower = Flower::findOrFail($id);
        $flower->available = !$flower->available;
        $flower->save();
        return response()->json($flower);
    }

    public function getSettings()
    {
        $path = storage_path('app/settings.json');
        if (!file_exists($path)) {
            return response()->json([
                'store_name' => "Jovy's Flowershop",
                'store_phone' => "+639097850776",
                'store_address' => "Brgy. Poblacion, Kidapawan City, Cotabato",
                'maintenance_mode' => false,
                'surge_pricing' => false,
                'surge_exempt_funeral' => true,
                'qr_image' => "",
                'downpayment_pct' => 30
            ]);
        }
        $settings = json_decode(file_get_contents($path), true);
        if (!isset($settings['surge_pricing'])) {
            $settings['surge_pricing'] = false;
        }
        if (!isset($settings['surge_exempt_funeral'])) {
            $settings['surge_exempt_funeral'] = true;
        }
        return response()->json($settings);
    }

    public function saveSettings(Request $request)
    {
        $validated = $request->validate([
            'store_name' => 'required|string|max:255',
            'store_phone' => 'required|string|max:50',
            'store_address' => 'required|string|max:500',
            'maintenance_mode' => 'required|boolean',
            'surge_pricing' => 'nullable|boolean',
            'surge_exempt_funeral' => 'nullable|boolean',
            'qr_image' => 'nullable|string|max:1000',
            'downpayment_pct' => 'required|integer|min:0|max:100',
        ]);
        $validated['surge_pricing'] = !empty($validated['surge_pricing']);
        $validated['surge_exempt_funeral'] = array_key_exists('surge_exempt_funeral', $validated)
            ? (bool) $validated['surge_exempt_funeral']
            : true;



        $path = storage_path('app/settings.json');
        
        // Ensure directory exists
        $dir = dirname($path);
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        // Use LOCK_EX to prevent concurrent writes from corrupting the settings file
        file_put_contents($path, json_encode($validated, JSON_PRETTY_PRINT), LOCK_EX);

        return response()->json($validated);
    }

    public function dashboard(Request $request)
    {
        $user = $request->user();
        if (!$user || ($user->role !== UserRole::Staff && $user->role !== UserRole::Admin)) {
            return redirect('/');
        }
        return view('admin');
    }

    public function getSmsLogs()
    {
        $logs = \App\Models\SmsLog::orderBy('created_at', 'desc')->take(100)->get();
        return response()->json($logs);
    }
}
