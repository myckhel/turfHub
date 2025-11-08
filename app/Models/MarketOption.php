<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MarketOption extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'betting_market_id',
        'key',
        'name',
        'odds',
        'total_stake',
        'bet_count',
        'is_active',
        'is_winning_option',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'odds' => 'decimal:2',
            'total_stake' => 'decimal:2',
            'bet_count' => 'integer',
            'is_active' => 'boolean',
            'is_winning_option' => 'boolean',
        ];
    }

    /**
     * Get the betting market this option belongs to.
     */
    public function bettingMarket(): BelongsTo
    {
        return $this->belongsTo(BettingMarket::class);
    }

    /**
     * Get all bets placed on this option.
     */
    public function bets(): HasMany
    {
        return $this->hasMany(Bet::class);
    }

    /**
     * Calculate the implied probability from odds.
     */
    public function getImpliedProbability(): float
    {
        return $this->odds > 0 ? (1 / $this->odds) * 100 : 0;
    }

    /**
     * Update odds based on total stakes.
     * Note: total_stake and bet_count are automatically maintained by BetObserver
     */
    public function updateOdds(): void
    {
        $market = $this->bettingMarket;
        $totalMarketStake = $market->getTotalStake();

        if ($totalMarketStake > 0 && $this->total_stake > 0) {
            // Simple odds calculation: higher stakes = lower odds
            $marketShare = $this->total_stake / $totalMarketStake;
            $newOdds = max(1.1, (1 / $marketShare) * 0.9); // Apply house edge

            $this->update(['odds' => round($newOdds, 2)]);
        }
    }

    /**
     * Recalculate odds for all options in this market.
     */
    public function recalculateMarketOdds(): void
    {
        $this->bettingMarket->marketOptions()->each(function ($option) {
            $option->updateOdds();
        });
    }

    /**
     * Check if this option can accept bets.
     */
    public function canAcceptBets(): bool
    {
        return $this->is_active && $this->bettingMarket->isOpenForBetting();
    }

    /**
     * Scope to get only active options.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to get winning options.
     */
    public function scopeWinning($query)
    {
        return $query->where('is_winning_option', true);
    }
}
