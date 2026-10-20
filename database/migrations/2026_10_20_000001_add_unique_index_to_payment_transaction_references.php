<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payment_transactions', function (Blueprint $table) {
            $table->string('reference_key', 100)->nullable()->after('reference_no');
        });

        $rows = \DB::table('payment_transactions')
            ->select(['id', 'reference_no'])
            ->whereNotNull('reference_no')
            ->get();
        $groups = $rows->groupBy(fn (object $row): string => strtoupper(trim($row->reference_no)));

        foreach ($groups as $referenceKey => $group) {
            if ($referenceKey !== '') {
                \DB::table('payment_transactions')
                    ->where('id', $group->first()->id)
                    ->update(['reference_key' => $referenceKey]);
            }
            // Existing duplicate references remain available for audit history. They
            // are left NULL in the reservation key and are rejected by the controller.
        }

        Schema::table('payment_transactions', function (Blueprint $table) {
            $table->unique('reference_key', 'payment_transactions_reference_key_unique');
        });
    }

    public function down(): void
    {
        Schema::table('payment_transactions', function (Blueprint $table) {
            $table->dropUnique('payment_transactions_reference_key_unique');
            $table->dropColumn('reference_key');
        });
    }
};
