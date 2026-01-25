<?php

namespace App\Services;

use App\Models\PromotionAudit;
use App\Models\Stage;
use App\Models\StageTeam;
use App\Services\PromotionHandlers\PromotionHandlerFactory;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class PromotionService
{
    public function __construct(
        protected RankingService $rankingService
    ) {}

    public function simulatePromotion(Stage $stage): array
    {
        if (! $stage->promotion) {
            throw new \Exception('No promotion rule defined for this stage');
        }

        if (! $stage->promotion->next_stage_id) {
            throw new \Exception('No next stage defined for promotion');
        }

        // Get current rankings
        $rankings = $this->rankingService->getRankingsForStage($stage);

        // Get promotion handler
        $handler = PromotionHandlerFactory::make($stage->promotion->rule_type->value);

        // Select winners
        $winnerTeamIds = $handler->selectWinners($stage, $rankings);

        // Get team details
        $teams = \App\Models\Team::whereIn('id', $winnerTeamIds)->get();

        return [
            'promoted_teams' => $teams->map(fn ($team) => [
                'id' => $team->id,
                'name' => $team->name,
            ])->toArray(),
            'next_stage' => $stage->promotion->nextStage->name,
            'promotion_rule' => $stage->promotion->rule_type,
        ];
    }

    public function executePromotion(Stage $stage, ?array $manualOverride = null): Collection
    {
        return DB::transaction(function () use ($stage, $manualOverride) {
            if (! $stage->promotion) {
                throw new \Exception('No promotion rule defined for this stage');
            }

            if (! $stage->promotion->next_stage_id) {
                throw new \Exception('No next stage defined for promotion');
            }

            $rankings = $this->rankingService->getRankingsForStage($stage);
            $handler = PromotionHandlerFactory::make($stage->promotion->rule_type->value);

            // Use manual override or automatic selection
            if ($manualOverride && isset($manualOverride['team_ids'])) {
                $winnerTeamIds = collect($manualOverride['team_ids']);
            } else {
                $winnerTeamIds = $handler->selectWinners($stage, $rankings);
            }

            // Assign promoted teams to next stage
            $nextStage = $stage->promotion->nextStage;
            $seeds = $manualOverride['seeds'] ?? [];

            foreach ($winnerTeamIds as $index => $teamId) {
                StageTeam::updateOrCreate(
                    [
                        'stage_id' => $nextStage->id,
                        'team_id' => $teamId,
                    ],
                    [
                        'seed' => $seeds[$index] ?? ($index + 1),
                    ]
                );
            }

            // Create audit record
            $this->auditPromotion($stage, [
                'promoted_teams' => $winnerTeamIds->toArray(),
                'next_stage_id' => $nextStage->id,
                'manual_override' => $manualOverride !== null,
            ], false);

            // Mark stage as completed
            $stage->update(['status' => 'completed']);

            return $winnerTeamIds;
        });
    }

    public function rollbackPromotion(PromotionAudit $audit): bool
    {
        return DB::transaction(function () use ($audit) {
            $result = $audit->result;
            $nextStageId = $result['next_stage_id'] ?? null;
            $promotedTeams = $result['promoted_teams'] ?? [];

            if (! $nextStageId) {
                throw new \Exception('Cannot rollback: next stage not found in audit');
            }

            // Remove promoted teams from next stage
            StageTeam::where('stage_id', $nextStageId)
                ->whereIn('team_id', $promotedTeams)
                ->delete();

            // Revert stage status
            $audit->stage->update(['status' => 'active']);

            // Create rollback audit
            PromotionAudit::create([
                'stage_id' => $audit->stage_id,
                'triggered_by' => \Illuminate\Support\Facades\Auth::id(),
                'simulated' => false,
                'result' => [
                    'action' => 'rollback',
                    'original_audit_id' => $audit->id,
                    'rolled_back_teams' => $promotedTeams,
                ],
            ]);

            return true;
        });
    }

    public function auditPromotion(Stage $stage, array $result, bool $simulated): PromotionAudit
    {
        return PromotionAudit::create([
            'stage_id' => $stage->id,
            'simulated' => $simulated,
            'result' => $result,
            'triggered_by' => \Illuminate\Support\Facades\Auth::id() ?? $stage->tournament->created_by,
        ]);
    }

    public function getPromotionHistory(Stage $stage): Collection
    {
        return PromotionAudit::where('stage_id', $stage->id)
            ->with('triggeredBy')
            ->orderBy('created_at', 'desc')
            ->get();
    }

    public function canPromote(Stage $stage): bool
    {
        return $stage->canPromote() &&
          $stage->fixtures()->whereNotIn('status', ['completed', 'cancelled'])->count() === 0;
    }
}
