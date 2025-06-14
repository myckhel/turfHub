<?php

namespace App\Services;

use App\Models\MatchSession;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

class MatchSessionService
{
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
    $allowedIncludes = ['turf', 'teams', 'gameMatches', 'queueLogic'];
    $validIncludes = array_intersect($includes, $allowedIncludes);

    if (!empty($validIncludes)) {
      $matchSession->load($validIncludes);
    }

    return $matchSession;
  }

  /**
   * Create a new match session.
   */
  public function createMatchSession(array $data): MatchSession
  {
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
   * Build query for filtering match sessions.
   */
  private function buildMatchSessionQuery(Request $request): Builder
  {
    $query = MatchSession::query();

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
      $allowedIncludes = ['turf', 'teams', 'gameMatches', 'queueLogic'];
      $validIncludes = array_intersect($includes, $allowedIncludes);

      if (!empty($validIncludes)) {
        $query->with($validIncludes);
      }
    }

    return $query;
  }
}
