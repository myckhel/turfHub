import type { Bet, BetResponse, BettingMarket, BettingStatsResponse } from '@/types/betting.types';
import api from './index';

interface AdminBettingStats {
  totalBets: number;
  totalStake: number;
  totalPayouts: number;
  activePlayers: number;
  activeMarkets: number;
  pendingBets: number;
  totalProfit: number;
  todayStats: {
    bets: number;
    stake: number;
    profit: number;
  };
}

interface PaginationMeta {
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
  from: number;
  to: number;
}

interface SettleMarketRequest {
  winningOptionId: number;
  reason?: string;
}

interface ConfirmOfflinePaymentRequest {
  betId: number;
  notes?: string;
}

interface SystemIssue {
  type: 'error' | 'warning';
  message: string;
  details?: Record<string, unknown>;
}

export const adminBettingApi = {
  /**
   * Get comprehensive admin betting statistics
   */
  getAdminStats: (): Promise<AdminBettingStats> => api.get(route('api.admin.betting.stats')),

  /**
   * Get all betting markets with admin details
   */
  getAllMarkets: (params?: {
    status?: string;
    turf_id?: number;
    page?: number;
    per_page?: number;
  }): Promise<{ data: BettingMarket[]; meta: PaginationMeta }> => api.get(route('api.admin.betting.markets'), { params }),

  /**
   * Get all bets with admin details
   */
  getAllBets: (params?: {
    status?: string;
    user_id?: number;
    market_id?: number;
    page?: number;
    per_page?: number;
  }): Promise<{ data: Bet[]; meta: PaginationMeta }> => api.get(route('api.admin.betting.bets'), { params }),

  /**
   * Settle a betting market
   */
  settleMarket: (marketId: number, data: SettleMarketRequest): Promise<BetResponse> =>
    api.post(route('api.admin.betting.markets.settle', { market: marketId }), data),

  /**
   * Cancel a betting market
   */
  cancelMarket: (marketId: number, reason?: string): Promise<BetResponse> =>
    api.post(route('api.admin.betting.markets.cancel', { market: marketId }), { reason }),

  /**
   * Confirm offline payment for a bet
   */
  confirmOfflinePayment: (data: ConfirmOfflinePaymentRequest): Promise<BetResponse> =>
    api.post(route('api.admin.betting.confirm-offline-payment'), data),

  /**
   * Cancel a bet (admin override)
   */
  cancelBet: (betId: number, reason?: string): Promise<BetResponse> => api.post(route('api.admin.betting.bets.cancel', { bet: betId }), { reason }),

  /**
   * Get betting statistics for a specific period
   */
  getPeriodStats: (params: { start_date?: string; end_date?: string; turf_id?: number; market_type?: string }): Promise<BettingStatsResponse> =>
    api.get(route('api.admin.betting.period-stats'), { params }),

  /**
   * Get user betting activity (admin view)
   */
  getUserBettingActivity: (
    userId: number,
    params?: {
      start_date?: string;
      end_date?: string;
      page?: number;
    },
  ): Promise<{ data: Bet[]; meta: PaginationMeta; stats: BettingStatsResponse }> =>
    api.get(route('api.admin.betting.users.activity', { user: userId }), { params }),

  /**
   * Get turf betting analytics (admin view)
   */
  getTurfAnalytics: (
    turfId: number,
    params?: {
      start_date?: string;
      end_date?: string;
    },
  ): Promise<{
    totalStake: number;
    totalPayout: number;
    profit: number;
    betCount: number;
    activeMarkets: number;
    topPlayers: Array<{
      user: { id: number; name: string };
      totalStake: number;
      betCount: number;
    }>;
  }> => api.get(route('api.admin.betting.turfs.analytics', { turf: turfId }), { params }),

  /**
   * Update market settings (admin only)
   */
  updateMarketSettings: (
    marketId: number,
    data: {
      is_active?: boolean;
      max_stake?: number;
      min_stake?: number;
      odds_multiplier?: number;
    },
  ): Promise<BetResponse> => api.patch(route('api.admin.betting.markets.settings', { market: marketId }), data),

  /**
   * Get system betting health check
   */
  getSystemHealth: (): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    issues: SystemIssue[];
    stats: {
      totalActiveMarkets: number;
      pendingPayments: number;
      failedBets: number;
      systemLoad: number;
    };
  }> => api.get(route('api.admin.betting.health')),
};
