<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class BankAccount extends Model
{
  use HasFactory;

  /**
   * The attributes that are mass assignable.
   *
   * @var array<int, string>
   */
  protected $fillable = [
    'accountable_type',
    'accountable_id',
    'bank_name',
    'bank_code',
    'account_number',
    'account_name',
    'paystack_recipient_code',
    'is_active',
    'is_verified',
    'verified_at',
    'metadata',
  ];

  /**
   * Get the attributes that should be cast.
   *
   * @return array<string, string>
   */
  protected function casts(): array
  {
    return [
      'is_active' => 'boolean',
      'is_verified' => 'boolean',
      'verified_at' => 'datetime',
      'metadata' => 'array',
    ];
  }

  /**
   * Get the owning accountable model (User or Turf).
   */
  public function accountable(): MorphTo
  {
    return $this->morphTo();
  }

  /**
   * Scope a query to only include active bank accounts.
   */
  public function scopeActive($query)
  {
    return $query->where('is_active', true);
  }

  /**
   * Scope a query to only include verified bank accounts.
   */
  public function scopeVerified($query)
  {
    return $query->where('is_verified', true);
  }
}
