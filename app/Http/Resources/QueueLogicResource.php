<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class QueueLogicResource extends JsonResource
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
            'match_session_id' => $this->match_session_id,
            'team_id' => $this->team_id,
            'queue_position' => $this->queue_position,
            'status' => $this->status,
            'reason_for_current_position' => $this->reason_for_current_position,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,

            // Relationships (loaded when needed)
            'match_session' => new MatchSessionResource($this->whenLoaded('matchSession')),
            'team' => new TeamResource($this->whenLoaded('team')),
        ];
    }
}
