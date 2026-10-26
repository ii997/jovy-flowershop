<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Order;
use App\Models\OrderReview;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReviewTest extends TestCase
{
    use RefreshDatabase;

    private function completedOrder(User $user, string $status = 'delivered', string $paymentStatus = 'verified'): Order
    {
        return Order::create([
            'user_id' => $user->id,
            'order_type' => 'purchase',
            'recipient_name' => 'Jane Doe',
            'recipient_phone' => '09170000000',
            'pickup_date' => now()->format('Y-m-d'),
            'items' => [],
            'total_price' => 500,
            'status' => $status,
            'payment_status' => $paymentStatus,
        ]);
    }

    public function test_verified_customer_can_publish_one_review_for_a_completed_order(): void
    {
        $customer = User::factory()->create(['name' => 'Jane Doe', 'role' => UserRole::Customer]);
        $order = $this->completedOrder($customer);

        $response = $this->actingAs($customer)->postJson("/api/orders/{$order->id}/review", [
            'rating' => 5,
            'comment' => 'The arrangement was beautiful!',
        ]);

        $response->assertCreated()->assertJsonPath('rating', 5);
        $this->assertDatabaseHas('order_reviews', [
            'order_id' => $order->id,
            'user_id' => $customer->id,
            'rating' => 5,
            'comment' => 'The arrangement was beautiful!',
        ]);

        $publicResponse = $this->getJson('/api/reviews');
        $publicResponse->assertOk()
            ->assertJsonPath('average_rating', 5)
            ->assertJsonPath('review_count', 1)
            ->assertJsonFragment([
                'rating' => 5,
                'comment' => 'The arrangement was beautiful!',
                'reviewer_name' => 'Jane D.',
            ]);
    }

    public function test_customer_can_edit_their_existing_review_without_creating_a_duplicate(): void
    {
        $customer = User::factory()->create(['role' => UserRole::Customer]);
        $order = $this->completedOrder($customer);

        $this->actingAs($customer)->postJson("/api/orders/{$order->id}/review", [
            'rating' => 4,
            'comment' => 'Good service.',
        ])->assertCreated();

        $this->actingAs($customer)->postJson("/api/orders/{$order->id}/review", [
            'rating' => 3,
            'comment' => 'Updated feedback.',
        ])->assertOk();

        $this->assertSame(1, OrderReview::where('order_id', $order->id)->count());
        $this->assertDatabaseHas('order_reviews', [
            'order_id' => $order->id,
            'rating' => 3,
            'comment' => 'Updated feedback.',
        ]);
    }

    public function test_feedback_requires_a_verified_completed_order_owned_by_the_customer(): void
    {
        $customer = User::factory()->create(['role' => UserRole::Customer]);
        $otherCustomer = User::factory()->create(['role' => UserRole::Customer]);
        $pendingOrder = $this->completedOrder($customer, 'preparing', 'pending');
        $otherOrder = $this->completedOrder($otherCustomer);

        $this->actingAs($customer)
            ->postJson("/api/orders/{$pendingOrder->id}/review", ['rating' => 5])
            ->assertStatus(422);

        $this->actingAs($customer)
            ->postJson("/api/orders/{$otherOrder->id}/review", ['rating' => 5])
            ->assertNotFound();

        $this->assertDatabaseCount('order_reviews', 0);
    }

    public function test_staff_cannot_publish_a_customer_review(): void
    {
        $staff = User::factory()->create(['role' => UserRole::Staff]);
        $order = $this->completedOrder($staff);

        $this->actingAs($staff)
            ->postJson("/api/orders/{$order->id}/review", ['rating' => 5])
            ->assertForbidden();

        $this->assertDatabaseCount('order_reviews', 0);
    }
}
