<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Fillable([
    'name',
    'category',
    'image',
    'description',
    'occasions',
    'seasons',
    'size',
    'gallery',
    'price',
    'rating',
    'availability',
    'stems',
])]
class Product extends Model
{
    /**
     * Get the attributes that should be cast.
     */
    protected function casts(): array
    {
        return [
            'occasions' => 'array',
            'seasons' => 'array',
            'gallery' => 'array',
            'stems' => 'array',
            'availability' => 'boolean',
            'price' => 'float',
            'rating' => 'float'
        ];
    }
}
