<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreGameMatchRequest;
use App\Http\Requests\UpdateGameMatchRequest;
use App\Http\Resources\GameMatchResource;
use App\Models\GameMatch;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class GameMatchController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = GameMatch::query();

        // Filter by match session
        if ($request->filled('match_session_id')) {
            $query->where('match_session_id', $request->match_session_id);
        }

        // Filter by team (first or second team)
        if ($request->filled('team_id')) {
            $query->where(function ($q) use ($request) {
                $q->where('first_team_id', $request->team_id)
                  ->orWhere('second_team_id', $request->team_id);
            });
        }

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Filter by outcome
        if ($request->filled('outcome')) {
            $query->where('outcome', $request->outcome);
        }

        // Filter by date range
        if ($request->filled('date_from')) {
            $query->where('match_time', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->where('match_time', '<=', $request->date_to);
        }

        // Load relationships if requested
        if ($request->filled('include')) {
            $includes = explode(',', $request->include);
            $allowedIncludes = ['matchSession', 'firstTeam', 'secondTeam', 'winningTeam', 'matchEvents'];
            $validIncludes = array_intersect($includes, $allowedIncludes);

            if (!empty($validIncludes)) {
                $query->with($validIncludes);
            }
        }

        $gameMatches = $query->orderBy('match_time', 'desc')->paginate($request->get('per_page', 15));

        return GameMatchResource::collection($gameMatches);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreGameMatchRequest $request): GameMatchResource
    {
        $gameMatch = GameMatch::create($request->validated());

        return new GameMatchResource($gameMatch);
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, GameMatch $gameMatch): GameMatchResource
    {
        // Load relationships if requested
        if ($request->filled('include')) {
            $includes = explode(',', $request->include);
            $allowedIncludes = ['matchSession', 'firstTeam', 'secondTeam', 'winningTeam', 'matchEvents'];
            $validIncludes = array_intersect($includes, $allowedIncludes);

            if (!empty($validIncludes)) {
                $gameMatch->load($validIncludes);
            }
        }

        return new GameMatchResource($gameMatch);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateGameMatchRequest $request, GameMatch $gameMatch): GameMatchResource
    {
        $gameMatch->update($request->validated());

        return new GameMatchResource($gameMatch);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(GameMatch $gameMatch): Response
    {
        $gameMatch->delete();

        return response()->noContent();
    }
}
