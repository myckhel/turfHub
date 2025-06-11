<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreMatchSessionRequest;
use App\Http\Requests\UpdateMatchSessionRequest;
use App\Http\Resources\MatchSessionResource;
use App\Models\MatchSession;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class MatchSessionController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = MatchSession::query();

        // Filter by turf
        if ($request->filled('turf_id')) {
            $query->where('turf_id', $request->turf_id);
        }

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Filter by active sessions
        if ($request->filled('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        // Filter by time slot
        if ($request->filled('time_slot')) {
            $query->where('time_slot', $request->time_slot);
        }

        // Filter by date range
        if ($request->filled('date_from')) {
            $query->where('session_date', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->where('session_date', '<=', $request->date_to);
        }

        // Search by name
        if ($request->filled('search')) {
            $query->where('name', 'LIKE', "%{$request->search}%");
        }

        // Load relationships if requested
        if ($request->filled('include')) {
            $includes = explode(',', $request->include);
            $allowedIncludes = ['turf', 'teams', 'gameMatches', 'queueLogic'];
            $validIncludes = array_intersect($includes, $allowedIncludes);

            if (!empty($validIncludes)) {
                $query->with($validIncludes);
            }
        }

        $matchSessions = $query->paginate($request->get('per_page', 15));

        return MatchSessionResource::collection($matchSessions);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreMatchSessionRequest $request): MatchSessionResource
    {
        $matchSession = MatchSession::create($request->validated());

        return new MatchSessionResource($matchSession);
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, MatchSession $matchSession): MatchSessionResource
    {
        // Load relationships if requested
        if ($request->filled('include')) {
            $includes = explode(',', $request->include);
            $allowedIncludes = ['turf', 'teams', 'gameMatches', 'queueLogic'];
            $validIncludes = array_intersect($includes, $allowedIncludes);

            if (!empty($validIncludes)) {
                $matchSession->load($validIncludes);
            }
        }

        return new MatchSessionResource($matchSession);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateMatchSessionRequest $request, MatchSession $matchSession): MatchSessionResource
    {
        $matchSession->update($request->validated());

        return new MatchSessionResource($matchSession);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(MatchSession $matchSession): Response
    {
        $matchSession->delete();

        return response()->noContent();
    }
}
