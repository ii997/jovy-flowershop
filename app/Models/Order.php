<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Fillable([
    'user_id',
    'order_type',
    'recipient_name',
    'recipient_phone',
    'pickup_date',
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

    public function notifications()
    {
        return $this->hasMany(Notification::class, 'user_id', 'user_id');
    }

    public function smsLogs()
    {
        return $this->hasMany(SmsLog::class);
    }

    protected function casts(): array
    {
        return [
            'items' => 'array',
            'pickup_date' => 'date:Y-m-d',
            'payment_details' => 'array',
            'payment_status' => 'string',
            'total_price' => 'decimal:2',
        ];
    }
}
