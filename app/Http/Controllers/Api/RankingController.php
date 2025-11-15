<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\RankingCollection;
use App\Jobs\ComputeRankingsJob;
use App\Models\Group;
use App\Models\Stage;
use App\Services\RankingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Gate;

class RankingController extends Controller
{
  public function __construct(
    private readonly RankingService $rankingService
  ) {}

  /**
   * Get rankings for a stage.
   */
  public function index(Stage $stage): RankingCollection
  {
    Gate::authorize('view', $stage->tournament);

    $rankings = Cache::remember("rankings-stage-{$stage->id}", 300, function () use ($stage) {
      return $stage->rankings()
        ->with('team')
        ->orderBy('rank')
        ->get();
    });

    return new RankingCollection($rankings);
  }

  /**
   * Get rankings for a specific group.
   */
  public function byGroup(Group $group): RankingCollection
  {
    Gate::authorize('view', $group->stage->tournament);

    $rankings = Cache::remember("rankings-group-{$group->id}", 300, function () use ($group) {
      return $group->rankings()
        ->with('team')
        ->orderBy('rank')
        ->get();
    });

    return new RankingCollection($rankings);
  }

  /**
   * Force recalculation of stage rankings.
   */
  public function refresh(Stage $stage): JsonResponse
  {
    Gate::authorize('update', $stage->tournament);

    ComputeRankingsJob::dispatch($stage->id);

    return response()->json(['message' => 'Ranking recalculation queued']);
  }
}
