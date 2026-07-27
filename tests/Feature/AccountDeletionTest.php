<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AccountDeletionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
    }

    public function test_user_can_request_account_deletion_and_is_logged_out(): void
    {
        $user = User::factory()->create([
            'password' => \Illuminate\Support\Facades\Hash::make('correct-password'),
        ]);

        $response = $this->actingAs($user)->postJson('/api/account/delete', [
            'current_password' => 'correct-password',
        ]);

        $response->assertStatus(200);
        $response->assertJsonStructure(['message', 'deletion_requested_at']);

        $user->refresh();
        $this->assertNotNull($user->deletion_requested_at);
        $this->assertTrue($user->isPendingDeletion());
        $this->assertGuest();
    }

    public function test_account_deletion_requires_valid_password(): void
    {
        $user = User::factory()->create([
            'password' => \Illuminate\Support\Facades\Hash::make('real-password'),
        ]);

        // Attempt with wrong password
        $response = $this->actingAs($user)->postJson('/api/account/delete', [
            'current_password' => 'wrong-password',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['current_password']);

        // Attempt without password
        $response = $this->actingAs($user)->postJson('/api/account/delete', []);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['current_password']);

        // Verify deletion was not set
        $user->refresh();
        $this->assertNull($user->deletion_requested_at);
        $this->assertFalse($user->isPendingDeletion());
    }

    public function test_user_can_cancel_account_deletion(): void
    {
        $user = User::factory()->create([
            'deletion_requested_at' => now()->subDays(5),
        ]);

        $response = $this->actingAs($user)->postJson('/api/account/cancel-deletion');

        $response->assertStatus(200);
        $response->assertJsonPath('message', 'Account deletion request has been canceled.');

        $user->refresh();
        $this->assertNull($user->deletion_requested_at);
        $this->assertFalse($user->isPendingDeletion());
    }

    public function test_purge_command_deletes_expired_accounts_and_nullifies_orders(): void
    {
        // User 1: Requested deletion 31 days ago (Expired)
        $expiredUser = User::factory()->create([
            'deletion_requested_at' => now()->subDays(31),
        ]);

        // User 2: Requested deletion 15 days ago (Within grace period)
        $recentUser = User::factory()->create([
            'deletion_requested_at' => now()->subDays(15),
        ]);

        // Create an order for expired user
        $product = \App\Models\Product::first();
        $order = Order::create([
            'user_id' => $expiredUser->id,
            'order_type' => 'purchase',
            'recipient_name' => 'Jane Doe',
            'recipient_phone' => '09123456789',
            'pickup_date' => now()->addDays(1)->format('Y-m-d'),
            'items' => [['id' => $product->id, 'name' => $product->name, 'price' => $product->price, 'quantity' => 1]],
            'total_price' => $product->price,
            'status' => 'confirmed',
        ]);

        // Run the purge artisan command
        $this->artisan('app:purge-deleted-accounts')
            ->assertExitCode(0);

        // Expired user should be permanently purged
        $this->assertDatabaseMissing('users', [
            'id' => $expiredUser->id,
        ]);

        // Recent user should still exist
        $this->assertDatabaseHas('users', [
            'id' => $recentUser->id,
        ]);

        // Order should remain in database with nullified user_id
        $this->assertDatabaseHas('orders', [
            'id' => $order->id,
            'user_id' => null,
        ]);
    }
}
