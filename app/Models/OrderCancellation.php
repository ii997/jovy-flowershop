<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Fillable([
    'order_id',
    'cancelled_by',
    'reason',
    'refund_amount',
    'refund_method',
])]
class OrderCancellation extends Model
{
    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function cancelledBy()
    {
        return $this->belongsTo(User::class, 'cancelled_by');
    }

    protected function casts(): array
    {
        return [
            'refund_amount' => 'float',
        ];
    }
}