<?php

namespace App\Services;

use App\Models\GameMatch;
use App\Models\MatchSession;
use App\Models\QueueLogic;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

class QueueLogicService
{
  /**
   * Get filtered and paginated queue logic entries.
   */
  public function getQueueLogic(Request $request): LengthAwarePaginator
  {
    $query = $this->buildQueueLogicQuery($request);

    return $query->orderBy('queue_position', 'asc')->paginate($request->get('per_page', 15));
  }

  /**
   * Get a single queue logic entry with optional relationships.
   */
  public function getQueueLogicWithRelations(QueueLogic $queueLogic, array $includes = []): QueueLogic
  {
    $allowedIncludes = ['matchSession', 'team'];
    $validIncludes = array_intersect($includes, $allowedIncludes);

    if (!empty($validIncludes)) {
      $queueLogic->load($validIncludes);
    }

    return $queueLogic;
  }

  /**
   * Create a new queue logic entry.
   */
  public function createQueueLogic(array $data): QueueLogic
  {
    return QueueLogic::create($data);
  }

  /**
   * Update an existing queue logic entry.
   */
  public function updateQueueLogic(QueueLogic $queueLogic, array $data): QueueLogic
  {
    $queueLogic->update($data);

    return $queueLogic;
  }

  /**
   * Delete a queue logic entry.
   */
  public function deleteQueueLogic(QueueLogic $queueLogic): bool
  {
    return $queueLogic->delete();
  }

  /**
   * Initialize queue for a match session by creating queue entries for all teams.
   */
  public function initializeQueue(MatchSession $matchSession): void
  {
    $teams = $matchSession->teams;

    foreach ($teams as $index => $team) {
      $matchSession->queueLogic()->create([
        'team_id' => $team->id,
        'queue_position' => $index + 1,
        'status' => $index < 2 ? 'next_to_play' : 'waiting',
        'reason_for_current_position' => 'initial_join',
      ]);
    }
  }

  /**
   * Update queue based on game match result.
   */
  public function updateQueueAfterMatch(MatchSession $matchSession, GameMatch $gameMatch): void
  {
    $firstTeamId = $gameMatch->first_team_id;
    $secondTeamId = $gameMatch->second_team_id;

    if ($gameMatch->outcome === GameMatch::OUTCOME_WIN) {
      $this->handleWinResult($matchSession, $gameMatch, $firstTeamId, $secondTeamId);
    } elseif ($gameMatch->outcome === GameMatch::OUTCOME_DRAW) {
      $this->handleDrawResult($matchSession, $firstTeamId, $secondTeamId);
    }

    $this->reorderQueue($matchSession);
  }

  /**
   * Handle win result queue logic.
   */
  private function handleWinResult(MatchSession $matchSession, GameMatch $gameMatch, int $firstTeamId, int $secondTeamId): void
  {
    $winningTeamId = $gameMatch->winning_team_id;
    $losingTeamId = $winningTeamId === $firstTeamId ? $secondTeamId : $firstTeamId;

    // Winner stays in next_to_play status
    $matchSession->queueLogic()
      ->where('team_id', $winningTeamId)
      ->update([
        'status' => 'next_to_play',
        'reason_for_current_position' => 'win',
      ]);

    // Loser goes to end of queue
    $maxPosition = $matchSession->queueLogic()->max('queue_position');
    $matchSession->queueLogic()
      ->where('team_id', $losingTeamId)
      ->update([
        'queue_position' => $maxPosition + 1,
        'status' => 'waiting',
        'reason_for_current_position' => 'loss',
      ]);
  }

  /**
   * Handle draw result queue logic.
   */
  private function handleDrawResult(MatchSession $matchSession, int $firstTeamId, int $secondTeamId): void
  {
    // Both teams step out and wait for random selection
    $matchSession->queueLogic()
      ->whereIn('team_id', [$firstTeamId, $secondTeamId])
      ->update([
        'status' => 'played_waiting_draw_resolution',
        'reason_for_current_position' => 'draw_waiting_other_match',
      ]);
  }

  /**
   * Reorder queue positions to maintain consistency.
   */
  private function reorderQueue(MatchSession $matchSession): void
  {
    $queueEntries = $matchSession->queueLogic()
      ->orderBy('queue_position')
      ->get();

    $position = 1;
    foreach ($queueEntries as $entry) {
      $entry->update(['queue_position' => $position]);
      $position++;
    }
  }

  /**
   * Get next two teams that should play.
   */
  public function getNextTeamsToPlay(MatchSession $matchSession): array
  {
    $teamsToPlay = $matchSession->queueLogic()
      ->where('status', 'next_to_play')
      ->orderBy('queue_position')
      ->limit(2)
      ->get();

    // If we don't have enough teams, try to resolve draw situations
    if ($teamsToPlay->count() < 2) {
      $this->resolveDrawSituations($matchSession);

      // Try again to get teams
      $teamsToPlay = $matchSession->queueLogic()
        ->where('status', 'next_to_play')
        ->orderBy('queue_position')
        ->limit(2)
        ->get();
    }

    return $teamsToPlay->pluck('team_id')->toArray();
  }

  /**
   * Resolve draw situations by randomly selecting teams.
   */
  private function resolveDrawSituations(MatchSession $matchSession): void
  {
    $drawTeams = $matchSession->queueLogic()
      ->where('status', 'played_waiting_draw_resolution')
      ->get();

    if ($drawTeams->count() >= 2) {
      // Randomly select one team to re-enter
      $selectedTeam = $drawTeams->random();

      $selectedTeam->update([
        'status' => 'next_to_play',
        'reason_for_current_position' => 'draw_reentry_random',
      ]);

      // Others continue waiting
      $drawTeams->where('id', '!=', $selectedTeam->id)
        ->each(function ($team) {
          $team->update([
            'status' => 'waiting',
            'reason_for_current_position' => 'draw_waiting_other_match',
          ]);
        });
    }
  }

  /**
   * Update teams status to playing when they are in a match.
   */
  public function markTeamsAsPlaying(MatchSession $matchSession, array $teamIds): void
  {
    $matchSession->queueLogic()
      ->whereIn('team_id', $teamIds)
      ->update(['status' => 'playing']);
  }

  /**
   * Get queue status for a match session.
   */
  public function getQueueStatus(MatchSession $matchSession): array
  {
    return $matchSession->queueLogic()
      ->with('team')
      ->orderBy('queue_position')
      ->get()
      // ->map(function ($queueEntry) {
      //     return [
      //         'team_id' => $queueEntry->team_id,
      //         'team_name' => $queueEntry->team->name,
      //         'queue_position' => $queueEntry->queue_position,
      //         'status' => $queueEntry->status,
      //         'reason' => $queueEntry->reason_for_current_position,
      //     ];
      // })
      ->toArray();
  }

  /**
   * Build query for filtering queue logic entries.
   */
  private function buildQueueLogicQuery(Request $request): Builder
  {
    $query = QueueLogic::query();

    // Filter by match session
    if ($request->filled('match_session_id')) {
      $query->where('match_session_id', $request->match_session_id);
    }

    // Filter by team
    if ($request->filled('team_id')) {
      $query->where('team_id', $request->team_id);
    }

    // Filter by status
    if ($request->filled('status')) {
      $query->where('status', $request->status);
    }

    // Load relationships if requested
    if ($request->filled('include')) {
      $includes = explode(',', $request->include);
      $allowedIncludes = ['matchSession', 'team'];
      $validIncludes = array_intersect($includes, $allowedIncludes);

      if (!empty($validIncludes)) {
        $query->with($validIncludes);
      }
    }

    return $query;
  }
}
