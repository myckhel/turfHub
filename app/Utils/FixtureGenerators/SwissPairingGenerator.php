<?php

namespace App\Utils\FixtureGenerators;

use Illuminate\Support\Collection;

class SwissPairingGenerator
{
    /**
     * Generate Swiss-system pairings.
     *
     * Teams are paired based on current standings:
     * - Top-ranked teams play against each other
     * - Teams with similar scores are matched
     * - No team plays the same opponent twice
     * - Bye is given to lowest-ranked team if odd number
     *
     * @param array $teamIds Array of team IDs
     * @param array $currentStandings Current rankings [['team_id' => X, 'points' => Y], ...]
     * @param array $previousPairings Array of previous match pairings to avoid rematches [[team1, team2], ...]
     * @param int $round Current round number
     * @return array Array of pairings
     */
    public static function generate(
        array $teamIds,
        array $currentStandings = [],
        array $previousPairings = [],
        int $round = 1
    ): array {
        // If no standings provided (first round), randomize
        if (empty($currentStandings)) {
            shuffle($teamIds);
            $sortedTeams = $teamIds;
        } else {
            // Sort teams by current standings (points, then tie-breakers)
            $sortedTeams = collect($currentStandings)
                ->sortByDesc(function ($team) {
                    return [
                        $team['points'] ?? 0,
                        $team['goal_difference'] ?? 0,
                        $team['goals_for'] ?? 0,
                    ];
                })
                ->pluck('team_id')
                ->toArray();
        }

        // Build previous pairings lookup for fast checking
        $previousMatches = self::buildPairingHistory($previousPairings);

        $pairings = [];
        $paired = [];
        $bye = null;

        // Handle odd number of teams
        if (count($sortedTeams) % 2 !== 0) {
            // Give bye to lowest unpaired team who hasn't had a bye
            for ($i = count($sortedTeams) - 1; $i >= 0; $i--) {
                $teamId = $sortedTeams[$i];
                if (!self::hasHadBye($teamId, $previousPairings)) {
                    $bye = $teamId;
                    unset($sortedTeams[$i]);
                    $sortedTeams = array_values($sortedTeams);
                    break;
                }
            }
            // If all teams had a bye, give to lowest ranked
            if ($bye === null) {
                $bye = array_pop($sortedTeams);
            }
        }

        // Pair teams with similar rankings, avoiding rematches
        foreach ($sortedTeams as $teamId) {
            if (in_array($teamId, $paired)) {
                continue;
            }

            $opponent = self::findBestOpponent(
                $teamId,
                $sortedTeams,
                $paired,
                $previousMatches
            );

            if ($opponent !== null) {
                $pairings[] = [
                    'home_team_id' => $teamId,
                    'away_team_id' => $opponent,
                    'round' => $round,
                ];
                $paired[] = $teamId;
                $paired[] = $opponent;
            }
        }

        // Add bye as a special pairing if exists
        if ($bye !== null) {
            $pairings[] = [
                'home_team_id' => $bye,
                'away_team_id' => null, // Null indicates a bye
                'round' => $round,
                'is_bye' => true,
            ];
        }

        return $pairings;
    }

    /**
     * Build pairing history lookup.
     */
    private static function buildPairingHistory(array $previousPairings): array
    {
        $history = [];
        foreach ($previousPairings as $pairing) {
            if (!isset($pairing['home_team_id'], $pairing['away_team_id'])) {
                continue;
            }
            $team1 = $pairing['home_team_id'];
            $team2 = $pairing['away_team_id'];

            if ($team2 === null) { // Bye
                continue;
            }

            $history[$team1][] = $team2;
            $history[$team2][] = $team1;
        }
        return $history;
    }

    /**
     * Check if team has had a bye before.
     */
    private static function hasHadBye(int $teamId, array $previousPairings): bool
    {
        foreach ($previousPairings as $pairing) {
            if (isset($pairing['is_bye']) && $pairing['is_bye'] === true) {
                if ($pairing['home_team_id'] === $teamId) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * Find best opponent for a team.
     * Prioritizes teams with similar ranking who haven't been played before.
     */
    private static function findBestOpponent(
        int $teamId,
        array $sortedTeams,
        array $paired,
        array $previousMatches
    ): ?int {
        $teamIndex = array_search($teamId, $sortedTeams);
        $playedBefore = $previousMatches[$teamId] ?? [];

        // Try to find opponent nearby in standings
        $searchRadius = 1;
        $maxRadius = ceil(count($sortedTeams) / 2);

        while ($searchRadius <= $maxRadius) {
            // Check teams within radius
            for ($offset = -$searchRadius; $offset <= $searchRadius; $offset++) {
                if ($offset === 0) {
                    continue;
                }

                $candidateIndex = $teamIndex + $offset;
                if ($candidateIndex < 0 || $candidateIndex >= count($sortedTeams)) {
                    continue;
                }

                $candidateId = $sortedTeams[$candidateIndex];

                // Skip if already paired or played before
                if (in_array($candidateId, $paired)) {
                    continue;
                }
                if (in_array($candidateId, $playedBefore)) {
                    continue;
                }

                return $candidateId;
            }

            $searchRadius++;
        }

        // Fallback: find any unpaired opponent (even if played before)
        foreach ($sortedTeams as $candidateId) {
            if ($candidateId === $teamId) {
                continue;
            }
            if (in_array($candidateId, $paired)) {
                continue;
            }
            return $candidateId;
        }

        return null;
    }

    /**
     * Calculate recommended number of rounds for Swiss system.
     * Typically log2(n) rounded up, but can be customized.
     */
    public static function recommendedRounds(int $teamCount): int
    {
        if ($teamCount <= 4) {
            return $teamCount - 1; // Round-robin
        }

        return (int) ceil(log($teamCount, 2));
    }
}
