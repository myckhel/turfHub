<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Bet extends Model
{
    use HasFactory;

    // Status Constants
    public const STATUS_PENDING = 'pending';
    public const STATUS_ACTIVE = 'active';
    public const STATUS_WON = 'won';
    public const STATUS_LOST = 'lost';
    public const STATUS_CANCELLED = 'cancelled';
    public const STATUS_REFUNDED = 'refunded';

    // Payment Method Constants
    public const PAYMENT_ONLINE = 'online';
    public const PAYMENT_OFFLINE = 'offline';
    public const PAYMENT_WALLET = 'wallet';

    // Payment Status Constants
    public const PAYMENT_PENDING = 'pending';
    public const PAYMENT_CONFIRMED = 'confirmed';
    public const PAYMENT_FAILED = 'failed';

    // Payout Status Constants
    public const PAYOUT_PENDING = 'pending';
    public const PAYOUT_COMPLETED = 'completed';
    public const PAYOUT_FAILED = 'failed';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'betting_market_id',
        'market_option_id',
        'stake_amount',
        'odds_at_placement',
        'potential_payout',
        'actual_payout',
        'status',
        'placed_at',
        'settled_at',
        'payment_reference',
        'payment_method',
        'payment_status',
        'payment_confirmed_at',
        'payment_metadata',
        'payout_status',
        'payout_amount',
        'payout_processed_at',
        'payout_reference',
        'cancelled_at',
        'cancellation_reason',
        'refund_amount',
        'refund_processed_at',
        'refund_reference',
        'notes',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'stake_amount' => 'decimal:2',
            'odds_at_placement' => 'decimal:2',
            'potential_payout' => 'decimal:2',
            'actual_payout' => 'decimal:2',
            'payout_amount' => 'decimal:2',
            'refund_amount' => 'decimal:2',
            'placed_at' => 'datetime',
            'settled_at' => 'datetime',
            'payment_confirmed_at' => 'datetime',
            'payout_processed_at' => 'datetime',
            'cancelled_at' => 'datetime',
            'refund_processed_at' => 'datetime',
            'payment_metadata' => 'array',
        ];
    }

    /**
     * Get the user who placed this bet.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the betting market this bet belongs to.
     */
    public function bettingMarket(): BelongsTo
    {
        return $this->belongsTo(BettingMarket::class);
    }

    /**
     * Get the market option this bet is on.
     */
    public function marketOption(): BelongsTo
    {
        return $this->belongsTo(MarketOption::class);
    }

    /**
     * Check if the bet is pending.
     */
    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    /**
     * Check if the bet has won.
     */
    public function isWon(): bool
    {
        return $this->status === self::STATUS_WON;
    }

    /**
     * Check if the bet has lost.
     */
    public function isLost(): bool
    {
        return $this->status === self::STATUS_LOST;
    }

    /**
     * Check if the bet is settled (won or lost).
     */
    public function isSettled(): bool
    {
        return in_array($this->status, [self::STATUS_WON, self::STATUS_LOST]);
    }

    /**
     * Check if payment is confirmed.
     */
    public function isPaymentConfirmed(): bool
    {
        return $this->payment_status === self::PAYMENT_CONFIRMED;
    }

    /**
     * Mark bet as won and calculate payout.
     */
    public function markAsWon(): void
    {
        $this->update([
            'status' => self::STATUS_WON,
            'actual_payout' => $this->potential_payout,
            'settled_at' => now(),
        ]);
    }

    /**
     * Mark bet as lost.
     */
    public function markAsLost(): void
    {
        $this->update([
            'status' => self::STATUS_LOST,
            'actual_payout' => 0,
            'settled_at' => now(),
        ]);
    }

    /**
     * Mark bet as cancelled and refund stake.
     */
    public function markAsCancelled(): void
    {
        $this->update([
            'status' => self::STATUS_CANCELLED,
            'actual_payout' => $this->stake_amount, // Refund stake
            'settled_at' => now(),
        ]);
    }

    /**
     * Calculate potential payout based on stake and odds.
     */
    public function calculatePotentialPayout(): float
    {
        return $this->stake_amount * $this->odds_at_placement;
    }

    /**
     * Get the profit from this bet (payout - stake).
     */
    public function getProfit(): float
    {
        if (!$this->actual_payout) {
            return 0;
        }

        return $this->actual_payout - $this->stake_amount;
    }

    /**
     * Scope to get bets by status.
     */
    public function scopeByStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope to get pending bets.
     */
    public function scopePending($query)
    {
        return $query->where('status', self::STATUS_PENDING);
    }

    /**
     * Scope to get settled bets.
     */
    public function scopeSettled($query)
    {
        return $query->whereIn('status', [self::STATUS_WON, self::STATUS_LOST]);
    }

    /**
     * Scope to get bets with confirmed payment.
     */
    public function scopePaymentConfirmed($query)
    {
        return $query->where('payment_status', self::PAYMENT_CONFIRMED);
    }

    /**
     * Scope to get recent bets.
     */
    public function scopeRecent($query, int $days = 30)
    {
        return $query->where('placed_at', '>=', now()->subDays($days));
    }
}
