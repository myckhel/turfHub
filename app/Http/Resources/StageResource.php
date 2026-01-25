<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StageResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'tournament_id' => $this->tournament_id,
            'name' => $this->name,
            'order' => $this->order,
            'stage_type' => $this->stage_type,
            'status' => $this->status,
            'settings' => $this->settings,
            'created_at' => $this->created_at->toIso8601String(),
            'updated_at' => $this->updated_at->toIso8601String(),

            // Relationships
            'tournament' => $this->whenLoaded('tournament', fn () => [
                'id' => $this->tournament->id,
                'name' => $this->tournament->name,
            ]),

            'next_stage' => $this->whenLoaded('promotion', function () {
                if ($this->promotion && $this->promotion->relationLoaded('nextStage')) {
                    return [
                        'id' => $this->promotion->nextStage->id,
                        'name' => $this->promotion->nextStage->name,
                        'order' => $this->promotion->nextStage->order,
                    ];
                }

                return null;
            }),

            'promotion' => $this->whenLoaded('promotion', fn () => [
                'id' => $this->promotion->id,
                'rule_type' => $this->promotion->rule_type,
                'rule_config' => $this->promotion->rule_config,
                'next_stage' => $this->promotion->relationLoaded('nextStage') ? [
                    'id' => $this->promotion->nextStage->id,
                    'name' => $this->promotion->nextStage->name,
                ] : null,
            ]),

            'groups' => GroupResource::collection($this->whenLoaded('groups')),
            'teams' => $this->whenLoaded('stageTeams', function () {
                return $this->stageTeams->map(fn ($st) => [
                    'id' => $st->team->id,
                    'name' => $st->team->name,
                    'seed' => $st->seed,
                    'group_id' => $st->group_id,
                    'metadata' => $st->metadata,
                ]);
            }),
            'fixtures' => FixtureResource::collection($this->whenLoaded('fixtures')),
            'rankings' => RankingResource::collection($this->whenLoaded('rankings')),

            // Counts
            'groups_count' => $this->whenCounted('groups'),
            'teams_count' => $this->whenCounted('stageTeams'),
            'fixtures_count' => $this->whenCounted('fixtures'),
        ];
    }
}
