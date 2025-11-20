<?php

namespace Tests\Unit\Utils\TieBreakers;

use App\Utils\TieBreakers\GoalDifferenceTieBreaker;
use App\Utils\TieBreakers\GoalsForTieBreaker;
use App\Utils\TieBreakers\HeadToHeadTieBreaker;
use Illuminate\Support\Collection;
use PHPUnit\Framework\TestCase;

class TieBreakersTest extends TestCase
{
    public function test_goal_difference_tie_breaker(): void
    {
        $teams = collect([
            ['team_id' => 1, 'points' => 6, 'goal_difference' => 3, 'goals_for' => 8],
            ['team_id' => 2, 'points' => 6, 'goal_difference' => 5, 'goals_for' => 10],
            ['team_id' => 3, 'points' => 6, 'goal_difference' => 2, 'goals_for' => 7],
        ]);

        $tieBreaker = new GoalDifferenceTieBreaker();
        $sorted = $tieBreaker->apply($teams, collect());

        $this->assertEquals(2, $sorted[0]['team_id']); // Best GD: +5
        $this->assertEquals(1, $sorted[1]['team_id']); // Second: +3
        $this->assertEquals(3, $sorted[2]['team_id']); // Third: +2
    }

    public function test_goals_for_tie_breaker(): void
    {
        $teams = collect([
            ['team_id' => 1, 'points' => 6, 'goal_difference' => 2, 'goals_for' => 8],
            ['team_id' => 2, 'points' => 6, 'goal_difference' => 2, 'goals_for' => 12],
            ['team_id' => 3, 'points' => 6, 'goal_difference' => 2, 'goals_for' => 5],
        ]);

        $tieBreaker = new GoalsForTieBreaker();
        $sorted = $tieBreaker->apply($teams, collect());

        $this->assertEquals(2, $sorted[0]['team_id']); // Most goals: 12
        $this->assertEquals(1, $sorted[1]['team_id']); // Second: 8
        $this->assertEquals(3, $sorted[2]['team_id']); // Third: 5
    }

    public function test_head_to_head_tie_breaker(): void
    {
        // Teams 1 and 2 both have 6 points
        // Team 1 beat Team 2 head-to-head
        $teams = collect([
            ['team_id' => 1, 'points' => 6, 'goal_difference' => 3, 'goals_for' => 8],
            ['team_id' => 2, 'points' => 6, 'goal_difference' => 3, 'goals_for' => 8],
        ]);

        $fixtures = collect([
            (object) ['home_team_id' => 1, 'away_team_id' => 2, 'score' => ['home' => 2, 'away' => 1]],
            (object) ['home_team_id' => 1, 'away_team_id' => 3, 'score' => ['home' => 3, 'away' => 0]],
            (object) ['home_team_id' => 2, 'away_team_id' => 3, 'score' => ['home' => 4, 'away' => 0]],
        ]);

        $tieBreaker = new HeadToHeadTieBreaker();
        $sorted = $tieBreaker->apply($teams, $fixtures);

        // Team 1 won head-to-head against Team 2
        $this->assertEquals(1, $sorted[0]['team_id']);
        $this->assertEquals(2, $sorted[1]['team_id']);
    }

    public function test_head_to_head_with_multiple_matches(): void
    {
        $teams = collect([
            ['team_id' => 1, 'points' => 6],
            ['team_id' => 2, 'points' => 6],
        ]);

        // Home and away matches
        $fixtures = collect([
            (object) ['home_team_id' => 1, 'away_team_id' => 2, 'score' => ['home' => 2, 'away' => 1]],
            (object) ['home_team_id' => 2, 'away_team_id' => 1, 'score' => ['home' => 1, 'away' => 1]],
        ]);

        $tieBreaker = new HeadToHeadTieBreaker();
        $sorted = $tieBreaker->apply($teams, $fixtures);

        // Team 1 has 4 points in head-to-head (W + D), Team 2 has 1 point (D)
        $this->assertEquals(1, $sorted[0]['team_id']);
    }

    public function test_head_to_head_ignores_non_relevant_matches(): void
    {
        // Only Teams 1 and 2 are tied
        $teams = collect([
            ['team_id' => 1, 'points' => 6],
            ['team_id' => 2, 'points' => 6],
        ]);

        $fixtures = collect([
            (object) ['home_team_id' => 1, 'away_team_id' => 2, 'score' => ['home' => 2, 'away' => 1]],
            (object) ['home_team_id' => 1, 'away_team_id' => 3, 'score' => ['home' => 5, 'away' => 0]], // Should be ignored
            (object) ['home_team_id' => 2, 'away_team_id' => 3, 'score' => ['home' => 3, 'away' => 0]], // Should be ignored
        ]);

        $tieBreaker = new HeadToHeadTieBreaker();
        $sorted = $tieBreaker->apply($teams, $fixtures);

        // Only the 1v2 match should count
        $this->assertEquals(1, $sorted[0]['team_id']);
    }

    public function test_head_to_head_with_three_way_tie(): void
    {
        $teams = collect([
            ['team_id' => 1, 'points' => 6],
            ['team_id' => 2, 'points' => 6],
            ['team_id' => 3, 'points' => 6],
        ]);

        $fixtures = collect([
            (object) ['home_team_id' => 1, 'away_team_id' => 2, 'score' => ['home' => 2, 'away' => 0]], // Team 1 wins
            (object) ['home_team_id' => 2, 'away_team_id' => 3, 'score' => ['home' => 1, 'away' => 0]], // Team 2 wins
            (object) ['home_team_id' => 3, 'away_team_id' => 1, 'score' => ['home' => 1, 'away' => 1]], // Draw
        ]);

        $tieBreaker = new HeadToHeadTieBreaker();
        $sorted = $tieBreaker->apply($teams, $fixtures);

        // Team 1: 4 pts (W + D), Team 2: 3 pts (W), Team 3: 1 pt (D)
        $this->assertEquals(1, $sorted[0]['team_id']);
        $this->assertEquals(2, $sorted[1]['team_id']);
        $this->assertEquals(3, $sorted[2]['team_id']);
    }
}
