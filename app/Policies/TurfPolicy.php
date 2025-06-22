<?php

namespace App\Policies;

use App\Models\Turf;
use App\Models\User;
use App\Services\TurfPermissionService;
use Illuminate\Auth\Access\Response;

class TurfPolicy
{
  protected TurfPermissionService $turfPermissionService;

  public function __construct(TurfPermissionService $turfPermissionService)
  {
    $this->turfPermissionService = $turfPermissionService;
  }

  /**
   * Determine whether the user can view any turfs.
   */
  public function viewAny(User $user): bool
  {
    return true; // Users can view turfs they have access to
  }

  /**
   * Determine whether the user can view the turf.
   */
  public function view(User $user, Turf $turf): bool
  {
    // User can view if they belong to the turf or own it
    return $user->belongsToTurf($turf->id) || $turf->owner_id === $user->id;
  }

  /**
   * Determine whether the user can create turfs.
   */
  public function create(User $user): bool
  {
    return true; // Any authenticated user can create a turf
  }

  /**
   * Determine whether the user can update the turf.
   */
  public function update(User $user, Turf $turf): bool
  {
    // Owner can always update
    if ($turf->owner_id === $user->id) {
      return true;
    }

    // Check if user has admin role in this turf
    return $this->turfPermissionService->userCanInTurf($user, 'manage turf settings', $turf->id);
  }

  /**
   * Determine whether the user can delete the turf.
   */
  public function delete(User $user, Turf $turf): bool
  {
    // Only the owner can delete a turf
    return $turf->owner_id === $user->id;
  }

  /**
   * Determine whether the user can restore the turf.
   */
  public function restore(User $user, Turf $turf): bool
  {
    return $turf->owner_id === $user->id;
  }

  /**
   * Determine whether the user can permanently delete the turf.
   */
  public function forceDelete(User $user, Turf $turf): bool
  {
    return $turf->owner_id === $user->id;
  }

  /**
   * Determine whether the user can manage match sessions.
   */
  public function manageMatchSessions(User $user, Turf $turf): bool
  {
    return $this->turfPermissionService->userCanInTurf($user, 'manage match sessions', $turf->id);
  }

  /**
   * Determine whether the user can invite players.
   */
  public function invitePlayers(User $user, Turf $turf): bool
  {
    return $this->turfPermissionService->userCanInTurf($user, 'invite players', $turf->id);
  }

  /**
   * Determine whether the user can remove players.
   */
  public function removePlayers(User $user, Turf $turf): bool
  {
    return $this->turfPermissionService->userCanInTurf($user, 'remove players', $turf->id);
  }

  /**
   * Determine whether the user can view analytics.
   */
  public function viewAnalytics(User $user, Turf $turf): bool
  {
    return $this->turfPermissionService->userCanInTurf($user, 'view turf analytics', $turf->id);
  }

  /**
   * Determine whether the user can create teams.
   */
  public function createTeams(User $user, Turf $turf): bool
  {
    return $this->turfPermissionService->userCanInTurf($user, 'create teams', $turf->id);
  }

  /**
   * Determine whether the user can manage teams.
   */
  public function manageTeams(User $user, Turf $turf): bool
  {
    return $this->turfPermissionService->userCanInTurf($user, 'manage teams', $turf->id);
  }

  /**
   * Determine whether the user can join a turf as a player.
   */
  public function join(User $user, Turf $turf): bool
  {
    // User cannot join if they are the owner
    if ($turf->owner_id === $user->id) {
      return false;
    }

    // User cannot join if turf is not active
    if (!$turf->is_active) {
      return false;
    }

    // User cannot join if they already belong to this turf
    if ($user->belongsToTurf($turf->id)) {
      return false;
    }

    // Any authenticated user can join an active turf
    return true;
  }

  /**
   * Determine whether the user can leave a turf.
   */
  public function leave(User $user, Turf $turf): bool
  {
    // User cannot leave if they are the owner
    if ($turf->owner_id === $user->id) {
      return false;
    }

    // User can only leave if they belong to this turf
    return $user->belongsToTurf($turf->id);
  }
}
