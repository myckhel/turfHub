<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTeamRequest;
use App\Http\Requests\UpdateTeamRequest;
use App\Http\Resources\TeamResource;
use App\Models\Team;
use App\Services\TeamService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class TeamController extends Controller
{
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
        $teams = $this->teamService->getTeams($request);

        return TeamResource::collection($teams);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreTeamRequest $request): TeamResource
    {
        $team = $this->teamService->createTeam($request->validated());

        return new TeamResource($team);
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, Team $team): TeamResource
    {
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
        $team = $this->teamService->updateTeam($team, $request->validated());

        return new TeamResource($team);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Team $team): Response
    {
        $this->teamService->deleteTeam($team);

        return response()->noContent();
    }
}
