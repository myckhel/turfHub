<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

class NotifyTeamsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $timeout = 60;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public Collection $teams,
        public string $notificationType,
        public array $data = []
    ) {
        $this->onQueue('notifications');
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        Log::info("Notifying {$this->teams->count()} teams about {$this->notificationType}");

        foreach ($this->teams as $team) {
            try {
                // TODO: Implement actual notification logic
                // This could be:
                // - Push notifications
                // - Email notifications
                // - In-app notifications
                // - SMS notifications

                Log::info("Notified team {$team->id} about {$this->notificationType}");
            } catch (\Throwable $e) {
                Log::error("Failed to notify team {$team->id}: {$e->getMessage()}");
            }
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error("Failed to notify teams about {$this->notificationType}: {$exception->getMessage()}");
    }
}
