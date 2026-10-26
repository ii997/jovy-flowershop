<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            $table->string('transaction_key', 150)->nullable()->after('type');
            $table->unique(
                ['user_id', 'type', 'transaction_key'],
                'notifications_user_event_transaction_unique'
            );
        });
    }

    public function down(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            $table->dropUnique('notifications_user_event_transaction_unique');
            $table->dropColumn('transaction_key');
        });
    }
};
