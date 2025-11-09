<?php

namespace Tests\Unit\Jobs\GameMatch;

use App\Jobs\GameMatch\Completed as GameMatchCompletedJob;
use App\Models\GameMatch;
use App\Models\MatchSession;
use App\Models\Team;
use App\Models\Turf;
use App\Models\User;
use App\Services\MatchSessionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;
use Tests\TestCase;

class CompletedTest extends TestCase
{
  use RefreshDatabase;

  public function test_job_calls_match_session_service_post_match_completed(): void
  {
    // Create necessary models
    $user = User::factory()->create();
    $turf = Turf::factory()->create(['owner_id' => $user->id]);
    $matchSession = MatchSession::factory()->create(['turf_id' => $turf->id]);

    // Create players for the turf
    $player1 = \App\Models\Player::factory()->create(['turf_id' => $turf->id]);
    $player2 = \App\Models\Player::factory()->create(['turf_id' => $turf->id]);

    $team1 = Team::factory()->create([
      'match_session_id' => $matchSession->id,
      'captain_id' => $player1->id,
    ]);
    $team2 = Team::factory()->create([
      'match_session_id' => $matchSession->id,
      'captain_id' => $player2->id,
    ]);

    $gameMatch = GameMatch::factory()->create([
      'match_session_id' => $matchSession->id,
      'first_team_id' => $team1->id,
      'second_team_id' => $team2->id,
      'status' => 'completed',
    ]);

    // Mock the MatchSessionService
    $mockService = Mockery::mock(MatchSessionService::class);
    $mockService->shouldReceive('postMatchCompleted')
      ->once()
      ->with(Mockery::type(MatchSession::class), Mockery::type(GameMatch::class));

    // Create and handle the job
    $job = new GameMatchCompletedJob($gameMatch);
    $job->handle($mockService);

    // The mock expectation will verify that postMatchCompleted was called
    $this->assertTrue(true); // Assertion to satisfy PHPUnit
  }

  public function test_job_handles_exceptions_gracefully(): void
  {
    // Create necessary models
    $user = User::factory()->create();
    $turf = Turf::factory()->create(['owner_id' => $user->id]);
    $matchSession = MatchSession::factory()->create(['turf_id' => $turf->id]);

    // Create players for the turf
    $player1 = \App\Models\Player::factory()->create(['turf_id' => $turf->id]);
    $player2 = \App\Models\Player::factory()->create(['turf_id' => $turf->id]);

    $team1 = Team::factory()->create([
      'match_session_id' => $matchSession->id,
      'captain_id' => $player1->id,
    ]);
    $team2 = Team::factory()->create([
      'match_session_id' => $matchSession->id,
      'captain_id' => $player2->id,
    ]);

    $gameMatch = GameMatch::factory()->create([
      'match_session_id' => $matchSession->id,
      'first_team_id' => $team1->id,
      'second_team_id' => $team2->id,
      'status' => 'completed',
    ]);

    // Mock the MatchSessionService to throw an exception
    $mockService = Mockery::mock(MatchSessionService::class);
    $mockService->shouldReceive('postMatchCompleted')
      ->once()
      ->andThrow(new \Exception('Service error'));

    // Create the job
    $job = new GameMatchCompletedJob($gameMatch);

    // Expect the job to re-throw the exception for retry mechanism
    $this->expectException(\Exception::class);
    $this->expectExceptionMessage('Service error');

    $job->handle($mockService);
  }

  protected function tearDown(): void
  {
    Mockery::close();
    parent::tearDown();
  }
}
