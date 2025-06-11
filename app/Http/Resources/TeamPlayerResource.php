<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TeamPlayerResource extends JsonResource
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
            'team_id' => $this->team_id,
            'player_id' => $this->player_id,
            'status' => $this->status,
            'join_time' => $this->join_time,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,

            // Relationships (loaded when needed)
            'team' => new TeamResource($this->whenLoaded('team')),
            'player' => new PlayerResource($this->whenLoaded('player')),
        ];
    }
}
