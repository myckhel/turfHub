<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable implements MustVerifyEmail
{
  /** @use HasFactory<\Database\Factories\UserFactory> */
  use HasApiTokens, HasFactory, Notifiable, HasRoles;

  /**
   * User role constants for turf-specific roles
   */
  public const TURF_ROLE_ADMIN = 'admin';
  public const TURF_ROLE_MANAGER = 'manager';
  public const TURF_ROLE_PLAYER = 'player';

  /**
   * Global role constants
   */
  public const ROLE_SUPER_ADMIN = 'super-admin';

  /**
   * The attributes that are mass assignable.
   *
   * @var list<string>
   */
  protected $fillable = [
    'name',
    'email',
    'password',
    // 'role' - removed as roles are now managed through Laravel Permission package
  ];

  /**
   * The attributes that should be hidden for serialization.
   *
   * @var list<string>
   */
  protected $hidden = [
    'password',
    'remember_token',
  ];

  /**
   * Get the attributes that should be cast.
   *
   * @return array<string, string>
   */
  protected function casts(): array
  {
    return [
      'email_verified_at' => 'datetime',
      'password' => 'hashed',
    ];
  }

  /**
   * Get the turfs owned by this user.
   */
  public function ownedTurfs(): HasMany
  {
    return $this->hasMany(Turf::class, 'owner_id');
  }

  /**
   * Get the player record for this user.
   */
  public function players(): HasMany
  {
    return $this->hasMany(Player::class);
  }

  /**
   * Get the turfs that this user belongs to through their player relationships.
   */
  public function belongingTurfs(): \Illuminate\Database\Eloquent\Relations\BelongsToMany
  {
    return $this->belongsToMany(Turf::class, 'players', 'user_id', 'turf_id')
      ->withPivot('is_member', 'status')
      ->withTimestamps();
  }

  /**
   * Check if user has a specific role within a turf.
   */
  public function hasRoleOnTurf(string $role, int $turfId): bool
  {
    // Set the turf context and check role
    $currentTeamId = getPermissionsTeamId();
    setPermissionsTeamId($turfId);

    $hasRole = $this->hasRole($role);

    // Restore previous team context
    setPermissionsTeamId($currentTeamId);

    return $hasRole;
  }

  /**
   * Check if user is an admin (legacy method - checks global role).
   */
  public function isAdmin(): bool
  {
    // Use team context 0 for global role check (since null doesn't work with teams enabled)
    $currentTeamId = getPermissionsTeamId();
    setPermissionsTeamId(0);

    $hasRole = $this->hasRole(self::ROLE_SUPER_ADMIN);

    // Restore team context
    setPermissionsTeamId($currentTeamId);

    return $hasRole;
  }

  /**
   * Check if user is a turf admin.
   */
  public function isTurfAdmin(int $turfId): bool
  {
    return $this->hasRoleOnTurf(self::TURF_ROLE_ADMIN, $turfId);
  }

  /**
   * Check if user is a manager (legacy method - checks global role).
   */
  public function isManager(): bool
  {
    return $this->hasRole(self::TURF_ROLE_MANAGER);
  }

  /**
   * Check if user is a turf manager.
   */
  public function isTurfManager(int $turfId): bool
  {
    return $this->hasRoleOnTurf(self::TURF_ROLE_MANAGER, $turfId);
  }

  /**
   * Check if user is a player (legacy method - checks global role).
   */
  public function isPlayer(): bool
  {
    return $this->hasRole(self::TURF_ROLE_PLAYER);
  }

  /**
   * Check if user is a turf player.
   */
  public function isTurfPlayer(int $turfId): bool
  {
    return $this->hasRoleOnTurf(self::TURF_ROLE_PLAYER, $turfId);
  }

  /**
   * Check if user has any role within a turf.
   */
  public function belongsToTurf(int $turfId): bool
  {
    return $this->isTurfAdmin($turfId) ||
      $this->isTurfManager($turfId) ||
      $this->isTurfPlayer($turfId);
  }

  /**
   * Get all turfs where user has any role.
   */
  public function getTurfsWithRoles(): array
  {
    $turfs = [];
    $currentTeamId = getPermissionsTeamId();

    // Get all roles for this user
    $roles = $this->roles()->whereNotNull('turf_id')->get();

    foreach ($roles as $role) {
      if (!in_array($role->turf_id, $turfs)) {
        $turfs[] = $role->turf_id;
      }
    }

    setPermissionsTeamId($currentTeamId);

    return $turfs;
  }

  /**
   * Check if user has any of the specified turf roles across all turfs.
   */
  public function hasAnyTurfRole(array $roles): bool
  {
    foreach ($this->players as $player) {
      foreach ($roles as $role) {
        if ($this->hasRoleOnTurf($role, $player->turf_id)) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Get the payments made by this user.
   */
  public function payments(): HasMany
  {
    return $this->hasMany(Payment::class);
  }

  /**
   * Get successful payments made by this user.
   */
  public function successfulPayments(): HasMany
  {
    return $this->payments()->where('status', \App\Models\Payment::STATUS_SUCCESS);
  }
}
