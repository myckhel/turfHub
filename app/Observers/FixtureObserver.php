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

        // Check if result was just submitted (score changed)
        if ($fixture->isDirty('score') && $fixture->score !== null) {
            Log::info("Tournament fixture {$fixture->id} result submitted");

            // Determine winner
            $winnerId = $this->determineWinner($fixture);

            // Update winner if not already set
            if ($fixture->winner_team_id !== $winnerId) {
                $fixture->updateQuietly(['winner_team_id' => $winnerId]);
            }

            // Update status to completed if not already
            if ($fixture->status !== 'completed') {
                $fixture->updateQuietly(['status' => 'completed']);
            }

            // Dispatch match completed event
            event(new MatchCompleted(
                $fixture,
                $winnerId,
                $fixture->score ?? []
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
        $score = $fixture->score;

        if (!$score || !isset($score['home'], $score['away'])) {
            return null;
        }

        if ($score['home'] > $score['away']) {
            return $fixture->home_team_id;
        } elseif ($score['away'] > $score['home']) {
            return $fixture->away_team_id;
        }

        // It's a draw
        return null;
    }
}
