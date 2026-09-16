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

    /**
     * Determine if a product is a funeral or sympathy arrangement that should be exempted from surge pricing.
     *
     * @param  \App\Models\Product|array  $product
     */
    public static function isFuneralProduct($product): bool
    {
        if (is_array($product)) {
            $name = strtolower($product['name'] ?? '');
            $category = strtolower($product['category'] ?? '');
            $occasions = $product['occasions'] ?? [];
        } else {
            $name = strtolower($product->name ?? '');
            $category = strtolower($product->category ?? '');
            $occasions = $product->occasions ?? [];
        }

        if (!is_array($occasions)) {
            $occasions = [];
        }
        $occasions = array_map('strtolower', $occasions);

        if (str_contains($category, 'funeral') || str_contains($category, 'sympathy')) {
            return true;
        }

        if (in_array('funeral', $occasions, true) || in_array('sympathy', $occasions, true)) {
            return true;
        }

        $keywords = ['funeral', 'sympathy', 'condolence', 'wreath', 'memorial'];
        foreach ($keywords as $kw) {
            if (str_contains($name, $kw)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Check if holiday surge pricing (flat 2x) is enabled in store settings.
     */
    public static function isSurgeActive(): bool
    {
        $settingsPath = storage_path('app/settings.json');
        if (!file_exists($settingsPath)) {
            return false;
        }

        $settings = json_decode(@file_get_contents($settingsPath), true);
        return !empty($settings['surge_pricing']);
    }

    /**
     * Check if funeral/sympathy arrangements are currently exempted from holiday surge pricing.
     * Defaults to true if surge_pricing is on and surge_exempt_funeral is not explicitly set to false.
     */
    public static function isFuneralExempt(): bool
    {
        $settingsPath = storage_path('app/settings.json');
        if (!file_exists($settingsPath)) {
            return true;
        }

        $settings = json_decode(@file_get_contents($settingsPath), true);
        if (!array_key_exists('surge_exempt_funeral', $settings)) {
            return true;
        }

        return (bool) $settings['surge_exempt_funeral'];
    }

    /**
     * Calculate effective selling price for a product.
     * If surge pricing is enabled:
     *   - If product is a funeral/sympathy item and funeral exemption is active -> standard base price (1x).
     *   - Otherwise -> doubled price (2x).
     *
     * @param  \App\Models\Product  $product
     */
    public static function getEffectivePrice(\App\Models\Product $product): float
    {
        $basePrice = (float) $product->price;

        if (self::isSurgeActive()) {
            if (self::isFuneralProduct($product) && self::isFuneralExempt()) {
                return round($basePrice, 2);
            }
            return round($basePrice * 2.0, 2);
        }

        return round($basePrice, 2);
    }
}