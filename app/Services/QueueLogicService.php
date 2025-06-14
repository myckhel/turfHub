<?php

namespace App\Services;

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
