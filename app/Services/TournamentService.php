<?php

namespace App\Services;

use App\Models\Tournament;
use App\Models\Stage;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Service class for managing tournaments
 *
 * Handles creation, updates, deletion, and lifecycle management of tournaments
 * including multi-stage tournament structures and status transitions.
 */
class TournamentService
{
  /**
   * Get filtered and paginated tournaments
   *
   * @param Request $request The HTTP request with filtering parameters
   *
   * @return LengthAwarePaginator Paginated tournaments with relationships
   */
  public function getTournaments(Request $request): LengthAwarePaginator
  {
    $query = $this->buildTournamentQuery($request);

    return $query->paginate($request->get('per_page', 15));
  }

  /**
   * Build query for filtering tournaments
   *
   * @param Request $request The HTTP request with filtering parameters
   *
   * @return Builder The constructed query builder
   */
  private function buildTournamentQuery(Request $request): Builder
  {
    $includes = ['turf', 'creator', 'teams', 'stages'];

    // Add optional includes if requested
    if ($request->filled('include')) {
      $requestIncludes = explode(',', $request->include);
      if (!empty($requestIncludes)) {
        $includes = array_merge($includes, $requestIncludes);
      }
    }

    $query = Tournament::with($includes)
      ->withCount(['stages', 'teams']);

    // Filter by turf
    if ($request->filled('turf_id')) {
      $query->where('turf_id', $request->turf_id);
    }

    // Filter by status
    if ($request->filled('status')) {
      $query->where('status', $request->status);
    }

    // Filter by type
    if ($request->filled('type')) {
      $query->where('type', $request->type);
    }

    return $query->latest();
  }

  /**
   * Create a new tournament with optional stages
   *
   * Creates a tournament in a database transaction. If stages are provided in the data,
   * they will be created along with the tournament. The creator is automatically set
   * to the authenticated user unless specified otherwise.
   *
   * @param array $data Tournament data including:
   *   - turf_id (int, required): ID of the turf hosting the tournament
   *   - name (string, required): Tournament name
   *   - type (string, optional): 'single_session' or 'multi_stage_tournament'
   *   - settings (array, optional): Custom tournament settings (scoring rules, etc.)
   *   - starts_at (string, required): Start date/time
   *   - ends_at (string, optional): End date/time
   *   - status (string, optional): Initial status (default: 'pending')
   *   - created_by (int, optional): Creator user ID
   *   - stages (array, optional): Array of stage configurations
   *
   * @return Tournament The created tournament with stages loaded
   */
  public function createTournament(array $data): Tournament
  {
    return DB::transaction(function () use ($data) {
      $tournament = Tournament::create([
        'turf_id' => $data['turf_id'],
        'name' => $data['name'],
        'type' => $data['type'] ?? 'single_session',
        'settings' => $data['settings'] ?? [],
        'starts_at' => $data['starts_at'],
        'ends_at' => $data['ends_at'] ?? null,
        'status' => $data['status'] ?? 'pending',
        'created_by' => $data['created_by'] ?? \Illuminate\Support\Facades\Auth::id(),
      ]);

      // Create stages if provided
      if (isset($data['stages']) && is_array($data['stages'])) {
        foreach ($data['stages'] as $index => $stageData) {
          Stage::create([
            'tournament_id' => $tournament->id,
            'name' => $stageData['name'],
            'order' => $stageData['order'] ?? $index + 1,
            'stage_type' => $stageData['stage_type'] ?? 'league',
            'settings' => $stageData['settings'] ?? [],
            'status' => 'pending',
          ]);
        }
      }

      return $tournament->load('stages');
    });
  }

  /**
   * Update tournament details
   *
   * Updates allowed fields while preserving existing values for omitted fields.
   * Returns the updated tournament with stages relationship loaded.
   *
   * @param Tournament $tournament The tournament to update
   * @param array $data Update data (all fields optional):
   *   - name (string): Tournament name
   *   - settings (array): Tournament settings
   *   - starts_at (string): Start date/time
   *   - ends_at (string): End date/time
   *   - status (string): Tournament status
   *
   * @return Tournament The updated tournament with stages
   */
  public function updateTournament(Tournament $tournament, array $data): Tournament
  {
    $tournament->update([
      'name' => $data['name'] ?? $tournament->name,
      'settings' => $data['settings'] ?? $tournament->settings,
      'starts_at' => $data['starts_at'] ?? $tournament->starts_at,
      'ends_at' => $data['ends_at'] ?? $tournament->ends_at,
      'status' => $data['status'] ?? $tournament->status,
    ]);

    return $tournament->fresh(['stages']);
  }

  /**
   * Delete a tournament and all related data
   *
   * Performs a cascading delete in a transaction, removing all stages, fixtures,
   * rankings, and groups associated with the tournament.
   *
   * @param Tournament $tournament The tournament to delete
   *
   * @return bool True if deletion was successful
   */
  public function deleteTournament(Tournament $tournament): bool
  {
    return DB::transaction(function () use ($tournament) {
      // Delete all related data (cascade should handle this, but explicit for clarity)
      $tournament->stages()->each(function ($stage) {
        $stage->fixtures()->delete();
        $stage->stageTeams()->delete();
        $stage->rankings()->delete();
        $stage->groups()->delete();
      });

      return $tournament->delete();
    });
  }

  /**
   * Get tournament with all related data
   *
   * Retrieves a tournament with all relevant relationships loaded including
   * turf, creator, ordered stages with groups and teams.
   *
   * @param int $tournamentId The tournament ID
   *
   * @return Tournament Tournament with loaded relationships
   *
   * @throws \Illuminate\Database\Eloquent\ModelNotFoundException If tournament not found
   */
  public function getTournamentWithStages(int $tournamentId): Tournament
  {
    return Tournament::with([
      'turf',
      'creator',
      'stages' => fn($q) => $q->orderBy('order'),
      'stages.groups',
      'stages.stageTeams.team',
      'teams',
    ])->findOrFail($tournamentId);
  }

  /**
   * Activate a tournament and its first stage
   *
   * Transitions tournament to 'active' status and activates the first stage
   * (ordered by the 'order' column).
   *
   * @param Tournament $tournament The tournament to activate
   *
   * @return Tournament The updated tournament
   */
  public function activateTournament(Tournament $tournament): Tournament
  {
    $tournament->update(['status' => 'active']);

    // Activate first stage
    $firstStage = $tournament->stages()->orderBy('order')->first();
    if ($firstStage) {
      $firstStage->update(['status' => 'active']);
    }

    return $tournament->fresh();
  }

  /**
   * Complete a tournament
   *
   * Marks tournament as completed. Validates that all stages are completed
   * before allowing completion.
   *
   * @param Tournament $tournament The tournament to complete
   *
   * @return Tournament The updated tournament
   *
   * @throws \Exception If any stages are not completed
   */
  public function completeTournament(Tournament $tournament): Tournament
  {
    // Verify all stages are completed
    $incompleteStages = $tournament->stages()->where('status', '!=', 'completed')->count();

    if ($incompleteStages > 0) {
      throw new \Exception("Cannot complete tournament with incomplete stages");
    }

    $tournament->update(['status' => 'completed']);

    return $tournament;
  }

  /**
   * Cancel a tournament
   *
   * Marks tournament and all its stages as cancelled.
   *
   * @param Tournament $tournament The tournament to cancel
   *
   * @return Tournament The updated tournament
   */
  public function cancelTournament(Tournament $tournament): Tournament
  {
    $tournament->update(['status' => 'cancelled']);
    $tournament->stages()->update(['status' => 'cancelled']);

    return $tournament;
  }

  /**
   * Get tournaments for a specific turf
   *
   * Retrieves tournaments with stages and teams relationships.
   * Optionally filters by status and orders by start date descending.
   *
   * @param int $turfId The turf ID
   * @param string|null $status Optional status filter ('pending', 'active', 'completed', 'cancelled')
   *
   * @return Collection Collection of Tournament models
   */
  public function getTournamentsByTurf(int $turfId, ?string $status = null): Collection
  {
    $query = Tournament::where('turf_id', $turfId)
      ->with(['stages', 'teams']);

    if ($status) {
      $query->where('status', $status);
    }

    return $query->orderBy('starts_at', 'desc')->get();
  }
}
