<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TeamPlayer extends Model
{
  use HasFactory;

  /**
   * The table associated with the model.
   *
   * @var string
   */

  /**
   * The attributes that are mass assignable.
   *
   * @var array<int, string>
   */
  protected $fillable = [
    'team_id',
    'player_id',
    'status', // e.g., active, benched, substituted_out
    'payment_status', // e.g., pending, confirmed, expired, failed
    'reserved_at', // Timestamp when slot was reserved for payment
    'payment_reference', // Payment reference for tracking
    'join_time', // Timestamp when player joined the team for the session
  ];

  /**
   * Get the attributes that should be cast.
   *
   * @return array<string, string>
   */
  protected function casts(): array
  {
    return [
      'join_time' => 'datetime',
      'reserved_at' => 'datetime',
    ];
  }

  /**
   * Get the team this entry belongs to.
   */
  public function team(): BelongsTo
  {
    return $this->belongsTo(Team::class);
  }

  /**
   * Get the player this entry belongs to.
   */
  public function player(): BelongsTo
  {
    return $this->belongsTo(Player::class);
  }

  /**
   * Check if the team player slot is confirmed.
   */
  public function isConfirmed(): bool
  {
    return $this->payment_status === 'confirmed';
  }

  /**
   * Check if the team player slot is pending payment.
   */
  public function isPendingPayment(): bool
  {
    return $this->payment_status === 'pending';
  }

  /**
   * Check if the team player slot reservation has expired.
   */
  public function isExpired(): bool
  {
    if (!$this->reserved_at || $this->payment_status !== 'pending') {
      return false;
    }

    // Reservation expires after 5 minutes
    return $this->reserved_at->addMinutes(5)->isPast();
  }

  /**
   * Mark the team player slot as confirmed.
   */
  public function markAsConfirmed(): void
  {
    $this->update([
      'payment_status' => 'confirmed',
      'reserved_at' => null,
      'join_time' => now(),
    ]);
  }

  /**
   * Mark the team player slot as expired.
   */
  public function markAsExpired(): void
  {
    $this->update([
      'payment_status' => 'expired'
    ]);
  }

  /**
   * Mark the team player slot as failed.
   */
  public function markAsFailed(): void
  {
    $this->update([
      'payment_status' => 'failed'
    ]);
  }

  /**
   * Scope for confirmed team players only.
   */
  public function scopeConfirmed($query)
  {
    return $query->where('payment_status', 'confirmed');
  }

  /**
   * Scope for pending payment team players.
   */
  public function scopePendingPayment($query)
  {
    return $query->where('payment_status', 'pending');
  }

  /**
   * Scope for expired reservations.
   */
  public function scopeExpired($query)
  {
    return $query->where('payment_status', 'pending')
      ->where('reserved_at', '<', now()->subMinutes(5));
  }
}
