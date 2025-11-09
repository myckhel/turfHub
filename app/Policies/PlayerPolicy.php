<?php

namespace App\Policies;

use App\Models\Player;
use App\Models\User;
use App\Services\TurfPermissionService;

class PlayerPolicy
{
    protected TurfPermissionService $turfPermissionService;

    public function __construct(TurfPermissionService $turfPermissionService)
    {
        $this->turfPermissionService = $turfPermissionService;
    }

    /**
     * Determine whether the user can view any players.
     */
    public function viewAny(User $user): bool
    {
        return true; // Any authenticated user can view players in their turfs
    }

    /**
     * Determine whether the user can view the player.
     */
    public function view(User $user, Player $player): bool
    {
        // User can view if they belong to the same turf or are themselves
        return $user->belongsToTurf($player->turf_id) || $player->user_id === $user->id;
    }

    /**
     * Determine whether the user can create players (join a turf).
     */
    public function create(User $user): bool
    {
        return true; // Any authenticated user can join a turf as a player
    }

    /**
     * Determine whether the user can update the player.
     */
    public function update(User $user, Player $player): bool
    {
        // User can update their own player record
        if ($player->user_id === $user->id) {
            return true;
        }

        // Turf admins and managers can update players in their turf
        return $this->turfPermissionService->userCanInTurf($user, 'manage players', $player->turf_id);
    }

    /**
     * Determine whether the user can delete the player.
     */
    public function delete(User $user, Player $player): bool
    {
        // User can leave a turf (delete their own player record)
        if ($player->user_id === $user->id) {
            return true;
        }

        // Turf admins and managers can remove players from their turf
        return $this->turfPermissionService->userCanInTurf($user, 'remove players', $player->turf_id);
    }

    /**
     * Determine whether the user can join a team in a match session.
     */
    public function joinTeam(User $user, Player $player): bool
    {
        // User can join teams if they are an active player in the turf
        return $player->user_id === $user->id && $player->status === 'active';
    }

    /**
     * Determine whether the user can view match sessions for this player's turf.
     */
    public function viewMatchSessions(User $user, Player $player): bool
    {
        // User can view match sessions if they belong to the same turf
        return $user->belongsToTurf($player->turf_id);
    }

    /**
     * Determine whether the user can make payments as this player.
     */
    public function makePayment(User $user, Player $player): bool
    {
        // User can make payments only for their own player record
        return $player->user_id === $user->id && $player->status === 'active';
    }

    /**
     * Determine whether the user can update a player's role.
     * Only turf admins can manage player roles.
     */
    public function updateRole(User $user, Player $player): bool
    {
        // Only turf admins can manage roles
        return $user->hasRoleOnTurf(User::TURF_ROLE_ADMIN, $player->turf_id);
    }
}
