<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Product;
use App\Models\Order;
use App\Enums\UserRole;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
    }

    public function test_registration_always_creates_customer_role(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('role', 'customer');

        $this->assertDatabaseHas('users', [
            'email' => 'test@example.com',
            'role' => 'customer',
        ]);
    }

    public function test_registration_ignores_client_provided_role(): void
    {
        // Even if a client sends a privileged role, the server must force customer
        $response = $this->postJson('/api/register', [
            'name' => 'Hacker User',
            'email' => 'hacker@example.com',
            'password' => 'password123',
            'role' => 'admin',
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('role', 'customer');

        $this->assertDatabaseHas('users', [
            'email' => 'hacker@example.com',
            'role' => 'customer',
        ]);
    }

    public function test_admin_cannot_be_created_through_api(): void
    {
        $this->postJson('/api/register', [
            'name' => 'Fake Admin',
            'email' => 'fakeadmin@example.com',
            'password' => 'password123',
            'role' => 'admin',
        ]);

        $user = User::where('email', 'fakeadmin@example.com')->first();
        $this->assertNotNull($user);
        $this->assertTrue($user->role instanceof \App\Enums\UserRole);
        $this->assertEquals(\App\Enums\UserRole::Customer, $user->role);
    }

    public function test_login_with_valid_credentials(): void
    {
        $response = $this->postJson('/api/login', [
            'email' => 'customer@jovy.com',
            'password' => 'password',
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('email', 'customer@jovy.com');
        $this->assertAuthenticated();
    }

    public function test_login_with_invalid_credentials_returns_error(): void
    {
        $response = $this->postJson('/api/login', [
            'email' => 'customer@jovy.com',
            'password' => 'wrongpassword',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('email');
    }

    public function test_logout_clears_session(): void
    {
        $user = User::where('email', 'carlos@customer.com')->first() ?: User::factory()->create();
        $this->actingAs($user);

        $response = $this->postJson('/api/logout');
        $response->assertStatus(200);
        $this->assertGuest();
    }
}