<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePlayerRequest;
use App\Http\Requests\UpdatePlayerRequest;
use App\Http\Requests\JoinTeamRequest;
use App\Http\Requests\LeaveTeamRequest;
use App\Http\Resources\PlayerResource;
use App\Http\Resources\MatchSessionResource;
use App\Http\Resources\TeamResource;
use App\Models\Player;
use App\Models\MatchSession;
use App\Models\Team;
use App\Services\PlayerService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;

class PlayerController extends Controller
{
    use AuthorizesRequests;

    protected PlayerService $playerService;

    public function __construct(PlayerService $playerService)
    {
        $this->playerService = $playerService;
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Player::class);

        $players = $this->playerService->getPlayers($request);

        return PlayerResource::collection($players);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StorePlayerRequest $request): PlayerResource
    {
        $this->authorize('create', Player::class);

        $player = $this->playerService->createPlayer($request->validated());

        return new PlayerResource($player);
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, Player $player): PlayerResource
    {
        $this->authorize('view', $player);

        $includes = [];
        if ($request->filled('include')) {
            $includes = explode(',', $request->include);
        }

        $player = $this->playerService->getPlayerWithRelations($player, $includes);

        return new PlayerResource($player);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdatePlayerRequest $request, Player $player): PlayerResource
    {
        $this->authorize('update', $player);

        $player = $this->playerService->updatePlayer($player, $request->validated());

        return new PlayerResource($player);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Player $player): Response
    {
        $this->authorize('delete', $player);

        $this->playerService->deletePlayer($player);

        return response()->noContent();
    }

    /**
     * Get active and scheduled match sessions for a player's turf.
     * This implements the "Sees active/scheduled match sessions" part of the player flow.
     */
    public function matchSessions(Player $player): AnonymousResourceCollection
    {
        $this->authorize('viewMatchSessions', $player);

        $matchSessions = $this->playerService->getAvailableMatchSessions($player);

        return MatchSessionResource::collection($matchSessions);
    }

    /**
     * Get available teams that a player can join in a match session.
     * This supports the "Pays to join a team slot" part of the player flow.
     */
    public function availableTeams(Player $player, MatchSession $matchSession): AnonymousResourceCollection
    {
        $this->authorize('joinTeam', $player);
        $this->authorize('view', $matchSession);

        $teams = $this->playerService->getAvailableTeams($player, $matchSession);

        return TeamResource::collection($teams);
    }

    /**
     * Join a team in a match session.
     * This implements the core "Joins a team slot in-app; pays online" functionality.
     */
    public function joinTeam(JoinTeamRequest $request, Player $player): JsonResponse
    {
        $this->authorize('joinTeam', $player);

        $matchSession = MatchSession::findOrFail($request->validated('match_session_id'));
        $team = $request->validated('team_id') ? Team::findOrFail($request->validated('team_id')) : null;

        // Verify the team belongs to the match session if provided
        if ($team && $team->match_session_id !== $matchSession->id) {
            return response()->json([
                'error' => 'Team does not belong to the specified match session'
            ], 400);
        }

        try {
            $result = $this->playerService->joinTeamSlot($player, $matchSession, $team, $request->validated('payment_amount'));

            return response()->json([
                'message' => 'Successfully joined team slot',
                'data' => $result,
            ]);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to join team slot'], 500);
        }
    }

    /**
     * Leave a team in a match session.
     * This allows players to leave before the match starts.
     */
    public function leaveTeam(LeaveTeamRequest $request, Player $player): JsonResponse
    {
        $team = Team::findOrFail($request->validated('team_id'));
        $this->authorize('leave', $team);

        try {
            $this->playerService->leaveTeam($player, $team);

            return response()->json([
                'message' => 'Successfully left the team',
            ]);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to leave team'], 500);
        }
    }

    /**
     * Get player's current team status in active match sessions.
     * This helps players track their current game state.
     */
    public function currentTeamStatus(Player $player): JsonResponse
    {
        $this->authorize('view', $player);

        $status = $this->playerService->getCurrentTeamStatus($player);

        return response()->json([
            'data' => $status,
            'message' => 'Current team status retrieved successfully'
        ]);
    }

    /**
     * Get payment history for a player in their turf.
     * This allows players to see their payment history.
     */
    public function paymentHistory(Request $request, Player $player): JsonResponse
    {
        $this->authorize('view', $player);

        $payments = $this->playerService->getPlayerPaymentHistory($player, $request);

        return response()->json([
            'data' => $payments,
            'message' => 'Payment history retrieved successfully'
        ]);
    }

    /**
     * Check if a player can join a specific team.
     * This helps with frontend validation before payment.
     */
    public function canJoinTeam(Request $request, Player $player): JsonResponse
    {
        $this->authorize('joinTeam', $player);

        $request->validate([
            'match_session_id' => 'required|exists:match_sessions,id',
            'team_id' => 'nullable|exists:teams,id',
        ]);

        $matchSession = MatchSession::findOrFail($request->match_session_id);
        $team = $request->team_id ? Team::findOrFail($request->team_id) : null;

        try {
            $canJoin = $this->playerService->canPlayerJoinTeam($player, $matchSession, $team);

            return response()->json([
                'can_join' => $canJoin['can_join'],
                'reason' => $canJoin['reason'] ?? null,
                'available_slots' => $canJoin['available_slots'] ?? null,
            ]);
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'can_join' => false,
                'reason' => $e->getMessage(),
            ], 400);
        }
    }
}
