<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\BettingMarketResource;
use App\Models\BettingMarket;
use App\Models\GameMatch;
use App\Models\Turf;
use App\Services\BettingService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\ValidationException;

class BettingMarketController extends Controller
{
    use AuthorizesRequests;

    public function __construct(
        protected BettingService $bettingService
    ) {}

    /**
     * Create a new betting market for a game match.
     */
    public function store(Request $request, GameMatch $gameMatch): JsonResponse
    {
        $this->authorize('manageBetting', $gameMatch);

        $request->validate([
            'market_type' => 'required|string|in:1x2,player_scoring,correct_score,total_goals',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'opens_at' => 'nullable|date',
            'closes_at' => 'nullable|date|after:opens_at',
            'metadata' => 'nullable|array',
            'options' => 'required|array|min:1',
            'options.*.key' => 'required|string',
            'options.*.name' => 'required|string',
            'options.*.odds' => 'nullable|numeric|min:1.1',
            'min_stake_amount' => 'nullable|numeric|min:1|max:1000000',
            'max_stake_amount' => 'nullable|numeric|min:1|max:10000000|gte:min_stake_amount',
        ]);

        try {
            $market = $this->bettingService->createMarket(
                $gameMatch,
                $request->only([
                    'market_type', 'name', 'description', 'opens_at',
                    'closes_at', 'metadata', 'options', 'min_stake_amount', 'max_stake_amount'
                ])
            );

            return response()->json([
                'status' => true,
                'message' => 'Betting market created successfully.',
                'data' => new BettingMarketResource($market)
            ], 201);
        } catch (ValidationException $e) {
            return response()->json([
                'status' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'Failed to create betting market: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Enable betting for a game match.
     */
    public function enableBetting(GameMatch $gameMatch): JsonResponse
    {
        $this->authorize('manageBetting', $gameMatch);

        try {
            $gameMatch->enableBetting();

            return response()->json([
                'status' => true,
                'message' => 'Betting enabled successfully.',
                'data' => [
                    'betting_enabled' => true,
                    'markets_count' => $gameMatch->bettingMarkets()->count()
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'Failed to enable betting: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Disable betting for a game match.
     */
    public function disableBetting(GameMatch $gameMatch): JsonResponse
    {
        $this->authorize('manageBetting', $gameMatch);

        try {
            $gameMatch->disableBetting();

            return response()->json([
                'status' => true,
                'message' => 'Betting disabled successfully.',
                'data' => [
                    'betting_enabled' => false,
                    'suspended_markets' => $gameMatch->bettingMarkets()->count()
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'Failed to disable betting: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Settle a betting market.
     */
    public function settleMarket(Request $request, ?Turf $turf, BettingMarket $bettingMarket): BettingMarketResource
    {
        $this->authorize('manageBetting', $bettingMarket->gameMatch);

        $validated = $request->validate([
            'settlement_result' => 'nullable|string|in:settled,cancelled,refunded',
            'winning_option_ids' => 'nullable|array',
            'winning_option_ids.*' => 'integer|exists:market_options,id',
            'settlement_notes' => 'nullable|string|max:1000',
        ]);

        $outcome = $this->bettingService->settleMarket(
            $bettingMarket,
            $request->user(),
            $validated['settlement_result'] ?? null,
            $validated['winning_option_ids'] ?? null,
            $validated['settlement_notes'] ?? null
        );

        return new BettingMarketResource($bettingMarket->fresh());
    }

    /**
     * Cancel a betting market.
     */
    public function cancelMarket(Request $request, ?Turf $turf, BettingMarket $bettingMarket): JsonResponse
    {
        $this->authorize('manageBetting', $bettingMarket->gameMatch);

        $request->validate([
            'reason' => 'nullable|string|max:500'
        ]);

        try {
            $this->bettingService->cancelMarket($bettingMarket, $request->reason);

            return response()->json([
                'status' => true,
                'message' => 'Market cancelled successfully.',
                'data' => [
                    'market' => new BettingMarketResource($bettingMarket->fresh()),
                    'cancelled_bets_count' => $bettingMarket->bets()->where('status', 'cancelled')->count()
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'Failed to cancel market: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get betting statistics for a game match.
     */
    public function getGameMatchStats(GameMatch $gameMatch): JsonResponse
    {
        $this->authorize('manageBetting', $gameMatch);

        $stats = [
            'betting_enabled' => $gameMatch->betting_enabled,
            'total_markets' => $gameMatch->bettingMarkets()->count(),
            'active_markets' => $gameMatch->bettingMarkets()->active()->count(),
            'settled_markets' => $gameMatch->bettingMarkets()->where('status', BettingMarket::STATUS_SETTLED)->count(),
            'total_bets' => $gameMatch->bettingMarkets()->withCount('bets')->get()->sum('bets_count'),
            'total_stake' => $gameMatch->bettingMarkets()->get()->sum(function($market) {
                return $market->getTotalStake();
            }),
        ];

        return response()->json([
            'status' => true,
            'data' => $stats
        ]);
    }

    /**
     * Confirm offline payment for a bet (turf manager action).
     */
    public function confirmOfflinePayment(Request $request): JsonResponse
    {
        $request->validate([
            'bet_id' => 'required|exists:bets,id'
        ]);

        $bet = \App\Models\Bet::findOrFail($request->bet_id);

        $this->authorize('manageBetting', $bet->marketOption->bettingMarket->gameMatch);

        if ($bet->payment_method !== \App\Models\Bet::PAYMENT_OFFLINE) {
            return response()->json([
                'status' => false,
                'message' => 'This bet does not require offline payment confirmation.'
            ], 400);
        }

        if ($bet->payment_status === \App\Models\Bet::PAYMENT_CONFIRMED) {
            return response()->json([
                'status' => false,
                'message' => 'Payment is already confirmed.'
            ], 400);
        }

        try {
            $this->bettingService->confirmBetPayment($bet);

            return response()->json([
                'status' => true,
                'message' => 'Offline payment confirmed successfully.',
                'data' => [
                    'bet_id' => $bet->id,
                    'payment_status' => 'confirmed'
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'Failed to confirm payment: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Show a specific betting market.
     */
    public function show(BettingMarket $bettingMarket): BettingMarketResource
    {
        return new BettingMarketResource($bettingMarket->load([
            'gameMatch.firstTeam',
            'gameMatch.secondTeam',
            'gameMatch.matchSession.turf',
            'marketOptions',
            'bets'
        ]));
    }

    /**
     * Update a betting market.
     */
    public function update(Request $request, BettingMarket $bettingMarket): JsonResponse
    {
        $this->authorize('manageBetting', $bettingMarket->gameMatch);

        $request->validate([
            'is_active' => 'sometimes|boolean',
            'name' => 'sometimes|string|max:255',
            'description' => 'sometimes|nullable|string',
            'closes_at' => 'sometimes|nullable|date',
            'metadata' => 'sometimes|nullable|array',
            'min_stake_amount' => 'sometimes|nullable|numeric|min:1|max:1000000',
            'max_stake_amount' => 'sometimes|nullable|numeric|min:1|max:10000000|gte:min_stake_amount',
        ]);

        try {
            $bettingMarket->update($request->only([
                'is_active', 'name', 'description', 'closes_at', 'metadata', 'status',
                'min_stake_amount', 'max_stake_amount'
            ]));

            return response()->json([
                'status' => true,
                'message' => 'Betting market updated successfully.',
                'data' => new BettingMarketResource($bettingMarket->refresh())
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'Failed to update market: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update market settings (admin only).
     */
    public function updateMarketSettings(Request $request, ?Turf $turf, BettingMarket $bettingMarket): JsonResponse
    {
        $request->validate([
            'is_active' => 'nullable|boolean',
            'min_stake_amount' => 'nullable|numeric|min:1|max:1000000',
            'max_stake_amount' => 'nullable|numeric|min:1|max:10000000|gte:min_stake_amount',
            'odds_multiplier' => 'nullable|numeric|min:0.1|max:10'
        ]);

        try {
            $settings = $request->only(['is_active', 'max_stake', 'min_stake', 'odds_multiplier']);

            // Filter out null values
            $settings = array_filter($settings, function($value) {
                return $value !== null;
            });

            if (!empty($settings)) {
                $bettingMarket->update($settings);
            }

            return response()->json([
                'status' => true,
                'message' => 'Market settings updated successfully.',
                'data' => new BettingMarketResource($bettingMarket->fresh())
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'Failed to update market settings: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get betting markets for a specific turf (turf managers/admins).
     */
    public function getTurfMarkets(Request $request, Turf $turf): JsonResponse
    {
        // Authorization will be handled in the controller that calls this
        try {
            $filters = $request->only(['status']);
            $perPage = $request->get('per_page', 15);

            $markets = $this->bettingService->getTurfMarkets($turf, $filters, $perPage);

            return response()->json([
                'data' => BettingMarketResource::collection($markets->items()),
                'meta' => [
                    'total' => $markets->total(),
                    'per_page' => $markets->perPage(),
                    'current_page' => $markets->currentPage(),
                    'last_page' => $markets->lastPage(),
                    'from' => $markets->firstItem(),
                    'to' => $markets->lastItem(),
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'Failed to fetch turf markets: ' . $e->getMessage()
            ], 500);
        }
    }
}
