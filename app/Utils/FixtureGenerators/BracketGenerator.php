<?php

namespace App\Utils\FixtureGenerators;

class BracketGenerator
{
    /**
     * Generate knockout bracket fixtures.
     *
     * @param array $teamIds Array of team IDs (should be seeded)
     * @param bool $singleLeg True for single elimination, false for home/away
     * @return array Array of fixtures
     */
    public static function generate(array $teamIds, bool $singleLeg = true): array
    {
        $teamCount = count($teamIds);

        // Determine bracket size (next power of 2)
        $bracketSize = self::getNextPowerOfTwo($teamCount);

        // Calculate byes needed
        $byesCount = $bracketSize - $teamCount;

        // Create first round pairings
        $pairings = self::createFirstRoundPairings($teamIds, $bracketSize, $byesCount);

        $fixtures = [];
        $round = 1;

        // Generate fixtures for first round
        foreach ($pairings as $index => $pairing) {
            if ($pairing['home'] !== null && $pairing['away'] !== null) {
                $fixtures[] = [
                    'home_team_id' => $pairing['home'],
                    'away_team_id' => $pairing['away'],
                    'round' => $round,
                    'match_number' => $index + 1,
                    'is_bye' => false,
                ];

                // Add second leg if double elimination
                if (!$singleLeg) {
                    $fixtures[] = [
                        'home_team_id' => $pairing['away'],
                        'away_team_id' => $pairing['home'],
                        'round' => $round,
                        'match_number' => $index + 1,
                        'is_second_leg' => true,
                    ];
                }
            }
        }

        return $fixtures;
    }

    /**
     * Get the next power of 2 greater than or equal to n.
     */
    private static function getNextPowerOfTwo(int $n): int
    {
        return pow(2, ceil(log($n, 2)));
    }

    /**
     * Create first round pairings with proper seeding.
     * Uses standard bracket seeding (1 vs n, 2 vs n-1, etc.)
     */
    private static function createFirstRoundPairings(array $teamIds, int $bracketSize, int $byesCount): array
    {
        $pairings = [];
        $matchesCount = $bracketSize / 2;

        // Seed teams (1 to n)
        $seeds = array_values($teamIds);

        // Add null for byes
        for ($i = 0; $i < $byesCount; $i++) {
            $seeds[] = null;
        }

        // Create pairings using standard bracket seeding
        // 1 vs n, 2 vs n-1, 3 vs n-2, etc.
        for ($i = 0; $i < $matchesCount; $i++) {
            $topSeed = $seeds[$i] ?? null;
            $bottomSeed = $seeds[$bracketSize - 1 - $i] ?? null;

            // If one team has a bye (null), that's the team that advances
            if ($topSeed === null || $bottomSeed === null) {
                // Skip this pairing - it's a bye
                continue;
            }

            $pairings[] = [
                'home' => $topSeed,
                'away' => $bottomSeed,
            ];
        }

        return $pairings;
    }

    /**
     * Generate subsequent round fixtures (to be called after first round completes).
     * This would typically be called dynamically as matches complete.
     */
    public static function generateNextRound(array $winners, int $round, bool $singleLeg = true): array
    {
        $fixtures = [];
        $winnerCount = count($winners);

        if ($winnerCount < 2) {
            return []; // Tournament over
        }

        // Pair winners
        for ($i = 0; $i < $winnerCount; $i += 2) {
            if (isset($winners[$i + 1])) {
                $fixtures[] = [
                    'home_team_id' => $winners[$i],
                    'away_team_id' => $winners[$i + 1],
                    'round' => $round,
                    'match_number' => ($i / 2) + 1,
                ];

                if (!$singleLeg) {
                    $fixtures[] = [
                        'home_team_id' => $winners[$i + 1],
                        'away_team_id' => $winners[$i],
                        'round' => $round,
                        'match_number' => ($i / 2) + 1,
                        'is_second_leg' => true,
                    ];
                }
            }
        }

        return $fixtures;
    }
}
