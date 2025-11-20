<?php

namespace App\Services\TournamentStrategies;

use App\Contracts\TournamentStrategies\StageStrategyInterface;
use App\Models\Stage;
use App\Utils\FixtureGenerators\BracketGenerator;
use Illuminate\Support\Collection;

class KnockoutStrategy implements StageStrategyInterface
{
    public function generateFixtures(Stage $stage): array
    {
        $teams = $stage->stageTeams()->orderBy('seed')->with('team')->get();
        $settings = $stage->settings ?? [];
        $singleLeg = $settings['single_leg'] ?? true;

        $teamIds = $teams->pluck('team_id')->toArray();

        // Use BracketGenerator utility
        $generatedFixtures = BracketGenerator::generate($teamIds, $singleLeg);

        // Map to stage fixtures format
        $fixtures = [];
        foreach ($generatedFixtures as $fixture) {
            $fixtures[] = [
                'stage_id' => $stage->id,
                'first_team_id' => $fixture['home_team_id'],
                'second_team_id' => $fixture['away_team_id'],
                'round' => $fixture['round'],
                'metadata' => $fixture['metadata'] ?? null,
            ];
        }

        return $fixtures;
    }

    public function computeRankings(Stage $stage): Collection
    {
        // For knockout, rankings are based on elimination order
        $fixtures = $stage->fixtures()->where('status', 'completed')->get();
        $teams = $stage->stageTeams()->with('team')->get();

        $standings = [];
        foreach ($teams as $stageTeam) {
            $standings[$stageTeam->team_id] = [
                'team_id' => $stageTeam->team_id,
                'stage_id' => $stage->id,
                'group_id' => null,
                'points' => 0,
                'played' => 0,
                'wins' => 0,
                'draws' => 0,
                'losses' => 0,
                'goals_for' => 0,
                'goals_against' => 0,
                'goal_difference' => 0,
                'rank' => 999, // Will be updated based on elimination round
            ];
        }

        // Process fixtures to determine rankings
        foreach ($fixtures as $fixture) {
            $homeTeamId = $fixture->first_team_id;
            $awayTeamId = $fixture->second_team_id;
            $winnerId = $fixture->winning_team_id;

            if ($winnerId) {
                $loserId = $winnerId === $homeTeamId ? $awayTeamId : $homeTeamId;

                // Winner continues, loser is ranked by round
                $metadata = json_decode($fixture->metadata ?? '{}', true);
                $round = $metadata['knockout_round'] ?? 'unknown';

                // Assign rank based on elimination round (later rounds = better rank)
                $standings[$loserId]['rank'] = min($standings[$loserId]['rank'], $this->getRankForRound($round));
            }
        }

        // Winner gets rank 1
        $winner = collect($standings)->where('rank', 999)->first();
        if ($winner) {
            $standings[$winner['team_id']]['rank'] = 1;
        }

        return collect(array_values($standings))->sortBy('rank')->values();
    }

    public function validateStageSettings(array $settings): bool
    {
        return true;
    }

    /**
     * Get rank for elimination round.
     */
    protected function getRankForRound(string $round): int
    {
        return match ($round) {
            'Final' => 2,
            'Semi-Final' => 4,
            'Quarter-Final' => 8,
            'Round of 16' => 16,
            'Round of 32' => 32,
            default => 999,
        };
    }
}
