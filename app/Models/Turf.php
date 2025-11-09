<?php

namespace App\Models;

use App\Services\TurfPermissionService;
use App\Traits\Payable;
use Bavix\Wallet\Traits\HasWallet;
use Bavix\Wallet\Interfaces\Wallet;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Turf extends Model implements Wallet
{
  use HasFactory, Payable, HasWallet;

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
    'team_slot_fee',
    'is_active',
    'settings',
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
      'team_slot_fee' => 'decimal:2',
      'is_active' => 'boolean',
      'settings' => 'array',
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
    $turfPermissionService = app(TurfPermissionService::class);
    return $turfPermissionService->getUsersWithRoleInTurf(User::TURF_ROLE_ADMIN, $this->id);
  }

  /**
   * Get all players who have manager role in this turf.
   */
  public function managers(): \Illuminate\Support\Collection
  {
    $turfPermissionService = app(TurfPermissionService::class);
    return $turfPermissionService->getUsersWithRoleInTurf(User::TURF_ROLE_MANAGER, $this->id);
  }

  /**
   * Get all players who have player role in this turf.
   */
  public function turfPlayers(): \Illuminate\Support\Collection
  {
    $turfPermissionService = app(TurfPermissionService::class);
    return $turfPermissionService->getUsersWithRoleInTurf(User::TURF_ROLE_PLAYER, $this->id);
  }

  /**
   * Check if this turf requires team slot fees.
   */
  public function requiresTeamSlotFee(): bool
  {
    return $this->team_slot_fee !== null && $this->team_slot_fee > 0;
  }

  /**
   * Get the team slot fee amount.
   */
  public function getTeamSlotFee(): ?float
  {
    return $this->team_slot_fee;
  }

  /**
   * Get the bank accounts associated with this turf.
   */
  public function bankAccounts(): \Illuminate\Database\Eloquent\Relations\MorphMany
  {
    return $this->morphMany(BankAccount::class, 'accountable');
  }

  /**
   * Get the active bank accounts for this turf.
   */
  public function activeBankAccounts(): \Illuminate\Database\Eloquent\Relations\MorphMany
  {
    return $this->bankAccounts()->where('is_active', true);
  }

  /**
   * Get the primary bank account for this turf.
   */
  public function primaryBankAccount(): \Illuminate\Database\Eloquent\Relations\MorphOne
  {
    return $this->morphOne(BankAccount::class, 'accountable')
      ->where('is_active', true)
      ->orderBy('created_at', 'asc');
  }

  /**
   * Get turf settings with defaults.
   */
  public function getSettings(): array
  {
    $defaultSettings = [
      'payment_methods' => [
        'cash_enabled' => true,
        'wallet_enabled' => true,
        'online_enabled' => true,
      ],
    ];

    if (!$this->settings) {
      return $defaultSettings;
    }

    return array_merge($defaultSettings, $this->settings);
  }

  /**
   * Update turf settings.
   */
  public function updateSettings(array $settings): bool
  {
    $currentSettings = $this->getSettings();
    $mergedSettings = array_replace_recursive($currentSettings, $settings);

    return $this->update(['settings' => $mergedSettings]);
  }

  /**
   * Get enabled payment methods.
   */
  public function getPaymentMethods(): array
  {
    $settings = $this->getSettings();
    $paymentMethods = $settings['payment_methods'] ?? [];

    $enabled = [];
    if ($paymentMethods['cash_enabled'] ?? false) {
      $enabled[] = 'cash';
    }
    if ($paymentMethods['wallet_enabled'] ?? false) {
      $enabled[] = 'wallet';
    }
    if ($paymentMethods['online_enabled'] ?? false) {
      $enabled[] = 'online';
    }

    return $enabled;
  }

  /**
   * Check if a specific payment method is enabled.
   */
  public function isPaymentMethodEnabled(string $method): bool
  {
    $settings = $this->getSettings();
    $paymentMethods = $settings['payment_methods'] ?? [];

    return match($method) {
      'cash', 'offline' => $paymentMethods['cash_enabled'] ?? false,
      'wallet' => $paymentMethods['wallet_enabled'] ?? false,
      'online', 'paystack' => $paymentMethods['online_enabled'] ?? false,
      default => false,
    };
  }

  /**
   * Get the user's role in this turf.
   */
  public function getUserRoleInTurf(User $user): ?string
  {
    // Check if user is owner
    if ($this->owner_id === $user->id) {
      return User::TURF_ROLE_ADMIN;
    }

    // Check user's roles in this turf context
    if ($user->isAdminInTurf($this->id)) {
      return User::TURF_ROLE_ADMIN;
    }

    if ($user->isManagerInTurf($this->id)) {
      return User::TURF_ROLE_MANAGER;
    }

    if ($user->isPlayerInTurf($this->id)) {
      return User::TURF_ROLE_PLAYER;
    }

    return null;
  }
}
