<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MatchSessionResource extends JsonResource
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
      'turf_id' => $this->turf_id,
      'name' => $this->name,
      'session_date' => $this->session_date,
      'time_slot' => $this->time_slot,
      'start_time' => $this->start_time,
      'end_time' => $this->end_time,
      'max_teams' => $this->max_teams,
      'max_players_per_team' => $this->max_players_per_team,
      'status' => $this->status,
      'is_active' => $this->is_active,
      'created_at' => $this->created_at,
      'updated_at' => $this->updated_at,

      // Relationships (loaded when needed)
      'is_session_player' => !!$this->sessionPlayer()->leftJoin('players', 'team_players.player_id', '=', 'players.id')
        ->where('players.user_id', auth()->user()->id)
        ->exists(),
      'turf' => new TurfResource($this->whenLoaded('turf')),
      'teams' => TeamResource::collection($this->whenLoaded('teams')),
      'game_matches' => GameMatchResource::collection($this->whenLoaded('gameMatches')),
      'queue_logic' => QueueLogicResource::collection($this->whenLoaded('queueLogic')),
    ];
  }
}
