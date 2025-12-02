<?php

namespace App\Listeners;

use App\Events\MatchCompleted;
use App\Jobs\ComputeRankingsJob;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Log;

class RecalculateRankingsListener implements ShouldQueue
{
    /**
     * Handle the event.
     */
    public function handle(MatchCompleted $event): void
    {
        if (!$event->fixture->stage_id) {
            Log::info("Match {$event->fixture->id} has no stage, skipping ranking recalculation");
            return;
        }

        Log::info("Match completed, dispatching ranking computation for stage {$event->fixture->stage_id}");

        ComputeRankingsJob::dispatch($event->fixture->stage_id);
    }

    /**
     * Handle a listener failure.
     */
    public function failed(MatchCompleted $event, \Throwable $exception): void
    {
        Log::error("Failed to dispatch ranking computation for match {$event->fixture->id}: {$exception->getMessage()}");
    }
}
