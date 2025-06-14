<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTeamPlayerRequest;
use App\Http\Requests\UpdateTeamPlayerRequest;
use App\Http\Resources\TeamPlayerResource;
use App\Models\TeamPlayer;
use App\Services\TeamPlayerService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class TeamPlayerController extends Controller
{
    protected TeamPlayerService $teamPlayerService;

    public function __construct(TeamPlayerService $teamPlayerService)
    {
        $this->teamPlayerService = $teamPlayerService;
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $teamPlayers = $this->teamPlayerService->getTeamPlayers($request);

        return TeamPlayerResource::collection($teamPlayers);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreTeamPlayerRequest $request): TeamPlayerResource
    {
        $teamPlayer = $this->teamPlayerService->createTeamPlayer($request->validated());

        return new TeamPlayerResource($teamPlayer);
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, TeamPlayer $teamPlayer): TeamPlayerResource
    {
        $includes = [];
        if ($request->filled('include')) {
            $includes = explode(',', $request->include);
        }

        $teamPlayer = $this->teamPlayerService->getTeamPlayerWithRelations($teamPlayer, $includes);

        return new TeamPlayerResource($teamPlayer);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateTeamPlayerRequest $request, TeamPlayer $teamPlayer): TeamPlayerResource
    {
        $teamPlayer = $this->teamPlayerService->updateTeamPlayer($teamPlayer, $request->validated());

        return new TeamPlayerResource($teamPlayer);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(TeamPlayer $teamPlayer): Response
    {
        $this->teamPlayerService->deleteTeamPlayer($teamPlayer);

        return response()->noContent();
    }
}
