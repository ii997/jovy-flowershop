<?php

namespace App\Support;

use App\Models\Flower;

class ProductPricing
{
    /**
     * Compute a bouquet's selling price from its stem composition.
     *
     * Price is derived from catalog flower pricing rules:
     *   - Tiered / Bundle pricing (e.g., 3 for ₱100): floor(qty / bundle_qty) * bundle_price + remainder * unit_price
     *   - Standard unit pricing: qty * unit_price
     *   - Fractional quantity (e.g. kilos): qty (float) * unit_price
     *   - Size variants: matched by exact name or name + size combination
     *
     * Stems referencing flowers that are not in the catalog contribute 0 to the total.
     *
     * @param  array<string, int|float>  $stems  map of flower name/variant => stem count or quantity
     */
    public static function computePrice(array $stems): float
    {
        if (empty($stems)) {
            return 0.0;
        }

        $allFlowers = Flower::all();
        $flowersByName = $allFlowers->keyBy('name');

        $total = 0.0;
        foreach ($stems as $flowerKey => $count) {
            $count = (float) $count;
            if ($count <= 0) {
                continue;
            }

            // 1. Direct match by exact name (e.g., "Anthurium (Medium)", "Roses", "Chrysanthemum")
            $flower = $flowersByName->get($flowerKey);

            // 2. Fallback match by name & size if formatted as "Name (Size)"
            if (!$flower && preg_match('/^(.*?)\s*\((.*?)\)$/', $flowerKey, $matches)) {
                $baseName = trim($matches[1]);
                $size = trim($matches[2]);
                $flower = $allFlowers->first(function ($f) use ($baseName, $size) {
                    return strcasecmp($f->name, $baseName) === 0 && strcasecmp((string)$f->size, $size) === 0;
                });
            }

            if ($flower) {
                if ($flower->bundle_qty > 0 && $flower->bundle_price > 0 && $count >= $flower->bundle_qty) {
                    $bundles = (int) floor($count / $flower->bundle_qty);
                    $remainder = $count - ($bundles * $flower->bundle_qty);
                    $itemTotal = ($bundles * $flower->bundle_price) + ($remainder * $flower->price);
                } else {
                    $itemTotal = $count * $flower->price;
                }
                $total += $itemTotal;
            }
        }

        return round($total, 2);
    }
}