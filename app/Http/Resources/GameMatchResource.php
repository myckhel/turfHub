<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GameMatchResource extends JsonResource
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
      'first_team_id' => $this->first_team_id,
      'second_team_id' => $this->second_team_id,
      'first_team_score' => $this->first_team_score,
      'second_team_score' => $this->second_team_score,
      'winning_team_id' => $this->winning_team_id,
      'outcome' => $this->outcome,
      'starts_at' => $this->starts_at,
      'status' => $this->status,
      'betting_enabled' => $this->betting_enabled,
      'created_at' => $this->created_at,
      'updated_at' => $this->updated_at,

      // Relationships (loaded when needed)
      'match_session' => new MatchSessionResource($this->whenLoaded('matchSession')),
      'first_team' => new TeamResource($this->whenLoaded('firstTeam')),
      'second_team' => new TeamResource($this->whenLoaded('secondTeam')),
      'winning_team' => new TeamResource($this->whenLoaded('winningTeam')),
      'match_events' => MatchEventResource::collection($this->whenLoaded('matchEvents')),
    ];
  }
}
