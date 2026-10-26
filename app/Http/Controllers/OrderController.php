<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Models\Flower;
use App\Models\Order;
use App\Models\OrderCancellation;
use App\Models\PaymentTransaction;
use App\Models\Product;
use App\Services\NotificationService;
use App\Support\ProductPricing;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class OrderController extends Controller
{
    /**
     * Store a newly created order.
     * Total price is recalculated server-side — never trust client-provided totals.
     * Payment status defaults to 'pending'.
     */
    public function store(Request $request)
    {
        // Enforce authentication — guest checkout is not supported
        if (! $request->user()) {
            return response()->json([
                'message' => 'Authentication required. Please log in to place an order.',
            ], 401);
        }

        // Enforce Maintenance Mode check
        $settingsPath = storage_path('app/settings.json');
        if (file_exists($settingsPath)) {
            $settings = json_decode(file_get_contents($settingsPath), true);
            if (! empty($settings['maintenance_mode'])) {
                $user = Auth::user();
                if (! $user || ! in_array($user->role, ['admin', 'staff'])) {
                    return response()->json([
                        'message' => 'The store is currently undergoing scheduled maintenance. New orders and reservations are temporarily disabled.',
                    ], 503);
                }
            }
        }

        $validated = $request->validate([
            'order_type' => 'required|string|in:purchase,reservation',
            'recipient_name' => 'required|string|max:255',
            'recipient_phone' => 'required|string|max:20',
            'pickup_date' => 'required|date|after_or_equal:today',
            'gift_message' => 'nullable|string',
            'items' => 'required|array',
            'items.*.id' => 'required|integer|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
        ]);

        $order = \DB::transaction(function () use ($validated) {
            $totalPrice = 0;
            $processedItems = [];

            foreach ($validated['items'] as $item) {
                $product = Product::where('id', $item['id'])->lockForUpdate()->firstOrFail();

                if (! $product->availability) {
                    throw ValidationException::withMessages([
                        'items' => ["'{$product->name}' is currently unavailable."],
                    ]);
                }

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
            }

            // Payment status: defaults to pending for both purchase and reservation
            $paymentStatus = 'pending';

            $order = Order::create([
                'user_id' => Auth::id(),
                'order_type' => $validated['order_type'],
                'recipient_name' => $validated['recipient_name'],
                'recipient_phone' => $validated['recipient_phone'],
                'pickup_date' => $validated['pickup_date'],
                'gift_message' => $validated['gift_message'] ?? null,
                'items' => $processedItems,
                'total_price' => $totalPrice,
                'status' => 'confirmed',
                'payment_status' => $paymentStatus,
            ]);

            foreach ($processedItems as $item) {
                $product = Product::where('id', $item['id'])->lockForUpdate()->first();
                if ($product) {
                    if (! empty($product->stems)) {
                        foreach ($product->stems as $flowerName => $countNeeded) {
                            $flower = Flower::findByNameOrVariant($flowerName, true);
                            if ($flower) {
                                $qtyToDeduct = $countNeeded * $item['quantity'];
                                $flower->quantity = max(0, $flower->quantity - $qtyToDeduct);
                                $flower->save();
                            }
                        }
                    }
                }
            }

            return $order;
        });

        // Fetch store owner contact number from settings
        $settingsPath = storage_path('app/settings.json');
        $storePhone = null;
        if (file_exists($settingsPath)) {
            $settings = json_decode(file_get_contents($settingsPath), true);
            $storePhone = $settings['phone'] ?? null;
        }

        // Notify Customer through in-app, email, and SMS delivery.
        NotificationService::sendCustomer(
            $order,
            'Order Submitted Successfully',
            "Your order #JFS-{$order->id} has been submitted. Status: Pending Payment.",
            'confirmed',
            "order:{$order->id}:confirmed"
        );

        // Notify Admin/Staff (In-App + SMS)
        NotificationService::send(
            null,
            'New Order Submitted',
            "New order #JFS-{$order->id} submitted by ".strip_tags($order->recipient_name).". Amount: ₱{$order->total_price}.",
            'new_order_alert',
            true,
            ! empty($storePhone),
            $storePhone,
            $order->id
        );

        return response()->json($order);
    }

    /**
     * List user orders or all orders if staff.
     */
    public function index(Request $request)
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        if ($user->role === UserRole::Staff) {
            $orders = Order::with('user', 'paymentTransactions', 'cancellation')
                ->orderBy('created_at', 'desc')
                ->get();
        } else {
            $orders = Order::with('paymentTransactions', 'cancellation')
                ->where('user_id', $user->id)
                ->orderBy('created_at', 'desc')
                ->get();
        }

        return response()->json($orders);
    }

    /**
     * Submit payment receipt screenshot.
     * Stores a new PaymentTransaction row instead of overwriting a single JSON blob.
     * Sets payment_status to 'awaiting_verification' for admin review.
     */
    public function submitPayment(Request $request, $id)
    {
        $order = Order::findOrFail($id);

        $user = $request->user();
        if (! $user) {
            abort(401, 'Authentication required.');
        }

        if ($order->user_id !== $user->id) {
            abort(403, 'Unauthorized.');
        }

        if ($order->status === 'delivered') {
            abort(422, 'Cannot submit payment for a delivered order.');
        }

        if ($order->status === 'cancelled') {
            abort(422, 'Cannot submit payment for a cancelled order.');
        }

        // Prevent duplicate payment submissions when already verified
        if ($order->payment_status === 'verified') {
            abort(422, 'Payment has already been verified for this order.');
        }

        $validated = $request->validate([
            'receipt' => 'required|image|mimes:jpeg,png,jpg|max:3072',
            'reference_no' => 'nullable|string|max:100',
            'amount' => 'nullable|numeric|min:0',
            'transaction_date' => 'nullable|string|max:100',
            'ocr_review_required' => 'nullable|boolean',
        ]);

        // Payment references identify the external transaction and may not be reused.
        // Normalize the value so casing or accidental outer whitespace cannot bypass
        // the duplicate check. The database unique index is the final race-safe guard.
        $referenceNo = isset($validated['reference_no'])
            ? strtoupper(trim($validated['reference_no']))
            : null;
        $referenceNo = $referenceNo ?: null;
        $referenceKey = $referenceNo;

        if ($referenceNo !== null && PaymentTransaction::query()
            ->whereRaw('UPPER(TRIM(reference_no)) = ?', [$referenceNo])
            ->exists()) {
            abort(422, 'This payment reference number has already been used. Please upload the receipt for a different transaction.');
        }

        $downpaymentPct = 30;
        $settingsPath = storage_path('app/settings.json');
        if (file_exists($settingsPath)) {
            $settings = json_decode(file_get_contents($settingsPath), true);
            if (isset($settings['downpayment_pct'])) {
                $downpaymentPct = (int) $settings['downpayment_pct'];
            }
        }

        $minExpectedAmount = $order->order_type === 'reservation'
            ? (float) $order->total_price * ($downpaymentPct / 100.0)
            : (float) $order->total_price;

        if ($validated['amount'] !== null && (float) $validated['amount'] < ($minExpectedAmount - 0.01)) {
            abort(422, $order->order_type === 'reservation'
                ? "The submitted downpayment amount is less than the required {$downpaymentPct}% downpayment."
                : 'The submitted payment amount is less than the order total.');
        }

        $path = $request->file('receipt')->store('receipts', 'public');

        try {
            $paymentTransaction = DB::transaction(function () use ($order, $validated, $referenceNo, $referenceKey, $path): PaymentTransaction {
                // Keep backward-compatible fields for existing frontend code
                $order->payment_receipt = '/storage/'.$path;
                $order->payment_details = [
                    'reference_no' => $referenceNo,
                    'amount' => $validated['amount'] ?? null,
                    'transaction_date' => $validated['transaction_date'] ?? null,
                    'ocr_review_required' => (bool) ($validated['ocr_review_required'] ?? false),
                ];
                $order->payment_status = 'awaiting_verification';
                $order->save();

                return PaymentTransaction::create([
                    'order_id' => $order->id,
                    'type' => 'payment',
                    'amount' => $validated['amount'] ?? $order->total_price,
                    'method' => 'instapay',
                    'reference_no' => $referenceNo,
                    'reference_key' => $referenceKey,
                    'receipt_image' => '/storage/'.$path,
                ]);
            });
        } catch (UniqueConstraintViolationException) {
            Storage::disk('public')->delete($path);

            abort(422, 'This payment reference number has already been used. Please upload the receipt for a different transaction.');
        }

        // Fetch store owner contact number from settings
        $settingsPath = storage_path('app/settings.json');
        $storePhone = null;
        if (file_exists($settingsPath)) {
            $settings = json_decode(file_get_contents($settingsPath), true);
            $storePhone = $settings['phone'] ?? null;
        }

        // Notify Customer through in-app, email, and SMS delivery.
        NotificationService::sendCustomer(
            $order,
            'Payment Receipt Uploaded',
            "We are reviewing your payment for order #JFS-{$order->id}. We will notify you once verified.",
            'payment_uploaded',
            "payment:{$paymentTransaction->id}:uploaded"
        );

        // Notify Admin/Staff (In-App + SMS)
        NotificationService::send(
            null,
            'New Payment Receipt',
            "New payment proof uploaded for order #JFS-{$order->id}. Reference: ".($referenceNo ?? 'N/A').'. Action required: Review.',
            'payment_review_alert',
            true,
            ! empty($storePhone),
            $storePhone,
            $order->id
        );

        return response()->json($order->load('paymentTransactions'));
    }

    /**
     * Cancel the order (initiated by the customer).
     * Only orders that are still 'confirmed' (not preparing or delivered) can be cancelled.
     * Restores the inventory of products and their corresponding flower stems.
     */
    public function cancel(Request $request, $id)
    {
        $order = Order::findOrFail($id);

        $user = $request->user();
        if (! $user) {
            abort(401, 'Authentication required.');
        }

        if ($order->user_id !== $user->id) {
            abort(403, 'Unauthorized.');
        }

        if ($order->status === 'cancelled') {
            abort(422, 'This order has already been cancelled.');
        }

        if ($order->status !== 'confirmed') {
            abort(422, 'Cannot cancel this order as it is already being prepared or has been delivered.');
        }

        $validated = $request->validate([
            'reason' => 'required|string|min:5|max:1000',
        ]);

        DB::transaction(function () use ($order, $validated, $request) {
            OrderCancellation::create([
                'order_id' => $order->id,
                'cancelled_by' => $request->user()->id,
                'reason' => $validated['reason'],
            ]);

            // Restore products inventory and flower stems count
            if ($order->items && is_array($order->items)) {
                foreach ($order->items as $item) {
                    $product = Product::where('id', $item['id'])->lockForUpdate()->first();
                    if ($product) {
                        // Only restore availability if no other active (non-cancelled, non-delivered)
                        // order still references this product. Otherwise, the product was either
                        // manually disabled by an admin or consumed by other orders, and we must
                        // not incorrectly re-enable it — that would cause overselling.
                        $otherActive = Order::whereIn('status', ['confirmed', 'preparing', 'ready'])
                            ->where('id', '!=', $order->id)
                            ->whereJsonContains('items', [['id' => $product->id]])
                            ->exists();
                        if (! $otherActive) {
                            $product->availability = true;
                        }
                        $product->save();

                        if (! empty($product->stems) && is_array($product->stems)) {
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

        // Fetch store admin phone number for SMS alert
        $storePhone = null;
        $settingsPath = storage_path('app/settings.json');
        if (file_exists($settingsPath)) {
            $settings = json_decode(file_get_contents($settingsPath), true);
            $storePhone = $settings['phone'] ?? null;
        }

        // Notify Customer through in-app, email, and SMS delivery.
        NotificationService::sendCustomer(
            $order,
            'Order Cancelled',
            "Your order #JFS-{$order->id} has been cancelled. Reason: ".strip_tags($validated['reason']).'.',
            'cancelled',
            "order:{$order->id}:cancelled"
        );

        // Notify Admin/Staff (In-App + SMS)
        NotificationService::send(
            null,
            'Order Cancelled by Customer',
            "Order #JFS-{$order->id} was cancelled by ".strip_tags($order->recipient_name).'. Reason: '.strip_tags($validated['reason']).'.',
            'order_cancelled_customer',
            true,
            ! empty($storePhone),
            $storePhone,
            $order->id
        );

        return response()->json($order->load('paymentTransactions', 'cancellation'));
    }
}
