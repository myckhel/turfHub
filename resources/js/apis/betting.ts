import type {
  BetActionResponse,
  BetResponse,
  BettingFilters,
  BettingHistoryResponse,
  BettingMarket,
  BettingMarketResponse,
  BettingStatsFilters,
  BettingStatsResponse,
  CreateMarketRequest,
  PlaceBetRequest,
  SettleMarketRequest,
} from '../types/betting.types';
import api from './index';

/**
 * API module for betting operations
 * Handles all player-facing betting functionality
 */
export const bettingApi = {
  /**
   * Get available betting markets (optionally filtered by game match)
   */
  getMarkets: async (params?: {
    game_match_id?: number;
    turf_id?: number;
    include?: string;
    per_page?: number;
    page?: number;
  }): Promise<BettingMarketResponse> => {
    return api.get(route('api.betting.markets'), { params });
  },

  /**
   * Get detailed information about a specific betting market
   */
  getMarket: async (marketId: number): Promise<{ data: BettingMarket }> => {
    return api.get(route('api.betting.markets.show', { bettingMarket: marketId }));
  },

  /**
   * Update a betting market (for turf owners/admins)
   */
  updateMarket: async (marketId: number, data: Partial<BettingMarket>): Promise<{ data: BettingMarket }> => {
    return api.patch(route('api.betting.markets.update', { bettingMarket: marketId }), data);
  },

  /**
   * Create a new betting market for a game match
   */
  createMarket: async (gameMatchId: number, marketData: CreateMarketRequest): Promise<{ data: BettingMarket }> => {
    return api.post(route('api.betting.game-matches.markets.store', { gameMatch: gameMatchId }), marketData);
  },

  /**
   * Settle a betting market with winning outcomes
   */
  settleMarket: async (marketId: number, settlementData: SettleMarketRequest): Promise<{ data: BettingMarket }> => {
    return api.patch(route('api.betting.markets.settle', { bettingMarket: marketId }), settlementData);
  },

  /**
   * Cancel a betting market and issue refunds
   */
  cancelMarket: async (marketId: number, reason?: string): Promise<{ data: BettingMarket }> => {
    return api.patch(route('api.betting.markets.cancel', { bettingMarket: marketId }), { reason });
  },

  /**
   * Place a new bet
   */
  placeBet: async (betData: PlaceBetRequest): Promise<BetResponse> => {
    return api.post(route('api.betting.place-bet'), betData);
  },

  /**
   * Get user's betting history with optional filters
   */
  getBettingHistory: async (filters?: BettingFilters): Promise<BettingHistoryResponse> => {
    return api.get(route('api.betting.history'), { params: filters });
  },

  /**
   * Get user's betting statistics
   */
  getBettingStats: async (filters?: BettingStatsFilters): Promise<BettingStatsResponse> => {
    return api.get(route('api.betting.stats'), { params: filters });
  },

  /**
   * Get betting analytics for turf owners
   */
  getTurfAnalytics: async (
    turfId: number,
  ): Promise<{
    total_revenue: number;
    total_bets: number;
    total_markets: number;
    active_markets: number;
    total_players: number;
    average_bet_amount: number;
    commission_earned: number;
    total_payouts: number;
    profit_margin: number;
    popular_market_types: Array<{
      type: string;
      count: number;
      revenue: number;
    }>;
    recent_activity: Array<{
      date: string;
      bets: number;
      revenue: number;
    }>;
  }> => {
    return api.get(route('api.betting.turf-analytics', { turf: turfId }));
  },

  /**
   * Cancel a pending bet
   */
  cancelBet: async (betId: number): Promise<BetActionResponse> => {
    return api.patch(route('api.betting.bets.cancel', { bet: betId }));
  },

  /**
   * Confirm payment for a bet (supports both offline and payment reference verification)
   */
  confirmPayment: async (betId: number, paymentReference?: string): Promise<BetActionResponse> => {
    return api.patch(route('api.betting.bets.confirm-payment', { bet: betId }), {
      payment_reference: paymentReference,
    });
  },

  /**
   * Verify Paystack payment for a bet
   */
  verifyPayment: async (betId: number, paymentReference: string): Promise<BetActionResponse> => {
    return api.post(route('api.betting.bets.verify-payment', { bet: betId }), {
      payment_reference: paymentReference,
    });
  },

  /**
   * Get betting markets for a specific game match
   */
  getGameMatchMarkets: async (gameMatchId: number): Promise<BettingMarketResponse> => {
    return api.get(route('api.betting.game-matches.markets', { gameMatch: gameMatchId }));
  },
};

export default bettingApi;
