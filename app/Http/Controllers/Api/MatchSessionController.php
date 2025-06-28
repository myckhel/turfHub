<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\AddPlayerToTeamRequest;
use App\Http\Requests\SetGameResultRequest;
use App\Http\Requests\StoreMatchSessionRequest;
use App\Http\Requests\UpdateMatchSessionRequest;
use App\Http\Resources\GameMatchResource;
use App\Http\Resources\MatchSessionResource;
use App\Http\Resources\PlayerResource;
use App\Models\MatchSession;
use App\Services\MatchSessionService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class MatchSessionController extends Controller
{
  use AuthorizesRequests;

  protected MatchSessionService $matchSessionService;

  public function __construct(MatchSessionService $matchSessionService)
  {
    $this->matchSessionService = $matchSessionService;
  }

  /**
   * Display a listing of the resource.
   */
  public function index(Request $request): AnonymousResourceCollection
  {
    $this->authorize('viewAny', MatchSession::class);

    $matchSessions = $this->matchSessionService->getMatchSessions($request);

    return MatchSessionResource::collection($matchSessions);
  }

  /**
   * Store a newly created resource in storage.
   */
  public function store(StoreMatchSessionRequest $request): MatchSessionResource
  {
    $this->authorize('create', MatchSession::class);

    $matchSession = $this->matchSessionService->createMatchSessionWithTeams($request->validated());

    return new MatchSessionResource($matchSession);
  }

  /**
   * Display the specified resource.
   */
  public function show(Request $request, MatchSession $matchSession): MatchSessionResource
  {
    $this->authorize('view', $matchSession);

    $includes = [];
    if ($request->filled('include')) {
      $includes = explode(',', $request->include);
    }

    $matchSession = $this->matchSessionService->getMatchSessionWithRelations($matchSession, $includes);

    return new MatchSessionResource($matchSession);
  }

  /**
   * Update the specified resource in storage.
   */
  public function update(UpdateMatchSessionRequest $request, MatchSession $matchSession): MatchSessionResource
  {
    $this->authorize('update', $matchSession);

    $matchSession = $this->matchSessionService->updateMatchSession($matchSession, $request->validated());

    return new MatchSessionResource($matchSession);
  }

  /**
   * Remove the specified resource from storage.
   */
  public function destroy(MatchSession $matchSession): Response
  {
    $this->authorize('delete', $matchSession);

    $this->matchSessionService->deleteMatchSession($matchSession);

    return response()->noContent();
  }

  /**
   * Add a player to a team in the match session.
   */
  public function addPlayerToTeam(AddPlayerToTeamRequest $request, MatchSession $matchSession): JsonResponse
  {
    $this->authorize('addPlayersToTeam', $matchSession);

    try {
      $this->matchSessionService->addPlayerToTeam(
        $matchSession,
        $request->validated('team_id'),
        $request->validated('player_id')
      );

      return response()->json(['message' => 'Player added to team successfully']);
    } catch (\InvalidArgumentException $e) {
      return response()->json(['error' => $e->getMessage()], 400);
    }
  }

  /**
   * Start a match session.
   */
  public function start(MatchSession $matchSession): MatchSessionResource
  {
    $this->authorize('start', $matchSession);

    $matchSession = $this->matchSessionService->startMatchSession($matchSession);

    return new MatchSessionResource($matchSession);
  }

  /**
   * Stop a match session.
   */
  public function stop(MatchSession $matchSession): MatchSessionResource
  {
    $this->authorize('stop', $matchSession);

    $matchSession = $this->matchSessionService->stopMatchSession($matchSession);

    return new MatchSessionResource($matchSession);
  }

  /**
   * Get queue status for a match session.
   */
  public function queueStatus(MatchSession $matchSession): JsonResponse
  {
    $this->authorize('view', $matchSession);

    $queueStatus = $this->matchSessionService->getQueueStatus($matchSession);

    return response()->json([
      'data' => $queueStatus,
      'message' => 'Queue status retrieved successfully'
    ]);
  }

  /**
   * Get available team slots for a match session.
   */
  public function getAvailableSlots(MatchSession $matchSession): JsonResponse
  {
    $this->authorize('view', $matchSession);

    $teams = $matchSession->teams()
      ->with(['teamPlayers.player.user', 'captain'])
      ->get();

    $totalSlots = $matchSession->max_teams * $matchSession->max_players_per_team;
    $occupiedSlots = $teams->sum(function ($team) {
      return $team->teamPlayers->count();
    });
    $availableSlots = $totalSlots - $occupiedSlots;

    $response = [
      'teams' => \App\Http\Resources\TeamResource::collection($teams),
      'total_slots' => $totalSlots,
      'available_slots' => $availableSlots,
      'slot_fee' => $matchSession->turf->team_slot_fee ?? 0,
      'max_players_per_team' => $matchSession->max_players_per_team,
    ];

    return response()->json([
      'data' => $response,
      'message' => 'Available slots retrieved successfully'
    ]);
  }

  /**
   * Get available players for a match session.
   * Can filter unassigned players and search by name.
   */
  public function getAvailablePlayers(Request $request, MatchSession $matchSession): JsonResponse
  {
    $this->authorize('view', $matchSession);

    $query = $matchSession->turf->players()->with('user');

    // Filter by unassigned players if requested
    if ($request->boolean('filter_unassigned', false)) {
      // Get players that are NOT in any team for this match session
      $assignedPlayerIds = $matchSession->teams()
        ->with('teamPlayers')
        ->get()
        ->pluck('teamPlayers')
        ->flatten()
        ->pluck('player_id')
        ->unique()
        ->toArray();

      if (!empty($assignedPlayerIds)) {
        $query->whereNotIn('id', $assignedPlayerIds);
      }
    }

    // Search by player name if provided
    if ($request->filled('search')) {
      $searchTerm = $request->input('search');
      $query->whereHas('user', function ($userQuery) use ($searchTerm) {
        $userQuery->where('name', 'LIKE', "%{$searchTerm}%");
      });
    }

    // Only include active players
    $query->where('status', 'active');

    $players = $query->get();

    return response()->json([
      'data' => PlayerResource::collection($players),
      'message' => 'Available players retrieved successfully'
    ]);
  }

  public function getGameMatches(Request $request, MatchSession $matchSession): JsonResponse
  {
    $this->authorize('view', $matchSession);

    $gameMatches = $this->matchSessionService->getGameMatches($request, $matchSession);

    return response()->json([
      'data' => GameMatchResource::collection($gameMatches),
      'message' => 'Game matches retrieved successfully'
    ]);
  }
}
