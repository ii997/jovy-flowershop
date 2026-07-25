<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Fillable([
    'user_id',
    'order_type',
    'delivery_type',
    'recipient_name',
    'recipient_phone',
    'delivery_address',
    'delivery_date',
    'gift_message',
    'items',
    'total_price',
    'status',
    'payment_status',
    'payment_receipt',
    'payment_details',
])]
class Order extends Model
{
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function paymentTransactions()
    {
        return $this->hasMany(PaymentTransaction::class);
    }

    public function cancellation()
    {
        return $this->hasOne(OrderCancellation::class);
    }

    protected function casts(): array
    {
        return [
            'items' => 'array',
            'delivery_type' => 'string',
            'delivery_date' => 'date:Y-m-d',
            'payment_details' => 'array',
            'payment_status' => 'string',
            'total_price' => 'decimal:2',
        ];
    }
}
