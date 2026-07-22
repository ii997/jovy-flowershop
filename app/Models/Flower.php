<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Fillable([
    'name',
    'price',
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
            'quantity' => 'integer',
        ];
    }
}
