<?php

namespace App\Services\TournamentStrategies;

use App\Contracts\TournamentStrategies\StageStrategyInterface;
use App\Models\Stage;
use App\Utils\FixtureGenerators\RoundRobinGenerator;
use App\Utils\RankingCalculator;
use App\Utils\TieBreakers\GoalDifferenceTieBreaker;
use App\Utils\TieBreakers\GoalsForTieBreaker;
use App\Utils\TieBreakers\HeadToHeadTieBreaker;
use Illuminate\Support\Collection;

class LeagueStrategy implements StageStrategyInterface
{
    public function generateFixtures(Stage $stage): array
    {
        $teams = $stage->stageTeams()->with('team')->get();
        $teamCount = $teams->count();

        if ($teamCount < 2) {
            throw new \InvalidArgumentException('At least 2 teams are required for a league.');
        }

        $settings = $stage->settings ?? [];
        $rounds = $settings['rounds'] ?? 1;
        $homeAway = $settings['home_away'] ?? false;

        $teamIds = $teams->pluck('team_id')->toArray();

        // Use RoundRobinGenerator utility
        $generatedFixtures = RoundRobinGenerator::generate($teamIds, $rounds, $homeAway);

        // Map to stage fixtures format
        $fixtures = [];
        foreach ($generatedFixtures as $fixture) {
            $fixtures[] = [
                'stage_id' => $stage->id,
                'first_team_id' => $fixture['home_team_id'],
                'second_team_id' => $fixture['away_team_id'],
                'round' => $fixture['round'],
            ];
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
        return isset($settings['scoring']) || true;
    }
}
