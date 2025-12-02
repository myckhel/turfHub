<?php

namespace App\Utils;

use Illuminate\Support\Collection;

class RankingCalculator
{
  /**
   * Calculate ranking stats from match results.
   *
   * @param Collection<int, object{first_team_id: int, second_team_id: int, first_team_score: int, second_team_score: int}> $fixtures Collection of completed fixtures
   * @param array<int> $teamIds Array of team IDs to rank
   * @param array{win: int, draw: int, loss: int}|null $scoringSystem Scoring system (default: win=3, draw=1, loss=0)
   * @return Collection<int, array{team_id: int, played: int, wins: int, draws: int, losses: int, goals_for: int, goals_against: int, goal_difference: int, points: int}> Collection of ranking data
   */
  public static function calculate(Collection $fixtures, array $teamIds, array $scoringSystem = null): Collection
  {
    $scoringSystem = $scoringSystem ?? config('tournament.scoring.default', [
      'win' => 3,
      'draw' => 1,
      'loss' => 0,
    ]);

    $rankings = collect();

    foreach ($teamIds as $teamId) {
      $stats = self::calculateTeamStats($fixtures, $teamId, $scoringSystem);
      $rankings->push($stats);
    }

    // Sort by points, then goal difference, then goals for
    return $rankings->sortByDesc(function ($team) {
      return [
        $team['points'],
        $team['goal_difference'],
        $team['goals_for'],
      ];
    })->values();
  }

  /**
   * Calculate stats for a single team.
   *
   * @param Collection<int, object{first_team_id: int, second_team_id: int, first_team_score: int, second_team_score: int}> $fixtures
   * @param int $teamId
   * @param array{win: int, draw: int, loss: int} $scoringSystem
   * @return array{team_id: int, played: int, wins: int, draws: int, losses: int, goals_for: int, goals_against: int, goal_difference: int, points: int}
   */
  private static function calculateTeamStats(Collection $fixtures, int $teamId, array $scoringSystem): array
  {
    $played = 0;
    $wins = 0;
    $draws = 0;
    $losses = 0;
    $goalsFor = 0;
    $goalsAgainst = 0;

    foreach ($fixtures as $fixture) {
      if (!isset($fixture->first_team_score, $fixture->second_team_score)) {
        continue; // Skip if no score
      }

      $isFirstTeam = $fixture->first_team_id === $teamId;
      $isSecondTeam = $fixture->second_team_id === $teamId;

      if (!$isFirstTeam && !$isSecondTeam) {
        continue; // Team not in this match
      }

      $played++;

      if ($isFirstTeam) {
        $teamScore = $fixture->first_team_score;
        $opponentScore = $fixture->second_team_score;
      } else {
        $teamScore = $fixture->second_team_score;
        $opponentScore = $fixture->first_team_score;
      }

      $goalsFor += $teamScore;
      $goalsAgainst += $opponentScore;

      if ($teamScore > $opponentScore) {
        $wins++;
      } elseif ($teamScore < $opponentScore) {
        $losses++;
      } else {
        $draws++;
      }
    }

    $points = ($wins * $scoringSystem['win']) +
      ($draws * $scoringSystem['draw']) +
      ($losses * $scoringSystem['loss']);

    return [
      'team_id' => $teamId,
      'played' => $played,
      'wins' => $wins,
      'draws' => $draws,
      'losses' => $losses,
      'goals_for' => $goalsFor,
      'goals_against' => $goalsAgainst,
      'goal_difference' => $goalsFor - $goalsAgainst,
      'points' => $points,
    ];
  }

  /**
   * Apply tie-breaker rules to teams with same points.
   *
   * @param Collection $rankings Rankings to apply tie-breakers to
   * @param array $tieBreakers Array of tie-breaker rule class names
   * @param Collection $fixtures Fixtures for head-to-head calculations
   * @return Collection Sorted rankings
   */
  public static function applyTieBreakers(Collection $rankings, array $tieBreakers, Collection $fixtures): Collection
  {
    // Group teams by points
    $groupedByPoints = $rankings->groupBy('points');

    $sorted = collect();

    foreach ($groupedByPoints as $points => $teams) {
      if ($teams->count() === 1) {
        $sorted->push($teams->first());
        continue;
      }

      // Apply tie-breakers in order
      $tiedTeams = $teams;
      foreach ($tieBreakers as $tieBreakerClass) {
        if ($tiedTeams->count() === 1) {
          break;
        }

        if (class_exists($tieBreakerClass)) {
          $tieBreaker = new $tieBreakerClass();
          $tiedTeams = $tieBreaker->apply($tiedTeams, $fixtures);
        }
      }

      foreach ($tiedTeams as $team) {
        $sorted->push($team);
      }
    }

    // Add rank numbers
    return $sorted->values()->map(function ($team, $index) {
      $team['rank'] = $index + 1;
      return $team;
    });
  }
}
