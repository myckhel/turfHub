<?php

namespace App\Services;

use App\Models\Stage;
use App\Models\StageTeam;
use App\Models\Tournament;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Service class for managing tournament stages
 *
 * Handles creation, updates, team assignment, and lifecycle management of tournament stages.
 * Supports different stage types: league, group, knockout, and swiss.
 */
class StageService
{
    /**
     * Create a new stage for a tournament
     *
     * Creates a stage in a transaction. Automatically determines the order number
     * by incrementing the maximum order of existing stages unless explicitly provided.
     *
     * @param Tournament $tournament The tournament to add the stage to
     * @param array $data Stage data including:
     *   - name (string, required): Stage name
     *   - stage_type (string, optional): 'league', 'group', 'knockout', or 'swiss'
     *   - settings (array, optional): Stage-specific configuration
     *   - order (int, optional): Display/execution order
     *   - next_stage_id (int, optional): ID of the next stage for promotion
     *
     * @return Stage The created stage
     */
    public function createStage(Tournament $tournament, array $data): Stage
    {
        return DB::transaction(function () use ($tournament, $data) {
            // Determine order
            $maxOrder = $tournament->stages()->max('order') ?? 0;

            return Stage::create([
                'tournament_id' => $tournament->id,
                'name' => $data['name'],
                'order' => $data['order'] ?? $maxOrder + 1,
                'stage_type' => $data['stage_type'] ?? 'league',
                'settings' => $data['settings'] ?? [],
                'next_stage_id' => $data['next_stage_id'] ?? null,
                'status' => 'pending',
            ]);
        });
    }

    /**
     * Update stage details
     *
     * Updates allowed fields while preserving existing values for omitted fields.
     *
     * @param Stage $stage The stage to update
     * @param array $data Update data (all fields optional):
     *   - name (string): Stage name
     *   - settings (array): Stage configuration
     *   - next_stage_id (int): Next stage for promotion
     *
     * @return Stage The updated stage
     */
    public function updateStage(Stage $stage, array $data): Stage
    {
        $stage->update([
            'name' => $data['name'] ?? $stage->name,
            'settings' => $data['settings'] ?? $stage->settings,
            'next_stage_id' => $data['next_stage_id'] ?? $stage->next_stage_id,
        ]);

        return $stage->fresh();
    }

    /**
     * Delete a stage and all related data
     *
     * Performs cascading deletion in a transaction, removing fixtures, rankings,
     * groups, and promotion rules. Also cleans up references from other stages.
     *
     * @param Stage $stage The stage to delete
     *
     * @return bool True if deletion was successful
     */
    public function deleteStage(Stage $stage): bool
    {
        return DB::transaction(function () use ($stage) {
            // Update any stages that reference this as next_stage
            Stage::where('next_stage_id', $stage->id)->update(['next_stage_id' => null]);

            // Delete related data
            $stage->fixtures()->delete();
            $stage->stageTeams()->delete();
            $stage->rankings()->delete();
            $stage->groups()->delete();
            $stage->promotion()->delete();

            return $stage->delete();
        });
    }

    /**
     * Assign teams to a stage
     *
     * Creates or updates StageTeam records linking teams to the stage.
     * Uses updateOrCreate for idempotency. Optionally applies seeding for
     * knockout brackets.
     *
     * @param Stage $stage The stage to assign teams to
     * @param array $teamIds Array of team IDs to assign
     * @param array|null $seeds Optional array of seed values corresponding to team_ids
     *
     * @return void
     */
    public function assignTeamsToStage(Stage $stage, array $teamIds, ?array $seeds = null): void
    {
        DB::transaction(function () use ($stage, $teamIds, $seeds) {
            foreach ($teamIds as $index => $teamId) {
                StageTeam::updateOrCreate(
                    [
                        'stage_id' => $stage->id,
                        'team_id' => $teamId,
                    ],
                    [
                        'seed' => $seeds[$index] ?? $index + 1,
                        'group_id' => null, // Will be set during fixture generation for group stages
                    ]
                );
            }
        });
    }

    /**
     * Remove teams from a stage
     *
     * Deletes StageTeam records for the specified teams.
     *
     * @param Stage $stage The stage to remove teams from
     * @param array $teamIds Array of team IDs to remove
     *
     * @return void
     */
    public function removeTeamsFromStage(Stage $stage, array $teamIds): void
    {
        StageTeam::where('stage_id', $stage->id)
            ->whereIn('team_id', $teamIds)
            ->delete();
    }

    /**
     * Reorder stages within a tournament
     *
     * Updates the order column for stages based on the provided array.
     * Useful for changing stage execution sequence.
     *
     * @param Tournament $tournament The tournament containing the stages
     * @param array $stageOrder Array of stage IDs in desired order (0-indexed)
     *
     * @return void
     */
    public function reorderStages(Tournament $tournament, array $stageOrder): void
    {
        DB::transaction(function () use ($tournament, $stageOrder) {
            foreach ($stageOrder as $order => $stageId) {
                Stage::where('id', $stageId)
                    ->where('tournament_id', $tournament->id)
                    ->update(['order' => $order + 1]);
            }
        });
    }

    /**
     * Link two stages for team promotion
     *
     * Sets the next_stage_id on the current stage to enable automatic promotion.
     * Validates that both stages belong to the same tournament.
     *
     * @param Stage $currentStage The source stage
     * @param Stage $nextStage The destination stage for promoted teams
     *
     * @return void
     *
     * @throws \InvalidArgumentException If stages are not in the same tournament
     */
    public function linkStages(Stage $currentStage, Stage $nextStage): void
    {
        // Verify stages are in same tournament
        if ($currentStage->tournament_id !== $nextStage->tournament_id) {
            throw new \InvalidArgumentException('Stages must be in the same tournament');
        }

        $currentStage->update(['next_stage_id' => $nextStage->id]);
    }

    /**
     * Activate a stage
     *
     * Marks the stage as active and sets all other stages in the tournament
     * to pending status (ensures only one active stage per tournament).
     *
     * @param Stage $stage The stage to activate
     *
     * @return Stage The updated stage
     */
    public function activateStage(Stage $stage): Stage
    {
        // Deactivate other stages in the tournament
        Stage::where('tournament_id', $stage->tournament_id)
            ->where('id', '!=', $stage->id)
            ->update(['status' => 'pending']);

        $stage->update(['status' => 'active']);

        return $stage;
    }

    /**
     * Complete a stage
     *
     * Marks the stage as completed. Validates that all fixtures are
     * completed or cancelled before allowing completion.
     *
     * @param Stage $stage The stage to complete
     *
     * @return Stage The updated stage
     *
     * @throws \Exception If any fixtures are not completed or cancelled
     */
    public function completeStage(Stage $stage): Stage
    {
        // Verify all fixtures are completed
        $incompleteFixtures = $stage->fixtures()
            ->whereNotIn('status', ['completed', 'cancelled'])
            ->count();

        if ($incompleteFixtures > 0) {
            throw new \Exception("Cannot complete stage with incomplete fixtures");
        }

        $stage->update(['status' => 'completed']);

        return $stage;
    }

    /**
     * Get stage with all related data
     *
     * Retrieves a stage with comprehensive relationships loaded including
     * tournament, groups, teams, fixtures, rankings, and promotion config.
     *
     * @param int $stageId The stage ID
     *
     * @return Stage Stage with loaded relationships
     *
     * @throws \Illuminate\Database\Eloquent\ModelNotFoundException If stage not found
     */
    public function getStageWithDetails(int $stageId): Stage
    {
        return Stage::with([
            'tournament',
            'groups.stageTeams.team',
            'stageTeams.team',
            'fixtures.firstTeam',
            'fixtures.secondTeam',
            'rankings.team',
            'promotion.nextStage',
        ])->findOrFail($stageId);
    }
}
