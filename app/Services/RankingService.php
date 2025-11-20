<?php

namespace App\Services;

use App\Models\Group;
use App\Models\Ranking;
use App\Models\Stage;
use App\Services\TournamentStrategies\StageStrategyFactory;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Service class for computing and managing tournament rankings
 *
 * Handles ranking calculation based on match results, tie-breaking rules,
 * and persistence of rankings to database. Uses strategy pattern to delegate
 * ranking computation to stage-type-specific strategies.
 */
class RankingService
{
    /**
     * Compute rankings for a stage
     *
     * Delegates ranking computation to the appropriate strategy based on stage type.
     * Calculates points, wins, draws, losses, goals, and applies tie-breakers.
     *
     * @param Stage $stage The stage to compute rankings for
     *
     * @return Collection Collection of ranking arrays with team statistics
     */
    public function computeStageRankings(Stage $stage): Collection
    {
        $strategy = StageStrategyFactory::make($stage->stage_type->value);

        return $strategy->computeRankings($stage);
    }

    /**
     * Compute rankings for a specific group
     *
     * For group-type stages, computes rankings and filters to a specific group.
     *
     * @param Group $group The group to compute rankings for
     *
     * @return Collection Collection of ranking arrays for teams in the group
     */
    public function computeGroupRankings(Group $group): Collection
    {
        $strategy = StageStrategyFactory::make($group->stage->stage_type->value);

        $allRankings = $strategy->computeRankings($group->stage);

        return $allRankings->where('group_id', $group->id);
    }

    /**
     * Save rankings to database
     *
     * Deletes existing rankings for the stage and creates new ranking records
     * in a database transaction for atomicity.
     *
     * @param Stage $stage The stage to persist rankings for
     * @param Collection $rankings Collection of ranking arrays to save
     *
     * @return void
     */
    public function persistRankings(Stage $stage, Collection $rankings): void
    {
        DB::transaction(function () use ($stage, $rankings) {
            // Delete existing rankings for this stage
            Ranking::where('stage_id', $stage->id)->delete();

            // Create new rankings
            foreach ($rankings as $ranking) {
                Ranking::create($ranking);
            }
        });
    }

    /**
     * Compute and save rankings in one operation
     *
     * Convenience method that combines computation and persistence.
     *
     * @param Stage $stage The stage to process
     *
     * @return Collection The computed rankings
     */
    public function computeAndPersist(Stage $stage): Collection
    {
        $rankings = $this->computeStageRankings($stage);
        $this->persistRankings($stage, $rankings);

        return $rankings;
    }

    /**
     * Apply tie-breaking rules to teams
     *
     * Sorts teams using specified tie-breaking rules in order of priority.
     * Rules are applied sequentially until a difference is found.
     *
     * @param Collection $teams Collection of team ranking arrays
     * @param array $rules Array of rule names to apply in order
     *   Supported rules: 'points', 'goal_difference', 'goals_for', 'goals_against',
     *   'wins', 'head_to_head', 'random'
     *
     * @return Collection Sorted collection of team rankings
     */
    public function applyTieBreakers(Collection $teams, array $rules): Collection
    {
        $sorted = $teams->toArray();

        usort($sorted, function ($a, $b) use ($rules) {
            foreach ($rules as $rule) {
                $comparison = $this->compareByRule($a, $b, $rule);
                if ($comparison !== 0) {
                    return $comparison;
                }
            }
            return 0;
        });

        return collect($sorted);
    }

    /**
     * Compare two teams by a specific tie-breaking rule
     *
     * Returns negative if team A should rank higher, positive if team B should rank higher,
     * zero if equal on this criterion.
     *
     * @param array $a First team's ranking data
     * @param array $b Second team's ranking data
     * @param string $rule The tie-breaking rule to apply
     *
     * @return int Comparison result (-1, 0, or 1)
     */
    protected function compareByRule(array $a, array $b, string $rule): int
    {
        return match ($rule) {
            'points' => $b['points'] - $a['points'],
            'goal_difference' => $b['goal_difference'] - $a['goal_difference'],
            'goals_for' => $b['goals_for'] - $a['goals_for'],
            'goals_against' => $a['goals_against'] - $b['goals_against'],
            'wins' => $b['wins'] - $a['wins'],
            'head_to_head' => $this->compareHeadToHead($a, $b),
            'random' => rand(-1, 1),
            default => 0,
        };
    }

    /**
     * Compare teams by head-to-head record
     *
     * TODO: Implement full head-to-head comparison by analyzing direct matches.
     * Currently returns 0 (equal).
     *
     * @param array $a First team's ranking data
     * @param array $b Second team's ranking data
     *
     * @return int Comparison result (currently always 0)
     */
    protected function compareHeadToHead(array $a, array $b): int
    {
        // TODO: Implement head-to-head comparison
        // Would need to look at direct matches between teams
        return 0;
    }

    /**
     * Get saved rankings for a stage
     *
     * Retrieves rankings from database ordered by rank.
     *
     * @param Stage $stage The stage to get rankings for
     *
     * @return Collection Collection of Ranking models with team relationship
     */
    public function getRankingsForStage(Stage $stage): Collection
    {
        return Ranking::where('stage_id', $stage->id)
            ->with('team')
            ->orderBy('rank')
            ->get();
    }

    /**
     * Get saved rankings for a specific group
     *
     * Retrieves rankings from database filtered by group and ordered by rank.
     *
     * @param int $groupId The group ID
     *
     * @return Collection Collection of Ranking models with team relationship
     */
    public function getRankingsForGroup(int $groupId): Collection
    {
        return Ranking::where('group_id', $groupId)
            ->with('team')
            ->orderBy('rank')
            ->get();
    }

    /**
     * Get ranking for a specific team in a stage
     *
     * Retrieves the ranking record for one team.
     *
     * @param Stage $stage The stage
     * @param int $teamId The team ID
     *
     * @return Ranking|null The ranking or null if not found
     */
    public function getTeamRanking(Stage $stage, int $teamId): ?Ranking
    {
        return Ranking::where('stage_id', $stage->id)
            ->where('team_id', $teamId)
            ->first();
    }

    /**
     * Recalculate and save rankings
     *
     * Alias for computeAndPersist() for more explicit naming when manually triggering refresh.
     *
     * @param Stage $stage The stage to refresh rankings for
     *
     * @return Collection The refreshed rankings
     */
    public function refreshRankings(Stage $stage): Collection
    {
        return $this->computeAndPersist($stage);
    }
}
