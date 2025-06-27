<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\Web\TurfController;
use App\Http\Controllers\Web\MatchSessionController;
use App\Http\Controllers\Web\TeamController;

Route::get('/', function () {
  return Inertia::render('Public/Welcome');
})->name('welcome');

Route::middleware(['auth', 'verified'])->group(function () {
  Route::get('dashboard', function () {
    return Inertia::render('App/Dashboard');
  })->name('dashboard');

  // Turf routes
  Route::get('turfs', [TurfController::class, 'index'])->name('web.turfs.index');
  Route::get('turfs/create', [TurfController::class, 'create'])->name('web.turfs.create');
  Route::get('turfs/{turf}', [TurfController::class, 'show'])->name('web.turfs.show');
  Route::get('turfs/{turf}/edit', [TurfController::class, 'edit'])->name('web.turfs.edit');

  // Match Session routes (nested under turfs)
  Route::get('turfs/{turf}/match-sessions', [MatchSessionController::class, 'index'])->name('web.turfs.match-sessions.index');
  Route::get('turfs/{turf}/match-sessions/create', [MatchSessionController::class, 'create'])->name('web.turfs.match-sessions.create');
  Route::get('turfs/{turf}/match-sessions/{matchSession}', [MatchSessionController::class, 'show'])->name('web.turfs.match-sessions.show');
  Route::get('turfs/{turf}/match-sessions/{matchSession}/edit', [MatchSessionController::class, 'edit'])->name('web.turfs.match-sessions.edit');

  // Team routes (nested under match sessions)
  Route::get('turfs/{turf}/match-sessions/{matchSession}/teams', [TeamController::class, 'index'])->name('web.turfs.match-sessions.teams.index');
  Route::get('turfs/{turf}/match-sessions/{matchSession}/teams/{team}', [TeamController::class, 'show'])->name('web.turfs.match-sessions.teams.show');
})->prefix('app');

// Public payment callback route (for Paystack)
Route::get('payment/callback', [App\Http\Controllers\Web\PaymentController::class, 'callback'])->name('payment.callback');

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
