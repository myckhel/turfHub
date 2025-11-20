<?php

namespace App\Jobs;

use App\Models\Stage;
use App\Services\FixtureGenerationService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class GenerateFixturesJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $timeout = 300;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public int $stageId,
        public bool $autoSchedule = true
    ) {
        $this->onQueue('tournament');
    }

    /**
     * Execute the job.
     */
    public function handle(FixtureGenerationService $fixtureService): void
    {
        $stage = Stage::findOrFail($this->stageId);

        // Check if fixtures already generated (idempotency)
        if ($stage->fixtures()->exists()) {
            Log::info("Fixtures already exist for stage {$this->stageId}, skipping generation");
            return;
        }

        Log::info("Generating fixtures for stage {$this->stageId}");

        $fixtures = $fixtureService->generateFixtures($stage, $this->autoSchedule);

        Log::info("Generated {$fixtures->count()} fixtures for stage {$this->stageId}");
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error("Failed to generate fixtures for stage {$this->stageId}: {$exception->getMessage()}");
    }
}
