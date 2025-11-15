<?php

namespace App\Services\TournamentStrategies;

use App\Contracts\TournamentStrategies\StageStrategyInterface;
use App\Models\Group;
use App\Models\Stage;
use Illuminate\Support\Collection;

class GroupStrategy implements StageStrategyInterface
{
    public function generateFixtures(Stage $stage): array
    {
        $teams = $stage->stageTeams()->with('team')->get();
        $settings = $stage->settings ?? [];
        $groupSize = $settings['group_size'] ?? 4;
        $teamsPerGroup = $settings['teams_per_group'] ?? $groupSize;

        // Divide teams into groups
        $groups = $this->divideIntoGroups($teams, $teamsPerGroup);
        $fixtures = [];

        foreach ($groups as $groupIndex => $groupTeams) {
            $groupName = chr(65 + $groupIndex); // A, B, C, etc.

            // Create or get group
            $group = Group::firstOrCreate([
                'stage_id' => $stage->id,
                'name' => "Group {$groupName}",
            ]);

            // Assign teams to group
            foreach ($groupTeams as $stageTeam) {
                $stageTeam->update(['group_id' => $group->id]);
            }

            // Generate round-robin for this group
            $teamIds = $groupTeams->pluck('team_id')->toArray();
            $groupFixtures = $this->generateRoundRobin($teamIds);

            foreach ($groupFixtures as $matchday => $matches) {
                foreach ($matches as $match) {
                    $fixtures[] = [
                        'stage_id' => $stage->id,
                        'group_id' => $group->id,
                        'first_team_id' => $match[0],
                        'second_team_id' => $match[1],
                        'matchday' => $matchday + 1,
                    ];
                }
            }
        }

        return $fixtures;
    }

    public function computeRankings(Stage $stage): Collection
    {
        $groups = $stage->groups()->with(['stageTeams.team', 'fixtures'])->get();
        $allRankings = collect();

        foreach ($groups as $group) {
            $groupRankings = $this->computeGroupRankings($stage, $group);
            $allRankings = $allRankings->merge($groupRankings);
        }

        return $allRankings;
    }

    public function validateStageSettings(array $settings): bool
    {
        return isset($settings['group_size']) || isset($settings['teams_per_group']);
    }

    /**
     * Divide teams into groups.
     *
     * @param Collection $teams
     * @param int $teamsPerGroup
     * @return array
     */
    protected function divideIntoGroups(Collection $teams, int $teamsPerGroup): array
    {
        return $teams->chunk($teamsPerGroup)->values()->all();
    }

    /**
     * Compute rankings for a specific group.
     *
     * @param Stage $stage
     * @param Group $group
     * @return Collection
     */
    protected function computeGroupRankings(Stage $stage, Group $group): Collection
    {
        $teams = $group->stageTeams;
        $fixtures = $group->fixtures()->where('status', 'completed')->get();
        $settings = $stage->settings ?? [];
        $scoring = $settings['scoring'] ?? ['win' => 3, 'draw' => 1, 'loss' => 0];

        $standings = [];

        foreach ($teams as $stageTeam) {
            $teamId = $stageTeam->team_id;
            $standings[$teamId] = [
                'team_id' => $teamId,
                'stage_id' => $stage->id,
                'group_id' => $group->id,
                'points' => 0,
                'played' => 0,
                'wins' => 0,
                'draws' => 0,
                'losses' => 0,
                'goals_for' => 0,
                'goals_against' => 0,
                'goal_difference' => 0,
            ];
        }

        foreach ($fixtures as $fixture) {
            $homeTeamId = $fixture->first_team_id;
            $awayTeamId = $fixture->second_team_id;
            $homeScore = $fixture->first_team_score ?? 0;
            $awayScore = $fixture->second_team_score ?? 0;

            if (!isset($standings[$homeTeamId]) || !isset($standings[$awayTeamId])) {
                continue;
            }

            $standings[$homeTeamId]['played']++;
            $standings[$awayTeamId]['played']++;
            $standings[$homeTeamId]['goals_for'] += $homeScore;
            $standings[$homeTeamId]['goals_against'] += $awayScore;
            $standings[$awayTeamId]['goals_for'] += $awayScore;
            $standings[$awayTeamId]['goals_against'] += $homeScore;

            if ($homeScore > $awayScore) {
                $standings[$homeTeamId]['wins']++;
                $standings[$homeTeamId]['points'] += $scoring['win'];
                $standings[$awayTeamId]['losses']++;
                $standings[$awayTeamId]['points'] += $scoring['loss'];
            } elseif ($homeScore < $awayScore) {
                $standings[$awayTeamId]['wins']++;
                $standings[$awayTeamId]['points'] += $scoring['win'];
                $standings[$homeTeamId]['losses']++;
                $standings[$homeTeamId]['points'] += $scoring['loss'];
            } else {
                $standings[$homeTeamId]['draws']++;
                $standings[$awayTeamId]['draws']++;
                $standings[$homeTeamId]['points'] += $scoring['draw'];
                $standings[$awayTeamId]['points'] += $scoring['draw'];
            }
        }

        foreach ($standings as &$standing) {
            $standing['goal_difference'] = $standing['goals_for'] - $standing['goals_against'];
        }

        usort($standings, function ($a, $b) {
            if ($a['points'] !== $b['points']) {
                return $b['points'] - $a['points'];
            }
            if ($a['goal_difference'] !== $b['goal_difference']) {
                return $b['goal_difference'] - $a['goal_difference'];
            }
            return $b['goals_for'] - $a['goals_for'];
        });

        foreach ($standings as $index => &$standing) {
            $standing['rank'] = $index + 1;
        }

        return collect($standings);
    }

    /**
     * Generate round-robin fixtures.
     *
     * @param array $teamIds
     * @return array
     */
    protected function generateRoundRobin(array $teamIds): array
    {
        $teamCount = count($teamIds);
        $fixtures = [];

        $hasBye = $teamCount % 2 !== 0;
        if ($hasBye) {
            $teamIds[] = null;
            $teamCount++;
        }

        $rounds = $teamCount - 1;
        $matchesPerRound = $teamCount / 2;

        for ($round = 0; $round < $rounds; $round++) {
            $fixtures[$round] = [];

            for ($match = 0; $match < $matchesPerRound; $match++) {
                $home = ($round + $match) % ($teamCount - 1);
                $away = ($teamCount - 1 - $match + $round) % ($teamCount - 1);

                if ($match === 0) {
                    $away = $teamCount - 1;
                }

                if ($teamIds[$home] === null || $teamIds[$away] === null) {
                    continue;
                }

                $fixtures[$round][] = [$teamIds[$home], $teamIds[$away]];
            }
        }

        return $fixtures;
    }
}
