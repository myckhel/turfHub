<?php

namespace App\Services;

use App\Models\Turf;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

class TurfService
{
  /**
   * Get filtered and paginated turfs.
   */
  public function getTurfs(Request $request): LengthAwarePaginator
  {
    $query = $this->buildTurfQuery($request);

    return $query->paginate($request->get('per_page', 15));
  }

  /**
   * Get a single turf with optional relationships.
   */
  public function getTurfWithRelations(Turf $turf, array $includes = []): Turf
  {
    $allowedIncludes = ['owner', 'players', 'matchSessions', 'activeMatchSessions'];
    $validIncludes = array_intersect($includes, $allowedIncludes);

    if (!empty($validIncludes)) {
      $turf->load($validIncludes);
    }

    return $turf;
  }

  /**
   * Create a new turf.
   */
  public function createTurf(array $data): Turf
  {
    return Turf::create($data);
  }

  /**
   * Update an existing turf.
   */
  public function updateTurf(Turf $turf, array $data): Turf
  {
    $turf->update($data);

    return $turf;
  }

  /**
   * Delete a turf.
   */
  public function deleteTurf(Turf $turf): bool
  {
    return $turf->delete();
  }

  /**
   * Build query for filtering turfs.
   */
  private function buildTurfQuery(Request $request): Builder
  {
    $query = Turf::query();

    // Filter by owner
    if ($request->filled('owner_id')) {
      $query->where('owner_id', $request->owner_id);
    }

    // Filter by active status
    if ($request->filled('is_active')) {
      $query->where('is_active', $request->boolean('is_active'));
    }

    // Filter by membership requirement
    if ($request->filled('requires_membership')) {
      $query->where('requires_membership', $request->boolean('requires_membership'));
    }

    // Search by name or location
    if ($request->filled('search')) {
      $search = $request->search;
      $query->where(function ($q) use ($search) {
        $q->where('name', 'LIKE', "%{$search}%")
          ->orWhere('location', 'LIKE', "%{$search}%");
      });
    }

    // Load relationships if requested
    if ($request->filled('include')) {
      $includes = explode(',', $request->include);
      $allowedIncludes = ['owner', 'players', 'matchSessions', 'activeMatchSessions'];
      $validIncludes = array_intersect($includes, $allowedIncludes);

      if (!empty($validIncludes)) {
        $query->with($validIncludes);
      }
    }

    return $query;
  }
}
