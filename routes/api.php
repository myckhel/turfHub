<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\GameMatchController;
use App\Http\Controllers\Api\MatchEventController;
use App\Http\Controllers\Api\MatchSessionController;
use App\Http\Controllers\Api\PlayerController;
use App\Http\Controllers\Api\QueueLogicController;
use App\Http\Controllers\Api\TeamController;
use App\Http\Controllers\Api\TeamPlayerController;
use App\Http\Controllers\Api\TurfController;
use App\Http\Controllers\Api\UserController;
use App\Models\MatchSession;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;

// Health check endpoint for Octane monitoring
Route::get('/health', function () {
  return response()->json([
    'status' => 'ok',
    'timestamp' => now()->toISOString(),
    'service' => 'TurfMate API',
    'version' => config('app.version', '1.0.0'),
    'octane' => [
      'server' => config('octane.server'),
      'php_version' => PHP_VERSION,
      'memory_usage' => memory_get_usage(true),
      'memory_peak' => memory_get_peak_usage(true),
    ],
    'database' => [
      'connected' => DB::connection()->getPdo() ? true : false,
    ],
    'cache' => [
      'working' => Cache::put('health_check', true, 10) && Cache::get('health_check') === true,
    ],
  ], 200);
})->name('health');

// Public authentication routes
Route::prefix('auth')->name('api.')->group(function () {
  Route::post('/register', [AuthController::class, 'register']);
  Route::post('/login', [AuthController::class, 'login']);
  Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
  Route::post('/reset-password', [AuthController::class, 'resetPassword']);
  Route::get('/verify-email/{id}/{hash}', [AuthController::class, 'verifyEmail'])
    ->middleware(['signed', 'throttle:6,1'])
    ->name('api.verification.verify');
});

// Protected routes requiring authentication
Route::middleware('auth:sanctum')->name('api.')->group(function () {
  // Auth routes
  Route::prefix('auth')->group(function () {
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/logout-all', [AuthController::class, 'logoutAll']);
    Route::post('/email/verification-notification', [AuthController::class, 'sendEmailVerification'])
      ->middleware('throttle:6,1');
    Route::post('/confirm-password', [AuthController::class, 'confirmPassword']);
  });

  // Legacy route for compatibility
  Route::get('/user', function (Request $request) {
    return $request->user();
  });

  // API Resource Routes
  Route::apiResource('users', UserController::class);
  Route::apiResource('turfs', TurfController::class);
  Route::apiResource('players', PlayerController::class);
  Route::apiResource('teams', TeamController::class);
  Route::apiResource('match-sessions', MatchSessionController::class);
  Route::apiResource('game-matches', GameMatchController::class);
  Route::apiResource('match-events', MatchEventController::class);
  Route::apiResource('queue-logic', QueueLogicController::class);
  Route::apiResource('team-players', TeamPlayerController::class);

  // Additional nested resource routes for better organization
  Route::prefix('turfs/{turf}')->group(function () {
    Route::get('players', [PlayerController::class, 'index'])->name('turfs.players.index');
    Route::get('available-players', [TurfController::class, 'getAvailablePlayers'])->name('turfs.available-players');
    Route::get('match-sessions', [MatchSessionController::class, 'index'])->name('turfs.match-sessions.index');
    Route::post('join', [TurfController::class, 'join'])->name('turfs.join');
    Route::delete('leave', [TurfController::class, 'leave'])->name('turfs.leave');

    // Team slot fee routes
    Route::get('join-cost', [TurfController::class, 'getJoinCost'])->name('turfs.join-cost');
    Route::get('team-slot-fee-info', [TurfController::class, 'getTeamSlotFeeInfo'])->name('turfs.team-slot-fee-info');
    Route::post('process-team-slot-payment', [TurfController::class, 'processTeamSlotPayment'])->name('turfs.process-team-slot-payment');
  });

  // Player-specific routes for the player flow
  Route::prefix('players/{player}')->group(function () {
    Route::get('match-sessions', [PlayerController::class, 'matchSessions'])->name('players.match-sessions');
    Route::get('match-sessions/{matchSession}/teams', [PlayerController::class, 'availableTeams'])->name('players.available-teams');
    Route::post('join-team', [PlayerController::class, 'joinTeam'])->name('players.join-team');
    Route::post('leave-team', [PlayerController::class, 'leaveTeam'])->name('players.leave-team');
    Route::get('team-status', [PlayerController::class, 'currentTeamStatus'])->name('players.team-status');
    Route::get('payment-history', [PlayerController::class, 'paymentHistory'])->name('players.payment-history');
    Route::post('can-join-team', [PlayerController::class, 'canJoinTeam'])->name('players.can-join-team');
  });

  Route::prefix('match-sessions/{matchSession}')->group(function () {
    Route::get('teams', [TeamController::class, 'index'])->name('match-sessions.teams.index');
    Route::get('available-slots', [MatchSessionController::class, 'getAvailableSlots'])->name('match-sessions.available-slots');
    Route::get('available-players', [MatchSessionController::class, 'getAvailablePlayers'])->name('match-sessions.available-players');
    Route::get('game-matches', [MatchSessionController::class, 'getGameMatches'])->name('match-sessions.game-matches.index');
    Route::get('queue-logic', [QueueLogicController::class, 'index'])->name('match-sessions.queue-logic.index');
    Route::get('queue-status', [MatchSessionController::class, 'queueStatus'])->name('match-sessions.queue-status');

    // Match session management routes
    Route::post('start', [MatchSessionController::class, 'start'])->name('match-sessions.start');
    Route::post('stop', [MatchSessionController::class, 'stop'])->name('match-sessions.stop');
    Route::post('add-player-to-team', [MatchSessionController::class, 'addPlayerToTeam'])->name('match-sessions.add-player-to-team');
  });

  Route::prefix('teams/{team}')->group(function () {
    Route::get('players', [TeamPlayerController::class, 'index'])->name('teams.players.index');
    Route::get('game-matches', [GameMatchController::class, 'index'])->name('teams.game-matches.index');

    // Team slot management
    Route::post('join-slot', [TeamController::class, 'joinSlot'])->name('teams.join-slot');
    Route::delete('leave-slot', [TeamController::class, 'leaveSlot'])->name('teams.leave-slot');
    Route::post('add-player', [TeamController::class, 'addPlayerToSlot'])->name('teams.add-player');
    Route::delete('remove-player/{playerId}', [TeamController::class, 'removePlayerFromSlot'])->name('teams.remove-player');
    Route::post('set-captain', [TeamController::class, 'setCaptain'])->name('teams.set-captain');
    Route::post('process-payment', [TeamController::class, 'processSlotPayment'])
      ->middleware('wallet.balance')
      ->name('teams.process-payment');
    Route::get('payment-status/{playerId}', [TeamController::class, 'getPaymentStatus'])->name('teams.payment-status');
    Route::get('stats', [TeamController::class, 'getStats'])->name('teams.stats');
  });

  Route::prefix('game-matches/{gameMatch}')->group(function () {
    Route::get('events', [MatchEventController::class, 'index'])->name('game-matches.events.index');
  });

  Route::prefix('users/{user}')->group(function () {
    Route::get('turfs', [TurfController::class, 'index'])->name('users.turfs.index');
    Route::get('belonging-turfs', [UserController::class, 'belongingTurfs'])->name('users.belonging-turfs');
    Route::get('players', [PlayerController::class, 'index'])->name('users.players.index');
  });

  // Payment routes
  Route::prefix('payments')->name('payments.')->group(function () {
    Route::post('initialize', [App\Http\Controllers\Api\PaymentController::class, 'initialize'])->name('initialize');
    Route::post('verify', [App\Http\Controllers\Api\PaymentController::class, 'verify'])->name('verify');
    Route::get('history', [App\Http\Controllers\Api\PaymentController::class, 'history'])->name('history');
    Route::get('suggested-amount', [App\Http\Controllers\Api\PaymentController::class, 'suggestedAmount'])->name('suggested-amount');
    Route::get('{payment}', [App\Http\Controllers\Api\PaymentController::class, 'show'])->name('show');
    Route::post('{payment}/cancel', [App\Http\Controllers\Api\PaymentController::class, 'cancel'])->name('cancel');
  });

  // Wallet routes
  Route::prefix('wallet')->name('wallet.')->group(function () {
    Route::get('balance', [App\Http\Controllers\Api\WalletController::class, 'getBalance'])->name('balance');
    Route::get('transactions', [App\Http\Controllers\Api\WalletController::class, 'getTransactions'])->name('transactions');
    Route::post('deposit', [App\Http\Controllers\Api\WalletController::class, 'deposit'])->name('deposit');
    Route::post('withdraw', [App\Http\Controllers\Api\WalletController::class, 'withdraw'])
      ->middleware('wallet.balance')
      ->name('withdraw');
    Route::post('verify-transfer', [App\Http\Controllers\Api\WalletController::class, 'verifyTransfer'])->name('verify-transfer');

    // Turf wallet routes
    Route::get('turf/{turfId}/balance', [App\Http\Controllers\Api\WalletController::class, 'getTurfBalance'])->name('turf.balance');
    Route::get('turf/{turfId}/transactions', [App\Http\Controllers\Api\WalletController::class, 'getTurfTransactions'])->name('turf.transactions');
  });

  // Bank account routes
  Route::prefix('bank-accounts')->name('bank-accounts.')->group(function () {
    Route::get('banks', [App\Http\Controllers\Api\BankAccountController::class, 'getBanks'])->name('banks');
    Route::post('verify-account', [App\Http\Controllers\Api\BankAccountController::class, 'verifyAccount'])->name('verify-account');

    // User bank accounts
    Route::get('user', [App\Http\Controllers\Api\BankAccountController::class, 'getUserBankAccounts'])->name('user.index');
    Route::post('user', [App\Http\Controllers\Api\BankAccountController::class, 'addUserBankAccount'])->name('user.store');
    Route::delete('user/{bankAccountId}', [App\Http\Controllers\Api\BankAccountController::class, 'removeUserBankAccount'])->name('user.destroy');

    // Turf bank accounts
    Route::get('turf/{turfId}', [App\Http\Controllers\Api\BankAccountController::class, 'getTurfBankAccounts'])->name('turf.index');
    Route::post('turf/{turfId}', [App\Http\Controllers\Api\BankAccountController::class, 'addTurfBankAccount'])->name('turf.store');
  });

  Route::prefix('match-sessions/{matchSession}')->group(function () {
    Route::get('payment-stats', [App\Http\Controllers\Api\PaymentController::class, 'matchSessionStats'])->name('match-sessions.payment-stats');
  });
});
