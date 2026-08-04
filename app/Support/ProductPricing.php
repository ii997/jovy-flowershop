<?php

namespace App\Support;

use App\Models\Flower;

class ProductPricing
{
    /**
     * Compute a bouquet's selling price from its stem composition.
     *
     * Price is fully derived from catalog flower unit prices:
     *     price = Σ (flower unit price × stem count)
     *
     * No markup or labor fee is added. Stems referencing flowers that are
     * not in the catalog contribute 0 to the total. The result is rounded
     * to 2 decimal places to match the decimal(10,2) products column.
     *
     * @param  array<string, int>  $stems  map of flower name => stem count
     */
    public static function computePrice(array $stems): float
    {
        if (empty($stems)) {
            return 0.0;
        }

        $flowers = Flower::whereIn('name', array_keys($stems))
            ->get()
            ->keyBy('name');

        $total = 0.0;
        foreach ($stems as $flowerName => $count) {
            $count = (int) $count;
            $flower = $flowers->get($flowerName);
            if ($flower && $count > 0) {
                $total += $flower->price * $count;
            }
        }

        return round($total, 2);
    }
}