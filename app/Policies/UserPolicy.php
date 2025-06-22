<?php

namespace App\Policies;

use App\Models\User;

class UserPolicy
{
  /**
   * Determine whether the user can view any users.
   */
  public function viewAny(User $user): bool
  {
    return true; // Any authenticated user can view users
  }

  /**
   * Determine whether the user can view the user.
   */
  public function view(User $user, User $model): bool
  {
    // Users can view their own profile or any other user
    // In production, you might want to restrict this based on roles
    return true;
  }

  /**
   * Determine whether the user can create users.
   */
  public function create(User $user): bool
  {
    return true; // Any authenticated user can create users
  }

  /**
   * Determine whether the user can update the user.
   */
  public function update(User $user, User $model): bool
  {
    // Users can only update their own profile
    return $user->id === $model->id;
  }

  /**
   * Determine whether the user can delete the user.
   */
  public function delete(User $user, User $model): bool
  {
    // Users can only delete their own profile
    return $user->id === $model->id;
  }

  /**
   * Determine whether the user can restore the user.
   */
  public function restore(User $user, User $model): bool
  {
    return $user->id === $model->id;
  }

  /**
   * Determine whether the user can permanently delete the user.
   */
  public function forceDelete(User $user, User $model): bool
  {
    return $user->id === $model->id;
  }
}
