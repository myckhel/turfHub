<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    // Payment routes
    Route::prefix('payments')->name('payment.')->group(function () {
        Route::get('create', [App\Http\Controllers\Web\PaymentController::class, 'create'])->name('create');
        Route::post('initialize', [App\Http\Controllers\Web\PaymentController::class, 'initialize'])->name('initialize');
        Route::get('history', [App\Http\Controllers\Web\PaymentController::class, 'history'])->name('history');
        Route::get('{payment}/success', [App\Http\Controllers\Web\PaymentController::class, 'success'])->name('success');
        Route::get('{payment}/failed', [App\Http\Controllers\Web\PaymentController::class, 'failed'])->name('failed');
        Route::post('{payment}/verify', [App\Http\Controllers\Web\PaymentController::class, 'verify'])->name('verify');
        Route::post('{payment}/cancel', [App\Http\Controllers\Web\PaymentController::class, 'cancel'])->name('cancel');
    });
});

// Public payment callback route (for Paystack)
Route::get('payment/callback', [App\Http\Controllers\Web\PaymentController::class, 'callback'])->name('payment.callback');

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
