<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreGameMatchRequest;
use App\Http\Requests\UpdateGameMatchRequest;
use App\Http\Resources\GameMatchResource;
use App\Models\GameMatch;
use App\Services\GameMatchService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
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
}
