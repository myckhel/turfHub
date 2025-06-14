<?php

namespace App\Services;

use App\Models\Team;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

class TeamService
{
  /**
   * Get filtered and paginated teams.
   */
  public function getTeams(Request $request): LengthAwarePaginator
  {
    $query = $this->buildTeamQuery($request);

    return $query->paginate($request->get('per_page', 15));
  }

  /**
   * Get a single team with optional relationships.
   */
  public function getTeamWithRelations(Team $team, array $includes = []): Team
  {
    $allowedIncludes = ['matchSession', 'captain', 'teamPlayers', 'gameMatchesAsFirstTeam', 'gameMatchesAsSecondTeam'];
    $validIncludes = array_intersect($includes, $allowedIncludes);

    if (!empty($validIncludes)) {
      $team->load($validIncludes);
    }

    return $team;
  }

  /**
   * Create a new team.
   */
  public function createTeam(array $data): Team
  {
    return Team::create($data);
  }

  /**
   * Update an existing team.
   */
  public function updateTeam(Team $team, array $data): Team
  {
    $team->update($data);

    return $team;
  }

  /**
   * Delete a team.
   */
  public function deleteTeam(Team $team): bool
  {
    return $team->delete();
  }

  /**
   * Build query for filtering teams.
   */
  private function buildTeamQuery(Request $request): Builder
  {
    $query = Team::query();

    // Filter by match session
    if ($request->filled('match_session_id')) {
      $query->where('match_session_id', $request->match_session_id);
    }

    // Filter by captain
    if ($request->filled('captain_id')) {
      $query->where('captain_id', $request->captain_id);
    }

    // Filter by status
    if ($request->filled('status')) {
      $query->where('status', $request->status);
    }

    // Search by name
    if ($request->filled('search')) {
      $query->where('name', 'LIKE', "%{$request->search}%");
    }

    // Load relationships if requested
    if ($request->filled('include')) {
      $includes = explode(',', $request->include);
      $allowedIncludes = ['matchSession', 'captain', 'teamPlayers', 'gameMatchesAsFirstTeam', 'gameMatchesAsSecondTeam'];
      $validIncludes = array_intersect($includes, $allowedIncludes);

      if (!empty($validIncludes)) {
        $query->with($validIncludes);
      }
    }

    return $query;
  }
}
