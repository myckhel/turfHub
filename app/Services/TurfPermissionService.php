<?php

namespace App\Services;

use App\Models\Player;
use App\Models\Turf;
use App\Models\User;
use Spatie\Permission\Models\Role;

class TurfPermissionService
{
  /**
   * Assign a role to a user within a specific turf.
   */
  public function assignRoleToUserInTurf(User $user, string $roleName, int $turfId): void
  {
    $currentTeamId = getPermissionsTeamId();
    setPermissionsTeamId($turfId);

    try {
      // Create role for this turf if it doesn't exist (team context handles turf scope)
      $role = Role::firstOrCreate([
        'name' => $roleName,
        'guard_name' => 'web', // Assuming web guard, adjust if needed
      ]);

      $user->assignRole($role);
    } finally {
      setPermissionsTeamId($currentTeamId);
    }
  }

  /**
   * Remove a role from a user within a specific turf.
   */
  public function removeRoleFromUserInTurf(User $user, string $roleName, int $turfId): void
  {
    $currentTeamId = getPermissionsTeamId();
    setPermissionsTeamId($turfId);

    try {
      $user->removeRole($roleName);
    } finally {
      setPermissionsTeamId($currentTeamId);
    }
  }

  /**
   * Add a player to a turf with a specific role.
   */
  public function addPlayerToTurf(User $user, Turf $turf, string $role = User::TURF_ROLE_PLAYER): Player
  {
    // Create or find the player record
    $player = Player::firstOrCreate([
      'user_id' => $user->id,
      'turf_id' => $turf->id,
    ], [
      'is_member' => false,
      'status' => 'active',
    ]);

    // Assign the role in the turf context
    $this->assignRoleToUserInTurf($user, $role, $turf->id);

    return $player;
  }

  /**
   * Remove a player from a turf (removes all roles).
   */
  public function removePlayerFromTurf(User $user, Turf $turf): void
  {
    $currentTeamId = getPermissionsTeamId();
    setPermissionsTeamId($turf->id);

    try {
      // Remove all turf-specific roles
      $roles = [User::TURF_ROLE_ADMIN, User::TURF_ROLE_MANAGER, User::TURF_ROLE_PLAYER];
      foreach ($roles as $role) {
        if ($user->hasRole($role)) {
          $user->removeRole($role);
        }
      }

      // Delete the player record
      Player::where('user_id', $user->id)
        ->where('turf_id', $turf->id)
        ->delete();
    } finally {
      setPermissionsTeamId($currentTeamId);
    }
  }

  /**
   * Promote a player to manager in a turf.
   */
  public function promoteToManager(User $user, int $turfId): void
  {
    $this->removeRoleFromUserInTurf($user, User::TURF_ROLE_PLAYER, $turfId);
    $this->assignRoleToUserInTurf($user, User::TURF_ROLE_MANAGER, $turfId);
  }

  /**
   * Promote a manager to admin in a turf.
   */
  public function promoteToAdmin(User $user, int $turfId): void
  {
    $this->removeRoleFromUserInTurf($user, User::TURF_ROLE_MANAGER, $turfId);
    $this->assignRoleToUserInTurf($user, User::TURF_ROLE_ADMIN, $turfId);
  }

  /**
   * Demote an admin to manager in a turf.
   */
  public function demoteToManager(User $user, int $turfId): void
  {
    $this->removeRoleFromUserInTurf($user, User::TURF_ROLE_ADMIN, $turfId);
    $this->assignRoleToUserInTurf($user, User::TURF_ROLE_MANAGER, $turfId);
  }

  /**
   * Demote a manager to player in a turf.
   */
  public function demoteToPlayer(User $user, int $turfId): void
  {
    $this->removeRoleFromUserInTurf($user, User::TURF_ROLE_MANAGER, $turfId);
    $this->assignRoleToUserInTurf($user, User::TURF_ROLE_PLAYER, $turfId);
  }

  /**
   * Get all users with a specific role in a turf.
   */
  public function getUsersWithRoleInTurf(string $roleName, int $turfId): \Illuminate\Support\Collection
  {
    $currentTeamId = getPermissionsTeamId();
    setPermissionsTeamId($turfId);

    try {
      // Check if the role exists (team context handles turf scope)
      $role = Role::where('name', $roleName)->first();

      if (!$role) {
        return collect();
      }

      // Get users who have the specific role in this turf
      return User::role($roleName)->get();
    } catch (\Spatie\Permission\Exceptions\RoleDoesNotExist $e) {
      // Handle case where role doesn't exist
      return collect();
    } finally {
      setPermissionsTeamId($currentTeamId);
    }
  }

  /**
   * Get all turfs where a user has any role.
   */
  public function getTurfsForUser(User $user): \Illuminate\Support\Collection
  {
    return Turf::whereHas('players', function ($query) use ($user) {
      $query->where('user_id', $user->id);
    })->get();
  }

  /**
   * Check if a user can perform an action in a turf.
   */
  public function userCanInTurf(User $user, string $permission, int $turfId): bool
  {
    // $currentTeamId = getPermissionsTeamId();
    // setPermissionsTeamId($turfId);

    // try {
    //   return $user->can($permission);
    // } finally {
    //   setPermissionsTeamId($currentTeamId);

    // For now, use role-based permission checking directly
    // since we're having issues with Spatie's permission system

    // Get the user's role in this turf
    if ($user->hasRoleOnTurf(User::TURF_ROLE_ADMIN, $turfId)) {
      // Admins can do everything
      return true;
    }

    if ($user->hasRoleOnTurf(User::TURF_ROLE_MANAGER, $turfId)) {
      // Managers can do most things except manage turf settings
      $managerPermissions = [
        'invite players',
        'remove players',
        'manage match sessions',
        'create teams',
        'view turf analytics',
        'manage teams',
      ];
      return in_array($permission, $managerPermissions);
    }

    if ($user->hasRoleOnTurf(User::TURF_ROLE_PLAYER, $turfId)) {
      // Players have limited permissions
      $playerPermissions = [
        'create teams' // Players can usually create teams
      ];
      return in_array($permission, $playerPermissions);
    }

    // No role = no permissions
    return false;
  }

  /**
   * Set up default roles and permissions for a new turf owner.
   */
  public function setupTurfOwner(User $user, Turf $turf): void
  {
    $this->addPlayerToTurf($user, $turf, User::TURF_ROLE_ADMIN);
  }
}
