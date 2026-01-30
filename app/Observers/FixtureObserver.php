<?php

namespace App\Observers;

use App\Events\MatchCompleted;
use App\Models\GameMatch;
use Illuminate\Support\Facades\Log;

class FixtureObserver
{
  /**
   * Handle the GameMatch "updated" event.
   */
  public function updated(GameMatch $fixture): void
  {
    // Check if this is a tournament fixture
    if (!$fixture->stage_id) {
      return;
    }

    // Check if result was just submitted (scores changed)
    if (($fixture->isDirty('first_team_score') || $fixture->isDirty('second_team_score')) &&
      $fixture->first_team_score !== null && $fixture->second_team_score !== null
    ) {
      Log::info("Tournament fixture {$fixture->id} result submitted");

      // Determine winner
      $winnerId = $this->determineWinner($fixture);

      // Update winner if not already set
      if ($fixture->winning_team_id !== $winnerId) {
        $fixture->updateQuietly(['winning_team_id' => $winnerId]);
      }

      // Update status to completed if not already
      if ($fixture->status !== 'completed') {
        $fixture->updateQuietly(['status' => 'completed']);
      }

      // Dispatch match completed event
      event(new MatchCompleted(
        $fixture,
        $winnerId,
        $fixture->first_team_score,
        $fixture->second_team_score
      ));
    }

    // Check if status changed to completed
    if ($fixture->isDirty('status') && $fixture->status === 'completed') {
      Log::info("Tournament fixture {$fixture->id} status changed to completed");
    }
  }

  /**
   * Determine the winner of a match based on score.
   */
  private function determineWinner(GameMatch $fixture): ?int
  {
    if ($fixture->first_team_score === null || $fixture->second_team_score === null) {
      return null;
    }

    if ($fixture->first_team_score > $fixture->second_team_score) {
      return $fixture->first_team_id;
    } elseif ($fixture->second_team_score > $fixture->first_team_score) {
      return $fixture->second_team_id;
    }

    // It's a draw
    return null;
  }
}
