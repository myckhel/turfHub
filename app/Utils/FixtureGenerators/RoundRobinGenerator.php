<?php

namespace App\Utils\FixtureGenerators;

class RoundRobinGenerator
{
    /**
     * Generate round-robin fixtures using the circle method algorithm.
     *
     * @param  array  $teamIds  Array of team IDs
     * @param  int  $rounds  Number of rounds (1 = single round-robin, 2 = double)
     * @param  bool  $reverseHomeAway  For second round in double round-robin
     * @return array Array of fixtures
     */
    public static function generate(array $teamIds, int $rounds = 1, bool $reverseHomeAway = false): array
    {
        $fixtures = [];
        $teamCount = count($teamIds);

        // Need even number of teams for round-robin
        $hasGhost = $teamCount % 2 !== 0;
        if ($hasGhost) {
            $teamIds[] = null; // Add ghost team for bye
            $teamCount++;
        }

        // Number of matchdays (n-1 for n teams)
        $matchdays = $teamCount - 1;

        // Teams per matchday
        $teamsPerMatchday = $teamCount / 2;

        for ($round = 0; $round < $rounds; $round++) {
            $roundNumber = $round + 1;

            for ($matchday = 0; $matchday < $matchdays; $matchday++) {
                $dayFixtures = self::generateMatchday($teamIds, $matchday, $teamsPerMatchday, $roundNumber);

                // Reverse home/away for subsequent rounds if requested
                if ($round > 0 && $reverseHomeAway) {
                    $dayFixtures = array_map(function ($fixture) use ($roundNumber) {
                        return [
                            'home_team_id' => $fixture['away_team_id'],
                            'away_team_id' => $fixture['home_team_id'],
                            'round' => $roundNumber,
                            'matchday' => $fixture['matchday'],
                        ];
                    }, $dayFixtures);
                }

                // Filter out byes (matches with ghost team)
                $dayFixtures = array_filter($dayFixtures, function ($fixture) {
                    return $fixture['home_team_id'] !== null && $fixture['away_team_id'] !== null;
                });

                $fixtures = array_merge($fixtures, $dayFixtures);
            }
        }

        return $fixtures;
    }

    /**
     * Generate fixtures for a single matchday using circle method.
     */
    private static function generateMatchday(array $teams, int $matchday, int $pairsCount, int $round = 1): array
    {
        $fixtures = [];
        $teamCount = count($teams);

        // First team is fixed, others rotate
        $rotatingTeams = array_slice($teams, 1);

        // Rotate teams for this matchday
        $rotation = $matchday % ($teamCount - 1);
        for ($i = 0; $i < $rotation; $i++) {
            $rotatingTeams[] = array_shift($rotatingTeams);
        }

        // Put fixed team back
        $arranged = array_merge([$teams[0]], $rotatingTeams);

        // Pair teams: first half vs second half (in reverse)
        for ($i = 0; $i < $pairsCount; $i++) {
            $homeIndex = $i;
            $awayIndex = $teamCount - 1 - $i;

            // Alternate home/away to balance
            if ($matchday % 2 === 0) {
                $fixtures[] = [
                    'home_team_id' => $arranged[$homeIndex],
                    'away_team_id' => $arranged[$awayIndex],
                    'round' => $round,
                    'matchday' => $matchday + 1,
                ];
            } else {
                $fixtures[] = [
                    'home_team_id' => $arranged[$awayIndex],
                    'away_team_id' => $arranged[$homeIndex],
                    'round' => $round,
                    'matchday' => $matchday + 1,
                ];
            }
        }

        return $fixtures;
    }
}
