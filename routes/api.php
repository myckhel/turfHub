<?php

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

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

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

Route::prefix('match-sessions/{matchSession}')->group(function () {
    Route::get('teams', [TeamController::class, 'index'])->name('match-sessions.teams.index');
    Route::get('game-matches', [GameMatchController::class, 'index'])->name('match-sessions.game-matches.index');
    Route::get('queue-logic', [QueueLogicController::class, 'index'])->name('match-sessions.queue-logic.index');
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
