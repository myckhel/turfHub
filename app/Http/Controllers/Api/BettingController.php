<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\BetResource;
use App\Http\Resources\BettingMarketResource;
use App\Models\Bet;
use App\Models\GameMatch;
use App\Models\MarketOption;
use App\Models\Turf;
use App\Services\BettingService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\ValidationException;

class BettingController extends Controller
{
  use AuthorizesRequests;

  public function __construct(
    protected BettingService $bettingService
  ) {}

  /**
   * Get available betting markets.
   */
  public function index(Request $request): AnonymousResourceCollection
  {
    $filters = $request->only(['game_match_id', 'turf_id', 'date', 'market_type']);
    $perPage = $request->get('per_page', 15);

    $markets = $this->bettingService->getAvailableMarkets($filters, $perPage);

    return BettingMarketResource::collection($markets);
  }

  /**
   * Get betting markets for a specific game match.
   */
  public function getGameMatchMarkets(GameMatch $gameMatch)
  {
    if (!$gameMatch->betting_enabled) {
      return response()->json([
        'message' => 'Betting is not enabled for this match.'
      ], 404);
    }

    $markets = $this->bettingService->getGameMatchMarkets($gameMatch);

    return BettingMarketResource::collection($markets);
  }

  /**
   * Place a bet on a market option.
   */
  public function placeBet(Request $request): JsonResponse
  {
    $rules = [
      'market_option_id' => 'required|exists:market_options,id',
      'stake_amount' => 'required|numeric|min:10',
      'payment_method' => 'required|in:online,offline,wallet',
      'payment_reference' => 'nullable|string|max:255',
    ];

    // Add receipt validation for offline payments
    if ($request->payment_method === 'offline') {
      $rules['receipt'] = 'required|file|mimes:jpeg,jpg,png,webp,pdf|max:5120'; // 5MB max
    }

    $request->validate($rules);

    try {
      $marketOption = MarketOption::findOrFail($request->market_option_id);
      $result = $this->bettingService->placeBet(
        user: $request->user(),
        marketOption: $marketOption,
        stakeAmount: $request->stake_amount,
        paymentMethod: $request->payment_method,
        paymentReference: $request->payment_reference,
        receiptFile: $request->file('receipt')
      );

      return response()->json($result);
    } catch (ValidationException $e) {
      return response()->json([
        'status' => false,
        'message' => 'Validation failed',
        'errors' => $e->errors()
      ], 422);
    } catch (\Exception $e) {
      return response()->json([
        'status' => false,
        'message' => 'Failed to place bet: ' . $e->getMessage()
      ], 500);
    }
  }

  /**
   * Get user's betting history.
   */
  public function getBettingHistory(Request $request): AnonymousResourceCollection
  {
    $filters = $request->only(['status', 'from_date', 'to_date']);
    $perPage = $request->get('per_page', 15);
    $bets = $this->bettingService->getUserBettingHistory($request->user(), $filters, $perPage);

    return BetResource::collection($bets);
  }

  /**
   * Get user's betting statistics.
   */
  public function getBettingStats(Request $request): JsonResponse
  {
    $stats = $this->bettingService->getUserBettingStats($request->user());

    return response()->json([
      'status' => true,
      'data' => $stats
    ]);
  }

  /**
   * Get a specific bet details.
   */
  public function getBet(Bet $bet): BetResource
  {
    $this->authorize('view', $bet);

    return new BetResource($bet->load([
      'marketOption.bettingMarket.gameMatch.firstTeam',
      'marketOption.bettingMarket.gameMatch.secondTeam',
      'marketOption.bettingMarket.gameMatch.matchSession.turf'
    ]));
  }

  /**
   * Cancel a pending bet (if allowed).
   */
  public function cancelBet(Bet $bet): JsonResponse
  {
    $this->authorize('update', $bet);

    if ($bet->status === Bet::STATUS_CANCELLED) {
      return response()->json([
        'status' => false,
        'message' => 'Bet is already cancelled.'
      ], 400);
    }

    // Only allow cancellation if market hasn't closed yet
    if (!$bet->marketOption->bettingMarket->isOpenForBetting()) {
      return response()->json([
        'status' => false,
        'message' => 'Cannot cancel bet - market is closed.'
      ], 400);
    }

    try {
      $result = $this->bettingService->cancelBet($bet, 'User cancellation');

      return response()->json($result);
    } catch (\Exception $e) {
      return response()->json([
        'status' => false,
        'message' => 'Failed to cancel bet: ' . $e->getMessage()
      ], 500);
    }
  }

  /**
   * Confirm or verify payment for a bet.
   */
  public function confirmPayment(Request $request, Bet $bet): JsonResponse
  {
    $this->authorize('update', $bet);

    if ($bet->payment_status === Bet::PAYMENT_CONFIRMED) {
      return response()->json([
        'status' => false,
        'message' => 'Payment is already confirmed.'
      ], 400);
    }

    try {
      $paymentReference = $request->input('payment_reference');
      $result = $this->bettingService->confirmBetPayment($bet, $paymentReference);

      return response()->json($result);
    } catch (\Exception $e) {
      return response()->json([
        'status' => false,
        'message' => 'Failed to confirm payment: ' . $e->getMessage()
      ], 500);
    }
  }

  /**
   * Verify Paystack payment for a bet.
   */
  public function verifyPayment(Request $request, Bet $bet): JsonResponse
  {
    $this->authorize('update', $bet);

    $request->validate([
      'payment_reference' => 'required|string'
    ]);

    if ($bet->payment_status === Bet::PAYMENT_CONFIRMED) {
      return response()->json([
        'status' => false,
        'message' => 'Payment is already confirmed.'
      ], 400);
    }

    try {
      $result = $this->bettingService->verifyBetPayment($bet, $request->payment_reference);

      return response()->json($result);
    } catch (\Exception $e) {
      return response()->json([
        'status' => false,
        'message' => 'Failed to verify payment: ' . $e->getMessage()
      ], 500);
    }
  }

  /**
   * Get betting analytics for turf owners.
   */
  public function getTurfAnalytics(Turf $turf): JsonResponse
  {
    // Authorize that the user is the turf owner or has permission
    $this->authorize('manageBetting', $turf);

    try {
      $analytics = $this->bettingService->getTurfAnalytics($turf);

      return response()->json($analytics);
    } catch (\Exception $e) {
      return response()->json([
        'message' => 'Failed to fetch betting analytics: ' . $e->getMessage()
      ], 500);
    }
  }

  /**
   * Get comprehensive admin betting statistics.
   */
  public function getAdminStats(): JsonResponse
  {
    try {
      $stats = $this->bettingService->getAdminStats();
      return response()->json($stats);
    } catch (\Exception $e) {
      return response()->json([
        'message' => 'Failed to fetch admin stats: ' . $e->getMessage()
      ], 500);
    }
  }

  /**
   * Get all betting markets (admin view).
   */
  public function getAllMarkets(Request $request): JsonResponse
  {
    try {
      $filters = $request->only(['status', 'turf_id']);
      $perPage = $request->get('per_page', 15);

      $markets = $this->bettingService->getAllMarkets($filters, $perPage);

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
        'message' => 'Failed to fetch markets: ' . $e->getMessage()
      ], 500);
    }
  }

  /**
   * Get all bets (admin view).
   */
  public function getAllBets(Request $request): JsonResponse
  {
    try {
      $filters = $request->only(['status', 'user_id', 'market_id']);
      $perPage = $request->get('per_page', 15);

      $bets = $this->bettingService->getAllBets($filters, $perPage);

      return response()->json([
        'data' => BetResource::collection($bets->items()),
        'meta' => [
          'total' => $bets->total(),
          'per_page' => $bets->perPage(),
          'current_page' => $bets->currentPage(),
          'last_page' => $bets->lastPage(),
          'from' => $bets->firstItem(),
          'to' => $bets->lastItem(),
        ]
      ]);
    } catch (\Exception $e) {
      return response()->json([
        'message' => 'Failed to fetch bets: ' . $e->getMessage()
      ], 500);
    }
  }

  /**
   * Get betting statistics for a specific period.
   */
  public function getPeriodStats(Request $request): JsonResponse
  {
    try {
      $params = $request->only(['start_date', 'end_date', 'turf_id', 'market_type']);
      $stats = $this->bettingService->getPeriodStats($params);

      return response()->json($stats);
    } catch (\Exception $e) {
      return response()->json([
        'message' => 'Failed to fetch period stats: ' . $e->getMessage()
      ], 500);
    }
  }

  /**
   * Get user betting activity (admin view).
   */
  public function getUserBettingActivity(Request $request, int $userId): JsonResponse
  {
    try {
      $params = $request->only(['start_date', 'end_date']);
      $perPage = $request->get('per_page', 15);

      $result = $this->bettingService->getUserBettingActivity($userId, $params, $perPage);

      return response()->json([
        'data' => BetResource::collection($result['bets']->items()),
        'meta' => [
          'total' => $result['bets']->total(),
          'per_page' => $result['bets']->perPage(),
          'current_page' => $result['bets']->currentPage(),
          'last_page' => $result['bets']->lastPage(),
          'from' => $result['bets']->firstItem(),
          'to' => $result['bets']->lastItem(),
        ],
        'stats' => $result['stats']
      ]);
    } catch (\Exception $e) {
      return response()->json([
        'message' => 'Failed to fetch user betting activity: ' . $e->getMessage()
      ], 500);
    }
  }

  /**
   * Get system betting health check.
   */
  public function getSystemHealth(): JsonResponse
  {
    try {
      $health = $this->bettingService->getSystemHealth();
      return response()->json($health);
    } catch (\Exception $e) {
      return response()->json([
        'message' => 'Failed to fetch system health: ' . $e->getMessage()
      ], 500);
    }
  }

  /**
   * Cancel a bet (admin override).
   */
  public function adminCancelBet(Request $request, Bet $bet): JsonResponse
  {
    try {
      $reason = $request->get('reason', 'Cancelled by admin');
      $result = $this->bettingService->adminCancelBet($bet, $reason);

      if ($result['success']) {
        return response()->json([
          'status' => true,
          'message' => 'Bet cancelled successfully',
          'data' => new BetResource($bet->fresh())
        ]);
      }

      return response()->json([
        'status' => false,
        'message' => $result['message']
      ], 400);
    } catch (\Exception $e) {
      return response()->json([
        'message' => 'Failed to cancel bet: ' . $e->getMessage()
      ], 500);
    }
  }

  /**
   * Upload payment receipt for a bet (for offline payments).
   */
  public function uploadReceipt(Request $request, Bet $bet): JsonResponse
  {
    $this->authorize('update', $bet);

    $request->validate([
      'receipt' => 'required|file|mimes:jpeg,jpg,png,webp,pdf|max:5120', // 5MB max
    ]);

    if ($bet->payment_method !== Bet::PAYMENT_OFFLINE) {
      return response()->json([
        'message' => 'Receipt upload is only allowed for offline payment bets.'
      ], 400);
    }

    if ($bet->payment_status === Bet::PAYMENT_CONFIRMED) {
      return response()->json([
        'message' => 'Payment is already confirmed. Cannot upload new receipt.'
      ], 400);
    }

    try {
      // Clear existing receipt if any
      $bet->clearMediaCollection('payment_receipts');

      // Upload new receipt
      $media = $bet->addMedia($request->file('receipt'))
        ->toMediaCollection('payment_receipts');

      return response()->json([
        'status' => true,
        'message' => 'Receipt uploaded successfully',
        'data' => new BetResource($bet->fresh())
      ]);
    } catch (\Exception $e) {
      return response()->json([
        'message' => 'Failed to upload receipt: ' . $e->getMessage()
      ], 500);
    }
  }

  /**
   * Confirm offline payment for a bet.
   */
  public function confirmOfflinePayment(Request $request): JsonResponse
  {
    $request->validate([
      'bet_id' => 'required|exists:bets,id',
      'notes' => 'nullable|string|max:500'
    ]);

    try {
      $bet = Bet::findOrFail($request->bet_id);
      $result = $this->bettingService->confirmOfflinePayment($bet, $request->notes);

      if ($result['success']) {
        return response()->json([
          'status' => true,
          'message' => 'Offline payment confirmed successfully',
          'data' => new BetResource($bet->fresh())
        ]);
      }

      return response()->json([
        'status' => false,
        'message' => $result['message']
      ], 400);
    } catch (\Exception $e) {
      return response()->json([
        'message' => 'Failed to confirm offline payment: ' . $e->getMessage()
      ], 500);
    }
  }

  /**
   * Reject offline payment for a bet.
   */
  public function rejectOfflinePayment(Request $request): JsonResponse
  {
    $request->validate([
      'bet_id' => 'required|exists:bets,id',
      'reason' => 'nullable|string|max:500'
    ]);

    try {
      $bet = Bet::findOrFail($request->bet_id);
      $result = $this->bettingService->rejectOfflinePayment($bet, $request->reason);

      if ($result['success']) {
        return response()->json([
          'message' => 'Offline payment rejected successfully',
          'data' => new BetResource($bet->fresh())
        ]);
      }

      return response()->json([
        'message' => $result['message']
      ], 400);
    } catch (\Exception $e) {
      return response()->json([
        'message' => 'Failed to reject offline payment: ' . $e->getMessage()
      ], 500);
    }
  }

  /**
   * Get betting statistics for a specific turf (turf managers/admins).
   */
  public function getTurfBettingStats(Request $request, Turf $turf): JsonResponse
  {
    // Check if user can manage betting for this turf
    $this->authorize('manageBetting', $turf);

    try {
      $stats = $this->bettingService->getTurfBettingStats($turf);
      return response()->json($stats);
    } catch (\Exception $e) {
      return response()->json([
        'message' => 'Failed to fetch turf betting stats: ' . $e->getMessage()
      ], 500);
    }
  }

  /**
   * Get betting markets for a specific turf (turf managers/admins).
   */
  public function getTurfMarkets(Request $request, Turf $turf): JsonResponse
  {
    // Check if user can manage betting for this turf
    $this->authorize('manageBetting', $turf);

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
        'message' => 'Failed to fetch turf markets: ' . $e->getMessage()
      ], 500);
    }
  }

  /**
   * Get bets for a specific turf (turf managers/admins).
   */
  public function getTurfBets(Request $request, Turf $turf): JsonResponse
  {
    // Check if user can manage betting for this turf
    $this->authorize('manageBetting', $turf);

    try {
      $filters = $request->only(['status', 'user_id']);
      $perPage = $request->get('per_page', 15);

      $bets = $this->bettingService->getTurfBets($turf, $filters, $perPage);

      return response()->json([
        'data' => BetResource::collection($bets->items()),
        'meta' => [
          'total' => $bets->total(),
          'per_page' => $bets->perPage(),
          'current_page' => $bets->currentPage(),
          'last_page' => $bets->lastPage(),
          'from' => $bets->firstItem(),
          'to' => $bets->lastItem(),
        ]
      ]);
    } catch (\Exception $e) {
      return response()->json([
        'message' => 'Failed to fetch turf bets: ' . $e->getMessage()
      ], 500);
    }
  }

  /**
   * Get period statistics for a specific turf (turf managers/admins).
   */
  public function getTurfPeriodStats(Request $request, Turf $turf): JsonResponse
  {
    // Check if user can manage betting for this turf
    $this->authorize('manageBetting', $turf);

    try {
      $params = $request->only(['start_date', 'end_date', 'market_type']);
      $params['turf_id'] = $turf->id;

      $stats = $this->bettingService->getPeriodStats($params);
      return response()->json($stats);
    } catch (\Exception $e) {
      return response()->json([
        'message' => 'Failed to fetch turf period stats: ' . $e->getMessage()
      ], 500);
    }
  }
}
