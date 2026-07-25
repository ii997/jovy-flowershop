<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\NotificationController;

Route::get('/', function () {
    return view('welcome');
});

// Catalog & settings routes
Route::get('/api/products', [ProductController::class, 'index']);
Route::get('/api/settings', [AdminController::class, 'getSettings']);

// Authentication routes (strict rate limits to prevent brute-force)
Route::post('/api/register', [AuthController::class, 'register'])->middleware('throttle:5,1');
Route::post('/api/login', [AuthController::class, 'login'])->middleware('throttle:5,1');
Route::post('/api/logout', [AuthController::class, 'logout'])->middleware('throttle:10,1');
Route::get('/api/user', [AuthController::class, 'user'])->middleware('auth');
Route::post('/api/profile', [AuthController::class, 'update'])->middleware('auth')->middleware('throttle:10,1');

// Customer orders routes
Route::post('/api/orders', [OrderController::class, 'store'])->middleware('auth')->middleware('throttle:10,1');
Route::get('/api/orders', [OrderController::class, 'index'])->middleware('auth');
Route::post('/api/orders/{id}/payment', [OrderController::class, 'submitPayment'])->middleware('auth')->middleware('throttle:10,1');
Route::post('/api/orders/{id}/cancel', [OrderController::class, 'cancel'])->middleware('auth')->middleware('throttle:10,1');

// Notifications routes
Route::get('/api/notifications', [NotificationController::class, 'index'])->middleware('auth');
Route::post('/api/notifications/read', [NotificationController::class, 'markRead'])->middleware('auth');

// Secure Admin API routes group (secured via Gate middleware)
Route::prefix('/api/admin')->middleware(['auth', 'throttle:60,1'])->group(function () {
    // Admin-only endpoints
    Route::middleware(['can:admin'])->group(function () {
        Route::get('/stats', [AdminController::class, 'stats']);
        Route::post('/products/{id}/price', [AdminController::class, 'updateProductPrice']);
        Route::post('/products/{id}/update', [AdminController::class, 'updateProductDetails']);
        Route::post('/products', [AdminController::class, 'storeProduct']);
        Route::post('/flowers', [AdminController::class, 'storeFlower']);
        Route::put('/flowers/{id}', [AdminController::class, 'updateFlower']);
    });

    // Staff & Admin shared endpoints
    Route::middleware(['can:staff'])->group(function () {
        Route::get('/orders', [AdminController::class, 'orders']);
        Route::post('/orders/{id}/status', [AdminController::class, 'updateOrderStatus']);
        Route::post('/orders/{id}/payment-status', [AdminController::class, 'updatePaymentStatus']);
        Route::post('/orders/{id}/cancel', [AdminController::class, 'cancelOrder']);
        Route::post('/products/{id}/availability', [AdminController::class, 'toggleProductAvailability']);
        Route::post('/upload-image', [AdminController::class, 'uploadImage']);
        Route::get('/flowers', [AdminController::class, 'flowers']);
        Route::post('/flowers/{id}/availability', [AdminController::class, 'toggleFlowerAvailability']);
        Route::get('/sms-logs', [AdminController::class, 'getSmsLogs']);
        Route::post('/settings', [AdminController::class, 'saveSettings']);
    });
});

// Secure Admin Dashboard web routes group
Route::get('/admin/{any?}', [AdminController::class, 'dashboard'])
    ->middleware('auth')
    ->where('any', '.*');
