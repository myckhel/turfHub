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
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Public authentication routes
Route::prefix('auth')->group(function () {
  Route::post('/register', [AuthController::class, 'register']);
  Route::post('/login', [AuthController::class, 'login']);
  Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
  Route::post('/reset-password', [AuthController::class, 'resetPassword']);
  Route::get('/verify-email/{id}/{hash}', [AuthController::class, 'verifyEmail'])
    ->middleware(['signed', 'throttle:6,1'])
    ->name('api.verification.verify');
});

// Protected routes requiring authentication
Route::middleware('auth:sanctum')->group(function () {
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
    Route::get('match-sessions', [MatchSessionController::class, 'index'])->name('turfs.match-sessions.index');
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
    Route::get('game-matches', [GameMatchController::class, 'index'])->name('match-sessions.game-matches.index');
    Route::get('queue-logic', [QueueLogicController::class, 'index'])->name('match-sessions.queue-logic.index');
    Route::get('queue-status', [MatchSessionController::class, 'queueStatus'])->name('match-sessions.queue-status');

    // Match session management routes
    Route::post('start', [MatchSessionController::class, 'start'])->name('match-sessions.start');
    Route::post('stop', [MatchSessionController::class, 'stop'])->name('match-sessions.stop');
    Route::post('add-player-to-team', [MatchSessionController::class, 'addPlayerToTeam'])->name('match-sessions.add-player-to-team');
    Route::post('set-game-result', [MatchSessionController::class, 'setGameResult'])->name('match-sessions.set-game-result');
  });

  Route::prefix('teams/{team}')->group(function () {
    Route::get('players', [TeamPlayerController::class, 'index'])->name('teams.players.index');
    Route::get('game-matches', [GameMatchController::class, 'index'])->name('teams.game-matches.index');
  });

  Route::prefix('game-matches/{gameMatch}')->group(function () {
    Route::get('events', [MatchEventController::class, 'index'])->name('game-matches.events.index');
  });

  Route::prefix('users/{user}')->group(function () {
    Route::get('turfs', [TurfController::class, 'index'])->name('users.turfs.index');
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

  Route::prefix('match-sessions/{matchSession}')->group(function () {
    Route::get('payment-stats', [App\Http\Controllers\Api\PaymentController::class, 'matchSessionStats'])->name('match-sessions.payment-stats');
  });
});
