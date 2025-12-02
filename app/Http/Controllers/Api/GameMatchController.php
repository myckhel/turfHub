<?php

namespace App\Http\Controllers\Api;

use App\Events\MatchCompleted;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreGameMatchRequest;
use App\Http\Requests\Tournament\SubmitMatchResultRequest;
use App\Http\Requests\UpdateGameMatchRequest;
use App\Http\Resources\GameMatchResource;
use App\Models\GameMatch;
use App\Services\GameMatchService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class GameMatchController extends Controller
{
  use AuthorizesRequests;
  protected GameMatchService $gameMatchService;

  public function __construct(GameMatchService $gameMatchService)
  {
    $this->gameMatchService = $gameMatchService;
  }

  /**
   * Display a listing of the resource.
   */
  public function index(Request $request): AnonymousResourceCollection
  {
    $gameMatches = $this->gameMatchService->getGameMatches($request);

    return GameMatchResource::collection($gameMatches);
  }

  /**
   * Store a newly created resource in storage.
   */
  public function store(StoreGameMatchRequest $request): GameMatchResource
  {
    $gameMatch = $this->gameMatchService->createGameMatch($request->validated());

    return new GameMatchResource($gameMatch);
  }

  /**
   * Display the specified resource.
   */
  public function show(Request $request, GameMatch $gameMatch): GameMatchResource
  {
    $this->authorize('view', $gameMatch);

    $includes = [];
    if ($request->filled('include')) {
      $includes = explode(',', $request->include);
    }

    $gameMatch = $this->gameMatchService->getGameMatchWithRelations($gameMatch, $includes);

    return new GameMatchResource($gameMatch);
  }

  /**
   * Update the specified resource in storage.
   */
  public function update(UpdateGameMatchRequest $request, GameMatch $gameMatch): GameMatchResource
  {
    $this->authorize('update', $gameMatch);

    $gameMatch = $this->gameMatchService->updateGameMatch($gameMatch, $request->validated());

    return new GameMatchResource($gameMatch);
  }

  /**
   * Remove the specified resource from storage.
   */
  public function destroy(GameMatch $gameMatch): Response
  {
    $this->authorize('delete', $gameMatch);

    $this->gameMatchService->deleteGameMatch($gameMatch);

    return response()->noContent();
  }

  /**
   * Submit match result for tournament fixtures.
   */
  public function submitResult(SubmitMatchResultRequest $request, GameMatch $gameMatch): GameMatchResource|JsonResponse
  {
    $this->authorize('update', $gameMatch);

    if (!$gameMatch->stage_id) {
      return response()->json([
        'message' => 'This endpoint is only for tournament fixtures'
      ], 400);
    }

    $validated = $request->validated();

    // Update fixture with result
    $gameMatch->update([
      'first_team_score' => $validated['home_score'],
      'second_team_score' => $validated['away_score'],
      'status' => 'completed',
      'metadata' => array_merge($gameMatch->metadata ?? [], $validated['metadata'] ?? []),
    ]);

    // Create match events if provided
    if (isset($validated['match_events'])) {
      foreach ($validated['match_events'] as $eventData) {
        $gameMatch->matchEvents()->create($eventData);
      }
    }

    return new GameMatchResource($gameMatch->fresh(['homeTeam', 'awayTeam', 'stage', 'group']));
  }

  /**
   * Update match result for tournament fixtures.
   */
  public function updateResult(SubmitMatchResultRequest $request, GameMatch $gameMatch): GameMatchResource|JsonResponse
  {
    $this->authorize('update', $gameMatch);

    if (!$gameMatch->stage_id) {
      return response()->json([
        'message' => 'This endpoint is only for tournament fixtures'
      ], 400);
    }

    $validated = $request->validated();

    // Update fixture with new result
    $gameMatch->update([
      'first_team_score' => $validated['home_score'],
      'second_team_score' => $validated['away_score'],
      'metadata' => array_merge($gameMatch->metadata ?? [], $validated['metadata'] ?? []),
    ]);

    // Trigger re-ranking
    event(new MatchCompleted(
      $gameMatch,
      $gameMatch->winner_team_id,
      $gameMatch->first_team_score,
      $gameMatch->second_team_score
    ));

    return new GameMatchResource($gameMatch->fresh(['homeTeam', 'awayTeam', 'stage', 'group']));
  }

  /**
   * Reschedule a tournament fixture.
   */
  public function reschedule(Request $request, GameMatch $gameMatch): GameMatchResource|JsonResponse
  {
    $this->authorize('update', $gameMatch);

    if (!$gameMatch->stage_id) {
      return response()->json([
        'message' => 'This endpoint is only for tournament fixtures'
      ], 400);
    }

    $validated = $request->validate([
      'starts_at' => 'required|date|after:now',
      'reason' => 'nullable|string|max:500',
    ]);

    $gameMatch->update([
      'starts_at' => $validated['starts_at'],
      'status' => 'scheduled',
      'metadata' => array_merge($gameMatch->metadata ?? [], [
        'rescheduled' => true,
        'reschedule_reason' => $validated['reason'] ?? null,
        'original_start' => $gameMatch->getOriginal('starts_at'),
      ]),
    ]);

    return new GameMatchResource($gameMatch->fresh());
  }
}
