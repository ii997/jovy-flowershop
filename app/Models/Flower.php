<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

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
    use SoftDeletes;
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

    /**
     * Find a flower by exact name, name + size variant, or 'Name (Size)' pattern.
     */
    public static function findByNameOrVariant(string $flowerKey, bool $lockForUpdate = false): ?self
    {
        $flowerKey = trim($flowerKey);
        if ($flowerKey === '') {
            return null;
        }

        $query = self::query();
        if ($lockForUpdate) {
            $query->lockForUpdate();
        }

        // 1. Direct match by exact name
        $flower = (clone $query)->where('name', $flowerKey)->first();
        if ($flower) {
            return $flower;
        }

        // 2. Match by Name (Size) pattern e.g. "Anthurium (Medium)"
        if (preg_match('/^(.*?)\s*\((.*?)\)$/', $flowerKey, $matches)) {
            $baseName = trim($matches[1]);
            $size = trim($matches[2]);

            $flower = (clone $query)->where('name', $baseName)
                ->where('size', $size)
                ->first();

            if ($flower) {
                return $flower;
            }

            // Case-insensitive fallback for name and size
            $flower = (clone $query)->whereRaw('LOWER(name) = ?', [strtolower($baseName)])
                ->whereRaw('LOWER(size) = ?', [strtolower($size)])
                ->first();

            if ($flower) {
                return $flower;
            }
        }

        // 3. Case-insensitive exact name fallback
        return (clone $query)->whereRaw('LOWER(name) = ?', [strtolower($flowerKey)])->first();
    }
}
