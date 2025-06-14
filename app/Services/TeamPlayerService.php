<?php

namespace App\Services;

use App\Models\TeamPlayer;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

class TeamPlayerService
{
  /**
   * Get filtered and paginated team players.
   */
  public function getTeamPlayers(Request $request): LengthAwarePaginator
  {
    $query = $this->buildTeamPlayerQuery($request);

    return $query->orderBy('join_time', 'asc')->paginate($request->get('per_page', 15));
  }

  /**
   * Get a single team player with optional relationships.
   */
  public function getTeamPlayerWithRelations(TeamPlayer $teamPlayer, array $includes = []): TeamPlayer
  {
    $allowedIncludes = ['team', 'player'];
    $validIncludes = array_intersect($includes, $allowedIncludes);

    if (!empty($validIncludes)) {
      $teamPlayer->load($validIncludes);
    }

    return $teamPlayer;
  }

  /**
   * Create a new team player.
   */
  public function createTeamPlayer(array $data): TeamPlayer
  {
    return TeamPlayer::create($data);
  }

  /**
   * Update an existing team player.
   */
  public function updateTeamPlayer(TeamPlayer $teamPlayer, array $data): TeamPlayer
  {
    $teamPlayer->update($data);

    return $teamPlayer;
  }

  /**
   * Delete a team player.
   */
  public function deleteTeamPlayer(TeamPlayer $teamPlayer): bool
  {
    return $teamPlayer->delete();
  }

  /**
   * Build query for filtering team players.
   */
  private function buildTeamPlayerQuery(Request $request): Builder
  {
    $query = TeamPlayer::query();

    // Filter by team
    if ($request->filled('team_id')) {
      $query->where('team_id', $request->team_id);
    }

    // Filter by player
    if ($request->filled('player_id')) {
      $query->where('player_id', $request->player_id);
    }

    // Filter by status
    if ($request->filled('status')) {
      $query->where('status', $request->status);
    }

    // Load relationships if requested
    if ($request->filled('include')) {
      $includes = explode(',', $request->include);
      $allowedIncludes = ['team', 'player'];
      $validIncludes = array_intersect($includes, $allowedIncludes);

      if (!empty($validIncludes)) {
        $query->with($validIncludes);
      }
    }

    return $query;
  }
}
