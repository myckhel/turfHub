<?php

namespace App\Jobs\GameMatch;

use App\Models\GameMatch;
use App\Services\MatchSessionService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * Job to process a completed GameMatch.
 *
 * This job is dispatched by the GameMatchObserver when a GameMatch status
 * changes to 'completed'. It handles post-match processing including:
 * - Updating team statistics
 * - Managing queue logic
 * - Creating the next game match if the session is still active
 */
class Completed implements ShouldQueue
{
  use Queueable, InteractsWithQueue, SerializesModels;

  /**
   * The number of times the job may be attempted.
   */
  public int $tries = 3;

  /**
   * The maximum number of seconds the job can run before timing out.
   */
  public int $timeout = 60;

  /**
   * Create a new job instance.
   */
  public function __construct(
    public GameMatch $gameMatch
  ) {
    //
  }

  /**
   * Execute the job.
   */
  public function handle(MatchSessionService $matchSessionService): void
  {
    // Load the match session relationship if not already loaded
    if (!$this->gameMatch->relationLoaded('matchSession')) {
      $this->gameMatch->load('matchSession');
    }

    // Call the service to process match completion and determine next game
    $matchSessionService->postMatchCompleted($this->gameMatch->matchSession, $this->gameMatch);
  }
}
