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
    'receipt_image',
    'admin_notes',
    'verified_by',
    'verified_at',
])]
class PaymentTransaction extends Model
{
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