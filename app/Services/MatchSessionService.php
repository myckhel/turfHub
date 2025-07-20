<?php

namespace App\Services;

use App\Models\GameMatch;
use App\Models\MatchSession;
use App\Models\Player;
use App\Services\QueueLogicService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

class MatchSessionService
{
  protected QueueLogicService $queueLogicService;
  protected GameMatchService $gameMatchService;

  public function __construct(QueueLogicService $queueLogicService, GameMatchService $gameMatchService)
  {
    $this->queueLogicService = $queueLogicService;
    $this->gameMatchService = $gameMatchService;
  }

  /**
   * Get filtered and paginated match sessions.
   */
  public function getMatchSessions(Request $request): LengthAwarePaginator
  {
    $query = $this->buildMatchSessionQuery($request);

    return $query->paginate($request->get('per_page', 15));
  }

  /**
   * Get a single match session with optional relationships.
   */
  public function getMatchSessionWithRelations(MatchSession $matchSession, array $includes = []): MatchSession
  {
    dd($includes);
    if (!empty($includes)) {
      $matchSession->load($includes);
    }

    return $matchSession;
  }

  /**
   * Create a new match session.
   */
  public function createMatchSession(array $data): MatchSession
  {
    // If max_players_per_team is not provided, use the turf's value
    if (!isset($data['max_players_per_team']) && isset($data['turf_id'])) {
      $turf = \App\Models\Turf::find($data['turf_id']);
      if ($turf) {
        $data['max_players_per_team'] = $turf->max_players_per_team;
      }
    }

    return MatchSession::create($data);
  }

  /**
   * Update an existing match session.
   */
  public function updateMatchSession(MatchSession $matchSession, array $data): MatchSession
  {
    $matchSession->update($data);

    return $matchSession;
  }

  /**
   * Delete a match session.
   */
  public function deleteMatchSession(MatchSession $matchSession): bool
  {
    return $matchSession->delete();
  }

  /**
   * Create a new match session with teams.
   */
  public function createMatchSessionWithTeams(array $data): MatchSession
  {
    $matchSession = MatchSession::create($data);

    // Create teams based on max_teams
    $maxTeams = $data['max_teams'];
    for ($i = 1; $i <= $maxTeams; $i++) {
      $matchSession->teams()->create([
        'name' => "Team {$i}",
        'status' => 'waiting',
        'wins' => 0,
        'losses' => 0,
        'draws' => 0,
      ]);
    }

    // Initialize queue logic
    $this->queueLogicService->initializeQueue($matchSession);

    return $matchSession->load(['teams', 'queueLogic']);
  }

  /**
   * Add a player to a team in a match session.
   */
  public function addPlayerToTeam(MatchSession $matchSession, int $teamId, int $playerId): void
  {
    $team = $matchSession->teams()->findOrFail($teamId);
    $player = Player::findOrFail($playerId);

    // Load turf relationship if not already loaded
    if (!$matchSession->relationLoaded('turf')) {
      $matchSession->load('turf');
    }

    // Verify player belongs to the same turf
    if ($player->turf_id !== $matchSession->turf_id) {
      throw new \InvalidArgumentException('Player does not belong to this turf');
    }

    // Check if team is full using match session's max players per team setting
    $maxPlayersPerTeam = $matchSession->max_players_per_team;
    if ($team->teamPlayers()->count() >= $maxPlayersPerTeam) {
      throw new \InvalidArgumentException("Team is full (max {$maxPlayersPerTeam} players allowed)");
    }

    // Check if player is already in a team for this session
    $existingTeamPlayer = $matchSession->teams()
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

    // Set captain if team doesn't have one
    if (!$team->captain_id) {
      $team->update(['captain_id' => $player->user_id]);
    }
  }

  /**
   * Start a match session.
   */
  public function startMatchSession(MatchSession $matchSession): MatchSession
  {
    $matchSession->update([
      'status' => 'active',
      'is_active' => true,
    ]);

    // Create the first game match if there are at least 2 teams
    $teams = $matchSession->queueLogic()
      ->where('status', 'next_to_play')
      ->orderBy('queue_position')
      ->limit(2)
      ->get();

    if ($teams->count() >= 2) {
      $this->createNextGameMatch($matchSession);
    }

    return $matchSession;
  }

  /**
   * Stop a match session.
   */
  public function stopMatchSession(MatchSession $matchSession): MatchSession
  {
    $matchSession->update([
      'status' => 'completed',
      'is_active' => false,
    ]);

    return $matchSession;
  }

  /**
   * Process the result of a game match and determine the next game.
   */
  public function postMatchCompleted(MatchSession $matchSession, GameMatch $gameMatch): MatchSession
  {

    // Update game match with result

    // Determine winner and update teams
    $this->processGameResult($gameMatch);

    // Update queue logic based on result
    $this->updateQueueLogic($matchSession, $gameMatch);

    // Create next game match if session is still active
    if ($matchSession->is_active) {
      $this->createNextGameMatch($matchSession);
    }

    return $matchSession;
  }

  /**
   * Get queue status for a match session.
   */
  public function getQueueStatus(MatchSession $matchSession): array
  {
    return $this->queueLogicService->getQueueStatus($matchSession);
  }

  /**
   * Process game result and update team statistics.
   */
  private function processGameResult(GameMatch $gameMatch): void
  {
    $firstTeamScore = $gameMatch->first_team_score;
    $secondTeamScore = $gameMatch->second_team_score;

    if ($firstTeamScore > $secondTeamScore) {
      // First team wins
      $gameMatch->update([
        'winning_team_id' => $gameMatch->first_team_id,
        'outcome' => GameMatch::OUTCOME_WIN,
      ]);

      $gameMatch->firstTeam()->increment('wins');
      $gameMatch->secondTeam()->increment('losses');
    } elseif ($secondTeamScore > $firstTeamScore) {
      // Second team wins
      $gameMatch->update([
        'winning_team_id' => $gameMatch->second_team_id,
        'outcome' => GameMatch::OUTCOME_WIN,
      ]);

      $gameMatch->secondTeam()->increment('wins');
      $gameMatch->firstTeam()->increment('losses');
    } else {
      // Draw
      $gameMatch->update([
        'winning_team_id' => null,
        'outcome' => GameMatch::OUTCOME_DRAW,
      ]);

      $gameMatch->firstTeam()->increment('draws');
      $gameMatch->secondTeam()->increment('draws');
    }
  }

  /**
   * Update queue logic based on game result.
   */
  private function updateQueueLogic(MatchSession $matchSession, GameMatch $gameMatch): void
  {
    $this->queueLogicService->updateQueueAfterMatch($matchSession, $gameMatch);
  }

  /**
   * Create the next game match based on queue logic.
   */
  private function createNextGameMatch(MatchSession $matchSession): ?GameMatch
  {
    // Get next two teams to play
    $teamIds = $this->queueLogicService->getNextTeamsToPlay($matchSession);

    if (count($teamIds) >= 2) {
      $gameMatch = $matchSession->gameMatches()->create([
        'first_team_id' => $teamIds[0],
        'second_team_id' => $teamIds[1],
        'first_team_score' => 0,
        'second_team_score' => 0,
        'match_time' => now(),
        'status' => 'upcoming',
      ]);

      // Update teams status to playing
      $this->queueLogicService->markTeamsAsPlaying($matchSession, $teamIds);

      return $gameMatch;
    }

    return null;
  }

  /**
   * Build query for filtering match sessions.
   */
  private function buildMatchSessionQuery(Request $request): Builder
  {
    // starting from last 3 days
    $query = MatchSession::query()->orderBy('session_date', 'asc');

    // Filter by turf
    if ($request->filled('turf_id')) {
      $query->where('turf_id', $request->turf_id);
    }

    // Filter by status
    if ($request->filled('status')) {
      $query->where('status', $request->status);
    }

    // Filter by active sessions
    if ($request->filled('is_active')) {
      $query->where('is_active', $request->boolean('is_active'));
    }

    // Filter by time slot
    if ($request->filled('time_slot')) {
      $query->where('time_slot', $request->time_slot);
    }

    // Filter by date range
    if ($request->filled('date_from')) {
      $query->where('session_date', '>=', $request->date_from);
    }

    if ($request->filled('date_to')) {
      $query->where('session_date', '<=', $request->date_to);
    }

    // Search by name
    if ($request->filled('search')) {
      $query->where('name', 'LIKE', "%{$request->search}%");
    }

    // Load relationships if requested
    if ($request->filled('include')) {
      $includes = explode(',', $request->include);

      if (!empty($includes)) {
        $query->with($includes);
      }
    }

    return $query;
  }

  function getGameMatches(Request $request, MatchSession $matchSession): LengthAwarePaginator
  {
    $request->merge(['match_session_id' => $matchSession->id]);
    return $this->gameMatchService->getGameMatches($request);
  }
}
