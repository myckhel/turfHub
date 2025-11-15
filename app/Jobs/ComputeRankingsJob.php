<?php

namespace App\Jobs;

use App\Events\RankingsUpdated;
use App\Models\Stage;
use App\Services\RankingService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class ComputeRankingsJob implements ShouldQueue
{
  use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

  public int $tries = 3;
  public int $timeout = 120;

  /**
   * Create a new job instance.
   */
  public function __construct(
    public int $stageId
  ) {
    $this->onQueue('tournament');
  }

  /**
   * Execute the job.
   */
  public function handle(RankingService $rankingService): void
  {
    $stage = Stage::with(['stageTeams', 'fixtures', 'groups'])->findOrFail($this->stageId);

    Log::info("Computing rankings for stage {$this->stageId}");

    $rankings = $rankingService->computeStageRankings($stage);
    $rankingService->persistRankings($stage, $rankings);

    // Invalidate rankings cache
    Cache::forget("rankings-stage-{$this->stageId}");

    // Also clear group caches for this stage
    foreach ($stage->groups as $group) {
      Cache::forget("rankings-group-{$group->id}");
    }

    Log::info("Rankings computed for stage {$this->stageId}: {$rankings->count()} teams ranked");

    // Fire event
    event(new RankingsUpdated($stage, $rankings));
  }

  /**
   * Handle a job failure.
   */
  public function failed(\Throwable $exception): void
  {
    Log::error("Failed to compute rankings for stage {$this->stageId}: {$exception->getMessage()}");
  }
}
