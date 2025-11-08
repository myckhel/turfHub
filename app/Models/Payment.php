<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Payment extends Model
{
    use HasFactory;

    public const STATUS_PENDING = 'pending';
    public const STATUS_SUCCESS = 'success';
    public const STATUS_FAILED = 'failed';
    public const STATUS_CANCELLED = 'cancelled';

    // Payment type constants - now more flexible
    public const TYPE_SESSION_FEE = 'session_fee';
    public const TYPE_TEAM_JOINING_FEE = 'team_joining_fee';
    public const TYPE_TURF_BOOKING = 'turf_booking';
    public const TYPE_MEMBERSHIP_FEE = 'membership_fee';
    public const TYPE_EQUIPMENT_RENTAL = 'equipment_rental';
    public const TYPE_TOURNAMENT_FEE = 'tournament_fee';
    public const TYPE_BET = 'bet';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'payable_type',
        'payable_id',
        'reference',
        'paystack_reference',
        'amount',
        'currency',
        'status',
        'payment_method',
        'gateway_response',
        'paid_at',
        'metadata',
        'payment_type',
        'description',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'paid_at' => 'datetime',
            'metadata' => 'array',
        ];
    }

    /**
     * Get the user that made the payment.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the payable model (MatchSession, Team, Turf, etc.).
     */
    public function payable(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * Get the match session this payment is for (if payable is MatchSession).
     *
     * @deprecated Use payable() relationship instead
     */
    public function matchSession(): ?MatchSession
    {
        return $this->payable_type === MatchSession::class ? $this->payable : null;
    }

    /**
     * Get the team this payment is associated with (if payable is Team).
     *
     * @deprecated Use payable() relationship instead
     */
    public function team(): ?Team
    {
        return $this->payable_type === Team::class ? $this->payable : null;
    }

    /**
     * Check if payment is successful.
     */
    public function isSuccessful(): bool
    {
        return $this->status === self::STATUS_SUCCESS;
    }

    /**
     * Check if payment is pending.
     */
    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    /**
     * Check if payment has failed.
     */
    public function hasFailed(): bool
    {
        return $this->status === self::STATUS_FAILED;
    }

    /**
     * Mark payment as successful.
     */
    public function markAsSuccessful(): self
    {
        $this->update([
            'status' => self::STATUS_SUCCESS,
            'paid_at' => now(),
        ]);

        return $this;
    }

    /**
     * Mark payment as failed.
     */
    public function markAsFailed(string $reason = null): self
    {
        $this->update([
            'status' => self::STATUS_FAILED,
            'gateway_response' => $reason,
        ]);

        return $this;
    }

    /**
     * Get all available payment types.
     */
    public static function getPaymentTypes(): array
    {
        return [
            self::TYPE_SESSION_FEE => 'Session Fee',
            self::TYPE_TEAM_JOINING_FEE => 'Team Joining Fee',
            self::TYPE_TURF_BOOKING => 'Turf Booking',
            self::TYPE_MEMBERSHIP_FEE => 'Membership Fee',
            self::TYPE_EQUIPMENT_RENTAL => 'Equipment Rental',
            self::TYPE_TOURNAMENT_FEE => 'Tournament Fee',
        ];
    }

    /**
     * Check if the payment is for a specific payable type.
     */
    public function isForPayableType(string $payableType): bool
    {
        return $this->payable_type === $payableType;
    }

    /**
     * Check if the payment is for a match session.
     */
    public function isForMatchSession(): bool
    {
        return $this->isForPayableType(MatchSession::class);
    }

    /**
     * Check if the payment is for a team.
     */
    public function isForTeam(): bool
    {
        return $this->isForPayableType(Team::class);
    }

    /**
     * Check if the payment is for a turf.
     */
    public function isForTurf(): bool
    {
        return $this->isForPayableType(Turf::class);
    }
}
