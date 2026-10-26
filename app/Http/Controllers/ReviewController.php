<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Models\Order;
use App\Models\OrderReview;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    public function index()
    {
        $publishedReviews = OrderReview::whereNotNull('published_at');
        $reviews = (clone $publishedReviews)->with('user:id,name')
            ->latest('published_at')
            ->take(10)
            ->get()
            ->map(fn (OrderReview $review) => [
                'id' => $review->id,
                'rating' => $review->rating,
                'comment' => $review->comment,
                'reviewer_name' => $this->displayName($review->user?->name),
                'published_at' => $review->published_at,
            ]);

        return response()->json([
            'reviews' => $reviews,
            'average_rating' => round((float) $publishedReviews->avg('rating'), 1),
            'review_count' => $publishedReviews->count(),
        ]);
    }

    public function store(Request $request, int $id)
    {
        abort_unless($request->user()->role === UserRole::Customer, 403, 'Only customers can submit reviews.');

        $validated = $request->validate([
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'comment' => ['nullable', 'string', 'max:1000'],
        ]);

        $order = Order::whereKey($id)->where('user_id', $request->user()->id)->firstOrFail();

        if ($order->status !== 'delivered' || $order->payment_status !== 'verified') {
            return response()->json([
                'message' => 'Feedback is available after your verified order is completed.',
            ], 422);
        }

        $review = OrderReview::updateOrCreate(
            ['order_id' => $order->id],
            [
                'user_id' => $request->user()->id,
                'rating' => $validated['rating'],
                'comment' => $validated['comment'] ?? null,
                'published_at' => now(),
            ]
        );

        return response()->json($review->fresh(), $review->wasRecentlyCreated ? 201 : 200);
    }

    private function displayName(?string $name): string
    {
        $parts = preg_split('/\s+/', trim($name ?: 'Customer')) ?: ['Customer'];
        $firstName = $parts[0];

        if (count($parts) === 1) {
            return $firstName;
        }

        $lastName = end($parts);

        return $firstName.' '.mb_substr($lastName, 0, 1).'.';
    }
}
