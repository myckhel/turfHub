<?php

namespace App\Policies;

use App\Models\GameMatch;
use App\Models\User;

class GameMatchPolicy
{
  /**
   * Determine whether the user can view the game match.
   */
  public function view(User $user, GameMatch $gameMatch): bool
  {
    // Users can view game matches if they have access to the turf
    return $gameMatch->matchSession->turf
      ->players()
      ->where('user_id', $user->id)
      ->exists() ||
      $user->hasAnyTurfRole([User::TURF_ROLE_ADMIN, User::TURF_ROLE_MANAGER], $gameMatch->matchSession->turf_id);
  }

  /**
   * Determine whether the user can update the game match.
   */
  public function update(User $user, GameMatch $gameMatch): bool
  {
    // Only turf admins and managers can update game matches
    return $user->hasAnyTurfRole([User::TURF_ROLE_ADMIN, User::TURF_ROLE_MANAGER], $gameMatch->matchSession->turf_id);
  }

  /**
   * Determine whether the user can delete the game match.
   */
  public function delete(User $user, GameMatch $gameMatch): bool
  {
    // Only turf admins and managers can delete game matches
    return $user->hasAnyTurfRole([User::TURF_ROLE_ADMIN, User::TURF_ROLE_MANAGER], $gameMatch->matchSession->turf_id);
  }

  /**
   * Determine whether the user can manage match events.
   */
  public function manageEvents(User $user, GameMatch $gameMatch): bool
  {
    // Only turf admins and managers can manage match events
    return $user->hasAnyTurfRole([User::TURF_ROLE_ADMIN, User::TURF_ROLE_MANAGER], $gameMatch->matchSession->turf_id);
  }
}
