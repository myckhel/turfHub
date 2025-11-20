<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TournamentResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'type' => $this->type,
            'status' => $this->status,
            'settings' => $this->settings,
            'starts_at' => $this->starts_at?->toIso8601String(),
            'ends_at' => $this->ends_at?->toIso8601String(),
            'created_at' => $this->created_at->toIso8601String(),
            'updated_at' => $this->updated_at->toIso8601String(),

            // Relationships
            'turf' => $this->whenLoaded('turf', fn() => [
                'id' => $this->turf->id,
                'name' => $this->turf->name,
                'location' => $this->turf->location,
            ]),

            'creator' => $this->whenLoaded('creator', fn() => [
                'id' => $this->creator->id,
                'name' => $this->creator->name,
            ]),

            'stages' => StageResource::collection($this->whenLoaded('stages')),
            'teams' => TeamResource::collection($this->whenLoaded('teams')),

            // Counts
            'stages_count' => $this->whenCounted('stages'),
            'teams_count' => $this->whenCounted('teams'),
        ];
    }
}
