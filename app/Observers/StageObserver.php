<?php

namespace App\Observers;

use App\Enums\StageStatus;
use App\Models\Stage;
use Illuminate\Support\Facades\Log;

class StageObserver
{
    /**
     * Handle the Stage "updated" event.
     */
    public function updated(Stage $stage): void
    {
        // Check if status changed
        if ($stage->isDirty('status')) {
            $oldStatus = $stage->getOriginal('status');
            $newStatus = $stage->status;

            $oldStatusValue = $oldStatus instanceof StageStatus ? $oldStatus->value : $oldStatus;
            $newStatusValue = $newStatus instanceof StageStatus ? $newStatus->value : $newStatus;

            Log::info("Stage {$stage->id} status changed from {$oldStatusValue} to {$newStatusValue}");

            // Handle status transitions
            match ($newStatus) {
                StageStatus::ACTIVE => $this->handleStageActivated($stage),
                StageStatus::COMPLETED => $this->handleStageCompleted($stage),
                StageStatus::CANCELLED => $this->handleStageCancelled($stage),
                default => null,
            };
        }
    }

    /**
     * Handle stage activated.
     */
    private function handleStageActivated(Stage $stage): void
    {
        Log::info("Stage {$stage->id} ({$stage->name}) has been activated");

        // You could trigger notifications here
        // Or auto-generate fixtures if not already generated
    }

    /**
     * Handle stage completed.
     */
    private function handleStageCompleted(Stage $stage): void
    {
        Log::info("Stage {$stage->id} ({$stage->name}) has been completed");

        // Stage completion is already handled by CheckPromotionEligibilityListener
        // This is just for logging and potential additional actions
    }

    /**
     * Handle stage cancelled.
     */
    private function handleStageCancelled(Stage $stage): void
    {
        Log::info("Stage {$stage->id} ({$stage->name}) has been cancelled");

        // Cancel all pending fixtures
        $stage->fixtures()
            ->whereIn('status', ['scheduled', 'upcoming'])
            ->update(['status' => 'cancelled']);
    }

    /**
     * Handle the Stage "deleting" event.
     */
    public function deleting(Stage $stage): void
    {
        Log::warning("Stage {$stage->id} ({$stage->name}) is being deleted");

        // Cascade delete related data
        $stage->stageTeams()->delete();
        $stage->rankings()->delete();
        $stage->fixtures()->delete();

        if ($stage->promotion) {
            $stage->promotion->delete();
        }
    }
}
