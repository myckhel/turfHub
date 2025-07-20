<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Http\Resources\MatchSessionResource;
use App\Http\Resources\TurfResource;
use App\Models\MatchSession;
use App\Models\Turf;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Inertia\Inertia;
use Inertia\Response;

class MatchSessionController extends Controller
{
  use AuthorizesRequests;
  /**
   * Display a listing of match sessions for a turf.
   */
  public function index(Turf $turf): Response
  {
    $this->authorize('view', $turf);

    return Inertia::render('App/MatchSessions/Index', [
      'turf' => new TurfResource($turf->load(['owner'])),
    ]);
  }

  /**
   * Show the form for creating a new match session.
   */
  public function create(Turf $turf): Response
  {
    $this->authorize('manageMatchSessions', $turf);

    return Inertia::render('App/MatchSessions/Create', [
      'turf' => new TurfResource($turf->load(['owner'])),
    ]);
  }

  /**
   * Display the specified match session.
   */
  public function show(Turf $turf, MatchSession $matchSession): Response
  {
    $this->authorize('view', $matchSession);

    // Ensure the match session belongs to the turf
    if ($matchSession->turf_id !== $turf->id) {
      abort(404);
    }

    return Inertia::render('App/MatchSessions/Show', [
      'turf' => new TurfResource($turf->load(['owner'])),
      'matchSession' => new MatchSessionResource($matchSession->load([
        'turf',
        'teams.teamPlayers.player.user',
        'gameMatches.firstTeam.teamPlayers.player.user',
        'gameMatches.secondTeam.teamPlayers.player.user',
        'gameMatches.winningTeam',
        'gameMatches.matchEvents.player.user',
        'gameMatches.matchEvents.team',
        'gameMatches.matchEvents.relatedPlayer.user',
        'queueLogic.team'
      ])),
    ]);
  }

  /**
   * Show the form for editing the specified match session.
   */
  public function edit(Turf $turf, MatchSession $matchSession): Response
  {
    $this->authorize('update', $matchSession);

    // Ensure the match session belongs to the turf
    if ($matchSession->turf_id !== $turf->id) {
      abort(404);
    }

    return Inertia::render('App/MatchSessions/Edit', [
      'turf' => new TurfResource($turf->load(['owner'])),
      'matchSession' => $matchSession,
    ]);
  }
}
