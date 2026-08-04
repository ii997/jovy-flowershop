<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Product;
use App\Models\Flower;
use App\Models\OrderCancellation;
use App\Enums\UserRole;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\DB;
use App\Services\NotificationService;

class AdminController extends Controller
{
    public function stats()
    {
        $grossSales = Order::sum('total_price');
        $totalOrders = Order::count();
        $activeListings = Product::where('availability', true)->count();
        $recentOrders = Order::orderBy('created_at', 'desc')->take(5)->get();

        // Revenue tracking uses payment_status (decoupled from fulfillment)
        $paidGross = Order::where('payment_status', 'verified')->sum('total_price');
        $pendingGross = Order::where('payment_status', 'awaiting_verification')->sum('total_price');

        $ordersItems = Order::pluck('items');
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
            $productDataMap = Product::whereIn('id', $allProductIds)->get()->keyBy('id');
        }

        foreach ($ordersItems as $items) {
            if (is_array($items)) {
                foreach ($items as $item) {
                    $qty = $item['quantity'] ?? 1;

                    // Product counts
                    $prodId = $item['id'] ?? null;
                    if ($prodId) {
                        $prodName = $item['name'] ?? ("Product #" . $prodId);
                        if (!isset($productCounts[$prodId])) {
                            $productCounts[$prodId] = ['id' => $prodId, 'name' => $prodName, 'count' => 0];
                        }
                        $productCounts[$prodId]['count'] += $qty;
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

        $dailyTrends = DB::table('orders')
            ->select(DB::raw('DATE(created_at) as date'), DB::raw('SUM(total_price) as total'), DB::raw('COUNT(id) as count'))
            ->groupBy('date')->orderBy('date', 'asc')->limit(30)->get();

        $driver = DB::connection()->getDriverName();
        $monthExpr = $driver === 'sqlite' ? "strftime('%Y-%m', created_at)" : "DATE_FORMAT(created_at, '%Y-%m')";
        $yearExpr = $driver === 'sqlite' ? "strftime('%Y', created_at)" : "YEAR(created_at)";

        $monthlyTrends = DB::table('orders')
            ->select(DB::raw("{$monthExpr} as month"), DB::raw('SUM(total_price) as total'), DB::raw('COUNT(id) as count'))
            ->groupBy('month')->orderBy('month', 'asc')->get();

        $yearlyTrends = DB::table('orders')
            ->select(DB::raw("{$yearExpr} as year"), DB::raw('SUM(total_price) as total'), DB::raw('COUNT(id) as count'))
            ->groupBy('year')->orderBy('year', 'asc')->get();

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
            'trends' => ['daily' => $dailyTrends, 'monthly' => $monthlyTrends, 'yearly' => $yearlyTrends],
            'patterns' => ['average_order_size' => (float) $averageOrderSize, 'repeat_rate' => (float) $repeatRate, 'total_customers' => (int) $totalCustomers],
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

    public function updateOrderStatus(Request $request, $id)
    {
        $validated = $request->validate([
            'status' => 'required|string|in:confirmed,preparing,delivered',
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
            $message = "Your order #JFS-{$order->id} is now being prepared! We will notify you once shipped.";
        } elseif ($order->status === 'delivered') {
            $title = '✔ Order Delivered';
            $message = "Your order #JFS-{$order->id} has been delivered successfully! Thank you for ordering from Jovy's Flowershop.";
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

        if ($validated['payment_status'] === 'verified') {
            $latestTx = $order->paymentTransactions()->latest()->first();
            if ($latestTx) {
                $latestTx->verified_by = $request->user()->id;
                $latestTx->verified_at = now();
                $latestTx->admin_notes = isset($validated['admin_notes']) ? strip_tags($validated['admin_notes']) : null;
                $latestTx->save();
            }
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
            'refund_amount' => 'nullable|numeric|min:0',
            'refund_method' => 'nullable|string|in:original_payment,store_credit,none',
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
                'refund_amount' => $validated['refund_amount'] ?? null,
                'refund_method' => $validated['refund_method'] ?? 'none',
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
                                $flower = \App\Models\Flower::where('name', $flowerName)
                                    ->lockForUpdate()
                                    ->first();
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
            if (($validated['refund_amount'] ?? 0) > 0 || $order->payment_status === 'verified') {
                $order->payment_status = 'refunded';
            }
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

    public function updateProductPrice(Request $request, $id)
    {
        $validated = $request->validate(['price' => 'required|numeric|min:0']);
        $product = Product::findOrFail($id);
        $product->price = $validated['price'];
        $product->save();
        return response()->json($product);
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
            'price' => 'required|numeric|min:0',
            'category' => 'required|string|max:255',
            'image' => 'nullable|string|max:255',
            'description' => 'required|string',
            'size' => 'required|string|max:100',
            'occasions' => 'required|array',
            'seasons' => 'required|array',
            'stems' => 'nullable|array',
        ]);
        $product = Product::findOrFail($id);
        $product->name = $validated['name'];
        $product->price = $validated['price'];
        $product->category = $validated['category'];
        $product->description = $validated['description'];
        $product->size = $validated['size'];
        $product->occasions = $validated['occasions'];
        $product->seasons = $validated['seasons'];
        if (!empty($validated['image'])) $product->image = $validated['image'];
        if (array_key_exists('stems', $validated)) $product->stems = $validated['stems'];
        $product->save();
        return response()->json($product);
    }

    public function storeProduct(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'price' => 'required|numeric|min:0',
            'category' => 'required|string|max:255',
            'image' => 'required|string|max:255',
            'description' => 'required|string',
            'size' => 'required|string|max:100',
            'occasions' => 'required|array',
            'seasons' => 'required|array',
            'stems' => 'nullable|array',
        ]);

        $product = DB::transaction(function () use ($validated) {
            if (!empty($validated['stems'])) {
                foreach ($validated['stems'] as $flowerName => $countNeeded) {
                    $flower = Flower::where('name', $flowerName)->first();
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
                'size' => $validated['size'],
                'gallery' => [$validated['image']],
                'price' => (float) $validated['price'],
                'rating' => 5.00,
                'availability' => true,
                'quantity' => 0,
                'stems' => $validated['stems'] ?? null,
            ]);
            return $product;
        });

        return response()->json($product);
    }

    public function uploadImage(Request $request)
    {
        $request->validate(['image' => 'required|image|mimes:jpeg,png,webp,jpg|max:2048']);
        $path = $request->file('image')->store('products', 'public');
        return response()->json(['url' => '/storage/' . $path]);
    }

    public function flowers()
    {
        return response()->json(Flower::orderBy('name')->get());
    }

    public function storeFlower(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'price' => 'required|numeric|min:0',
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
            'quantity' => 'required|integer|min:0',
            'available' => 'boolean',
        ]);
        $flower = Flower::findOrFail($id);
        $flower->update($validated);
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
                'qr_image' => "",
                'downpayment_pct' => 30
            ]);
        }
        $settings = json_decode(file_get_contents($path), true);
        return response()->json($settings);
    }

    public function saveSettings(Request $request)
    {
        $validated = $request->validate([
            'store_name' => 'required|string|max:255',
            'store_phone' => 'required|string|max:50',
            'store_address' => 'required|string|max:500',
            'maintenance_mode' => 'required|boolean',
            'qr_image' => 'nullable|string|max:1000',
            'downpayment_pct' => 'required|integer|min:0|max:100',
        ]);

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
