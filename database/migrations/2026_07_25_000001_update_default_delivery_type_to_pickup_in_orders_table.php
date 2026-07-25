<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Update default delivery_type to "pickup" in orders table.
     */
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->string('delivery_type', 20)->default('pickup')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->string('delivery_type', 20)->default('delivery')->change();
        });
    }
};
