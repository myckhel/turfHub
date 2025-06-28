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

  /**
   * Join a team slot for a player.
   */
  public function joinTeamSlot(Team $team, int $playerId, ?int $position = null): void
  {
    // First, get the player record
    $player = \App\Models\Player::where('id', $playerId)
      ->where('turf_id', $team->matchSession->turf_id)
      ->firstOrFail();

    // Check if team is full using match session's max players per team setting
    if ($team->teamPlayers()->count() >= $team->matchSession->max_players_per_team) {
      throw new \InvalidArgumentException('Team is full');
    }

    // Check if player is already in a team for this session
    $existingTeamPlayer = $team->matchSession->teams()
      ->join('team_players', 'teams.id', '=', 'team_players.team_id')
      ->where('team_players.player_id', $player->id)
      ->first();

    if ($existingTeamPlayer) {
      throw new \InvalidArgumentException('Player is already in a team for this session');
    }

    // Add player to team
    $team->teamPlayers()->create([
      'player_id' => $player->id,
    ]);

    // Set captain if team doesn't have one
    if (!$team->captain_id) {
      $team->update(['captain_id' => $playerId]);
    }
  }

  /**
   * Leave a team slot for a player.
   */
  public function leaveTeamSlot(Team $team, int $playerId): void
  {
    $player = \App\Models\Player::where('id', $playerId)
      ->where('turf_id', $team->matchSession->turf_id)
      ->firstOrFail();

    $teamPlayer = $team->teamPlayers()->where('player_id', $player->id)->first();

    if (!$teamPlayer) {
      throw new \InvalidArgumentException('Player is not in this team');
    }

    // Remove player from team
    $teamPlayer->delete();

    // If this was the captain, unset captain
    if ($team->captain_id == $playerId) {
      // Set new captain to first remaining player
      $newCaptain = $team->teamPlayers()->with('player.user')->first();
      $team->update([
        'captain_id' => $newCaptain ? $newCaptain->player->user_id : null
      ]);
    }
  }

  /**
   * Add player to team slot (for admins/managers).
   */
  public function addPlayerToTeamSlot(Team $team, int $playerId, ?int $position = null, bool $isCaptain = false): void
  {
    $player = \App\Models\Player::findOrFail($playerId);

    // Verify player belongs to the same turf
    if ($player->turf_id !== $team->matchSession->turf_id) {
      throw new \InvalidArgumentException('Player does not belong to this turf');
    }

    // Check if team is full using match session's max players per team setting
    if ($team->teamPlayers()->count() >= $team->matchSession->max_players_per_team) {
      throw new \InvalidArgumentException('Team is full');
    }

    // Check if player is already in a team for this session
    $existingTeamPlayer = $team->matchSession->teams()
      ->join('team_players', 'teams.id', '=', 'team_players.team_id')
      ->where('team_players.player_id', $playerId)
      ->first();

    if ($existingTeamPlayer) {
      throw new \InvalidArgumentException('Player is already in a team for this session');
    }

    // Add player to team
    $team->teamPlayers()->create([
      'player_id' => $playerId,
    ]);

    // Set as captain if requested
    if ($isCaptain || !$team->captain_id) {
      $team->update(['captain_id' => $player->user_id]);
    }
  }

  /**
   * Remove player from team slot.
   */
  public function removePlayerFromTeamSlot(Team $team, int $playerId): void
  {
    $teamPlayer = $team->teamPlayers()->where('player_id', $playerId)->first();

    if (!$teamPlayer) {
      throw new \InvalidArgumentException('Player is not in this team');
    }

    $player = $teamPlayer->player;

    // Remove player from team
    $teamPlayer->delete();

    // If this was the captain, set new captain
    if ($team->captain_id == $player->user_id) {
      $newCaptain = $team->teamPlayers()->with('player.user')->first();
      $team->update([
        'captain_id' => $newCaptain ? $newCaptain->player->user_id : null
      ]);
    }
  }

  /**
   * Set team captain.
   */
  public function setCaptain(Team $team, int $playerId): void
  {
    $teamPlayer = $team->teamPlayers()->where('player_id', $playerId)->first();

    if (!$teamPlayer) {
      throw new \InvalidArgumentException('Player is not in this team');
    }

    $team->update(['captain_id' => $teamPlayer->player->user_id]);
  }

  /**
   * Process payment for team slot.
   */
  public function processTeamSlotPayment(Team $team, int $userId, int $position, string $paymentMethod, ?string $redirectUrl = null): array
  {
    $turf = $team->matchSession->turf;
    $teamSlotFee = $turf->team_slot_fee ?? 0;

    if ($teamSlotFee <= 0) {
      throw new \InvalidArgumentException('No team slot fee required for this turf');
    }

    $player = \App\Models\Player::where('user_id', $userId)
      ->where('turf_id', $turf->id)
      ->firstOrFail();

    // For now, return a mock payment response
    // This would integrate with actual payment service (Paystack)
    return [
      'payment_id' => 'pay_' . uniqid(),
      'amount' => $teamSlotFee,
      'status' => 'pending',
      'payment_url' => $redirectUrl ? $redirectUrl . '?payment_id=pay_' . uniqid() : null,
      'reference' => 'ref_' . uniqid(),
    ];
  }

  /**
   * Get team slot payment status.
   */
  public function getTeamSlotPaymentStatus(Team $team, int $playerId): array
  {
    // For now, return a mock status
    // This would check actual payment records
    return [
      'status' => 'paid',
      'payment_id' => 'pay_' . uniqid(),
    ];
  }

  /**
   * Get team statistics.
   */
  public function getTeamStats(Team $team): array
  {
    $totalMatches = $team->wins + $team->losses + $team->draws;
    $winRate = $totalMatches > 0 ? ($team->wins / $totalMatches) * 100 : 0;

    return [
      'total_matches' => $totalMatches,
      'wins' => $team->wins,
      'losses' => $team->losses,
      'draws' => $team->draws,
      'goals_for' => $team->goals_for ?? 0,
      'goals_against' => $team->goals_against ?? 0,
      'win_rate' => round($winRate, 2),
    ];
  }
}
