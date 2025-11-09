<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
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
      // 'email' => $this->email,
      // 'role' - removed as roles are now managed through Laravel Permission package
      // Use getRoleNames() or hasRole() methods to check user roles
      'email_verified_at' => $this->email_verified_at,
      'created_at' => $this->created_at,
      'updated_at' => $this->updated_at,

      // Relationships (loaded when needed)
      'owned_turfs' => TurfResource::collection($this->whenLoaded('ownedTurfs')),
      'players' => PlayerResource::collection($this->whenLoaded('players')),
      'belonging_turfs' => TurfResource::collection($this->whenLoaded('belongingTurfs')),
    ];
  }
}
