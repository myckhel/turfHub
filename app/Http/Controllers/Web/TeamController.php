<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Http\Resources\MatchSessionResource;
use App\Http\Resources\TeamResource;
use App\Models\MatchSession;
use App\Models\Team;
use App\Models\Turf;
use App\Services\TeamService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Inertia\Inertia;
use Inertia\Response;

class TeamController extends Controller
{
  use AuthorizesRequests;

  protected TeamService $teamService;

  public function __construct(TeamService $teamService)
  {
    $this->teamService = $teamService;
  }

  /**
   * Display teams for a match session.
   */
  public function index(Turf $turf, MatchSession $matchSession): Response
  {
    $this->authorize('view', $matchSession);

    // Ensure the match session belongs to the turf
    if ($matchSession->turf_id !== $turf->id) {
      abort(404);
    }

    $teams = $matchSession->teams()
      ->with(['captain', 'teamPlayers.player.user', 'matchSession'])
      ->get();

    return Inertia::render('App/Teams/Index', [
      'turf' => $turf->load(['owner']),
      'matchSession' => new MatchSessionResource($matchSession),
      'teams' => TeamResource::collection($teams),
    ]);
  }

  /**
   * Display the specified team.
   */
  public function show(Turf $turf, MatchSession $matchSession, Team $team): Response
  {
    $this->authorize('view', $team);

    // Ensure the team belongs to the match session and turf
    if ($team->match_session_id !== $matchSession->id || $matchSession->turf_id !== $turf->id) {
      abort(404);
    }

    $team->load([
      'captain',
      'teamPlayers.player.user',
      'matchSession.turf',
      'gameMatchesAsFirstTeam',
      'gameMatchesAsSecondTeam'
    ]);

    return Inertia::render('App/Teams/Show', [
      'turf' => $turf->load(['owner']),
      'matchSession' => $matchSession,
      'team' => new TeamResource($team),
    ]);
  }
}
