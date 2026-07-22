<?php

namespace Database\Seeders;

use App\Models\User;
use App\Enums\UserRole;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Seed admin and staff users.
     */
    public function run(): void
    {
        $users = [
            ['name' => 'Rose Admin',   'email' => 'admin@jovy.com',   'password' => 'password', 'role' => UserRole::Admin],
            ['name' => 'David Manager','email' => 'manager@jovy.com', 'password' => 'password', 'role' => UserRole::Admin],
            ['name' => 'Jack Staff',   'email' => 'staff@jovy.com',   'password' => 'password', 'role' => UserRole::Staff],
            ['name' => 'Maria Staff',  'email' => 'maria@jovy.com',   'password' => 'password', 'role' => UserRole::Staff],
        ];

        foreach ($users as $user) {
            User::firstOrCreate(
                ['email' => $user['email']],
                [
                    'name' => $user['name'],
                    'password' => Hash::make($user['password']),
                    'role' => $user['role'],
                ]
            );
        }

        $this->command->info('Seeded ' . User::whereIn('role', [UserRole::Admin, UserRole::Staff])->count() . ' admin/staff users.');
    }
}
