<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Tournament\CreateTournamentRequest;
use App\Http\Requests\Tournament\UpdateTournamentRequest;
use App\Http\Resources\TournamentCollection;
use App\Http\Resources\TournamentResource;
use App\Models\Tournament;
use App\Services\TournamentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class TournamentController extends Controller
{
    public function __construct(
        private readonly TournamentService $tournamentService
    ) {}

    /**
     * Display a listing of tournaments.
     */
    public function index(Request $request): TournamentCollection
    {
        $query = Tournament::with(['turf', 'creator'])
            ->when($request->turf_id, fn($q) => $q->where('turf_id', $request->turf_id))
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->when($request->type, fn($q) => $q->where('type', $request->type))
            ->latest();

        $tournaments = $request->has('per_page')
            ? $query->paginate($request->per_page)
            : $query->get();

        return new TournamentCollection($tournaments);
    }

    /**
     * Store a newly created tournament.
     */
    public function store(CreateTournamentRequest $request): TournamentResource|JsonResponse
    {
        Gate::authorize('create', Tournament::class);

        $tournament = $this->tournamentService->createTournament($request->validated());

        return new TournamentResource($tournament);
    }

    /**
     * Display the specified tournament.
     */
    public function show(Tournament $tournament): TournamentResource
    {
        Gate::authorize('view', $tournament);

        $tournament->load(['turf', 'creator', 'stages.groups', 'teams']);

        return new TournamentResource($tournament);
    }

    /**
     * Update the specified tournament.
     */
    public function update(UpdateTournamentRequest $request, Tournament $tournament): TournamentResource
    {
        Gate::authorize('update', $tournament);

        $tournament = $this->tournamentService->updateTournament($tournament, $request->validated());

        return new TournamentResource($tournament);
    }

    /**
     * Remove the specified tournament.
     */
    public function destroy(Tournament $tournament): JsonResponse
    {
        Gate::authorize('delete', $tournament);

        $this->tournamentService->deleteTournament($tournament);

        return response()->json(null, 204);
    }

    /**
     * Export tournament data (fixtures, rankings, etc.).
     */
    public function export(Tournament $tournament): JsonResponse
    {
        Gate::authorize('view', $tournament);

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
