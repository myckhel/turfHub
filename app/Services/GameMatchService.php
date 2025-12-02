<?php

namespace App\Services;

use App\Models\GameMatch;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

class GameMatchService
{
  /**
   * Get filtered and paginated game matches.
   */
  public function getGameMatches(Request $request): LengthAwarePaginator
  {
    $query = $this->buildGameMatchQuery($request);

    return $query->orderBy('match_time', 'desc')->paginate($request->get('per_page', 15));
  }

  /**
   * Get a single game match with optional relationships.
   */
  public function getGameMatchWithRelations(GameMatch $gameMatch, array $includes = []): GameMatch
  {
    if (!empty($includes)) {
      $mappedIncludes = $this->mapRelationshipNames($includes);
      $gameMatch->load($mappedIncludes);
    }

    return $gameMatch;
  }

  /**
   * Map snake_case relationship names to camelCase method names.
   */
  private function mapRelationshipNames(array $includes): array
  {
    $relationshipMap = [
      'first_team' => 'firstTeam',
      'second_team' => 'secondTeam',
      'winning_team' => 'winningTeam',
      'match_session' => 'matchSession',
      'turf' => 'turf',
      'match_events' => 'matchEvents',
      'betting_markets' => 'bettingMarkets',
      'active_betting_markets' => 'activeBettingMarkets',
      // Support nested relationships
      'match_session.turf' => 'matchSession.turf',
      'first_team.players' => 'firstTeam.players',
      'second_team.players' => 'secondTeam.players',
    ];

    // Convert snake_case includes to proper relationship names
    return array_map(function ($include) use ($relationshipMap) {
      return $relationshipMap[$include] ?? $include;
    }, $includes);
  }

  /**
   * Create a new game match.
   */
  public function createGameMatch(array $data): GameMatch
  {
    return GameMatch::create($data);
  }

  /**
   * Update an existing game match.
   */
  public function updateGameMatch(GameMatch $gameMatch, array $data): GameMatch
  {
    $gameMatch->update($data);

    return $gameMatch;
  }

  /**
   * Delete a game match.
   */
  public function deleteGameMatch(GameMatch $gameMatch): bool
  {
    return $gameMatch->delete();
  }

  /**
   * Build query for filtering game matches.
   */
  private function buildGameMatchQuery(Request $request): Builder
  {
    $query = GameMatch::query();

    // Filter by match session
    if ($request->filled('match_session_id')) {
      $query->where('match_session_id', $request->match_session_id);
    }

    // Filter by turf (for standalone matches)
    if ($request->filled('turf_id')) {
      $query->where('turf_id', $request->turf_id);
    }

    // Filter by stage
    if ($request->filled('stage_id')) {
      $query->where('stage_id', $request->stage_id);
    }

    // Filter by group
    if ($request->filled('group_id')) {
      $query->where('group_id', $request->group_id);
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
      $query->when(
        is_array($request->status),
        fn($q) => $q->whereIn('status', $request->status),
        fn($q) => $q->where('status', $request->status)
      );
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

      if (!empty($includes)) {
        $mappedIncludes = $this->mapRelationshipNames($includes);
        $query->with($mappedIncludes);
      }
    }

    return $query;
  }
}
