<?php

namespace App\Observers;

use App\Models\Bet;
use Illuminate\Support\Facades\Log;

class BetObserver
{
    /**
     * Handle the Bet "created" event.
     */
    public function created(Bet $bet): void
    {
        // Only update if payment is confirmed
        if ($bet->payment_status === Bet::PAYMENT_CONFIRMED) {
            $this->incrementMarketOptionCounters($bet);
        }
    }

    /**
     * Handle the Bet "updated" event.
     */
    public function updated(Bet $bet): void
    {
        // Handle payment confirmation
        if ($bet->wasChanged('payment_status')) {
            if ($bet->payment_status === Bet::PAYMENT_CONFIRMED && $bet->getOriginal('payment_status') !== Bet::PAYMENT_CONFIRMED) {
                // Payment just confirmed - add to counters
                $this->incrementMarketOptionCounters($bet);
            } elseif ($bet->getOriginal('payment_status') === Bet::PAYMENT_CONFIRMED && $bet->payment_status !== Bet::PAYMENT_CONFIRMED) {
                // Payment was confirmed but now isn't (e.g., refund) - subtract from counters
                $this->decrementMarketOptionCounters($bet);
            }
        }

        // Handle status changes that affect counters (cancellation, refund)
        if ($bet->wasChanged('status')) {
            $oldStatus = $bet->getOriginal('status');
            $newStatus = $bet->status;

            // If bet was active/pending and is now cancelled/refunded, decrement
            if (in_array($oldStatus, [Bet::STATUS_ACTIVE, Bet::STATUS_PENDING]) &&
                in_array($newStatus, [Bet::STATUS_CANCELLED, Bet::STATUS_REFUNDED])) {
                if ($bet->payment_status === Bet::PAYMENT_CONFIRMED) {
                    $this->decrementMarketOptionCounters($bet);
                }
            }
        }

        // Recalculate odds if counters changed
        if ($bet->wasChanged(['payment_status', 'status'])) {
            $bet->marketOption->updateOdds();
        }
    }

    /**
     * Handle the Bet "deleted" event.
     */
    public function deleted(Bet $bet): void
    {
        // Only decrement if the bet was confirmed
        if ($bet->payment_status === Bet::PAYMENT_CONFIRMED &&
            !in_array($bet->status, [Bet::STATUS_CANCELLED, Bet::STATUS_REFUNDED])) {
            $this->decrementMarketOptionCounters($bet);
        }
    }

    /**
     * Handle the Bet "restored" event.
     */
    public function restored(Bet $bet): void
    {
        // Re-add to counters if payment was confirmed
        if ($bet->payment_status === Bet::PAYMENT_CONFIRMED &&
            !in_array($bet->status, [Bet::STATUS_CANCELLED, Bet::STATUS_REFUNDED])) {
            $this->incrementMarketOptionCounters($bet);
        }
    }

    /**
     * Increment the market option's total_stake and bet_count.
     */
    private function incrementMarketOptionCounters(Bet $bet): void
    {
        $marketOption = $bet->marketOption;

        $marketOption->increment('total_stake', $bet->stake_amount);
        $marketOption->increment('bet_count');

        Log::info('Market option counters incremented', [
            'market_option_id' => $marketOption->id,
            'bet_id' => $bet->id,
            'stake_amount' => $bet->stake_amount,
            'new_total_stake' => $marketOption->fresh()->total_stake,
            'new_bet_count' => $marketOption->fresh()->bet_count,
        ]);
    }

    /**
     * Decrement the market option's total_stake and bet_count.
     */
    private function decrementMarketOptionCounters(Bet $bet): void
    {
        $marketOption = $bet->marketOption;

        $marketOption->decrement('total_stake', $bet->stake_amount);
        $marketOption->decrement('bet_count');

        Log::info('Market option counters decremented', [
            'market_option_id' => $marketOption->id,
            'bet_id' => $bet->id,
            'stake_amount' => $bet->stake_amount,
            'new_total_stake' => $marketOption->fresh()->total_stake,
            'new_bet_count' => $marketOption->fresh()->bet_count,
        ]);
    }
}
