<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\Web\TurfController;

Route::get('/', function () {
  return Inertia::render('Public/Welcome');
})->name('welcome');

Route::middleware(['auth', 'verified'])->group(function () {
  Route::get('dashboard', function () {
    return Inertia::render('App/Dashboard');
  })->name('dashboard');

  // Turf routes
  Route::get('turfs', [TurfController::class, 'index'])->name('web.turfs.index');
  Route::get('turfs/{turf}', [TurfController::class, 'show'])->name('web.turfs.show');
})->prefix('app');

// Public payment callback route (for Paystack)
Route::get('payment/callback', [App\Http\Controllers\Web\PaymentController::class, 'callback'])->name('payment.callback');

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
