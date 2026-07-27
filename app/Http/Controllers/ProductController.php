<?php

namespace App\Http\Controllers;

use App\Models\Product;
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
        return response()->json(Product::paginate($perPage));
    }
}
