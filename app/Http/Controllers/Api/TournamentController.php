<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Tournament\CreateTournamentRequest;
use App\Http\Requests\Tournament\UpdateTournamentRequest;
use App\Http\Resources\TournamentResource;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use App\Models\Tournament;
use App\Services\TournamentService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class TournamentController extends Controller
{
  use AuthorizesRequests;

  public function __construct(
    private readonly TournamentService $tournamentService
  ) {}

  /**
   * Display a listing of tournaments.
   */
  public function index(Request $request): AnonymousResourceCollection
  {
    $tournaments = $this->tournamentService->getTournaments($request);

    return TournamentResource::collection($tournaments);
  }

  /**
   * Store a newly created tournament.
   */
  public function store(CreateTournamentRequest $request): TournamentResource
  {
    $this->authorize('create', Tournament::class);

    $tournament = $this->tournamentService->createTournament($request->validated());

    return new TournamentResource($tournament);
  }

  /**
   * Display the specified tournament.
   */
  public function show(Tournament $tournament): TournamentResource
  {
    $this->authorize('view', $tournament);

    $tournament->load(['turf', 'creator', 'stages.groups', 'teams']);

    return new TournamentResource($tournament);
  }

  /**
   * Update the specified tournament.
   */
  public function update(UpdateTournamentRequest $request, Tournament $tournament): TournamentResource
  {
    $this->authorize('update', $tournament);

    $tournament = $this->tournamentService->updateTournament($tournament, $request->validated());

    return new TournamentResource($tournament);
  }

  /**
   * Remove the specified tournament.
   */
  public function destroy(Tournament $tournament): Response
  {
    $this->authorize('delete', $tournament);

    $this->tournamentService->deleteTournament($tournament);

    return response()->noContent();
  }

  /**
   * Export tournament data (fixtures, rankings, etc.).
   */
  public function export(Tournament $tournament): JsonResponse
  {
    $this->authorize('view', $tournament);

    $tournament->load([
      'stages.groups.rankings',
      'stages.fixtures.homeTeam',
      'stages.fixtures.awayTeam',
      'teams'
    ]);

    return response()->json([
      'tournament' => new TournamentResource($tournament),
    ]);
  }
}
