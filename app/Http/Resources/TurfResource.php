<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TurfResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'location' => $this->location,
            'owner_id' => $this->owner_id,
            'requires_membership' => $this->requires_membership,
            'membership_fee' => $this->membership_fee,
            'membership_type' => $this->membership_type,
            'max_players_per_team' => $this->max_players_per_team,
            'is_active' => $this->is_active,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,

            // Relationships (loaded when needed)
            'owner' => new UserResource($this->whenLoaded('owner')),
            'players' => PlayerResource::collection($this->whenLoaded('players')),
            'match_sessions' => MatchSessionResource::collection($this->whenLoaded('matchSessions')),
            'active_match_sessions' => MatchSessionResource::collection($this->whenLoaded('activeMatchSessions')),
        ];
    }
}
