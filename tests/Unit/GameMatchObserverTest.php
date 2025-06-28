<?php

namespace Tests\Unit;

use App\Jobs\GameMatch\Completed as GameMatchCompletedJob;
use App\Models\GameMatch;
use App\Models\MatchSession;
use App\Models\Team;
use App\Models\Turf;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class GameMatchObserverTest extends TestCase
{
  use RefreshDatabase;

  protected function setUp(): void
  {
    parent::setUp();
    Queue::fake();
  }

  public function test_observer_dispatches_job_when_status_changes_to_completed(): void
  {
    // Create necessary models
    $user = User::factory()->create();
    $turf = Turf::factory()->create(['owner_id' => $user->id]);
    $matchSession = MatchSession::factory()->create(['turf_id' => $turf->id]);
    $team1 = Team::factory()->create(['match_session_id' => $matchSession->id]);
    $team2 = Team::factory()->create(['match_session_id' => $matchSession->id]);

    // Create a game match
    $gameMatch = GameMatch::factory()->create([
      'match_session_id' => $matchSession->id,
      'first_team_id' => $team1->id,
      'second_team_id' => $team2->id,
      'status' => 'in_progress',
    ]);

    // Update the status to completed - this should trigger the observer and dispatch the job
    $gameMatch->update([
      'status' => 'completed',
      'first_team_score' => 2,
      'second_team_score' => 1,
    ]);

    // Assert that the job was dispatched
    Queue::assertPushed(GameMatchCompletedJob::class, function ($job) use ($gameMatch) {
      return $job->gameMatch->id === $gameMatch->id;
    });
  }

  public function test_observer_does_not_dispatch_job_when_status_is_not_completed(): void
  {
    // Create necessary models
    $user = User::factory()->create();
    $turf = Turf::factory()->create(['owner_id' => $user->id]);
    $matchSession = MatchSession::factory()->create(['turf_id' => $turf->id]);
    $team1 = Team::factory()->create(['match_session_id' => $matchSession->id]);
    $team2 = Team::factory()->create(['match_session_id' => $matchSession->id]);

    // Create a game match
    $gameMatch = GameMatch::factory()->create([
      'match_session_id' => $matchSession->id,
      'first_team_id' => $team1->id,
      'second_team_id' => $team2->id,
      'status' => 'upcoming',
    ]);

    // Update to in_progress (not completed) - this should NOT trigger the observer
    $gameMatch->update([
      'status' => 'in_progress',
    ]);

    // Assert that no job was dispatched
    Queue::assertNotPushed(GameMatchCompletedJob::class);
  }

  public function test_observer_does_not_dispatch_job_when_status_was_already_completed(): void
  {
    // Create necessary models
    $user = User::factory()->create();
    $turf = Turf::factory()->create(['owner_id' => $user->id]);
    $matchSession = MatchSession::factory()->create(['turf_id' => $turf->id]);
    $team1 = Team::factory()->create(['match_session_id' => $matchSession->id]);
    $team2 = Team::factory()->create(['match_session_id' => $matchSession->id]);

    // Create a game match that's already completed
    $gameMatch = GameMatch::factory()->create([
      'match_session_id' => $matchSession->id,
      'first_team_id' => $team1->id,
      'second_team_id' => $team2->id,
      'status' => 'completed',
    ]);

    // Update other fields but keep status as completed - this should NOT trigger the observer
    $gameMatch->update([
      'first_team_score' => 3,
      'second_team_score' => 2,
    ]);

    // Assert that no job was dispatched since status didn't change
    Queue::assertNotPushed(GameMatchCompletedJob::class);
  }
}
