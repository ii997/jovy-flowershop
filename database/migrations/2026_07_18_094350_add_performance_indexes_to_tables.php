<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations — add performance indexes to frequently queried columns.
     */
    public function up(): void
    {
        // Users: role is queried for authorization checks
        Schema::table('users', function (Blueprint $table) {
            $table->index('role');
        });

        // Products: category, availability are used for filtering and lookups
        Schema::table('products', function (Blueprint $table) {
            $table->index('category');
            $table->index('availability');
        });

        // Orders: status, order_type, user_id are used for filtering, analytics, and joins
        Schema::table('orders', function (Blueprint $table) {
            $table->index('status');
            $table->index('order_type');
            $table->index('created_at');
        });

        // Flowers: name is queried by name for stock deduction
        Schema::table('flowers', function (Blueprint $table) {
            $table->unique('name', 'flowers_name_unique');
        });

        // Newsletter: email is already unique via validation, add index
        Schema::table('newsletter_subscriptions', function (Blueprint $table) {
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', fn(Blueprint $t) => $t->dropIndex(['role']));
        Schema::table('products', fn(Blueprint $t) => $t->dropIndex(['category', 'availability'])); // only drops first
        Schema::table('products', function (Blueprint $t) {
            $t->dropIndex(['category']);
            $t->dropIndex(['availability']);
        });
        Schema::table('orders', function (Blueprint $t) {
            $t->dropIndex(['status']);
            $t->dropIndex(['order_type']);
            $t->dropIndex(['created_at']);
        });
        Schema::table('flowers', fn(Blueprint $t) => $t->dropUnique('flowers_name_unique'));
        Schema::table('newsletter_subscriptions', fn(Blueprint $t) => $t->dropIndex(['created_at']));
    }
};