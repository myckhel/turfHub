<?php

namespace App\Services;

use App\Models\MatchEvent;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

class MatchEventService
{
  /**
   * Get filtered and paginated match events.
   */
  public function getMatchEvents(Request $request): LengthAwarePaginator
  {
    $query = $this->buildMatchEventQuery($request);

    return $query->orderBy('minute')->paginate($request->get('per_page', 15));
  }

  /**
   * Get a single match event with optional relationships.
   */
  public function getMatchEventWithRelations(MatchEvent $matchEvent, array $includes = []): MatchEvent
  {
    $allowedIncludes = ['gameMatch', 'player', 'team', 'relatedPlayer'];
    $validIncludes = array_intersect($includes, $allowedIncludes);

    if (!empty($validIncludes)) {
      $matchEvent->load($validIncludes);
    }

    return $matchEvent;
  }

  /**
   * Create a new match event.
   */
  public function createMatchEvent(array $data): MatchEvent
  {
    return MatchEvent::create($data);
  }

  /**
   * Update an existing match event.
   */
  public function updateMatchEvent(MatchEvent $matchEvent, array $data): MatchEvent
  {
    $matchEvent->update($data);

    return $matchEvent;
  }

  /**
   * Delete a match event.
   */
  public function deleteMatchEvent(MatchEvent $matchEvent): bool
  {
    return $matchEvent->delete();
  }

  /**
   * Build query for filtering match events.
   */
  private function buildMatchEventQuery(Request $request): Builder
  {
    $query = MatchEvent::query();

    // Filter by game match
    if ($request->filled('game_match_id')) {
      $query->where('game_match_id', $request->game_match_id);
    }

    // Filter by player
    if ($request->filled('player_id')) {
      $query->where('player_id', $request->player_id);
    }

    // Filter by team
    if ($request->filled('team_id')) {
      $query->where('team_id', $request->team_id);
    }

    // Filter by event type
    if ($request->filled('type')) {
      $query->where('type', $request->type);
    }

    // Filter by minute range
    if ($request->filled('minute_from')) {
      $query->where('minute', '>=', $request->minute_from);
    }

    if ($request->filled('minute_to')) {
      $query->where('minute', '<=', $request->minute_to);
    }

    // Load relationships if requested
    if ($request->filled('include')) {
      $includes = explode(',', $request->include);
      $allowedIncludes = ['gameMatch', 'player', 'team', 'relatedPlayer'];
      $validIncludes = array_intersect($includes, $allowedIncludes);

      if (!empty($validIncludes)) {
        $query->with($validIncludes);
      }
    }

    return $query;
  }
}
