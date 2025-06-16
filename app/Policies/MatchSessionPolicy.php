<?php

namespace App\Policies;

use App\Models\MatchSession;
use App\Models\Player;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class MatchSessionPolicy
{
    /**
     * Determine whether the user can view any match sessions.
     */
    public function viewAny(User $user): bool
    {
        return true; // Any authenticated user can view match sessions
    }

    /**
     * Determine whether the user can view the match session.
     */
    public function view(User $user, MatchSession $matchSession): bool
    {
        // Users can view match sessions for turfs they are players in
        return $user->players()->where('turf_id', $matchSession->turf_id)->exists();
    }

    /**
     * Determine whether the user can create match sessions.
     */
    public function create(User $user): bool
    {
        // Any user who is a player with manager or admin role in any turf can create match sessions
        return $user->players()
            ->whereIn('turf_id', function ($query) use ($user) {
                $query->select('turf_id')
                    ->from('players')
                    ->where('user_id', $user->id);
            })
            ->exists() && (
                $user->hasAnyTurfRole([User::TURF_ROLE_ADMIN, User::TURF_ROLE_MANAGER])
            );
    }

    /**
     * Determine whether the user can update the match session.
     */
    public function update(User $user, MatchSession $matchSession): bool
    {
        // Check if user is admin/manager of the turf
        return $this->canManageMatchSession($user, $matchSession);
    }

    /**
     * Determine whether the user can delete the match session.
     */
    public function delete(User $user, MatchSession $matchSession): bool
    {
        // Only turf admins and managers can delete match sessions
        return $this->canManageMatchSession($user, $matchSession);
    }

    /**
     * Determine whether the user can start a match session.
     */
    public function start(User $user, MatchSession $matchSession): bool
    {
        return $this->canManageMatchSession($user, $matchSession);
    }

    /**
     * Determine whether the user can stop a match session.
     */
    public function stop(User $user, MatchSession $matchSession): bool
    {
        return $this->canManageMatchSession($user, $matchSession);
    }

    /**
     * Determine whether the user can add players to teams in the match session.
     */
    public function addPlayersToTeam(User $user, MatchSession $matchSession): bool
    {
        return $this->canManageMatchSession($user, $matchSession);
    }

    /**
     * Determine whether the user can set match results.
     */
    public function setMatchResult(User $user, MatchSession $matchSession): bool
    {
        return $this->canManageMatchSession($user, $matchSession);
    }

    /**
     * Helper method to check if user can manage the match session.
     */
    private function canManageMatchSession(User $user, MatchSession $matchSession): bool
    {
        // Check if user has admin or manager role in the turf
        return $user->hasRoleOnTurf(User::TURF_ROLE_ADMIN, $matchSession->turf_id) ||
            $user->hasRoleOnTurf(User::TURF_ROLE_MANAGER, $matchSession->turf_id);
    }
}
