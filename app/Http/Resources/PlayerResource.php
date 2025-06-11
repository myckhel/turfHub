<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PlayerResource extends JsonResource
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
            'user_id' => $this->user_id,
            'turf_id' => $this->turf_id,
            'is_member' => $this->is_member,
            'status' => $this->status,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,

            // Relationships (loaded when needed)
            'user' => new UserResource($this->whenLoaded('user')),
            'turf' => new TurfResource($this->whenLoaded('turf')),
            'team_players' => TeamPlayerResource::collection($this->whenLoaded('teamPlayers')),
            'match_events' => MatchEventResource::collection($this->whenLoaded('matchEvents')),
        ];
    }
}
