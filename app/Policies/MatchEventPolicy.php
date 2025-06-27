<?php

namespace App\Policies;

use App\Models\MatchEvent;
use App\Models\User;

class MatchEventPolicy
{
  /**
   * Determine whether the user can view the match event.
   */
  public function view(User $user, MatchEvent $matchEvent): bool
  {
    // Users can view match events if they have access to the turf
    return $matchEvent->gameMatch->matchSession->turf
      ->players()
      ->where('user_id', $user->id)
      ->exists() ||
      $user->hasAnyTurfRole([User::TURF_ROLE_ADMIN, User::TURF_ROLE_MANAGER], $matchEvent->gameMatch->matchSession->turf_id);
  }

  /**
   * Determine whether the user can create match events.
   */
  public function create(User $user): bool
  {
    // Only authenticated users can create match events (specific turf check will be done in controller)
    return true;
  }

  /**
   * Determine whether the user can update the match event.
   */
  public function update(User $user, MatchEvent $matchEvent): bool
  {
    // Only turf admins and managers can update match events
    return $user->hasAnyTurfRole([User::TURF_ROLE_ADMIN, User::TURF_ROLE_MANAGER], $matchEvent->gameMatch->matchSession->turf_id);
  }

  /**
   * Determine whether the user can delete the match event.
   */
  public function delete(User $user, MatchEvent $matchEvent): bool
  {
    // Only turf admins and managers can delete match events
    return $user->hasAnyTurfRole([User::TURF_ROLE_ADMIN, User::TURF_ROLE_MANAGER], $matchEvent->gameMatch->matchSession->turf_id);
  }
}
