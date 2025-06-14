<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreMatchSessionRequest;
use App\Http\Requests\UpdateMatchSessionRequest;
use App\Http\Resources\MatchSessionResource;
use App\Models\MatchSession;
use App\Services\MatchSessionService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class MatchSessionController extends Controller
{
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
        $matchSessions = $this->matchSessionService->getMatchSessions($request);

        return MatchSessionResource::collection($matchSessions);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreMatchSessionRequest $request): MatchSessionResource
    {
        $matchSession = $this->matchSessionService->createMatchSession($request->validated());

        return new MatchSessionResource($matchSession);
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, MatchSession $matchSession): MatchSessionResource
    {
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
        $matchSession = $this->matchSessionService->updateMatchSession($matchSession, $request->validated());

        return new MatchSessionResource($matchSession);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(MatchSession $matchSession): Response
    {
        $this->matchSessionService->deleteMatchSession($matchSession);

        return response()->noContent();
    }
}
