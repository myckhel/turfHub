<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MarketOptionResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'key' => $this->key,
            'name' => $this->name,
            'odds' => $this->odds,
            'total_stake' => $this->total_stake,
            'bet_count' => $this->bet_count,
            'is_active' => $this->is_active,
            'is_winning_option' => $this->is_winning_option,
            'implied_probability' => $this->getImpliedProbability(),
            'can_accept_bets' => $this->canAcceptBets(),
            'created_at' => $this->created_at->toISOString(),
            'updated_at' => $this->updated_at->toISOString(),

            // Betting market relationship (when needed)
            'betting_market' => $this->whenLoaded('bettingMarket', function () {
                return [
                    'id' => $this->bettingMarket->id,
                    'market_type' => $this->bettingMarket->market_type,
                    'name' => $this->bettingMarket->name,
                    'min_stake_amount' => $this->bettingMarket->getMinStakeAmount(),
                    'max_stake_amount' => $this->bettingMarket->getMaxStakeAmount(),
                ];
            }),
        ];
    }
}
