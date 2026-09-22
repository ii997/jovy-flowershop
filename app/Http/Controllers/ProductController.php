<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Support\ProductPricing;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    /**
     * Display a paginated listing of all products.
     */
    public function index(Request $request)
    {
        $perPage = (int) $request->input('per_page', 50);
        $perPage = max(1, min(200, $perPage));

        $query = Product::query();
        if ($request->boolean('with_archived')) {
            $query->withTrashed();
        }

        $paginated = $query->paginate($perPage);
        $paginated->getCollection()->transform(function ($product) {
            $basePrice = (float) $product->price;
            $effectivePrice = ProductPricing::getEffectivePrice($product);

            $product->base_price = $basePrice;
            $product->price = $effectivePrice;
            $product->is_surge_applied = ($effectivePrice > $basePrice);

            return $product;
        });

        return response()->json($paginated);
    }
}

