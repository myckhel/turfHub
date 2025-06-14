<?php

namespace App\Services;

use App\Models\Player;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

class PlayerService
{
  /**
   * Get filtered and paginated players.
   */
  public function getPlayers(Request $request): LengthAwarePaginator
  {
    $query = $this->buildPlayerQuery($request);

    return $query->paginate($request->get('per_page', 15));
  }

  /**
   * Get a single player with optional relationships.
   */
  public function getPlayerWithRelations(Player $player, array $includes = []): Player
  {
    $allowedIncludes = ['user', 'turf', 'teamPlayers', 'matchEvents'];
    $validIncludes = array_intersect($includes, $allowedIncludes);

    if (!empty($validIncludes)) {
      $player->load($validIncludes);
    }

    return $player;
  }

  /**
   * Create a new player.
   */
  public function createPlayer(array $data): Player
  {
    return Player::create($data);
  }

  /**
   * Update an existing player.
   */
  public function updatePlayer(Player $player, array $data): Player
  {
    $player->update($data);

    return $player;
  }

  /**
   * Delete a player.
   */
  public function deletePlayer(Player $player): bool
  {
    return $player->delete();
  }

  /**
   * Build query for filtering players.
   */
  private function buildPlayerQuery(Request $request): Builder
  {
    $query = Player::query();

    // Filter by user
    if ($request->filled('user_id')) {
      $query->where('user_id', $request->user_id);
    }

    // Filter by turf
    if ($request->filled('turf_id')) {
      $query->where('turf_id', $request->turf_id);
    }

    // Filter by membership status
    if ($request->filled('is_member')) {
      $query->where('is_member', $request->boolean('is_member'));
    }

    // Filter by status
    if ($request->filled('status')) {
      $query->where('status', $request->status);
    }

    // Load relationships if requested
    if ($request->filled('include')) {
      $includes = explode(',', $request->include);
      $allowedIncludes = ['user', 'turf', 'teamPlayers', 'matchEvents'];
      $validIncludes = array_intersect($includes, $allowedIncludes);

      if (!empty($validIncludes)) {
        $query->with($validIncludes);
      }
    }

    return $query;
  }
}
