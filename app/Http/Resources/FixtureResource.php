<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FixtureResource extends JsonResource
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
            'home_team_id' => $this->home_team_id,
            'away_team_id' => $this->away_team_id,
            'starts_at' => $this->starts_at?->toIso8601String(),
            'duration' => $this->duration,
            'status' => $this->status,
            'score' => $this->score,
            'winning_team_id' => $this->winning_team_id,
            'metadata' => $this->metadata,
            'created_at' => $this->created_at->toIso8601String(),
            'updated_at' => $this->updated_at->toIso8601String(),

            // Relationships
            'home_team' => $this->whenLoaded('homeTeam', fn() => [
                'id' => $this->homeTeam->id,
                'name' => $this->homeTeam->name,
            ]),

            'away_team' => $this->whenLoaded('awayTeam', fn() => [
                'id' => $this->awayTeam->id,
                'name' => $this->awayTeam->name,
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
