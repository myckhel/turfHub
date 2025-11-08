<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BettingMarketResource extends JsonResource
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
            'market_type' => $this->market_type,
            'name' => $this->name,
            'description' => $this->description,
            'is_active' => $this->is_active,
            'status' => $this->status,
            'game_match_id' => $this->game_match_id,
            'opens_at' => $this->opens_at?->toISOString(),
            'closes_at' => $this->closes_at?->toISOString(),
            'settled_at' => $this->settled_at?->toISOString(),
            'metadata' => $this->metadata,
            'is_open_for_betting' => $this->isOpenForBetting(),
            'is_settled' => $this->isSettled(),
            'total_stake' => $this->getTotalStake(),
            'total_bets' => $this->getTotalBets(),
            'created_at' => $this->created_at->toISOString(),
            'updated_at' => $this->updated_at->toISOString(),

            // Relationships
            'game_match' => $this->whenLoaded('gameMatch', function () {
                return [
                    'id' => $this->gameMatch->id,
                    'status' => $this->gameMatch->status,
                    'match_time' => $this->gameMatch->match_time?->toISOString(),
                    'betting_enabled' => $this->gameMatch->betting_enabled,
                    'first_team' => $this->whenLoaded('gameMatch.firstTeam', [
                        'id' => $this->gameMatch->firstTeam->id,
                        'name' => $this->gameMatch->firstTeam->name,
                    ]),
                    'second_team' => $this->whenLoaded('gameMatch.secondTeam', [
                        'id' => $this->gameMatch->secondTeam->id,
                        'name' => $this->gameMatch->secondTeam->name,
                    ]),
                    'match_session' => $this->whenLoaded('gameMatch.matchSession', function () {
                        return [
                            'id' => $this->gameMatch->matchSession->id,
                            'name' => $this->gameMatch->matchSession->name,
                            'session_date' => $this->gameMatch->matchSession->session_date,
                            'time_slot' => $this->gameMatch->matchSession->time_slot,
                            'turf' => $this->whenLoaded('gameMatch.matchSession.turf', [
                                'id' => $this->gameMatch->matchSession->turf->id,
                                'name' => $this->gameMatch->matchSession->turf->name,
                                'location' => $this->gameMatch->matchSession->turf->location,
                            ]),
                        ];
                    }),
                ];
            }),

            'market_options' => MarketOptionResource::collection($this->whenLoaded('marketOptions')),

            'outcome' => $this->whenLoaded('outcome', function () {
                return [
                    'id' => $this->outcome->id,
                    'winning_option_id' => $this->outcome->winning_option_id,
                    'actual_result' => $this->outcome->actual_result,
                    'settled_at' => $this->outcome->settled_at?->toISOString(),
                    'settlement_notes' => $this->outcome->settlement_notes,
                    'requires_manual_review' => $this->outcome->requires_manual_review,
                ];
            }),
        ];
    }
}
