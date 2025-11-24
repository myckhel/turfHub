<?php

namespace Tests\Unit\Utils;

use App\Utils\RankingCalculator;
use App\Utils\TieBreakers\GoalDifferenceTieBreaker;
use App\Utils\TieBreakers\GoalsForTieBreaker;
use App\Utils\TieBreakers\HeadToHeadTieBreaker;
use App\Utils\TieBreakers\RandomTieBreaker;
use Illuminate\Support\Collection;
use Tests\TestCase;

class RankingCalculatorTest extends TestCase
{
  public function test_calculates_basic_rankings(): void
  {
    $fixtures = collect([
      (object) ['first_team_id' => 1, 'second_team_id' => 2, 'first_team_score' => 3, 'second_team_score' => 1],
      (object) ['first_team_id' => 3, 'second_team_id' => 4, 'first_team_score' => 2, 'second_team_score' => 2],
    ]);

    $teamIds = [1, 2, 3, 4];
    $rankings = RankingCalculator::calculate($fixtures, $teamIds);

    $this->assertCount(4, $rankings);

    // Team 1 won
    $team1 = $rankings->firstWhere('team_id', 1);
    $this->assertEquals(3, $team1['points']);
    $this->assertEquals(1, $team1['wins']);
    $this->assertEquals(0, $team1['draws']);

    // Team 3 and 4 drew
    $team3 = $rankings->firstWhere('team_id', 3);
    $this->assertEquals(1, $team3['points']);
    $this->assertEquals(1, $team3['draws']);
  }

  public function test_custom_scoring_system(): void
  {
    $fixtures = collect([
      (object) ['first_team_id' => 1, 'second_team_id' => 2, 'first_team_score' => 2, 'second_team_score' => 0],
    ]);

    $teamIds = [1, 2];
    $customScoring = ['win' => 2, 'draw' => 1, 'loss' => 0];
    $rankings = RankingCalculator::calculate($fixtures, $teamIds, $customScoring);

    $team1 = $rankings->firstWhere('team_id', 1);
    $this->assertEquals(2, $team1['points']); // Custom win points
  }

  public function test_goal_statistics(): void
  {
    $fixtures = collect([
      (object) ['first_team_id' => 1, 'second_team_id' => 2, 'first_team_score' => 3, 'second_team_score' => 1],
      (object) ['first_team_id' => 1, 'second_team_id' => 3, 'first_team_score' => 2, 'second_team_score' => 2],
    ]);

    $teamIds = [1, 2, 3];
    $rankings = RankingCalculator::calculate($fixtures, $teamIds);

    $team1 = $rankings->firstWhere('team_id', 1);
    $this->assertEquals(5, $team1['goals_for']); // 3 + 2
    $this->assertEquals(3, $team1['goals_against']); // 1 + 2
    $this->assertEquals(2, $team1['goal_difference']); // 5 - 3
  }

  public function test_applies_tie_breakers(): void
  {
    // Create scenario where teams have same points
    $fixtures = collect([
      (object) ['first_team_id' => 1, 'second_team_id' => 3, 'first_team_score' => 2, 'second_team_score' => 0],
      (object) ['first_team_id' => 2, 'second_team_id' => 4, 'first_team_score' => 1, 'second_team_score' => 0],
    ]);

    $teamIds = [1, 2, 3, 4];
    $rankings = RankingCalculator::calculate($fixtures, $teamIds);

    // Both team 1 and 2 have 3 points, apply tie-breakers
    $tieBreakers = [GoalDifferenceTieBreaker::class, GoalsForTieBreaker::class];
    $sorted = RankingCalculator::applyTieBreakers($rankings, $tieBreakers, $fixtures);

    // Team 1 should be first (better goal difference: +2 vs +1)
    $this->assertEquals(1, $sorted[0]['rank']);
    $this->assertEquals(1, $sorted[0]['team_id']);
  }

  public function test_teams_with_no_matches(): void
  {
    $fixtures = collect([
      (object) ['first_team_id' => 1, 'second_team_id' => 2, 'first_team_score' => 1, 'second_team_score' => 0],
    ]);

    $teamIds = [1, 2, 3]; // Team 3 has no matches
    $rankings = RankingCalculator::calculate($fixtures, $teamIds);

    $team3 = $rankings->firstWhere('team_id', 3);
    $this->assertEquals(0, $team3['points']);
    $this->assertEquals(0, $team3['played']);
  }

  public function test_rankings_sorted_by_points(): void
  {
    $fixtures = collect([
      (object) ['first_team_id' => 1, 'second_team_id' => 2, 'first_team_score' => 3, 'second_team_score' => 0], // Team 1: 3pts
      (object) ['first_team_id' => 3, 'second_team_id' => 4, 'first_team_score' => 1, 'second_team_score' => 1], // Team 3,4: 1pt each
      (object) ['first_team_id' => 2, 'second_team_id' => 3, 'first_team_score' => 2, 'second_team_score' => 0], // Team 2: 3pts
    ]);

    $teamIds = [1, 2, 3, 4];
    $rankings = RankingCalculator::calculate($fixtures, $teamIds);

    // Rankings should be sorted by points descending
    $this->assertEquals(3, $rankings[0]['points']);
    $this->assertEquals(3, $rankings[1]['points']);
    $this->assertLessThan(3, $rankings[2]['points']);
  }
}
