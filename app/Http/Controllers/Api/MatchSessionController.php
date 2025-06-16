<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\AddPlayerToTeamRequest;
use App\Http\Requests\SetGameResultRequest;
use App\Http\Requests\StoreMatchSessionRequest;
use App\Http\Requests\UpdateMatchSessionRequest;
use App\Http\Resources\MatchSessionResource;
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
     * Set result for a game match and trigger queue logic.
     */
    public function setGameResult(SetGameResultRequest $request, MatchSession $matchSession): MatchSessionResource
    {
        $this->authorize('setMatchResult', $matchSession);

        $matchSession = $this->matchSessionService->setGameMatchResult(
            $matchSession,
            $request->validated('game_match_id'),
            [
                'first_team_score' => $request->validated('first_team_score'),
                'second_team_score' => $request->validated('second_team_score'),
            ]
        );

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
}
