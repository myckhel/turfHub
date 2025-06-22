<?php

namespace App\Models;

use App\Traits\Payable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Turf extends Model
{
  use HasFactory, Payable;

  /**
   * The attributes that are mass assignable.
   *
   * @var array<int, string>
   */
  protected $fillable = [
    'name',
    'description',
    'location',
    'owner_id',
    'requires_membership',
    'membership_fee',
    'membership_type',
    'max_players_per_team',
    'is_active',
  ];

  /**
   * Get the attributes that should be cast.
   *
   * @return array<string, string>
   */
  protected function casts(): array
  {
    return [
      'requires_membership' => 'boolean',
      'membership_fee' => 'decimal:2',
      'is_active' => 'boolean',
    ];
  }

  /**
   * Get the owner of the turf.
   */
  public function owner(): BelongsTo
  {
    return $this->belongsTo(User::class, 'owner_id');
  }

  /**
   * Get the players for this turf.
   */
  public function players(): HasMany
  {
    return $this->hasMany(Player::class);
  }

  /**
   * Get the match sessions for this turf.
   */
  public function matchSessions(): HasMany
  {
    return $this->hasMany(MatchSession::class);
  }

  /**
   * Get active match sessions for this turf.
   */
  public function activeMatchSessions(): HasMany
  {
    return $this->hasMany(MatchSession::class)->where('is_active', true);
  }

  /**
   * Boot the model and set up event listeners.
   */
  protected static function boot(): void
  {
    parent::boot();

    // When a turf is created, automatically assign the owner as admin
    static::created(function (Turf $turf) {
      $turfPermissionService = app(\App\Services\TurfPermissionService::class);
      $turfPermissionService->setupTurfOwner($turf->owner, $turf);
    });
  }

  /**
   * Get all players who have admin role in this turf.
   */
  public function admins(): \Illuminate\Support\Collection
  {
    $turfPermissionService = app(\App\Services\TurfPermissionService::class);
    return $turfPermissionService->getUsersWithRoleInTurf(User::TURF_ROLE_ADMIN, $this->id);
  }

  /**
   * Get all players who have manager role in this turf.
   */
  public function managers(): \Illuminate\Support\Collection
  {
    $turfPermissionService = app(\App\Services\TurfPermissionService::class);
    return $turfPermissionService->getUsersWithRoleInTurf(User::TURF_ROLE_MANAGER, $this->id);
  }

  /**
   * Get all players who have player role in this turf.
   */
  public function turfPlayers(): \Illuminate\Support\Collection
  {
    $turfPermissionService = app(\App\Services\TurfPermissionService::class);
    return $turfPermissionService->getUsersWithRoleInTurf(User::TURF_ROLE_PLAYER, $this->id);
  }
}
