<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * One-to-many payment audit trail.
     * Replaces the single JSON payment_details blob with verifiable rows.
     */
    public function up(): void
    {
        Schema::create('payment_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->string('type', 20)->default('payment'); // payment, refund, partial_refund
            $table->decimal('amount', 10, 2)->nullable();
            $table->string('method', 30)->nullable(); // instapay, gcash, bank_transfer, cash
            $table->string('reference_no', 100)->nullable();
            $table->string('receipt_image')->nullable();
            $table->text('admin_notes')->nullable();
            $table->foreignId('verified_by')->nullable()->constrained('users');
            $table->timestamp('verified_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_transactions');
    }
};