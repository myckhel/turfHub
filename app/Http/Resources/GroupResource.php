<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GroupResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'stage_id' => $this->stage_id,
            'name' => $this->name,
            'settings' => $this->settings,
            'created_at' => $this->created_at->toIso8601String(),
            'updated_at' => $this->updated_at->toIso8601String(),

            // Relationships
            'stage' => $this->whenLoaded('stage', fn() => [
                'id' => $this->stage->id,
                'name' => $this->stage->name,
            ]),

            'rankings' => RankingResource::collection($this->whenLoaded('rankings')),
            'fixtures' => FixtureResource::collection($this->whenLoaded('fixtures')),

            // Counts
            'teams_count' => $this->whenCounted('stageTeams'),
            'fixtures_count' => $this->whenCounted('fixtures'),
        ];
    }
}
