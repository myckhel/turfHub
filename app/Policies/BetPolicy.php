<?php

namespace App\Policies;

use App\Models\Bet;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class BetPolicy
{
    /**
     * Determine whether the user can view any bets.
     */
    public function viewAny(User $user): bool
    {
        // Users can view their own bets
        return true;
    }

    /**
     * Determine whether the user can view the bet.
     */
    public function view(User $user, Bet $bet): bool
    {
        // Users can only view their own bets, unless they are turf managers
        return $user->id === $bet->user_id || $this->canManageBetting($user, $bet);
    }

    /**
     * Determine whether the user can create bets.
     */
    public function create(User $user): bool
    {
        // All authenticated users can create bets
        return true;
    }

    /**
     * Determine whether the user can update the bet.
     */
    public function update(User $user, Bet $bet): bool
    {
        // Users can only update their own pending bets
        return $user->id === $bet->user_id && $bet->isPending();
    }

    /**
     * Determine whether the user can delete the bet.
     */
    public function delete(User $user, Bet $bet): bool
    {
        // Users can only cancel their own pending bets
        return $user->id === $bet->user_id && $bet->isPending();
    }

    /**
     * Determine whether the user can restore the bet.
     */
    public function restore(User $user, Bet $bet): bool
    {
        return false; // Bets cannot be restored
    }

    /**
     * Determine whether the user can permanently delete the bet.
     */
    public function forceDelete(User $user, Bet $bet): bool
    {
        return false; // Bets cannot be permanently deleted
    }

    /**
     * Determine whether the user can confirm payment for the bet.
     */
    public function confirmPayment(User $user, Bet $bet): bool
    {
        // User can confirm their own offline payment, or turf manager can confirm
        return ($user->id === $bet->user_id && $bet->payment_method === Bet::PAYMENT_OFFLINE) ||
               $this->canManageBetting($user, $bet);
    }

    /**
     * Check if user can manage betting for the bet's game match.
     */
    private function canManageBetting(User $user, Bet $bet): bool
    {
        $gameMatch = $bet->marketOption->bettingMarket->gameMatch;
        $turf = $gameMatch->matchSession->turf;

        // Check if user is turf owner/admin or has permission to manage betting
        return $turf->owner_id === $user->id ||
               $user->hasRole('super-admin') ||
               $user->hasPermissionTo('manage-betting');
    }
}
