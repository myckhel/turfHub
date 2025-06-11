<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreMatchEventRequest;
use App\Http\Requests\UpdateMatchEventRequest;
use App\Http\Resources\MatchEventResource;
use App\Models\MatchEvent;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class MatchEventController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = MatchEvent::query();

        // Filter by game match
        if ($request->filled('game_match_id')) {
            $query->where('game_match_id', $request->game_match_id);
        }

        // Filter by player
        if ($request->filled('player_id')) {
            $query->where('player_id', $request->player_id);
        }

        // Filter by team
        if ($request->filled('team_id')) {
            $query->where('team_id', $request->team_id);
        }

        // Filter by event type
        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        // Filter by minute range
        if ($request->filled('minute_from')) {
            $query->where('minute', '>=', $request->minute_from);
        }

        if ($request->filled('minute_to')) {
            $query->where('minute', '<=', $request->minute_to);
        }

        // Load relationships if requested
        if ($request->filled('include')) {
            $includes = explode(',', $request->include);
            $allowedIncludes = ['gameMatch', 'player', 'team', 'relatedPlayer'];
            $validIncludes = array_intersect($includes, $allowedIncludes);

            if (!empty($validIncludes)) {
                $query->with($validIncludes);
            }
        }

        $matchEvents = $query->orderBy('minute', 'asc')->paginate($request->get('per_page', 15));

        return MatchEventResource::collection($matchEvents);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreMatchEventRequest $request): MatchEventResource
    {
        $matchEvent = MatchEvent::create($request->validated());

        return new MatchEventResource($matchEvent);
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, MatchEvent $matchEvent): MatchEventResource
    {
        // Load relationships if requested
        if ($request->filled('include')) {
            $includes = explode(',', $request->include);
            $allowedIncludes = ['gameMatch', 'player', 'team', 'relatedPlayer'];
            $validIncludes = array_intersect($includes, $allowedIncludes);

            if (!empty($validIncludes)) {
                $matchEvent->load($validIncludes);
            }
        }

        return new MatchEventResource($matchEvent);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateMatchEventRequest $request, MatchEvent $matchEvent): MatchEventResource
    {
        $matchEvent->update($request->validated());

        return new MatchEventResource($matchEvent);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(MatchEvent $matchEvent): Response
    {
        $matchEvent->delete();

        return response()->noContent();
    }
}
