<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\RankingResource;
use App\Jobs\ComputeRankingsJob;
use App\Models\Group;
use App\Models\Stage;
use App\Services\RankingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Cache;

class RankingController extends Controller
{
  public function __construct(
    private readonly RankingService $rankingService
  ) {}

  /**
   * Get rankings for a stage.
   */
  public function index(Stage $stage): AnonymousResourceCollection
  {
    $this->authorize('view', $stage->tournament);

    $rankings = Cache::remember("rankings-stage-{$stage->id}", 300, function () use ($stage) {
      return $stage->rankings()
        ->with(['team', 'group'])
        ->orderBy('rank')
        ->paginate(15);
    });

    return RankingResource::collection($rankings);
  }

  /**
   * Get rankings for a specific group.
   */
  public function byGroup(Group $group): AnonymousResourceCollection
  {
    $this->authorize('view', $group->stage->tournament);

    $rankings = Cache::remember("rankings-group-{$group->id}", 300, function () use ($group) {
      return $group->rankings()
        ->with('team')
        ->orderBy('rank')
        ->paginate(15);
    });

    return RankingResource::collection($rankings);
  }

  /**
   * Force recalculation of stage rankings.
   */
  public function refresh(Stage $stage): JsonResponse
  {
    $this->authorize('update', $stage->tournament);

    ComputeRankingsJob::dispatch($stage->id);

    return response()->json(['message' => 'Ranking recalculation queued']);
  }
}
