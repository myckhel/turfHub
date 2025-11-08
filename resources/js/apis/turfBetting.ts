import type { Bet, BetResponse, BettingMarket, BettingStatsResponse } from '@/types/betting.types';
import api from './index';

interface TurfBettingStats {
  totalBets: number;
  totalStake: number;
  totalPayouts: number;
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
  winning_option_ids: number[];
  settlement_notes?: string;
  settlement_result?: 'settled' | 'cancelled' | 'refunded';
}

interface ConfirmOfflinePaymentRequest {
  bet_id: number;
  notes?: string;
}

interface RejectOfflinePaymentRequest {
  bet_id: number;
  reason?: string;
}

export const turfBettingApi = {
  /**
   * Get betting statistics for a specific turf
   */
  getTurfStats: (turfId: number): Promise<TurfBettingStats> => api.get(route('api.turfs.betting.stats', { turf: turfId })),

  /**
   * Get betting markets for a specific turf
   */
  getTurfMarkets: (
    turfId: number,
    params?: {
      status?: string;
      page?: number;
      per_page?: number;
    },
  ): Promise<{ data: BettingMarket[]; meta: PaginationMeta }> => api.get(route('api.turfs.betting.markets', { turf: turfId }), { params }),

  /**
   * Get bets for a specific turf
   */
  getTurfBets: (
    turfId: number,
    params?: {
      status?: string;
      user_id?: number;
      page?: number;
      per_page?: number;
    },
  ): Promise<{ data: Bet[]; meta: PaginationMeta }> => api.get(route('api.turfs.betting.bets', { turf: turfId }), { params }),

  /**
   * Settle a betting market
   */
  settleMarket: (turfId: number, marketId: number, data: SettleMarketRequest): Promise<BetResponse> =>
    api.post(route('api.turfs.betting.markets.settle', { turf: turfId, bettingMarket: marketId }), data),

  /**
   * Cancel a betting market
   */
  cancelMarket: (turfId: number, marketId: number, reason?: string): Promise<BetResponse> =>
    api.post(route('api.turfs.betting.markets.cancel', { turf: turfId, bettingMarket: marketId }), { reason }),

  /**
   * Confirm offline payment for a bet
   */
  confirmOfflinePayment: (turfId: number, data: ConfirmOfflinePaymentRequest): Promise<BetResponse> =>
    api.post(route('api.turfs.betting.confirm-offline-payment', { turf: turfId }), data),

  /**
   * Reject offline payment for a bet
   */
  rejectOfflinePayment: (turfId: number, data: RejectOfflinePaymentRequest): Promise<BetResponse> =>
    api.post(route('api.turfs.betting.reject-offline-payment', { turf: turfId }), data),

  /**
   * Cancel a bet (manager override)
   */
  cancelBet: (turfId: number, betId: number, reason?: string): Promise<BetResponse> =>
    api.post(route('api.turfs.betting.bets.cancel', { turf: turfId, bet: betId }), { reason }),

  /**
   * Get betting statistics for a specific period
   */
  getPeriodStats: (
    turfId: number,
    params: {
      start_date?: string;
      end_date?: string;
      market_type?: string;
    },
  ): Promise<BettingStatsResponse> => api.get(route('api.turfs.betting.period-stats', { turf: turfId }), { params }),

  /**
   * Update market settings (manager only)
   */
  updateMarketSettings: (
    turfId: number,
    marketId: number,
    data: {
      is_active?: boolean;
      max_stake?: number;
      min_stake?: number;
      odds_multiplier?: number;
    },
  ): Promise<BetResponse> => api.patch(route('api.turfs.betting.markets.settings', { turf: turfId, bettingMarket: marketId }), data),
};
