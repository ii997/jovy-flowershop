<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            if (Schema::hasColumn('orders', 'delivery_address')) {
                $table->dropColumn('delivery_address');
            }
            if (Schema::hasColumn('orders', 'delivery_type')) {
                $table->dropColumn('delivery_type');
            }
            if (Schema::hasColumn('orders', 'delivery_date') && !Schema::hasColumn('orders', 'pickup_date')) {
                $table->renameColumn('delivery_date', 'pickup_date');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            if (Schema::hasColumn('orders', 'pickup_date') && !Schema::hasColumn('orders', 'delivery_date')) {
                $table->renameColumn('pickup_date', 'delivery_date');
            }
            if (!Schema::hasColumn('orders', 'delivery_address')) {
                $table->string('delivery_address', 500)->nullable();
            }
            if (!Schema::hasColumn('orders', 'delivery_type')) {
                $table->string('delivery_type', 20)->default('pickup');
            }
        });
    }
};
