<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MatchEventResource extends JsonResource
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
            'game_match_id' => $this->game_match_id,
            'player_id' => $this->player_id,
            'team_id' => $this->team_id,
            'type' => $this->type,
            'minute' => $this->minute,
            'comment' => $this->comment,
            'related_player_id' => $this->related_player_id,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,

            // Relationships (loaded when needed)
            'game_match' => new GameMatchResource($this->whenLoaded('gameMatch')),
            'player' => new PlayerResource($this->whenLoaded('player')),
            'team' => new TeamResource($this->whenLoaded('team')),
            'related_player' => new PlayerResource($this->whenLoaded('relatedPlayer')),
        ];
    }
}
