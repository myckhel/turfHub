<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BetOutcome extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'betting_market_id',
        'winning_option_id',
        'actual_result',
        'settled_by',
        'settled_at',
        'settlement_notes',
        'requires_manual_review',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'actual_result' => 'array',
            'settled_at' => 'datetime',
            'requires_manual_review' => 'boolean',
        ];
    }

    /**
     * Get the betting market this outcome belongs to.
     */
    public function bettingMarket(): BelongsTo
    {
        return $this->belongsTo(BettingMarket::class);
    }

    /**
     * Get the winning market option.
     */
    public function winningOption(): BelongsTo
    {
        return $this->belongsTo(MarketOption::class, 'winning_option_id');
    }

    /**
     * Get the user who settled this outcome.
     */
    public function settledBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'settled_by');
    }

    /**
     * Settle all bets for this outcome.
     */
    public function settleBets(): void
    {
        $market = $this->bettingMarket;

        // Mark winning option(s)
        if ($this->winning_option_id) {
            $this->winningOption->update(['is_winning_option' => true]);
        }

        // Get all winning option IDs from actual_result if multiple winners supported
        $winningOptionIds = $this->actual_result['winning_option_ids'] ?? [$this->winning_option_id];

        // Settle all bets with confirmed payment in this market
        $market->bets()->paymentConfirmed()->each(function (Bet $bet) use ($winningOptionIds) {
            if (in_array($bet->market_option_id, $winningOptionIds)) {
                $bet->markAsWon();
            } else {
                $bet->markAsLost();
            }
        });

        // Cancel bets with pending or failed payment
        $market->bets()->whereIn('payment_status', [Bet::PAYMENT_PENDING, Bet::PAYMENT_FAILED])
            ->where('status', Bet::STATUS_PENDING)
            ->each(function (Bet $bet) {
                $bet->markAsCancelled();
            });

        // Update market status
        $market->update([
            'status' => BettingMarket::STATUS_SETTLED,
            'settled_at' => $this->settled_at,
        ]);
    }

    /**
     * Refund all bets for this outcome.
     */
    public function refundBets(): void
    {
        $market = $this->bettingMarket;

        // Cancel/refund all pending bets
        $market->bets()->pending()->each(function (Bet $bet) {
            $bet->markAsCancelled();
        });

        // Update market status
        $market->update([
            'status' => BettingMarket::STATUS_CANCELLED,
            'settled_at' => $this->settled_at,
        ]);
    }

    /**
     * Create outcome from game match result.
     */
    public static function createFromGameMatch(GameMatch $gameMatch, ?User $settledBy = null): ?self
    {
        // Find 1X2 market for this game match
        $market = $gameMatch->bettingMarkets()
            ->where('market_type', BettingMarket::TYPE_1X2)
            ->first();

        if (!$market) {
            return null;
        }

        // Determine winning option based on game result
        $winningOptionKey = null;
        if ($gameMatch->winning_team_id === $gameMatch->first_team_id) {
            $winningOptionKey = 'home';
        } elseif ($gameMatch->winning_team_id === $gameMatch->second_team_id) {
            $winningOptionKey = 'away';
        } elseif ($gameMatch->outcome === GameMatch::OUTCOME_DRAW) {
            $winningOptionKey = 'draw';
        }

        if (!$winningOptionKey) {
            return null;
        }

        $winningOption = $market->marketOptions()
            ->where('key', $winningOptionKey)
            ->first();

        if (!$winningOption) {
            return null;
        }

        $outcome = self::create([
            'betting_market_id' => $market->id,
            'winning_option_id' => $winningOption->id,
            'actual_result' => [
                'first_team_score' => $gameMatch->first_team_score,
                'second_team_score' => $gameMatch->second_team_score,
                'winning_team_id' => $gameMatch->winning_team_id,
                'outcome' => $gameMatch->outcome,
            ],
            'settled_by' => $settledBy?->id,
            'settled_at' => now(),
            'settlement_notes' => 'Auto-settled based on game match result',
            'requires_manual_review' => false,
        ]);

        $outcome->settleBets();

        return $outcome;
    }

    /**
     * Create outcome from manual settlement.
     */
    public static function createManualOutcome(
        BettingMarket $market,
        array $winningOptionIds,
        ?User $settledBy = null,
        ?string $settlementNotes = null
    ): self {
        // Validate that all option IDs belong to this market
        $validOptions = $market->marketOptions()
            ->whereIn('id', $winningOptionIds)
            ->pluck('id')
            ->toArray();

        if (count($validOptions) !== count($winningOptionIds)) {
            throw new \InvalidArgumentException('Some winning option IDs do not belong to this market.');
        }

        // Use first winning option as primary (for single winner markets)
        $primaryWinningOptionId = $winningOptionIds[0];

        $outcome = self::create([
            'betting_market_id' => $market->id,
            'winning_option_id' => $primaryWinningOptionId,
            'actual_result' => [
                'winning_option_ids' => $winningOptionIds,
                'settlement_type' => 'manual',
            ],
            'settled_by' => $settledBy?->id,
            'settled_at' => now(),
            'settlement_notes' => $settlementNotes ?? 'Manually settled by administrator',
            'requires_manual_review' => false,
        ]);

        $outcome->settleBets();

        return $outcome;
    }

    /**
     * Create cancelled/refunded outcome.
     */
    public static function createCancelledOutcome(
        BettingMarket $market,
        ?User $settledBy = null,
        ?string $settlementNotes = null
    ): self {
        $outcome = self::create([
            'betting_market_id' => $market->id,
            'winning_option_id' => null,
            'actual_result' => [
                'settlement_type' => 'cancelled',
            ],
            'settled_by' => $settledBy?->id,
            'settled_at' => now(),
            'settlement_notes' => $settlementNotes ?? 'Market cancelled - all bets refunded',
            'requires_manual_review' => false,
        ]);

        $outcome->refundBets();

        return $outcome;
    }
}
