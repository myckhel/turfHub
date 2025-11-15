<?php

namespace App\Jobs;

use App\Events\StagePromoted;
use App\Models\Stage;
use App\Services\PromotionService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PromoteStageJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 2;
    public int $timeout = 300;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public int $stageId,
        public ?array $manualOverride = null
    ) {
        $this->onQueue('tournament');
    }

    /**
     * Execute the job.
     */
    public function handle(PromotionService $promotionService): void
    {
        $stage = Stage::with(['promotion', 'nextStage'])->findOrFail($this->stageId);

        if (!$stage->promotion || !$stage->nextStage) {
            Log::warning("Stage {$this->stageId} has no promotion rule or next stage configured");
            return;
        }

        Log::info("Executing promotion for stage {$this->stageId}");

        DB::beginTransaction();
        try {
            $promotedTeams = $promotionService->executePromotion($stage, $this->manualOverride);

            DB::commit();

            Log::info("Promoted {$promotedTeams->count()} teams from stage {$this->stageId} to stage {$stage->nextStage->id}");

            // Fire event
            event(new StagePromoted($stage, $promotedTeams, $stage->nextStage));

            // Dispatch fixture generation for next stage
            GenerateFixturesJob::dispatch($stage->nextStage->id);
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error("Failed to promote stage {$this->stageId}: {$e->getMessage()}");
            throw $e;
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error("Promotion job failed for stage {$this->stageId}: {$exception->getMessage()}");
    }
}
