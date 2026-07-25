<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add delivery_type to orders - "delivery" or "pickup". Default set to "pickup".
     */
    public function up(): void
    {
        Schema::table("orders", function (Blueprint $table) {
            $table->string("delivery_type", 20)->default("pickup")->after("order_type");
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table("orders", function (Blueprint $table) {
            $table->dropColumn("delivery_type");
        });
    }
};
