<?php

namespace App\Http\Controllers;

use App\Models\Product;

class ProductController extends Controller
{
    /**
     * Display a listing of all products.
     */
    public function index()
    {
        return response()->json(Product::all());
    }
}
