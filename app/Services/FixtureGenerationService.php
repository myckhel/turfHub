<?php

namespace App\Services;

use App\Events\FixturesGenerated;
use App\Models\GameMatch;
use App\Models\Stage;
use App\Services\TournamentStrategies\StageStrategyFactory;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Log;

class FixtureGenerationService
{
  public function simulateFixtures(Stage $stage): array
  {
    $strategy = StageStrategyFactory::make($stage->stage_type->value);

    return $strategy->generateFixtures($stage);
  }

  public function generateFixtures(Stage $stage, bool $autoSchedule = true): Collection
  {
    return DB::transaction(function () use ($stage, $autoSchedule) {
      $strategy = StageStrategyFactory::make($stage->stage_type->value);
      $fixturesData = $strategy->generateFixtures($stage);

      $startDate = $stage->tournament->starts_at ?? now();
      $settings = $stage->settings ?? [];
      $matchDuration = $settings['match_duration'] ?? 12;
      $matchInterval = $settings['match_interval'] ?? 15; // minutes between matches

      $fixtures = collect();
      $currentTime = Carbon::parse($startDate);

      foreach ($fixturesData as $fixtureData) {
        $fixture = GameMatch::create([
          'stage_id' => $fixtureData['stage_id'],
          'group_id' => $fixtureData['group_id'] ?? null,
          'match_session_id' => null, // Tournament fixtures don't have session
          'first_team_id' => $fixtureData['first_team_id'],
          'second_team_id' => $fixtureData['second_team_id'],
          'starts_at' => $autoSchedule ? $currentTime : null,
          'duration' => $matchDuration,
          'status' => 'upcoming',
          'metadata' => $fixtureData['metadata'] ?? null,
        ]);

        if ($autoSchedule) {
          $currentTime->addMinutes($matchDuration + $matchInterval);
        }

        $fixtures->push($fixture);
      }

      Event::dispatch(new FixturesGenerated($stage, $fixtures));

      return $fixtures;
    });
  }

  public function manualCreateFixture(Stage $stage, array $data): GameMatch
  {
    return GameMatch::create([
      'stage_id' => $stage->id,
      'group_id' => $data['group_id'] ?? null,
      'match_session_id' => null,
      'first_team_id' => $data['first_team_id'],
      'second_team_id' => $data['second_team_id'],
      'starts_at' => $data['starts_at'] ?? null,
      'duration' => $data['duration'] ?? ($stage->settings['match_duration'] ?? 12),
      'status' => $data['status'] ?? 'upcoming',
    ]);
  }

  public function scheduleFixtures(array $fixtureIds, Carbon $startDate, int $intervalMinutes): void
  {
    DB::transaction(function () use ($fixtureIds, $startDate, $intervalMinutes) {
      $currentTime = $startDate->copy();

      foreach ($fixtureIds as $fixtureId) {
        $fixture = GameMatch::findOrFail($fixtureId);
        $duration = $fixture->duration ?? 12;

        $fixture->update(['starts_at' => $currentTime]);

        $currentTime->addMinutes($duration + $intervalMinutes);
      }
    });
  }

  public function rescheduleFixture(GameMatch $fixture, Carbon $newStartTime): GameMatch
  {
    $fixture->update(['starts_at' => $newStartTime]);

    return $fixture;
  }

  public function deleteStageFixtures(Stage $stage): int
  {
    return $stage->fixtures()->delete();
  }

  public function swapTeams(GameMatch $fixture, int $team1Id, int $team2Id): GameMatch
  {
    if ($fixture->first_team_id === $team1Id) {
      $fixture->update([
        'first_team_id' => $team2Id,
        'second_team_id' => $team1Id,
      ]);
    } elseif ($fixture->first_team_id === $team2Id) {
      $fixture->update([
        'first_team_id' => $team1Id,
        'second_team_id' => $team2Id,
      ]);
    }

    return $fixture->fresh();
  }
}
