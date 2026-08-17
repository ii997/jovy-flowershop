<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Fillable([
    'name',
    'price',
    'unit_type',
    'size',
    'bundle_qty',
    'bundle_price',
    'quantity',
    'available',
])]
class Flower extends Model
{
    /**
     * Get the attributes that should be cast.
     */
    protected function casts(): array
    {
        return [
            'available' => 'boolean',
            'price' => 'float',
            'bundle_price' => 'float',
            'bundle_qty' => 'integer',
            'quantity' => 'integer',
        ];
    }
}
