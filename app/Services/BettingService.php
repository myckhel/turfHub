<?php

namespace App\Services;

use App\Models\Bet;
use App\Models\BettingMarket;
use App\Models\BetOutcome;
use App\Models\GameMatch;
use App\Models\MarketOption;
use App\Models\Payment;
use App\Models\Turf;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class BettingService
{
    public function __construct(
        protected PaymentService $paymentService,
        protected BettingPaymentService $bettingPaymentService
    ) {}

    /**
     * Get all available betting markets for upcoming game matches.
     */
    public function getAvailableMarkets(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = BettingMarket::with([
            'gameMatch.firstTeam',
            'gameMatch.secondTeam',
            'gameMatch.matchSession.turf',
            'marketOptions' => function ($query) {
                $query->active()->orderBy('key');
            }
        ])
        // ->openForBetting()
        ->whereHas('gameMatch', function ($query) {
            $query->where('betting_enabled', true);
                  // ->where('status', 'upcoming');
        });

        // Filter by game_match_id if provided
        if (isset($filters['game_match_id'])) {
            $query->where('game_match_id', $filters['game_match_id']);
        }

        // Apply filters
        if (isset($filters['turf_id'])) {
            $query->whereHas('gameMatch.matchSession', function ($q) use ($filters) {
                $q->where('turf_id', $filters['turf_id']);
            });
        }

        if (isset($filters['date'])) {
            $query->whereHas('gameMatch.matchSession', function ($q) use ($filters) {
                $q->whereDate('session_date', $filters['date']);
            });
        }

        if (isset($filters['market_type'])) {
            $query->where('market_type', $filters['market_type']);
        }

        return $query->orderBy('closes_at', 'asc')->paginate($perPage);
    }

    /**
     * Get betting markets for a specific game match.
     */
    public function getGameMatchMarkets(GameMatch $gameMatch): Collection
    {
        return $gameMatch->bettingMarkets()
            ->with('marketOptions')
            ->active()
            ->orderBy('market_type')
            ->get();
    }

    /**
     * Create a betting market for a game match.
     */
    public function createMarket(GameMatch $gameMatch, array $marketData): BettingMarket
    {
        if (!$gameMatch->betting_enabled) {
            throw ValidationException::withMessages([
                'game_match' => 'Betting is not enabled for this match.'
            ]);
        }

        DB::beginTransaction();

        try {
            $market = $gameMatch->bettingMarkets()->create([
                'market_type' => $marketData['market_type'],
                'name' => $marketData['name'],
                'description' => $marketData['description'] ?? null,
                'is_active' => true,
                'opens_at' => $marketData['opens_at'] ?? now(),
                'closes_at' => $marketData['closes_at'] ?? $gameMatch->match_time,
                'status' => BettingMarket::STATUS_ACTIVE,
                'metadata' => $marketData['metadata'] ?? null,
            ]);

            // Create market options
            if (isset($marketData['options'])) {
                foreach ($marketData['options'] as $optionData) {
                    $market->marketOptions()->create([
                        'key' => $optionData['key'],
                        'name' => $optionData['name'],
                        'odds' => $optionData['odds'] ?? 2.00,
                        'is_active' => true,
                    ]);
                }
            }

            DB::commit();

            return $market->load('marketOptions');
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Place a bet on a market option.
     */
    public function placeBet(
        User $user,
        MarketOption $marketOption,
        float $stakeAmount,
        string $paymentMethod = Bet::PAYMENT_ONLINE,
        ?string $paymentReference = null,
        $receiptFile = null
    ): array {
        if (!$marketOption->canAcceptBets()) {
            throw ValidationException::withMessages([
                'market' => 'This market is not accepting bets.'
            ]);
        }

        if ($stakeAmount < 10) {
            throw ValidationException::withMessages([
                'stake' => 'Minimum stake amount is ₦10.'
            ]);
        }

        // Validate receipt for offline payments
        if ($paymentMethod === Bet::PAYMENT_OFFLINE && !$receiptFile) {
            throw ValidationException::withMessages([
                'receipt' => 'Payment receipt is required for offline payments.'
            ]);
        }

        DB::beginTransaction();

        try {
            $potentialPayout = $stakeAmount * $marketOption->odds;

      // Create the bet
      $bet = Bet::create([
                'user_id' => $user->id,
                'betting_market_id' => $marketOption->betting_market_id,
                'market_option_id' => $marketOption->id,
                'stake_amount' => $stakeAmount,
                'odds_at_placement' => $marketOption->odds,
                'potential_payout' => $potentialPayout,
                'status' => Bet::STATUS_PENDING,
                'placed_at' => now(),
                'payment_method' => $paymentMethod,
                'payment_status' => Bet::PAYMENT_PENDING,
                'payment_reference' => $paymentReference,
            ]);

            // Attach receipt for offline payments
            if ($paymentMethod === Bet::PAYMENT_OFFLINE && $receiptFile) {
                $bet->addMedia($receiptFile)
                    ->toMediaCollection('payment_receipts');
            }

            DB::commit();

            // Process payment using the dedicated payment service
            return $this->bettingPaymentService->processBetPayment($bet, $paymentMethod, $paymentReference);

        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Confirm bet payment (for offline payments or payment verification).
     */
    public function confirmBetPayment(Bet $bet, ?string $paymentReference = null): array
    {
        return $this->bettingPaymentService->processBetPayment($bet, $bet->payment_method, $paymentReference);
    }

    /**
     * Cancel a bet and process refund if applicable.
     */
    public function cancelBet(Bet $bet, string $reason = 'User cancellation'): array
    {
        return $this->bettingPaymentService->cancelBetAndRefund($bet, $reason);
    }

    /**
     * Verify bet payment using payment reference.
     */
    public function verifyBetPayment(Bet $bet, string $paymentReference): array
    {
        return $this->bettingPaymentService->verifyBetPayment($bet, $paymentReference);
    }

    /**
     * Get user's betting history.
     */
    public function getUserBettingHistory(User $user, array $filters = [], int $perPage = 15)
    {
        $query = $user->bets()
            ->with([
                'marketOption.bettingMarket.gameMatch.firstTeam',
                'marketOption.bettingMarket.gameMatch.secondTeam',
                'marketOption.bettingMarket.gameMatch.matchSession.turf'
            ])
            ->orderBy('placed_at', 'desc');

        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (isset($filters['from_date'])) {
            $query->whereDate('placed_at', '>=', $filters['from_date']);
        }

        if (isset($filters['to_date'])) {
            $query->whereDate('placed_at', '<=', $filters['to_date']);
        }

        return $query->paginate($perPage);
    }

    /**
     * Get user's betting statistics.
     */
    public function getUserBettingStats(User $user): array
    {
        $bets = $user->bets()->paymentConfirmed();

        return [
            'total_bets' => $bets->count(),
            'total_staked' => $bets->sum('stake_amount'),
            'total_won' => $bets->where('status', Bet::STATUS_WON)->sum('actual_payout'),
            'total_lost' => $bets->where('status', Bet::STATUS_LOST)->sum('stake_amount'),
            'pending_bets' => $bets->where('status', Bet::STATUS_PENDING)->count(),
            'win_rate' => $this->calculateWinRate($user),
            'profit_loss' => $this->calculateProfitLoss($user),
        ];
    }

    /**
     * Settle a betting market based on game match result.
     */
    public function settleMarket(
        BettingMarket $market,
        ?User $settledBy = null,
        ?string $settlementResult = null,
        ?array $winningOptionIds = null,
        ?string $settlementNotes = null
    ): BetOutcome {
        if ($market->isSettled()) {
            throw ValidationException::withMessages([
                'market' => 'Market is already settled.'
            ]);
        }

        $gameMatch = $market->gameMatch;

        // Handle different settlement types
        if ($settlementResult === 'cancelled' || $settlementResult === 'refunded') {
            // Cancel/refund all bets
            return BetOutcome::createCancelledOutcome($market, $settledBy, $settlementNotes);
        }

        // Manual settlement with winning option IDs
        if ($winningOptionIds && count($winningOptionIds) > 0) {
            return BetOutcome::createManualOutcome(
                $market,
                $winningOptionIds,
                $settledBy,
                $settlementNotes
            );
        }

        // Auto-settlement from game match
        if ($gameMatch->status !== 'completed') {
            throw ValidationException::withMessages([
                'game_match' => 'Game match must be completed before auto-settling bets, or provide winning options for manual settlement.'
            ]);
        }

        return BetOutcome::createFromGameMatch($gameMatch, $settledBy);
    }

    /**
     * Cancel a betting market and refund all bets.
     */
    public function cancelMarket(BettingMarket $market, string $reason = null): void
    {
        DB::beginTransaction();

        try {
            // Cancel all pending bets and mark for refund
            $market->bets()->pending()->each(function (Bet $bet) {
                $bet->markAsCancelled();
            });

            // Update market status
            $market->update([
                'status' => BettingMarket::STATUS_CANCELLED,
                'settled_at' => now(),
            ]);

            DB::commit();

            Log::info('Betting market cancelled', [
                'market_id' => $market->id,
                'reason' => $reason
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Calculate user's win rate.
     */
    private function calculateWinRate(User $user): float
    {
        $settledBets = $user->bets()->settled()->paymentConfirmed();
        $totalSettled = $settledBets->count();

        if ($totalSettled === 0) {
            return 0;
        }

        $wonBets = $settledBets->where('status', Bet::STATUS_WON)->count();

        return round(($wonBets / $totalSettled) * 100, 2);
    }

    /**
     * Calculate user's profit/loss.
     */
    private function calculateProfitLoss(User $user): float
    {
        $settledBets = $user->bets()->settled()->paymentConfirmed()->get();

        $totalStaked = $settledBets->sum('stake_amount');
        $totalWon = $settledBets->where('status', Bet::STATUS_WON)->sum('actual_payout');

        return $totalWon - $totalStaked;
    }

    /**
     * Get comprehensive betting analytics for a turf owner.
     */
    public function getTurfAnalytics(Turf $turf): array
    {
        // Get all betting markets related to this turf
        $markets = BettingMarket::whereHas('gameMatch.matchSession', function ($query) use ($turf) {
            $query->where('turf_id', $turf->id);
        })->with(['bets', 'marketOptions'])->get();

        $totalRevenue = 0;
        $totalBets = 0;
        $totalPayouts = 0;
        $commissionEarned = 0;
        $playerIds = [];
        $marketTypes = [];

        foreach ($markets as $market) {
            foreach ($market->bets as $bet) {
                if ($bet->payment_status === Bet::PAYMENT_CONFIRMED) {
                    $totalBets++;
                    $totalRevenue += $bet->stake_amount;

                    // Track unique players
                    $playerIds[$bet->user_id] = true;

                    // Track market types
                    if (!isset($marketTypes[$market->market_type])) {
                        $marketTypes[$market->market_type] = [
                            'count' => 0,
                            'revenue' => 0
                        ];
                    }
                    $marketTypes[$market->market_type]['count']++;
                    $marketTypes[$market->market_type]['revenue'] += $bet->stake_amount;

                    // Calculate payouts for won bets
                    if ($bet->status === Bet::STATUS_WON && $bet->actual_payout) {
                        $totalPayouts += $bet->actual_payout;
                    }

                    // Calculate commission (assuming 5% commission rate)
                    $commissionEarned += $bet->stake_amount * 0.05;
                }
            }
        }

        // Transform market types data
        $popularMarketTypes = collect($marketTypes)->map(function ($data, $type) {
            return [
                'type' => $type,
                'count' => $data['count'],
                'revenue' => $data['revenue']
            ];
        })->values()->toArray();

        // Calculate recent activity (last 7 days)
        $recentActivity = collect(range(6, 0))->map(function ($daysAgo) use ($turf) {
            $date = now()->subDays($daysAgo);

            $dayBets = Bet::whereHas('bettingMarket.gameMatch.matchSession', function ($query) use ($turf) {
                $query->where('turf_id', $turf->id);
            })
            ->whereDate('created_at', $date)
            ->where('payment_status', Bet::PAYMENT_CONFIRMED)
            ->get();

            return [
                'date' => $date->format('Y-m-d'),
                'bets' => $dayBets->count(),
                'revenue' => $dayBets->sum('stake_amount')
            ];
        })->toArray();

        return [
            'total_revenue' => $totalRevenue,
            'total_bets' => $totalBets,
            'total_markets' => $markets->count(),
            'active_markets' => $markets->where('is_active', true)->count(),
            'total_players' => count($playerIds),
            'average_bet_amount' => $totalBets > 0 ? $totalRevenue / $totalBets : 0,
            'commission_earned' => $commissionEarned,
            'total_payouts' => $totalPayouts,
            'profit_margin' => $totalRevenue > 0 ? (($totalRevenue - $totalPayouts) / $totalRevenue) * 100 : 0,
            'popular_market_types' => $popularMarketTypes,
            'recent_activity' => $recentActivity,
        ];
    }

    /**
     * Get comprehensive admin betting statistics.
     */
    public function getAdminStats(): array
    {
        $today = now()->startOfDay();

        // Overall statistics
        $totalBets = Bet::count();
        $totalStake = Bet::sum('amount');
        $totalPayouts = Bet::whereNotNull('payout_amount')->sum('payout_amount');
        $activePlayers = User::whereHas('bets')->count();
        $activeMarkets = BettingMarket::where('is_active', true)->count();
        $pendingBets = Bet::where('status', 'pending')->count();
        $totalProfit = $totalStake - $totalPayouts;

        // Today's statistics
        $todayBets = Bet::whereDate('created_at', $today)->count();
        $todayStake = Bet::whereDate('created_at', $today)->sum('amount');
        $todayPayouts = Bet::whereDate('created_at', $today)->whereNotNull('payout_amount')->sum('payout_amount');
        $todayProfit = $todayStake - $todayPayouts;

        return [
            'totalBets' => $totalBets,
            'totalStake' => $totalStake,
            'totalPayouts' => $totalPayouts,
            'activePlayers' => $activePlayers,
            'activeMarkets' => $activeMarkets,
            'pendingBets' => $pendingBets,
            'totalProfit' => $totalProfit,
            'todayStats' => [
                'bets' => $todayBets,
                'stake' => $todayStake,
                'profit' => $todayProfit,
            ]
        ];
    }

    /**
     * Get all betting markets (admin view).
     */
    public function getAllMarkets(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = BettingMarket::with([
            'gameMatch.firstTeam',
            'gameMatch.secondTeam',
            'gameMatch.matchSession.turf',
            'marketOptions'
        ]);

        // Apply filters
        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (isset($filters['turf_id'])) {
            $query->whereHas('gameMatch.matchSession', function ($q) use ($filters) {
                $q->where('turf_id', $filters['turf_id']);
            });
        }

        return $query->orderBy('created_at', 'desc')->paginate($perPage);
    }

    /**
     * Get all bets (admin view).
     */
    public function getAllBets(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = Bet::with([
            'user',
            'marketOption.bettingMarket.gameMatch'
        ]);

        // Apply filters
        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (isset($filters['user_id'])) {
            $query->where('user_id', $filters['user_id']);
        }

        if (isset($filters['market_id'])) {
            $query->whereHas('marketOption', function ($q) use ($filters) {
                $q->where('betting_market_id', $filters['market_id']);
            });
        }

        return $query->orderBy('created_at', 'desc')->paginate($perPage);
    }

    /**
     * Get betting statistics for a specific period.
     */
    public function getPeriodStats(array $params): array
    {
        $query = Bet::query();

        if (isset($params['start_date'])) {
            $query->whereDate('created_at', '>=', $params['start_date']);
        }

        if (isset($params['end_date'])) {
            $query->whereDate('created_at', '<=', $params['end_date']);
        }

        if (isset($params['turf_id'])) {
            $query->whereHas('marketOption.bettingMarket.gameMatch.matchSession', function ($q) use ($params) {
                $q->where('turf_id', $params['turf_id']);
            });
        }

        if (isset($params['market_type'])) {
            $query->whereHas('marketOption.bettingMarket', function ($q) use ($params) {
                $q->where('market_type', $params['market_type']);
            });
        }

        $bets = $query->get();
        $totalBets = $bets->count();
        $totalStake = $bets->sum('amount');
        $totalWinnings = $bets->whereNotNull('payout_amount')->sum('payout_amount');
        $winningBets = $bets->where('status', 'won')->count();

        return [
            'total_bets' => $totalBets,
            'total_stake' => $totalStake,
            'total_winnings' => $totalWinnings,
            'win_rate' => $totalBets > 0 ? ($winningBets / $totalBets) * 100 : 0,
            'profit_loss' => $totalStake - $totalWinnings,
            'average_odds' => $bets->avg('potential_payout') / $bets->avg('amount'),
        ];
    }

    /**
     * Get user betting activity (admin view).
     */
    public function getUserBettingActivity(int $userId, array $params, int $perPage = 15): array
    {
        $betsQuery = Bet::with(['marketOption.bettingMarket'])
            ->where('user_id', $userId);

        if (isset($params['start_date'])) {
            $betsQuery->whereDate('created_at', '>=', $params['start_date']);
        }

        if (isset($params['end_date'])) {
            $betsQuery->whereDate('created_at', '<=', $params['end_date']);
        }

        $bets = $betsQuery->orderBy('created_at', 'desc')->paginate($perPage);

        // Calculate user stats
        $allUserBets = Bet::where('user_id', $userId)->get();
        $stats = [
            'total_bets' => $allUserBets->count(),
            'total_stake' => $allUserBets->sum('amount'),
            'total_winnings' => $allUserBets->whereNotNull('payout_amount')->sum('payout_amount'),
            'win_rate' => $allUserBets->count() > 0 ? ($allUserBets->where('status', 'won')->count() / $allUserBets->count()) * 100 : 0,
        ];

        return [
            'bets' => $bets,
            'stats' => $stats
        ];
    }

    /**
     * Get system betting health check.
     */
    public function getSystemHealth(): array
    {
        $issues = [];
        $status = 'healthy';

        // Check for pending bets older than 1 hour
        $oldPendingBets = Bet::where('status', 'pending')
            ->where('created_at', '<', now()->subHour())
            ->count();

        if ($oldPendingBets > 0) {
            $issues[] = [
                'type' => 'warning',
                'message' => "There are {$oldPendingBets} pending bets older than 1 hour",
                'details' => ['count' => $oldPendingBets]
            ];
            $status = 'warning';
        }

        // Check for markets that should be settled
        $unsettledMarkets = BettingMarket::where('status', 'open')
            ->whereHas('gameMatch', function ($q) {
                $q->where('status', 'completed');
            })
            ->count();

        if ($unsettledMarkets > 0) {
            $issues[] = [
                'type' => 'error',
                'message' => "There are {$unsettledMarkets} markets that should be settled",
                'details' => ['count' => $unsettledMarkets]
            ];
            $status = 'critical';
        }

        $stats = [
            'totalActiveMarkets' => BettingMarket::where('is_active', true)->count(),
            'pendingPayments' => Bet::where('status', 'pending')->count(),
            'failedBets' => Bet::where('status', 'cancelled')->count(),
            'systemLoad' => 0, // This could be calculated based on recent activity
        ];

        return [
            'status' => $status,
            'issues' => $issues,
            'stats' => $stats
        ];
    }

    /**
     * Cancel a bet (admin override).
     */
    public function adminCancelBet(Bet $bet, string $reason = 'Cancelled by admin'): array
    {
        try {
            DB::beginTransaction();

            if ($bet->status !== 'pending' && $bet->status !== 'active') {
                return [
                    'success' => false,
                    'message' => 'Only pending or active bets can be cancelled'
                ];
            }

            // Refund the bet amount if payment was processed
            if ($bet->payment_status === Bet::PAYMENT_CONFIRMED) {
                // Logic to refund user wallet or process refund
                // This would depend on the payment method used
            }

            $bet->update([
                'status' => Bet::STATUS_CANCELLED,
                'cancelled_at' => now(),
                'cancellation_reason' => $reason
            ]);

            DB::commit();

            return [
                'success' => true,
                'message' => 'Bet cancelled successfully'
            ];
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to cancel bet', [
                'bet_id' => $bet->id,
                'error' => $e->getMessage()
            ]);

            return [
                'success' => false,
                'message' => 'Failed to cancel bet: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Confirm offline payment for a bet.
     */
    public function confirmOfflinePayment(Bet $bet, ?string $notes = null): array
    {
        try {
            if ($bet->payment_method !== 'offline') {
                return [
                    'success' => false,
                    'message' => 'Only offline payment bets can be confirmed manually'
                ];
            }

            if ($bet->payment_status === Bet::PAYMENT_CONFIRMED) {
                return [
                    'success' => false,
                    'message' => 'Payment is already confirmed'
                ];
            }

            // Check if receipt exists
            if (!$bet->hasReceipt()) {
                return [
                    'success' => false,
                    'message' => 'Cannot confirm payment: Receipt not found'
                ];
            }

            $bet->update([
                'payment_status' => Bet::PAYMENT_CONFIRMED,
                'payment_confirmed_at' => now(),
                'status' => Bet::STATUS_ACTIVE,
                'notes' => $notes
            ]);

            // Get receipt information
            $receipt = $bet->getFirstMedia('payment_receipts');
            $receiptInfo = $receipt ? [
                'url' => $receipt->getUrl(),
                'preview_url' => $receipt->hasGeneratedConversion('preview') ? $receipt->getUrl('preview') : null,
                'thumb_url' => $receipt->hasGeneratedConversion('thumb') ? $receipt->getUrl('thumb') : null,
                'file_name' => $receipt->file_name,
                'size' => $receipt->size,
                'mime_type' => $receipt->mime_type,
                'uploaded_at' => $receipt->created_at?->toIso8601String(),
            ] : null;

            return [
                'success' => true,
                'message' => 'Offline payment confirmed successfully',
                'receipt' => $receiptInfo
            ];
        } catch (\Exception $e) {
            Log::error('Failed to confirm offline payment', [
                'bet_id' => $bet->id,
                'error' => $e->getMessage()
            ]);

            return [
                'success' => false,
                'message' => 'Failed to confirm payment: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Reject offline payment for a bet.
     */
    public function rejectOfflinePayment(Bet $bet, ?string $reason = null): array
    {
        try {
            if ($bet->payment_method !== 'offline') {
                return [
                    'success' => false,
                    'message' => 'Only offline payment bets can be rejected'
                ];
            }

            if ($bet->payment_status === Bet::PAYMENT_CONFIRMED) {
                return [
                    'success' => false,
                    'message' => 'Cannot reject a confirmed payment'
                ];
            }

            // Update bet status to cancelled/failed
            $bet->update([
                'payment_status' => Bet::PAYMENT_FAILED,
                'status' => Bet::STATUS_CANCELLED,
                'notes' => $reason ?? 'Payment receipt rejected by manager'
            ]);

            // Optionally delete the receipt if needed
            // $bet->clearMediaCollection('payment_receipts');

            return [
                'success' => true,
                'message' => 'Offline payment rejected successfully'
            ];
        } catch (\Exception $e) {
            Log::error('Failed to reject offline payment', [
                'bet_id' => $bet->id,
                'error' => $e->getMessage()
            ]);

            return [
                'success' => false,
                'message' => 'Failed to reject payment: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Get betting statistics for a specific turf.
     */
    public function getTurfBettingStats(Turf $turf): array
    {
        $today = now()->startOfDay();

        // Get bets for this turf through game matches
        $turfBetsQuery = Bet::whereHas('marketOption.bettingMarket.gameMatch.matchSession', function ($q) use ($turf) {
            $q->where('turf_id', $turf->id);
        });

        $totalBets = $turfBetsQuery->count();
        $totalStake = $turfBetsQuery->sum('amount');
        $totalPayouts = $turfBetsQuery->whereNotNull('payout_amount')->sum('payout_amount');
        $pendingBets = $turfBetsQuery->where('status', 'pending')->count();
        $totalProfit = $totalStake - $totalPayouts;

        // Active markets for this turf
        $activeMarkets = BettingMarket::whereHas('gameMatch.matchSession', function ($q) use ($turf) {
            $q->where('turf_id', $turf->id);
        })->where('is_active', true)->count();

        // Today's statistics
        $todayBets = $turfBetsQuery->whereDate('created_at', $today)->count();
        $todayStake = $turfBetsQuery->whereDate('created_at', $today)->sum('amount');
        $todayPayouts = $turfBetsQuery->whereDate('created_at', $today)->whereNotNull('payout_amount')->sum('payout_amount');
        $todayProfit = $todayStake - $todayPayouts;

        return [
            'totalBets' => $totalBets,
            'totalStake' => $totalStake,
            'totalPayouts' => $totalPayouts,
            'activeMarkets' => $activeMarkets,
            'pendingBets' => $pendingBets,
            'totalProfit' => $totalProfit,
            'todayStats' => [
                'bets' => $todayBets,
                'stake' => $todayStake,
                'profit' => $todayProfit,
            ]
        ];
    }

    /**
     * Get betting markets for a specific turf.
     */
    public function getTurfMarkets(Turf $turf, array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = BettingMarket::with([
            'gameMatch.firstTeam',
            'gameMatch.secondTeam',
            'gameMatch.matchSession.turf',
            'marketOptions'
        ])->whereHas('gameMatch.matchSession', function ($q) use ($turf) {
            $q->where('turf_id', $turf->id);
        });

        // Apply filters
        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        return $query->orderBy('created_at', 'desc')->paginate($perPage);
    }

    /**
     * Get bets for a specific turf.
     */
    public function getTurfBets(Turf $turf, array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = Bet::with([
            'user',
            'marketOption.bettingMarket.gameMatch'
        ])->whereHas('marketOption.bettingMarket.gameMatch.matchSession', function ($q) use ($turf) {
            $q->where('turf_id', $turf->id);
        });

        // Apply filters
        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (isset($filters['user_id'])) {
            $query->where('user_id', $filters['user_id']);
        }

        return $query->orderBy('created_at', 'desc')->paginate($perPage);
    }
}
