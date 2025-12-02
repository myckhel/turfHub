<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TeamResource extends JsonResource
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
      'turf_id' => $this->turf_id,
      'tournament_id' => $this->tournament_id,
      'name' => $this->name,
      'color' => $this->color,
      'captain_id' => $this->captain_id,
      'status' => $this->status,
      'wins' => $this->wins,
      'losses' => $this->losses,
      'draws' => $this->draws,
      'metadata' => $this->metadata,
      'created_at' => $this->created_at,
      'updated_at' => $this->updated_at,

      // Relationships (loaded when needed)
      'match_session' => new MatchSessionResource($this->whenLoaded('matchSession')),
      'turf' => new TurfResource($this->whenLoaded('turf')),
      'tournament' => new TournamentResource($this->whenLoaded('tournament')),
      'captain' => new PlayerResource($this->whenLoaded('captain')),
      'teamPlayers' => TeamPlayerResource::collection($this->whenLoaded('teamPlayers')),
      'game_matches_as_first_team' => GameMatchResource::collection($this->whenLoaded('gameMatchesAsFirstTeam')),
      'game_matches_as_second_team' => GameMatchResource::collection($this->whenLoaded('gameMatchesAsSecondTeam')),
    ];
  }
}
