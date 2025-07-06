<?php

namespace App\Services;

use App\Models\Player;
use App\Models\MatchSession;
use App\Models\Team;
use App\Models\TeamPlayer;
use App\Models\Payment;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PlayerService
{
  protected PaymentService $paymentService;

  public function __construct(PaymentService $paymentService)
  {
    $this->paymentService = $paymentService;
  }

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
   * Get available match sessions for a player.
   * Returns active and scheduled match sessions in the player's turf.
   */
  public function getAvailableMatchSessions(Player $player): Collection
  {
    return MatchSession::where('turf_id', $player->turf_id)
      ->whereIn('status', ['scheduled', 'active'])
      ->with(['teams.teamPlayers.player.user', 'turf'])
      ->orderBy('session_date')
      ->orderBy('start_time')
      ->get();
  }

  /**
   * Get available teams that a player can join in a match session.
   */
  public function getAvailableTeams(Player $player, MatchSession $matchSession): Collection
  {
    // Verify the player belongs to the same turf as the match session
    if ($player->turf_id !== $matchSession->turf_id) {
      throw new \InvalidArgumentException('Player does not belong to this turf');
    }

    // Check if player is already in a team for this session
    $existingTeamPlayer = TeamPlayer::whereHas('team', function ($query) use ($matchSession) {
      $query->where('match_session_id', $matchSession->id);
    })->whereHas('player', function ($query) use ($player) {
      $query->where('id', $player->id);
    })->first();

    if ($existingTeamPlayer) {
      throw new \InvalidArgumentException('Player is already in a team for this match session');
    }

    return $matchSession->teams()
      ->with(['teamPlayers.player.user', 'captain', 'matchSession.turf'])
      ->get()
      ->filter(function ($team) use ($matchSession) {
        // Return teams that have available slots using match session's max players per team setting
        return $team->teamPlayers->count() < $matchSession->max_players_per_team;
      });
  }

  /**
   * Join a team slot in a match session.
   * This implements the core player flow functionality.
   */
  public function joinTeamSlot(Player $player, MatchSession $matchSession, ?Team $team = null, string $paymentMethod = 'none'): array
  {
    return DB::transaction(function () use ($player, $matchSession, $team, $paymentMethod) {
      // Verify the player belongs to the same turf as the match session
      if ($player->turf_id !== $matchSession->turf_id) {
        throw new \InvalidArgumentException('Player does not belong to this turf');
      }

      // Check if match session is accepting players
      if (!in_array($matchSession->status, ['scheduled', 'active'])) {
        throw new \InvalidArgumentException('Match session is not accepting players');
      }

      // Check if player is already in a team for this session
      $existingTeamPlayer = TeamPlayer::whereHas('team', function ($query) use ($matchSession) {
        $query->where('match_session_id', $matchSession->id);
      })->whereHas('player', function ($query) use ($player) {
        $query->where('id', $player->id);
      })->first();

      if ($existingTeamPlayer) {
        throw new \InvalidArgumentException('Player is already in a team for this match session');
      }

      // If no team specified, create a new team or join an available one
      if (!$team) {
        $team = $this->findOrCreateAvailableTeam($matchSession, $player);
      }

      // Verify team has space using match session's max players per team setting
      if ($team->teamPlayers->count() >= $matchSession->max_players_per_team) {
        throw new \InvalidArgumentException('Team is full');
      }

      $paymentAmount = $matchSession->turf->team_slot_fee ?? 0;

      // Check if payment is required
      if ($paymentAmount > 0 && $paymentMethod !== 'none') {
        if ($paymentMethod === 'wallet') {
          // Process wallet payment
          $walletService = app(\App\Services\WalletService::class);
          $result = $walletService->processWalletPayment(
            $player->user,
            $matchSession->turf,
            $paymentAmount,
            "Match session fee for {$matchSession->name}",
            [
              'match_session_id' => $matchSession->id,
              'team_id' => $team->id,
              'payment_type' => Payment::TYPE_SESSION_FEE
            ]
          );

          if (!$result['success']) {
            throw new \Exception('Wallet payment failed: ' . $result['message']);
          }

          // Add player to team after successful wallet payment
          $teamPlayer = TeamPlayer::create([
            'team_id' => $team->id,
            'player_id' => $player->id,
            'join_time' => now(),
          ]);

          // Set captain if this is the first player in the team
          if ($team->teamPlayers->count() === 0 && !$team->captain_id) {
            $team->update(['captain_id' => $player->user_id]);
          }

          return [
            'team' => $team->load(['teamPlayers.player.user', 'captain', 'matchSession']),
            'team_player' => $teamPlayer,
            'payment' => $result['payment'],
            'payment_method' => 'wallet',
            'wallet_balance' => $result['payer_balance']
          ];
        } else {
          // Initialize Paystack payment
          $paymentResult = $this->paymentService->initializePayment(
            user: $player->user,
            payable: $matchSession,
            amount: $paymentAmount,
            paymentType: Payment::TYPE_SESSION_FEE,
            description: "Match session fee for {$matchSession->name}"
          );

          if (!$paymentResult['status']) {
            throw new \Exception('Payment initialization failed: ' . $paymentResult['message']);
          }

          // Store team information for later processing after payment
          cache()->put(
            "match_session_payment_{$paymentResult['data']['reference']}",
            [
              'match_session_id' => $matchSession->id,
              'team_id' => $team->id,
              'player_id' => $player->id,
              'user_id' => $player->user_id
            ],
            now()->addHours(1)
          );

          return [
            'team' => $team->load(['teamPlayers.player.user', 'captain', 'matchSession']),
            'payment' => $paymentResult['data'],
            'payment_method' => 'paystack',
            'requires_payment' => true
          ];
        }
      } else {
        // No payment required, add player directly
        $teamPlayer = TeamPlayer::create([
          'team_id' => $team->id,
          'player_id' => $player->id,
          'join_time' => now(),
        ]);

        // Set captain if this is the first player in the team
        if ($team->teamPlayers->count() === 0 && !$team->captain_id) {
          $team->update(['captain_id' => $player->user_id]);
        }

        return [
          'team' => $team->load(['teamPlayers.player.user', 'captain', 'matchSession']),
          'team_player' => $teamPlayer,
          'payment_method' => 'none'
        ];
      }
    });
  }

  /**
   * Leave a team before the match starts.
   */
  public function leaveTeam(Player $player, Team $team): void
  {
    DB::transaction(function () use ($player, $team) {
      // Check if match session allows leaving
      if ($team->matchSession->status !== 'scheduled') {
        throw new \InvalidArgumentException('Cannot leave team after match has started');
      }

      // Find the team player record
      $teamPlayer = TeamPlayer::where('team_id', $team->id)
        ->where('player_id', $player->id)
        ->first();

      if (!$teamPlayer) {
        throw new \InvalidArgumentException('Player is not in this team');
      }

      // Remove player from team
      $teamPlayer->delete();

      // If the leaving player was the captain, assign a new captain
      if ($team->captain_id === $player->user_id) {
        $newCaptain = $team->teamPlayers()->with('player.user')->first();
        $team->update([
          'captain_id' => $newCaptain ? $newCaptain->player->user_id : null
        ]);
      }

      // If team becomes empty, you might want to delete it or keep it for future players
      // For now, we'll keep empty teams
    });
  }

  /**
   * Get current team status for a player.
   */
  public function getCurrentTeamStatus(Player $player): array
  {
    $currentTeams = TeamPlayer::whereHas('team.matchSession', function ($query) {
      $query->whereIn('status', ['scheduled', 'active']);
    })
      ->whereHas('player', function ($query) use ($player) {
        $query->where('id', $player->id);
      })
      ->with(['team.matchSession', 'team.gameMatchesAsFirstTeam', 'team.gameMatchesAsSecondTeam'])
      ->get();

    $status = [];
    foreach ($currentTeams as $teamPlayer) {
      $team = $teamPlayer->team;
      $matchSession = $team->matchSession;

      // Get recent match results for this team
      $recentMatches = collect()
        ->merge($team->gameMatchesAsFirstTeam)
        ->merge($team->gameMatchesAsSecondTeam)
        ->sortByDesc('created_at')
        ->take(5);

      $status[] = [
        'match_session' => [
          'id' => $matchSession->id,
          'name' => $matchSession->name,
          'status' => $matchSession->status,
          'session_date' => $matchSession->session_date,
          'time_slot' => $matchSession->time_slot,
        ],
        'team' => [
          'id' => $team->id,
          'name' => $team->name,
          'status' => $team->status,
          'wins' => $team->wins,
          'losses' => $team->losses,
          'draws' => $team->draws,
          'is_captain' => $team->captain_id === $player->user_id,
        ],
        'recent_matches' => $recentMatches->values(),
      ];
    }

    return $status;
  }

  /**
   * Find an available team or create a new one.
   */
  private function findOrCreateAvailableTeam(MatchSession $matchSession, Player $player): Team
  {
    $maxPlayersPerTeam = $matchSession->max_players_per_team;

    // Try to find a team with available slots
    $availableTeam = $matchSession->teams()
      ->whereHas('teamPlayers', function ($query) use ($maxPlayersPerTeam) {
        $query->havingRaw('COUNT(*) < ?', [$maxPlayersPerTeam]);
      }, '<', $maxPlayersPerTeam)
      ->orWhereDoesntHave('teamPlayers')
      ->first();

    if ($availableTeam) {
      return $availableTeam;
    }

    // Check if we can create more teams
    $currentTeamCount = $matchSession->teams()->count();
    if ($currentTeamCount >= $matchSession->max_teams) {
      throw new \InvalidArgumentException('Match session is full');
    }

    // Create a new team
    return Team::create([
      'match_session_id' => $matchSession->id,
      'name' => 'Team ' . chr(65 + $currentTeamCount), // Team A, Team B, etc.
      'captain_id' => $player->user_id,
      'status' => 'waiting',
      'wins' => 0,
      'losses' => 0,
      'draws' => 0,
    ]);
  }

  /**
   * Get payment history for a player.
   */
  public function getPlayerPaymentHistory(Player $player, Request $request): LengthAwarePaginator
  {
    // Get payments for match sessions and teams in the player's turf
    $turfId = $player->turf_id;

    $query = Payment::where('user_id', $player->user_id)
      ->whereHasMorph(
        'payable',
        [MatchSession::class, Team::class],
        function (Builder $query, $type) use ($turfId) {
          if ($type == Team::class) {
            $query->whereHas('matchSession', function ($matchQuery) use ($turfId) {
              $matchQuery->where('turf_id', $turfId);
            });
          } else {
            $query->where('turf_id', $turfId);
          }
        }
      )
      ->with(['payable'])
      ->orderBy('created_at', 'desc');

    return $query->paginate($request->get('per_page', 15));
  }

  /**
   * Check if a player can join a team.
   */
  public function canPlayerJoinTeam(Player $player, MatchSession $matchSession, ?Team $team): array
  {
    // Verify the player belongs to the same turf as the match session
    if ($player->turf_id !== $matchSession->turf_id) {
      return [
        'can_join' => false,
        'reason' => 'Player does not belong to this turf',
      ];
    }

    // Check if player is active
    if ($player->status !== 'active') {
      return [
        'can_join' => false,
        'reason' => 'Player is not active',
      ];
    }

    // Check if match session is accepting players
    if (!in_array($matchSession->status, ['scheduled', 'active'])) {
      return [
        'can_join' => false,
        'reason' => 'Match session is not accepting players',
      ];
    }

    // Check if player is already in a team for this session
    $existingTeamPlayer = TeamPlayer::whereHas('team', function ($query) use ($matchSession) {
      $query->where('match_session_id', $matchSession->id);
    })->whereHas('player', function ($query) use ($player) {
      $query->where('id', $player->id);
    })->first();

    if ($existingTeamPlayer) {
      return [
        'can_join' => false,
        'reason' => 'Player is already in a team for this match session',
      ];
    }

    // If specific team provided, check if it has space
    if ($team) {
      $currentPlayers = $team->teamPlayers->count();
      if ($currentPlayers >= $matchSession->max_players_per_team) {
        return [
          'can_join' => false,
          'reason' => 'Team is full',
        ];
      }

      return [
        'can_join' => true,
        'available_slots' => $matchSession->max_players_per_team - $currentPlayers,
      ];
    }

    $maxPlayersPerTeam = $matchSession->max_players_per_team;

    // Check if any team has space or if new teams can be created
    $availableTeams = $matchSession->teams()
      ->whereHas('teamPlayers', function ($query) use ($maxPlayersPerTeam) {
        $query->havingRaw('COUNT(*) < ?', [$maxPlayersPerTeam]);
      }, '<', $maxPlayersPerTeam)
      ->orWhereDoesntHave('teamPlayers')
      ->count();

    $currentTeamCount = $matchSession->teams()->count();

    if ($availableTeams > 0 || $currentTeamCount < $matchSession->max_teams) {
      return [
        'can_join' => true,
        'available_slots' => $availableTeams > 0 ? 'Available teams with slots' : 'New team will be created',
      ];
    }

    return [
      'can_join' => false,
      'reason' => 'Match session is full',
    ];
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

  /**
   * Handle successful match session payment after Paystack verification.
   */
  public function handleSuccessfulMatchSessionPayment(string $paymentReference): array
  {
    // Get cached match session information
    $sessionData = cache()->get("match_session_payment_{$paymentReference}");

    if (!$sessionData) {
      return [
        'success' => false,
        'message' => 'Match session payment data not found or expired'
      ];
    }

    try {
      $matchSession = MatchSession::findOrFail($sessionData['match_session_id']);
      $team = Team::findOrFail($sessionData['team_id']);
      $player = Player::findOrFail($sessionData['player_id']);

      // Add player to team
      $teamPlayer = TeamPlayer::create([
        'team_id' => $team->id,
        'player_id' => $player->id,
        'join_time' => now(),
      ]);

      // Set captain if this is the first player in the team
      if ($team->teamPlayers->count() === 1 && !$team->captain_id) {
        $team->update(['captain_id' => $player->user_id]);
      }

      // Clear the cached data
      cache()->forget("match_session_payment_{$paymentReference}");

      return [
        'success' => true,
        'message' => 'Player successfully added to match session team',
        'match_session_id' => $matchSession->id,
        'team_id' => $team->id,
        'player_id' => $player->id
      ];
    } catch (\Exception $e) {
      return [
        'success' => false,
        'message' => 'Failed to add player to match session: ' . $e->getMessage()
      ];
    }
  }
}
