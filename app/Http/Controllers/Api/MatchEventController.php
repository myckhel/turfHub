<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreMatchEventRequest;
use App\Http\Requests\UpdateMatchEventRequest;
use App\Http\Resources\MatchEventResource;
use App\Models\MatchEvent;
use App\Services\MatchEventService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class MatchEventController extends Controller
{
    use AuthorizesRequests;
    protected MatchEventService $matchEventService;

    public function __construct(MatchEventService $matchEventService)
    {
        $this->matchEventService = $matchEventService;
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $matchEvents = $this->matchEventService->getMatchEvents($request);

        return MatchEventResource::collection($matchEvents);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreMatchEventRequest $request): MatchEventResource
    {
        $this->authorize('create', MatchEvent::class);

        $matchEvent = $this->matchEventService->createMatchEvent($request->validated());

        return new MatchEventResource($matchEvent);
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, MatchEvent $matchEvent): MatchEventResource
    {
        $this->authorize('view', $matchEvent);

        $includes = [];
        if ($request->filled('include')) {
            $includes = explode(',', $request->include);
        }

        $matchEvent = $this->matchEventService->getMatchEventWithRelations($matchEvent, $includes);

        return new MatchEventResource($matchEvent);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateMatchEventRequest $request, MatchEvent $matchEvent): MatchEventResource
    {
        $this->authorize('update', $matchEvent);

        $matchEvent = $this->matchEventService->updateMatchEvent($matchEvent, $request->validated());

        return new MatchEventResource($matchEvent);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(MatchEvent $matchEvent): Response
    {
        $this->authorize('delete', $matchEvent);

        $this->matchEventService->deleteMatchEvent($matchEvent);

        return response()->noContent();
    }
}
