<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RankingResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'stage_id' => $this->stage_id,
            'group_id' => $this->group_id,
            'team_id' => $this->team_id,
            'rank' => $this->rank,
            'points' => $this->points,
            'played' => $this->played,
            'wins' => $this->wins,
            'draws' => $this->draws,
            'losses' => $this->losses,
            'goals_for' => $this->goals_for,
            'goals_against' => $this->goals_against,
            'goal_difference' => $this->goal_difference,
            'metadata' => $this->metadata,

            // Relationships
            'team' => $this->whenLoaded('team', fn() => [
                'id' => $this->team->id,
                'name' => $this->team->name,
            ]),

            'stage' => $this->whenLoaded('stage', fn() => [
                'id' => $this->stage->id,
                'name' => $this->stage->name,
            ]),

            'group' => $this->whenLoaded('group', fn() => [
                'id' => $this->group->id,
                'name' => $this->group->name,
            ]),
        ];
    }
}
