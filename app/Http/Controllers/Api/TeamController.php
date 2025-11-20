<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTeamRequest;
use App\Http\Requests\UpdateTeamRequest;
use App\Http\Resources\TeamResource;
use App\Models\Team;
use App\Services\TeamService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;

class TeamController extends Controller
{
  use AuthorizesRequests;

  protected TeamService $teamService;

  public function __construct(TeamService $teamService)
  {
    $this->teamService = $teamService;
  }

  /**
   * Display a listing of the resource.
   */
  public function index(Request $request): AnonymousResourceCollection
  {
    $this->authorize('viewAny', Team::class);

    $teams = $this->teamService->getTeams($request);

    return TeamResource::collection($teams);
  }

  /**
   * Store a newly created resource in storage.
   */
  public function store(StoreTeamRequest $request): TeamResource
  {
    $this->authorize('create', Team::class);

    $team = $this->teamService->createTeam($request->validated());

    return new TeamResource($team);
  }

  /**
   * Display the specified resource.
   */
  public function show(Request $request, Team $team): TeamResource
  {
    $this->authorize('view', $team);

    $includes = [];
    if ($request->filled('include')) {
      $includes = explode(',', $request->include);
    }

    $team = $this->teamService->getTeamWithRelations($team, $includes);

    return new TeamResource($team);
  }

  /**
   * Update the specified resource in storage.
   */
  public function update(UpdateTeamRequest $request, Team $team): TeamResource
  {
    $this->authorize('update', $team);

    $team = $this->teamService->updateTeam($team, $request->validated());

    return new TeamResource($team);
  }

  /**
   * Remove the specified resource from storage.
   */
  public function destroy(Team $team): Response
  {
    $this->authorize('delete', $team);

    $this->teamService->deleteTeam($team);

    return response()->noContent();
  }

  /**
   * Join a team slot (for players).
   */
  public function joinSlot(Request $request, Team $team): JsonResponse
  {
    $this->authorize('joinSlot', $team);

    try {
      $userId = Auth::user()->id;

      // Get turf from either match session or tournament
      $turf = $team->match_session_id
        ? $team->matchSession->turf
        : $team->tournament->turf;

      $playerId = $turf->players()
        ->where('user_id', $userId)
        ->value('id');

      $this->teamService->joinTeamSlot($team, $playerId, $request->get('position'));

      return response()->json([
        'message' => 'Successfully joined team slot'
      ]);
    } catch (\InvalidArgumentException $e) {
      return response()->json(['error' => $e->getMessage()], 400);
    }
  }

  /**
   * Leave a team slot (for players).
   */
  public function leaveSlot(Team $team): JsonResponse
  {
    $this->authorize('leaveSlot', $team);

    try {
      $userId = Auth::user()->id;

      // Get turf from either match session or tournament
      $turf = $team->match_session_id
        ? $team->matchSession->turf
        : $team->tournament->turf;

      $playerId = $turf->players()
        ->where('user_id', $userId)
        ->value('id');

      $this->teamService->leaveTeamSlot($team, $playerId);

      return response()->json([
        'message' => 'Successfully left team slot'
      ]);
    } catch (\InvalidArgumentException $e) {
      return response()->json(['error' => $e->getMessage()], 400);
    }
  }

  /**
   * Add player to team slot (for admins/managers).
   */
  public function addPlayerToSlot(Request $request, Team $team): JsonResponse
  {
    $this->authorize('addPlayerToSlot', $team);

    $request->validate([
      'player_id' => 'required|exists:players,id',
      'position' => 'sometimes|integer|min:1|max:6',
      'is_captain' => 'sometimes|boolean'
    ]);

    try {
      $this->teamService->addPlayerToTeamSlot(
        $team,
        $request->get('player_id'),
        $request->get('position'),
        $request->get('is_captain', false)
      );

      return response()->json([
        'message' => 'Player added to team slot successfully'
      ]);
    } catch (\InvalidArgumentException $e) {
      return response()->json(['error' => $e->getMessage()], 400);
    }
  }

  /**
   * Remove player from team slot (for admins/managers).
   */
  public function removePlayerFromSlot(Team $team, int $playerId): JsonResponse
  {
    $this->authorize('removePlayerFromSlot', $team);

    try {
      $this->teamService->removePlayerFromTeamSlot($team, $playerId);

      return response()->json([
        'message' => 'Player removed from team slot successfully'
      ]);
    } catch (\InvalidArgumentException $e) {
      return response()->json(['error' => $e->getMessage()], 400);
    }
  }

  /**
   * Set team captain.
   */
  public function setCaptain(Request $request, Team $team): JsonResponse
  {
    $this->authorize('setCaptain', $team);

    $request->validate([
      'player_id' => 'required|exists:players,id'
    ]);

    try {
      $this->teamService->setCaptain($team, $request->get('player_id'));

      return response()->json([
        'message' => 'Team captain set successfully'
      ]);
    } catch (\InvalidArgumentException $e) {
      return response()->json(['error' => $e->getMessage()], 400);
    }
  }

  /**
   * Process payment for team slot.
   */
  public function processSlotPayment(Request $request, Team $team): JsonResponse
  {
    $this->authorize('processSlotPayment', $team);

    $request->validate([
      'position' => 'required|integer|min:1|max:6',
      'payment_method' => 'required|in:paystack,wallet',
    ]);

    try {
      $paymentResponse = $this->teamService->processTeamSlotPayment(
        $team,
        Auth::user()->id,
        $request->get('position'),
        $request->get('payment_method'),
      );

      return response()->json($paymentResponse);
    } catch (\InvalidArgumentException $e) {
      return response()->json(['error' => $e->getMessage()], 400);
    }
  }

  /**
   * Get payment status for a slot.
   */
  public function getPaymentStatus(Team $team, int $playerId): JsonResponse
  {
    $this->authorize('view', $team);

    $status = $this->teamService->getTeamSlotPaymentStatus($team, $playerId);

    return response()->json($status);
  }

  /**
   * Get team statistics.
   */
  public function getStats(Team $team): JsonResponse
  {
    $this->authorize('view', $team);

    $stats = $this->teamService->getTeamStats($team);

    return response()->json($stats);
  }
}
