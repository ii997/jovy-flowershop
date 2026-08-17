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
            // Drop single-column unique constraint so flowers can have multiple size entries
            $table->dropUnique('flowers_name_unique');
            // Add non-unique index on name for fast lookups
            $table->index('name', 'flowers_name_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('flowers', function (Blueprint $table) {
            $table->dropIndex('flowers_name_index');
            $table->unique('name', 'flowers_name_unique');
        });
    }
};
