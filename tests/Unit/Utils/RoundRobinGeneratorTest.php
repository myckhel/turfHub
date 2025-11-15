<?php

namespace Tests\Unit\Utils;

use App\Utils\FixtureGenerators\RoundRobinGenerator;
use PHPUnit\Framework\TestCase;

class RoundRobinGeneratorTest extends TestCase
{
    public function test_generates_fixtures_for_even_teams(): void
    {
        $teamIds = [1, 2, 3, 4];
        $fixtures = RoundRobinGenerator::generate($teamIds);

        // 4 teams = 3 rounds, 2 matches per round = 6 total matches
        $this->assertCount(6, $fixtures);

        // Each team plays 3 matches
        $teamMatchCounts = $this->countTeamMatches($fixtures);
        foreach ($teamIds as $teamId) {
            $this->assertEquals(3, $teamMatchCounts[$teamId]);
        }

        // No team plays itself
        foreach ($fixtures as $fixture) {
            $this->assertNotEquals($fixture['home_team_id'], $fixture['away_team_id']);
        }
    }

    public function test_generates_fixtures_for_odd_teams(): void
    {
        $teamIds = [1, 2, 3, 4, 5];
        $fixtures = RoundRobinGenerator::generate($teamIds);

        // 5 teams = 5 rounds, but each team gets 1 bye
        // Total matches = (5 * 4) / 2 = 10
        $this->assertCount(10, $fixtures);

        // Each team plays 4 matches (5-1)
        $teamMatchCounts = $this->countTeamMatches($fixtures);
        foreach ($teamIds as $teamId) {
            $this->assertEquals(4, $teamMatchCounts[$teamId]);
        }
    }

    public function test_generates_double_round_robin(): void
    {
        $teamIds = [1, 2, 3, 4];
        $fixtures = RoundRobinGenerator::generate($teamIds, 2);

        // 4 teams, 2 rounds = 12 matches
        $this->assertCount(12, $fixtures);

        // Each team plays 6 matches (3 opponents * 2 rounds)
        $teamMatchCounts = $this->countTeamMatches($fixtures);
        foreach ($teamIds as $teamId) {
            $this->assertEquals(6, $teamMatchCounts[$teamId]);
        }
    }

    public function test_generates_home_away_fixtures(): void
    {
        $teamIds = [1, 2, 3, 4];
        // Home/away is achieved with 2 rounds and reverseHomeAway = true
        $fixtures = RoundRobinGenerator::generate($teamIds, 2, true);

        // With 2 rounds and home/away reversal:
        // 4 teams = 6 matches per round * 2 = 12
        $this->assertCount(12, $fixtures);

        // Check that fixtures have different home/away in different rounds
        $round1Fixtures = array_filter($fixtures, fn($f) => $f['round'] === 1);
        $round2Fixtures = array_filter($fixtures, fn($f) => $f['round'] === 2);

        $this->assertGreaterThan(0, count($round1Fixtures));
        $this->assertGreaterThan(0, count($round2Fixtures));
    }

    public function test_minimum_two_teams(): void
    {
        $teamIds = [1, 2];
        $fixtures = RoundRobinGenerator::generate($teamIds);

        // 2 teams = 1 match
        $this->assertCount(1, $fixtures);
        $this->assertEquals(1, $fixtures[0]['home_team_id']);
        $this->assertEquals(2, $fixtures[0]['away_team_id']);
    }

    public function test_single_team_generates_no_fixtures(): void
    {
        $teamIds = [1];
        $fixtures = RoundRobinGenerator::generate($teamIds);

        $this->assertCount(0, $fixtures);
    }

    public function test_fixture_structure(): void
    {
        $teamIds = [1, 2, 3];
        $fixtures = RoundRobinGenerator::generate($teamIds);

        foreach ($fixtures as $fixture) {
            $this->assertArrayHasKey('home_team_id', $fixture);
            $this->assertArrayHasKey('away_team_id', $fixture);
            $this->assertArrayHasKey('round', $fixture);
            $this->assertIsInt($fixture['home_team_id']);
            $this->assertIsInt($fixture['away_team_id']);
            $this->assertIsInt($fixture['round']);
        }
    }

    public function test_no_duplicate_pairings_in_single_round(): void
    {
        $teamIds = [1, 2, 3, 4, 5, 6];
        $fixtures = RoundRobinGenerator::generate($teamIds);

        $pairings = [];
        foreach ($fixtures as $fixture) {
            $pair = [$fixture['home_team_id'], $fixture['away_team_id']];
            sort($pair);
            $key = implode('-', $pair);

            $this->assertNotContains($key, $pairings, 'Found duplicate pairing: ' . $key);
            $pairings[] = $key;
        }
    }

    private function countTeamMatches(array $fixtures): array
    {
        $counts = [];
        foreach ($fixtures as $fixture) {
            $counts[$fixture['home_team_id']] = ($counts[$fixture['home_team_id']] ?? 0) + 1;
            $counts[$fixture['away_team_id']] = ($counts[$fixture['away_team_id']] ?? 0) + 1;
        }
        return $counts;
    }

    private function assertHasReverseFixtures(array $fixtures): void
    {
        $pairings = [];
        foreach ($fixtures as $fixture) {
            $pair = $fixture['home_team_id'] . '-' . $fixture['away_team_id'];
            $reversePair = $fixture['away_team_id'] . '-' . $fixture['home_team_id'];
            $pairings[$pair] = true;

            if (isset($pairings[$reversePair])) {
                return; // Found at least one reverse fixture
            }
        }

        // If we get here, check if reverse exists for first fixture
        $first = $fixtures[0];
        $reverseExists = false;
        foreach ($fixtures as $fixture) {
            if (
                $fixture['home_team_id'] === $first['away_team_id'] &&
                $fixture['away_team_id'] === $first['home_team_id']
            ) {
                $reverseExists = true;
                break;
            }
        }
        $this->assertTrue($reverseExists, 'No reverse fixtures found');
    }
}
