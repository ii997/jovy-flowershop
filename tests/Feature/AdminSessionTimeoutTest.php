<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminSessionTimeoutTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
    }

    public function test_admin_stays_logged_in_within_timeout_period(): void
    {
        $admin = User::where('email', 'admin@jovy.com')->first();
        $admin->last_admin_activity = now()->subMinutes(15);
        $admin->save();

        $this->actingAs($admin);

        $response = $this->getJson('/api/admin/stats');
        $response->assertStatus(200);
    }

    public function test_admin_logged_out_after_thirty_one_minutes(): void
    {
        $admin = User::where('email', 'admin@jovy.com')->first();
        $admin->last_admin_activity = now()->subMinutes(31);
        $admin->save();

        $this->actingAs($admin);

        $response = $this->getJson('/api/admin/stats');
        $response->assertStatus(401);
        $response->assertJson([
            'message' => 'Your session has expired due to inactivity. Please log in again.',
        ]);
    }

    public function test_regular_customer_not_affected_by_admin_timeout(): void
    {
        $customer = User::where('email', 'customer@jovy.com')->first();
        // Even with a stale activity timestamp, regular users should not be affected
        $customer->last_admin_activity = now()->subMinutes(31);
        $customer->save();

        $this->actingAs($customer);

        $response = $this->getJson('/api/user');
        $response->assertStatus(200);
    }

    public function test_admin_activity_extends_timeout_window(): void
    {
        $admin = User::where('email', 'admin@jovy.com')->first();
        $admin->last_admin_activity = now()->subMinutes(25);
        $admin->save();

        $this->actingAs($admin);

        // This request should succeed and reset the timer
        $this->getJson('/api/admin/stats')->assertStatus(200);

        // Verify the database column was updated
        $admin->refresh();
        $this->assertNotNull($admin->last_admin_activity);
        $this->assertTrue(
            $admin->last_admin_activity->diffInMinutes(now()) < 1,
            'Expected last_admin_activity to be updated to near-now, but was '
            . $admin->last_admin_activity->diffInMinutes(now()) . ' minutes old.'
        );
    }

    public function test_admin_web_view_redirects_after_inactivity(): void
    {
        $admin = User::where('email', 'admin@jovy.com')->first();
        $admin->last_admin_activity = now()->subMinutes(31);
        $admin->save();

        $this->actingAs($admin);

        $response = $this->get('/admin');
        $response->assertStatus(302);
        $response->assertRedirect('/');
    }

    public function test_staff_also_subject_to_admin_timeout(): void
    {
        $staff = User::where('email', 'staff@jovy.com')->first();
        $staff->last_admin_activity = now()->subMinutes(31);
        $staff->save();

        $this->actingAs($staff);

        $response = $this->getJson('/api/admin/orders');
        $response->assertStatus(401);
        $response->assertJson([
            'message' => 'Your session has expired due to inactivity. Please log in again.',
        ]);
    }

    public function test_first_request_sets_activity_without_timeout(): void
    {
        $admin = User::where('email', 'admin@jovy.com')->first();

        // No last_admin_activity set (fresh login)
        $this->actingAs($admin);

        $this->getJson('/api/admin/stats')->assertStatus(200);

        // DB column should now have the timestamp
        $admin->refresh();
        $this->assertNotNull($admin->last_admin_activity);
    }
}
