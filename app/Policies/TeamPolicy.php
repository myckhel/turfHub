<?php

namespace App\Policies;

use App\Models\Team;
use App\Models\User;
use App\Services\TurfPermissionService;

class TeamPolicy
{
    protected TurfPermissionService $turfPermissionService;

    public function __construct(TurfPermissionService $turfPermissionService)
    {
        $this->turfPermissionService = $turfPermissionService;
    }

    /**
     * Determine whether the user can view any teams.
     */
    public function viewAny(User $user): bool
    {
        return true; // Any authenticated user can view teams in their turfs
    }

    /**
     * Determine whether the user can view the team.
     */
    public function view(User $user, Team $team): bool
    {
        // User can view if they belong to the turf
        return $user->belongsToTurf($team->matchSession->turf_id);
    }

    /**
     * Determine whether the user can create teams.
     */
    public function create(User $user): bool
    {
        // Any user who is a manager or admin in any turf can create teams
        return $user->hasAnyTurfRole([User::TURF_ROLE_ADMIN, User::TURF_ROLE_MANAGER]);
    }

    /**
     * Determine whether the user can update the team.
     */
    public function update(User $user, Team $team): bool
    {
        // Team captain can update their team
        if ($team->captain_id === $user->id) {
            return true;
        }

        // Turf admins and managers can update teams
        return $this->turfPermissionService->userCanInTurf($user, 'manage teams', $team->matchSession->turf_id);
    }

    /**
     * Determine whether the user can delete the team.
     */
    public function delete(User $user, Team $team): bool
    {
        // Only turf admins and managers can delete teams
        return $this->turfPermissionService->userCanInTurf($user, 'manage teams', $team->matchSession->turf_id);
    }

    /**
     * Determine whether the user can join this team.
     */
    public function join(User $user, Team $team): bool
    {
        // User must be a player in the turf and the match session must be accepting players
        $player = $user->players()->where('turf_id', $team->matchSession->turf_id)->first();
        
        if (!$player || $player->status !== 'active') {
            return false;
        }

        // Check if match session is in the right state
        return in_array($team->matchSession->status, ['scheduled', 'active']);
    }

    /**
     * Determine whether the user can leave this team.
     */
    public function leave(User $user, Team $team): bool
    {
        // User can leave if they are part of the team and match hasn't started
        $isTeamMember = $team->teamPlayers()->whereHas('player', function ($query) use ($user) {
            $query->where('user_id', $user->id);
        })->exists();

        return $isTeamMember && $team->matchSession->status === 'scheduled';
    }

    /**
     * Determine whether the user can invite players to this team.
     */
    public function invitePlayers(User $user, Team $team): bool
    {
        // Team captain can invite players
        if ($team->captain_id === $user->id) {
            return true;
        }

        // Turf admins and managers can invite players to teams
        return $this->turfPermissionService->userCanInTurf($user, 'manage teams', $team->matchSession->turf_id);
    }
}
