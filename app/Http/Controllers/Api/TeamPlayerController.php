<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTeamPlayerRequest;
use App\Http\Requests\UpdateTeamPlayerRequest;
use App\Http\Resources\TeamPlayerResource;
use App\Models\TeamPlayer;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class TeamPlayerController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = TeamPlayer::query();

        // Filter by team
        if ($request->filled('team_id')) {
            $query->where('team_id', $request->team_id);
        }

        // Filter by player
        if ($request->filled('player_id')) {
            $query->where('player_id', $request->player_id);
        }

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Load relationships if requested
        if ($request->filled('include')) {
            $includes = explode(',', $request->include);
            $allowedIncludes = ['team', 'player'];
            $validIncludes = array_intersect($includes, $allowedIncludes);

            if (!empty($validIncludes)) {
                $query->with($validIncludes);
            }
        }

        $teamPlayers = $query->orderBy('join_time', 'asc')->paginate($request->get('per_page', 15));

        return TeamPlayerResource::collection($teamPlayers);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreTeamPlayerRequest $request): TeamPlayerResource
    {
        $teamPlayer = TeamPlayer::create($request->validated());

        return new TeamPlayerResource($teamPlayer);
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, TeamPlayer $teamPlayer): TeamPlayerResource
    {
        // Load relationships if requested
        if ($request->filled('include')) {
            $includes = explode(',', $request->include);
            $allowedIncludes = ['team', 'player'];
            $validIncludes = array_intersect($includes, $allowedIncludes);

            if (!empty($validIncludes)) {
                $teamPlayer->load($validIncludes);
            }
        }

        return new TeamPlayerResource($teamPlayer);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateTeamPlayerRequest $request, TeamPlayer $teamPlayer): TeamPlayerResource
    {
        $teamPlayer->update($request->validated());

        return new TeamPlayerResource($teamPlayer);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(TeamPlayer $teamPlayer): Response
    {
        $teamPlayer->delete();

        return response()->noContent();
    }
}
