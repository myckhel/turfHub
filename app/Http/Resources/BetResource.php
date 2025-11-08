<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BetResource extends JsonResource
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
            'stake_amount' => $this->stake_amount,
            'odds_at_placement' => $this->odds_at_placement,
            'potential_payout' => $this->potential_payout,
            'actual_payout' => $this->actual_payout,
            'status' => $this->status,
            'payment_method' => $this->payment_method,
            'payment_status' => $this->payment_status,
            'payment_reference' => $this->payment_reference,
            'placed_at' => $this->placed_at->toISOString(),
            'settled_at' => $this->settled_at?->toISOString(),
            'notes' => $this->notes,
            'profit' => $this->getProfit(),
            'is_pending' => $this->isPending(),
            'is_won' => $this->isWon(),
            'is_lost' => $this->isLost(),
            'is_settled' => $this->isSettled(),
            'is_payment_confirmed' => $this->isPaymentConfirmed(),
            'created_at' => $this->created_at->toISOString(),
            'updated_at' => $this->updated_at->toISOString(),

            // User relationship
            'user' => $this->whenLoaded('user', [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'email' => $this->user->email,
            ]),

            // Market option relationship
            'market_option' => $this->whenLoaded('marketOption', function () {
                return [
                    'id' => $this->marketOption->id,
                    'key' => $this->marketOption->key,
                    'name' => $this->marketOption->name,
                    'odds' => $this->marketOption->odds,
                    'is_winning_option' => $this->marketOption->is_winning_option,
                ];
            }),

            // Betting market relationship
            'betting_market' => $this->whenLoaded('bettingMarket', function () {
                return [
                    'id' => $this->bettingMarket->id,
                    'market_type' => $this->bettingMarket->market_type,
                    'name' => $this->bettingMarket->name,
                    'status' => $this->bettingMarket->status,
                    'is_settled' => $this->bettingMarket->isSettled(),

                    'game_match' => $this->whenLoaded('bettingMarket.gameMatch', function () {
                        return [
                            'id' => $this->bettingMarket->gameMatch->id,
                            'status' => $this->bettingMarket->gameMatch->status,
                            'first_team_score' => $this->bettingMarket->gameMatch->first_team_score,
                            'second_team_score' => $this->bettingMarket->gameMatch->second_team_score,
                            'match_time' => $this->bettingMarket->gameMatch->match_time?->toISOString(),

                            'first_team' => $this->whenLoaded('bettingMarket.gameMatch.firstTeam', [
                                'id' => $this->bettingMarket->gameMatch->firstTeam->id,
                                'name' => $this->bettingMarket->gameMatch->firstTeam->name,
                            ]),

                            'second_team' => $this->whenLoaded('bettingMarket.gameMatch.secondTeam', [
                                'id' => $this->bettingMarket->gameMatch->secondTeam->id,
                                'name' => $this->bettingMarket->gameMatch->secondTeam->name,
                            ]),

                            'match_session' => $this->whenLoaded('bettingMarket.gameMatch.matchSession', function () {
                                return [
                                    'id' => $this->bettingMarket->gameMatch->matchSession->id,
                                    'name' => $this->bettingMarket->gameMatch->matchSession->name,
                                    'session_date' => $this->bettingMarket->gameMatch->matchSession->session_date,
                                    'time_slot' => $this->bettingMarket->gameMatch->matchSession->time_slot,

                                    'turf' => $this->whenLoaded('bettingMarket.gameMatch.matchSession.turf', [
                                        'id' => $this->bettingMarket->gameMatch->matchSession->turf->id,
                                        'name' => $this->bettingMarket->gameMatch->matchSession->turf->name,
                                        'location' => $this->bettingMarket->gameMatch->matchSession->turf->location,
                                    ]),
                                ];
                            }),
                        ];
                    }),
                ];
            }),
        ];
    }
}
