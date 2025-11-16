<?php

namespace App\Policies;

use App\Models\GameMatch;
use App\Models\User;

class GameMatchPolicy
{
  /**
   * Get turf ID from game match via matchSession or stage.
   */
  private function getTurfId(GameMatch $gameMatch): ?int
  {
    if ($gameMatch->matchSession) {
      return $gameMatch->matchSession->turf_id;
    }

    return $gameMatch->stage?->tournament?->turf_id;
  }

  /**
   * Get turf object from game match via matchSession or stage.
   */
  private function getTurf(GameMatch $gameMatch)
  {
    if ($gameMatch->matchSession) {
      return $gameMatch->matchSession->turf;
    }

    return $gameMatch->stage?->tournament?->turf;
  }

  /**
   * Check if user has turf admin or manager role.
   */
  private function hasAdminOrManagerRole(User $user, GameMatch $gameMatch): bool
  {
    $turfId = $this->getTurfId($gameMatch);
    return $turfId && $user->hasAnyTurfRole([User::TURF_ROLE_ADMIN, User::TURF_ROLE_MANAGER], $turfId);
  }

  /**
   * Determine whether the user can view the game match.
   */
  public function view(User $user, GameMatch $gameMatch): bool
  {
    // Users can view game matches if they have access to the turf
    $turf = $this->getTurf($gameMatch);
    return $turf?->players()
      ->where('user_id', $user->id)
      ->exists() ?? false;
  }

  /**
   * Determine whether the user can update the game match.
   */
  public function update(User $user, GameMatch $gameMatch): bool
  {
    // Only turf admins and managers can update game matches
    return $this->hasAdminOrManagerRole($user, $gameMatch);
  }

  /**
   * Determine whether the user can delete the game match.
   */
  public function delete(User $user, GameMatch $gameMatch): bool
  {
    // Only turf admins and managers can delete game matches
    return $this->hasAdminOrManagerRole($user, $gameMatch);
  }

  /**
   * Determine whether the user can manage match events.
   */
  public function manageEvents(User $user, GameMatch $gameMatch): bool
  {
    // Only turf admins and managers can manage match events
    return $this->hasAdminOrManagerRole($user, $gameMatch);
  }

  /**
   * Determine whether the user can manage betting for the game match.
   */
  public function manageBetting(User $user, GameMatch $gameMatch): bool
  {
    // Only turf owners, admins and managers can manage betting
    $turf = $this->getTurf($gameMatch);
    return $turf && (
      $turf->owner_id === $user->id ||
      $this->hasAdminOrManagerRole($user, $gameMatch) ||
      $user->hasRole('super-admin') ||
      $user->hasPermissionTo('manage-betting')
    );
  }
}
