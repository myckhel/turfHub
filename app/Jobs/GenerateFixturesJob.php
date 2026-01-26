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

    // If no teams assigned to the stage and it's the first stage, assign tournament teams
    if (! $stage->stageTeams()->exists() && $stage->order === 1) {
      $stageTeamData = $stage->tournament->teams()->pluck('id')->map(fn($teamId) => ['team_id' => $teamId])->toArray();
      if (! empty($stageTeamData)) {
        $stage->stageTeams()->createMany($stageTeamData);
        Log::info('Assigned ' . count($stageTeamData) . " tournament teams to first stage {$this->stageId}");
      }
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
