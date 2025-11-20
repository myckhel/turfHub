<?php

namespace App\Policies;

use App\Models\Tournament;
use App\Models\User;

class TournamentPolicy
{
  /**
   * Determine whether the user can view any models.
   */
  public function viewAny(User $user): bool
  {
    return true; // Anyone can list tournaments
  }

  /**
   * Determine whether the user can view the model.
   */
  public function view(User $user, Tournament $tournament): bool
  {
    // Super admins, turf owners, or tournament creator can view
    return $user->hasRole(User::ROLE_SUPER_ADMIN)
      || $tournament->turf->owner_id === $user->id
      || $tournament->created_by === $user->id;
  }

  /**
   * Determine whether the user can create models.
   */
  public function create(User $user): bool
  {
    // Super admins and turf owners can create tournaments
    return $user->hasRole(User::ROLE_SUPER_ADMIN) || $user->ownedTurfs()->exists();
  }

  /**
   * Determine whether the user can update the model.
   */
  public function update(User $user, Tournament $tournament): bool
  {
    // Super admins, turf owners, or tournament creator can update
    return $user->hasRole(User::ROLE_SUPER_ADMIN)
      || $tournament->turf->owner_id === $user->id
      || $tournament->created_by === $user->id;
  }

  /**
   * Determine whether the user can delete the model.
   */
  public function delete(User $user, Tournament $tournament): bool
  {
    // Super admins, turf owners, or tournament creator can delete
    return $user->hasRole(User::ROLE_SUPER_ADMIN)
      || $tournament->turf->owner_id === $user->id
      || $tournament->created_by === $user->id;
  }

  /**
   * Determine whether the user can restore the model.
   */
  public function restore(User $user, Tournament $tournament): bool
  {
    return $user->hasRole(User::ROLE_SUPER_ADMIN);
  }

  /**
   * Determine whether the user can permanently delete the model.
   */
  public function forceDelete(User $user, Tournament $tournament): bool
  {
    return $user->hasRole(User::ROLE_SUPER_ADMIN);
  }
}
