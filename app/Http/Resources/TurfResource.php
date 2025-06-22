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
    $user = $request->user();
    $turfPermissionService = app(\App\Services\TurfPermissionService::class);

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
      'player' => new PlayerResource($this->whenLoaded('player')),
      'match_sessions' => MatchSessionResource::collection($this->whenLoaded('matchSessions')),
      'active_match_sessions' => MatchSessionResource::collection($this->whenLoaded('activeMatchSessions')),

      // Permission information for the current user
      'user_permissions' => $this->when($user, function () use ($user, $turfPermissionService) {

        // Clear any cached permissions to ensure fresh check
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        return [
          'can_manage_turf' => $turfPermissionService->userCanInTurf($user, 'manage turf settings', $this->id),
          'can_invite_players' => $turfPermissionService->userCanInTurf($user, 'invite players', $this->id),
          'can_remove_players' => $turfPermissionService->userCanInTurf($user, 'remove players', $this->id),
          'can_manage_sessions' => $turfPermissionService->userCanInTurf($user, 'manage match sessions', $this->id),
          'can_create_teams' => $turfPermissionService->userCanInTurf($user, 'create teams', $this->id),
          'can_view_analytics' => $turfPermissionService->userCanInTurf($user, 'view turf analytics', $this->id),
          'is_owner' => $this->owner_id === $user->id,
          'role_in_turf' => $this->getUserRoleInTurf($user),
        ];
      }),

      // Role summary
      'role_counts' => [
        'admins' => $this->admins()->count(),
        'managers' => $this->managers()->count(),
        'players' => $this->turfPlayers()->count(),
      ],
    ];
  }

  /**
   * Get the user's role in this turf.
   */
  private function getUserRoleInTurf($user): ?string
  {
    if (!$user) {
      return null;
    }

    if ($user->isTurfAdmin($this->id)) {
      return 'admin';
    }

    if ($user->isTurfManager($this->id)) {
      return 'manager';
    }

    if ($user->isTurfPlayer($this->id)) {
      return 'player';
    }

    return null;
  }
}
