<?php

namespace App\Services\TournamentStrategies;

use App\Contracts\TournamentStrategies\StageStrategyInterface;
use App\Models\Stage;
use App\Utils\FixtureGenerators\SwissPairingGenerator;
use App\Utils\RankingCalculator;
use App\Utils\TieBreakers\GoalDifferenceTieBreaker;
use App\Utils\TieBreakers\GoalsForTieBreaker;
use App\Utils\TieBreakers\HeadToHeadTieBreaker;
use Illuminate\Support\Collection;

class SwissStrategy implements StageStrategyInterface
{
    public function generateFixtures(Stage $stage): array
    {
        $teams = $stage->stageTeams()->with('team')->get();
        $teamIds = $teams->pluck('team_id')->toArray();

        if (count($teamIds) < 2) {
            throw new \InvalidArgumentException('At least 2 teams are required for Swiss system.');
        }

        $settings = $stage->settings ?? [];
        $totalRounds = $settings['rounds'] ?? SwissPairingGenerator::recommendedRounds(count($teamIds));

        // Get current round number based on existing fixtures
        $currentRound = $stage->fixtures()->max('round') ?? 0;
        $nextRound = $currentRound + 1;

        if ($nextRound > $totalRounds) {
            throw new \InvalidArgumentException('All rounds have been generated.');
        }

        // Get current standings
        $currentStandings = [];
        if ($nextRound > 1) {
            $rankings = $this->computeRankings($stage);
            $currentStandings = $rankings->map(function ($ranking) {
                return [
                    'team_id' => $ranking['team_id'],
                    'points' => $ranking['points'],
                    'goal_difference' => $ranking['goal_difference'],
                    'goals_for' => $ranking['goals_for'],
                ];
            })->toArray();
        }

        // Get previous pairings to avoid rematches
        $previousPairings = $stage->fixtures()
            ->get()
            ->map(function ($fixture) {
                return [
                    'home_team_id' => $fixture->first_team_id,
                    'away_team_id' => $fixture->second_team_id,
                    'is_bye' => $fixture->metadata['is_bye'] ?? false,
                ];
            })
            ->toArray();

        // Generate pairings for next round
        $pairings = SwissPairingGenerator::generate(
            $teamIds,
            $currentStandings,
            $previousPairings,
            $nextRound
        );

        // Map to stage fixtures format
        $fixtures = [];
        foreach ($pairings as $pairing) {
            $fixture = [
                'stage_id' => $stage->id,
                'first_team_id' => $pairing['home_team_id'],
                'second_team_id' => $pairing['away_team_id'],
                'round' => $pairing['round'],
            ];

            if (isset($pairing['is_bye']) && $pairing['is_bye']) {
                $fixture['metadata'] = json_encode(['is_bye' => true]);
            }

            $fixtures[] = $fixture;
        }

        return $fixtures;
    }

    public function computeRankings(Stage $stage): Collection
    {
        $teams = $stage->stageTeams()->with('team')->get();
        $fixtures = $stage->fixtures()->where('status', 'completed')->get();
        $settings = $stage->settings ?? [];
        $scoring = $settings['scoring'] ?? null;

        $teamIds = $teams->pluck('team_id')->toArray();

        // Map fixtures to format expected by RankingCalculator
        $mappedFixtures = $fixtures->map(function ($fixture) {
            // Handle byes (automatic win)
            $metadata = json_decode($fixture->metadata ?? '{}', true);
            if (isset($metadata['is_bye']) && $metadata['is_bye']) {
                return (object) [
                    'home_team_id' => $fixture->first_team_id,
                    'away_team_id' => $fixture->first_team_id, // Self-match to avoid null
                    'score' => [
                        'home' => 3, // Bye counts as 3-0 win
                        'away' => 0,
                    ],
                ];
            }

            return (object) [
                'home_team_id' => $fixture->first_team_id,
                'away_team_id' => $fixture->second_team_id,
                'score' => [
                    'home' => $fixture->first_team_score ?? 0,
                    'away' => $fixture->second_team_score ?? 0,
                ],
            ];
        });

        // Use RankingCalculator utility
        $rankings = RankingCalculator::calculate($mappedFixtures, $teamIds, $scoring);

        // Apply tie-breakers
        $tieBreakers = [
            GoalDifferenceTieBreaker::class,
            GoalsForTieBreaker::class,
            HeadToHeadTieBreaker::class,
        ];

        $rankedTeams = RankingCalculator::applyTieBreakers($rankings, $tieBreakers, $mappedFixtures);

        // Add stage and group IDs
        return $rankedTeams->map(function ($team) use ($stage) {
            return array_merge($team, [
                'stage_id' => $stage->id,
                'group_id' => null,
            ]);
        });
    }

    public function validateStageSettings(array $settings): bool
    {
        return isset($settings['rounds']);
    }
}
