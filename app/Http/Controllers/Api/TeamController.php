<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTeamRequest;
use App\Http\Requests\UpdateTeamRequest;
use App\Http\Resources\TeamResource;
use App\Models\Team;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class TeamController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Team::query();

        // Filter by match session
        if ($request->filled('match_session_id')) {
            $query->where('match_session_id', $request->match_session_id);
        }

        // Filter by captain
        if ($request->filled('captain_id')) {
            $query->where('captain_id', $request->captain_id);
        }

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Search by name
        if ($request->filled('search')) {
            $query->where('name', 'LIKE', "%{$request->search}%");
        }

        // Load relationships if requested
        if ($request->filled('include')) {
            $includes = explode(',', $request->include);
            $allowedIncludes = ['matchSession', 'captain', 'teamPlayers', 'gameMatchesAsFirstTeam', 'gameMatchesAsSecondTeam'];
            $validIncludes = array_intersect($includes, $allowedIncludes);

            if (!empty($validIncludes)) {
                $query->with($validIncludes);
            }
        }

        $teams = $query->paginate($request->get('per_page', 15));

        return TeamResource::collection($teams);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreTeamRequest $request): TeamResource
    {
        $team = Team::create($request->validated());

        return new TeamResource($team);
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, Team $team): TeamResource
    {
        // Load relationships if requested
        if ($request->filled('include')) {
            $includes = explode(',', $request->include);
            $allowedIncludes = ['matchSession', 'captain', 'teamPlayers', 'gameMatchesAsFirstTeam', 'gameMatchesAsSecondTeam'];
            $validIncludes = array_intersect($includes, $allowedIncludes);

            if (!empty($validIncludes)) {
                $team->load($validIncludes);
            }
        }

        return new TeamResource($team);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateTeamRequest $request, Team $team): TeamResource
    {
        $team->update($request->validated());

        return new TeamResource($team);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Team $team): Response
    {
        $team->delete();

        return response()->noContent();
    }
}
