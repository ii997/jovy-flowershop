<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Audit trail for order cancellations — prevents casual one-click cancellations.
     */
    public function up(): void
    {
        Schema::create('order_cancellations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('cancelled_by')->constrained('users');
            $table->text('reason');
            $table->decimal('refund_amount', 10, 2)->nullable();
            $table->string('refund_method', 30)->nullable(); // original_payment, store_credit, none
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_cancellations');
    }
};