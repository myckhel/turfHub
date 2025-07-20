<?php

namespace App\Services;

use App\Models\Player;
use App\Models\Team;
use App\Models\TeamPlayer;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

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
    if (!empty($includes)) {
      $team->load($includes);
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
   * Process payment for team slot with race condition protection.
   */
  public function processTeamSlotPayment(Team $team, int $userId, int $position, string $paymentMethod): array
  {
    $turf = $team->matchSession->turf;
    $teamSlotFee = $turf->team_slot_fee ?? 0;

    if ($teamSlotFee <= 0) {
      throw new \InvalidArgumentException('No team slot fee required for this turf');
    }

    $user = User::findOrFail($userId);
    $player = Player::where('user_id', $userId)
      ->where('turf_id', $turf->id)
      ->firstOrFail();

    return DB::transaction(function () use ($team, $player, $position, $paymentMethod, $teamSlotFee, $turf, $user) {
      // Lock the team to prevent race conditions
      $team = Team::lockForUpdate()->findOrFail($team->id);

      // Check if player is already in a team slot for this session
      $existingTeamPlayer = TeamPlayer::whereHas('team', function ($query) use ($team) {
        $query->where('match_session_id', $team->match_session_id);
      })
        ->where('player_id', $player->id)
        ->whereIn('payment_status', ['pending', 'confirmed']) // Check both pending and confirmed
        ->first();

      if ($existingTeamPlayer) {
        throw new \InvalidArgumentException('Player is already in a team for this session');
      }

      // Count only confirmed players for capacity check
      $confirmedPlayersCount = $team->teamPlayers()->confirmed()->count();

      // Check if team has available slots
      if ($confirmedPlayersCount >= $team->matchSession->max_players_per_team) {
        throw new \InvalidArgumentException('Team is full');
      }

      if ($paymentMethod === 'wallet') {
        // Process wallet payment
        $walletService = app(WalletService::class);

        $result = $walletService->processWalletPayment(
          $user,
          $turf,
          $teamSlotFee,
          "Team slot payment for {$turf->name} - Session {$team->matchSession->id}",
          [
            'team_id' => $team->id,
            'match_session_id' => $team->match_session_id,
            'position' => $position,
            'payment_type' => \App\Models\Payment::TYPE_TEAM_JOINING_FEE
          ]
        );

        if ($result['success']) {
          // Add player to team slot after successful payment - wallet payments are immediate
          $team->teamPlayers()->create([
            'player_id' => $player->id,
            'payment_status' => 'confirmed',
            'payment_reference' => $result['payment']->reference,
            'join_time' => now(),
          ]);

          // Set captain if team doesn't have one
          if (!$team->captain_id) {
            $team->update(['captain_id' => $player->user_id]);
          }

          return [
            'success' => true,
            'payment_method' => 'wallet',
            'payment_id' => $result['payment']->id,
            'amount' => $teamSlotFee,
            'status' => 'success',
            'message' => 'Payment successful via wallet',
            'new_wallet_balance' => $result['payer_balance'],
            'formatted_balance' => '₦' . number_format($result['payer_balance'], 2),
            'team_slot_added' => true
          ];
        } else {
          return [
            'success' => false,
            'payment_method' => 'wallet',
            'status' => 'failed',
            'message' => $result['message']
          ];
        }
      } else {
        // Process Paystack payment using PaymentService
        $paymentService = app(\App\Services\PaymentService::class);

        $paymentResult = $paymentService->initializePayment(
          $user,
          $team,
          $teamSlotFee,
          \App\Models\Payment::TYPE_TEAM_JOINING_FEE,
          "Team slot payment for {$turf->name} - Session {$team->matchSession->id}"
        );

        if ($paymentResult['status']) {
          // Reserve the slot for payment processing with expiry
          $team->teamPlayers()->create([
            'player_id' => $player->id,
            'payment_status' => 'pending',
            'payment_reference' => $paymentResult['data']['reference'],
            'reserved_at' => now(),
          ]);

          return [
            'success' => true,
            'payment_method' => 'paystack',
            'payment_id' => $paymentResult['data']['payment_id'],
            'amount' => $teamSlotFee,
            'status' => 'pending',
            'payment_url' => $paymentResult['data']['authorization_url'],
            'reference' => $paymentResult['data']['reference'],
            'access_code' => $paymentResult['data']['access_code'],
            'message' => 'Paystack payment initiated',
            'slot_reserved' => true,
            'expires_at' => now()->addMinutes(5)->toISOString()
          ];
        } else {
          return [
            'success' => false,
            'payment_method' => 'paystack',
            'status' => 'failed',
            'message' => $paymentResult['message']
          ];
        }
      }
    });
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
