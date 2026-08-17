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
        Schema::table('flowers', function (Blueprint $table) {
            $table->string('unit_type')->default('stem')->after('price'); // stem, stick, kilo
            $table->string('size')->nullable()->after('unit_type'); // Small, Medium, Large
            $table->integer('bundle_qty')->nullable()->after('size'); // e.g. 3 for Chrysanthemum
            $table->decimal('bundle_price', 10, 2)->nullable()->after('bundle_qty'); // e.g. 100.00 for Chrysanthemum
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('flowers', function (Blueprint $table) {
            $table->dropColumn(['unit_type', 'size', 'bundle_qty', 'bundle_price']);
        });
    }
};
