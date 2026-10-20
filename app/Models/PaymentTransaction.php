<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Fillable([
    'order_id',
    'type',
    'amount',
    'method',
    'reference_no',
    'reference_key',
    'receipt_image',
    'admin_notes',
    'verified_by',
    'verified_at',
])]
class PaymentTransaction extends Model
{
    protected static function booted(): void
    {
        static::creating(function (self $transaction): void {
            $transaction->reference_key = $transaction->reference_no
                ? strtoupper(trim($transaction->reference_no))
                : null;
        });
    }

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function verifier()
    {
        return $this->belongsTo(User::class, 'verified_by');
    }

    protected function casts(): array
    {
        return [
            'amount' => 'float',
            'verified_at' => 'datetime',
        ];
    }
}
