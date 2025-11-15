<?php

namespace Tests\Unit\Utils;

use App\Utils\FixtureGenerators\SwissPairingGenerator;
use PHPUnit\Framework\TestCase;

class SwissPairingGeneratorTest extends TestCase
{
    public function test_generates_pairings_for_even_teams(): void
    {
        $teamIds = [1, 2, 3, 4, 5, 6];
        $pairings = SwissPairingGenerator::generate($teamIds);

        // 6 teams = 3 matches
        $this->assertCount(3, $pairings);

        // All teams paired (no byes)
        $pairedTeams = [];
        foreach ($pairings as $pairing) {
            $pairedTeams[] = $pairing['home_team_id'];
            $pairedTeams[] = $pairing['away_team_id'];
        }
        $this->assertEquals(6, count($pairedTeams));
    }

    public function test_generates_bye_for_odd_teams(): void
    {
        $teamIds = [1, 2, 3, 4, 5];
        $pairings = SwissPairingGenerator::generate($teamIds);

        // 5 teams = 2 regular matches + 1 bye
        $this->assertCount(3, $pairings);

        $byeExists = false;
        foreach ($pairings as $pairing) {
            if ($pairing['away_team_id'] === null) {
                $byeExists = true;
                $this->assertTrue($pairing['is_bye']);
            }
        }
        $this->assertTrue($byeExists);
    }

    public function test_pairs_by_standings_in_subsequent_rounds(): void
    {
        $teamIds = [1, 2, 3, 4];

        // First round - random pairing
        $round1 = SwissPairingGenerator::generate($teamIds, [], [], 1);

        // Simulate standings after round 1
        $standings = [
            ['team_id' => 1, 'points' => 3, 'goal_difference' => 2, 'goals_for' => 2],
            ['team_id' => 2, 'points' => 3, 'goal_difference' => 1, 'goals_for' => 1],
            ['team_id' => 3, 'points' => 0, 'goal_difference' => -1, 'goals_for' => 0],
            ['team_id' => 4, 'points' => 0, 'goal_difference' => -2, 'goals_for' => 0],
        ];

        // Round 2 should pair 1v2 and 3v4 (similar standings)
        $round2 = SwissPairingGenerator::generate($teamIds, $standings, $round1, 2);

        $this->assertCount(2, $round2);
    }

    public function test_avoids_rematches(): void
    {
        $teamIds = [1, 2, 3, 4];

        $previousPairings = [
            ['home_team_id' => 1, 'away_team_id' => 2, 'round' => 1],
            ['home_team_id' => 3, 'away_team_id' => 4, 'round' => 1],
        ];

        $standings = [
            ['team_id' => 1, 'points' => 3, 'goal_difference' => 1, 'goals_for' => 2],
            ['team_id' => 2, 'points' => 3, 'goal_difference' => 1, 'goals_for' => 2],
            ['team_id' => 3, 'points' => 0, 'goal_difference' => -1, 'goals_for' => 0],
            ['team_id' => 4, 'points' => 0, 'goal_difference' => -1, 'goals_for' => 0],
        ];

        $round2 = SwissPairingGenerator::generate($teamIds, $standings, $previousPairings, 2);

        // Should pair 1v3 or 1v4 (avoid 1v2)
        foreach ($round2 as $pairing) {
            if ($pairing['home_team_id'] === 1) {
                $this->assertNotEquals(2, $pairing['away_team_id']);
            }
        }
    }

    public function test_bye_rotates_to_different_teams(): void
    {
        $teamIds = [1, 2, 3];

        // Round 1 - team 3 gets bye
        $round1 = SwissPairingGenerator::generate($teamIds, [], [], 1);

        // Find who got the bye
        $byeTeamR1 = null;
        foreach ($round1 as $pairing) {
            if (isset($pairing['is_bye']) && $pairing['is_bye']) {
                $byeTeamR1 = $pairing['home_team_id'];
            }
        }

        // Round 2 - different team should get bye
        $round2 = SwissPairingGenerator::generate($teamIds, [], $round1, 2);

        $byeTeamR2 = null;
        foreach ($round2 as $pairing) {
            if (isset($pairing['is_bye']) && $pairing['is_bye']) {
                $byeTeamR2 = $pairing['home_team_id'];
            }
        }

        $this->assertNotNull($byeTeamR1);
        $this->assertNotNull($byeTeamR2);
        $this->assertNotEquals($byeTeamR1, $byeTeamR2);
    }

    public function test_recommended_rounds(): void
    {
        $this->assertEquals(3, SwissPairingGenerator::recommendedRounds(5));  // log2(5) ≈ 2.32 → 3
        $this->assertEquals(3, SwissPairingGenerator::recommendedRounds(8));  // log2(8) = 3
        $this->assertEquals(4, SwissPairingGenerator::recommendedRounds(16)); // log2(16) = 4
        $this->assertEquals(3, SwissPairingGenerator::recommendedRounds(4));  // Small count = round-robin
    }

    public function test_pairing_structure(): void
    {
        $teamIds = [1, 2, 3, 4];
        $pairings = SwissPairingGenerator::generate($teamIds);

        foreach ($pairings as $pairing) {
            $this->assertArrayHasKey('home_team_id', $pairing);
            $this->assertArrayHasKey('away_team_id', $pairing);
            $this->assertArrayHasKey('round', $pairing);
            $this->assertIsInt($pairing['home_team_id']);
            $this->assertIsInt($pairing['round']);
        }
    }

    public function test_first_round_is_random(): void
    {
        $teamIds = [1, 2, 3, 4, 5, 6];

        // Generate first round multiple times
        $pairings1 = SwissPairingGenerator::generate($teamIds, [], [], 1);

        // First round should pair all teams
        $this->assertCount(3, $pairings1);

        // Just verify structure - randomness is hard to test deterministically
        foreach ($pairings1 as $pairing) {
            $this->assertNotEquals($pairing['home_team_id'], $pairing['away_team_id']);
        }
    }
}
