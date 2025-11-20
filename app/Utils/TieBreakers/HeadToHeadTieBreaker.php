<?php

namespace App\Utils\TieBreakers;

use Illuminate\Support\Collection;

class HeadToHeadTieBreaker extends TieBreakerBase
{
    /**
     * Sort by head-to-head record between tied teams.
     */
    public function apply(Collection $teams, Collection $fixtures): Collection
    {
        $teamIds = $teams->pluck('team_id')->toArray();

        // Get only matches between these teams
        $headToHeadFixtures = $fixtures->filter(function ($fixture) use ($teamIds) {
            return in_array($fixture->home_team_id, $teamIds) &&
                in_array($fixture->away_team_id, $teamIds);
        });

        // Calculate mini-table from head-to-head matches
        $headToHeadStats = [];
        foreach ($teamIds as $teamId) {
            $headToHeadStats[$teamId] = $this->calculateHeadToHeadStats(
                $headToHeadFixtures,
                $teamId
            );
        }

        // Sort by head-to-head points, then goal difference
        return collect($headToHeadStats)
            ->sortByDesc(function ($stats) {
                return [$stats['points'], $stats['goal_difference']];
            })
            ->map(function ($stats) use ($teams) {
                return $teams->firstWhere('team_id', $stats['team_id']);
            })
            ->values();
    }

    /**
     * Calculate head-to-head stats for a team.
     */
    private function calculateHeadToHeadStats(Collection $fixtures, int $teamId): array
    {
        $points = 0;
        $goalsFor = 0;
        $goalsAgainst = 0;

        foreach ($fixtures as $fixture) {
            if (!isset($fixture->score['home'], $fixture->score['away'])) {
                continue;
            }

            $isHome = $fixture->home_team_id === $teamId;
            $isAway = $fixture->away_team_id === $teamId;

            if (!$isHome && !$isAway) {
                continue;
            }

            if ($isHome) {
                $teamScore = $fixture->score['home'];
                $opponentScore = $fixture->score['away'];
            } else {
                $teamScore = $fixture->score['away'];
                $opponentScore = $fixture->score['home'];
            }

            $goalsFor += $teamScore;
            $goalsAgainst += $opponentScore;

            if ($teamScore > $opponentScore) {
                $points += 3;
            } elseif ($teamScore === $opponentScore) {
                $points += 1;
            }
        }

        return [
            'team_id' => $teamId,
            'points' => $points,
            'goal_difference' => $goalsFor - $goalsAgainst,
        ];
    }
}
