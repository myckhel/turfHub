<?php

namespace App\Listeners;

use App\Events\RankingsUpdated;
use App\Jobs\PromoteStageJob;
use App\Models\Stage;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Log;

class CheckPromotionEligibilityListener implements ShouldQueue
{
    /**
     * Handle the event.
     */
    public function handle(RankingsUpdated $event): void
    {
        $stage = $event->stage;

        // Check if stage has promotion rule configured
        if (!$stage->promotion || !$stage->nextStage) {
            return;
        }

        // Check if all fixtures in the stage are completed
        if (!$this->areAllFixturesCompleted($stage)) {
            Log::info("Stage {$stage->id} has incomplete fixtures, promotion not triggered");
            return;
        }

        // Check if stage is marked as completed
        if ($stage->status !== 'completed') {
            Log::info("Stage {$stage->id} is not marked as completed, updating status");
            $stage->update(['status' => 'completed']);
        }

        Log::info("Stage {$stage->id} is eligible for promotion, dispatching promotion job");

        PromoteStageJob::dispatch($stage->id);
    }

    /**
     * Check if all fixtures in the stage are completed.
     */
    private function areAllFixturesCompleted(Stage $stage): bool
    {
        $totalFixtures = $stage->fixtures()->count();
        $completedFixtures = $stage->fixtures()->where('status', 'completed')->count();

        return $totalFixtures > 0 && $totalFixtures === $completedFixtures;
    }

    /**
     * Handle a listener failure.
     */
    public function failed(RankingsUpdated $event, \Throwable $exception): void
    {
        Log::error("Failed to check promotion eligibility for stage {$event->stage->id}: {$exception->getMessage()}");
    }
}
