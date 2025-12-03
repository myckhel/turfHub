<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class BettingMarket extends Model
{
    use HasFactory;

    // Market Type Constants
    public const TYPE_1X2 = '1x2';
    public const TYPE_PLAYER_SCORING = 'player_scoring';
    public const TYPE_CORRECT_SCORE = 'correct_score';
    public const TYPE_TOTAL_GOALS = 'total_goals';

    // Status Constants
    public const STATUS_ACTIVE = 'active';
    public const STATUS_SUSPENDED = 'suspended';
    public const STATUS_SETTLED = 'settled';
    public const STATUS_CANCELLED = 'cancelled';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'game_match_id',
        'market_type',
        'name',
        'description',
        'is_active',
        'opens_at',
        'closes_at',
        'settled_at',
        'status',
        'metadata',
        'min_stake_amount',
        'max_stake_amount',
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
            'opens_at' => 'datetime',
            'closes_at' => 'datetime',
            'settled_at' => 'datetime',
            'metadata' => 'array',
            'min_stake_amount' => 'float',
            'max_stake_amount' => 'float',
        ];
    }

    /**
     * Get the game match this betting market belongs to.
     */
    public function gameMatch(): BelongsTo
    {
        return $this->belongsTo(GameMatch::class);
    }

    /**
     * Get all market options for this betting market.
     */
    public function marketOptions(): HasMany
    {
        return $this->hasMany(MarketOption::class);
    }

    /**
     * Get all bets placed on this market.
     */
    public function bets(): HasMany
    {
        return $this->hasMany(Bet::class);
    }

    /**
     * Get the outcome for this market (if settled).
     */
    public function outcome(): HasOne
    {
        return $this->hasOne(BetOutcome::class);
    }

    /**
     * Check if the market is currently open for betting.
     */
    public function isOpenForBetting(): bool
    {
        if (!$this->is_active || $this->status !== self::STATUS_ACTIVE) {
            return false;
        }

        $now = now();

        if ($this->opens_at && $now->lt($this->opens_at)) {
            return false;
        }

        // if ($this->closes_at && $now->gt($this->closes_at)) {
        //     return false;
        // }

        return true;
    }

    /**
     * Check if the market is settled.
     */
    public function isSettled(): bool
    {
        return $this->status === self::STATUS_SETTLED && $this->settled_at !== null;
    }

    /**
     * Get total amount staked on this market.
     */
    public function getTotalStake(): float
    {
        return $this->bets()->sum('stake_amount');
    }

    /**
     * Get total number of bets on this market.
     */
    public function getTotalBets(): int
    {
        return $this->bets()->count();
    }

    /**
     * Scope to get only active markets.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true)->where('status', self::STATUS_ACTIVE);
    }

    /**
     * Scope to get markets open for betting.
     */
    public function scopeOpenForBetting($query)
    {
        $now = now();
        return $query->active()
            ->where(function ($q) use ($now) {
                $q->whereNull('opens_at')->orWhere('opens_at', '<=', $now);
            })
            ->where(function ($q) use ($now) {
                $q->whereNull('closes_at')->orWhere('closes_at', '>', $now);
            });
    }

    /**
     * Scope to get markets by type.
     */
    public function scopeByType($query, string $type)
    {
        return $query->where('market_type', $type);
    }

    /**
     * Create default 1X2 market for a game match.
     */
    public static function create1X2Market(GameMatch $gameMatch, ?float $minStake = null, ?float $maxStake = null): self
    {
        $market = self::create([
            'game_match_id' => $gameMatch->id,
            'market_type' => self::TYPE_1X2,
            'name' => '1X2 Match Result',
            'description' => 'Predict the outcome of the match',
            'is_active' => true,
            'opens_at' => now(),
            'closes_at' => $gameMatch->match_time ?? now()->addHour(),
            'status' => self::STATUS_ACTIVE,
            'min_stake_amount' => $minStake,
            'max_stake_amount' => $maxStake,
        ]);

        // Create default options for 1X2
        $market->marketOptions()->createMany([
            [
                'key' => 'home',
                'name' => $gameMatch->firstTeam->name . ' Win',
                'odds' => 2.00,
            ],
            [
                'key' => 'draw',
                'name' => 'Draw',
                'odds' => 3.00,
            ],
            [
                'key' => 'away',
                'name' => $gameMatch->secondTeam->name . ' Win',
                'odds' => 2.50,
            ],
        ]);

        return $market;
    }

    /**
     * Get the minimum stake amount for this market.
     * Falls back to config default if not set.
     */
    public function getMinStakeAmount(): float
    {
        return $this->min_stake_amount ?? config('betting.min_stake_amount', 10);
    }

    /**
     * Get the maximum stake amount for this market.
     * Falls back to config default if not set.
     */
    public function getMaxStakeAmount(): float
    {
        return $this->max_stake_amount ?? config('betting.max_stake_amount', 50000);
    }
}
