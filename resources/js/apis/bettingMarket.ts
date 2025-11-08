import type { BettingMarket, BettingMarketResponse, CreateMarketRequest, MarketOption, SettleMarketRequest } from '../types/betting.types';
import api from './index';

/**
 * API module for betting market management
 * Handles turf owner/manager betting administration
 */
export const bettingMarketApi = {
  /**
   * Enable betting for a specific game match
   */
  enableBetting: async (gameMatchId: number): Promise<{ message: string }> => {
    return api.post(route('api.betting.game-matches.enable-betting', { gameMatch: gameMatchId }));
  },

  /**
   * Disable betting for a specific game match
   */
  disableBetting: async (gameMatchId: number): Promise<{ message: string }> => {
    return api.post(route('api.betting.game-matches.disable-betting', { gameMatch: gameMatchId }));
  },

  /**
   * Create a new betting market for a game match
   */
  createMarket: async (gameMatchId: number, marketData: Omit<CreateMarketRequest, 'game_match_id'>): Promise<{ data: BettingMarket }> => {
    return api.post(route('api.betting.game-matches.markets.store', { gameMatch: gameMatchId }), {
      ...marketData,
      game_match_id: gameMatchId,
    });
  },

  /**
   * Update an existing betting market
   */
  updateMarket: async (marketId: number, marketData: Partial<CreateMarketRequest>): Promise<{ data: BettingMarket }> => {
    return api.put(route('api.betting.markets.update', { market: marketId }), marketData);
  },

  /**
   * Delete a betting market (only if no bets placed)
   */
  deleteMarket: async (marketId: number): Promise<{ message: string }> => {
    return api.delete(route('api.betting.markets.destroy', { market: marketId }));
  },

  /**
   * Suspend a betting market (stop accepting new bets)
   */
  suspendMarket: async (marketId: number): Promise<{ message: string }> => {
    return api.post(route('api.betting.markets.suspend', { market: marketId }));
  },

  /**
   * Reopen a suspended betting market
   */
  reopenMarket: async (marketId: number): Promise<{ message: string }> => {
    return api.post(route('api.betting.markets.reopen', { market: marketId }));
  },

  /**
   * Settle a betting market with results
   * @param marketId - The betting market ID
   * @param settlementData - Settlement data including result type, winning options, and notes
   */
  settleMarket: async (marketId: number, settlementData: SettleMarketRequest): Promise<BettingMarket> => {
    return api.patch(route('api.betting.markets.settle', { bettingMarket: marketId }), settlementData);
  },

  /**
   * Cancel a betting market and refund all bets
   */
  cancelMarket: async (marketId: number, reason?: string): Promise<{ message: string; refunded_bets: number }> => {
    return api.post(route('api.betting.markets.cancel', { market: marketId }), { reason });
  },

  /**
   * Get all markets for turf owner's game matches
   */
  getTurfMarkets: async (turfId: number, filters?: { status?: string; date_from?: string; date_to?: string }): Promise<BettingMarketResponse> => {
    return api.get(route('api.betting.turfs.markets', { turf: turfId }), { params: filters });
  },

  /**
   * Get betting analytics for turf owner
   */
  getTurfBettingAnalytics: async (
    turfId: number,
    period?: 'week' | 'month' | 'year',
  ): Promise<{
    data: {
      total_markets: number;
      total_bets: number;
      total_volume: number;
      commission_earned: number;
      active_markets: number;
      popular_market_types: Array<{ type: string; count: number; volume: number }>;
    };
  }> => {
    return api.get(route('api.betting.turfs.analytics', { turf: turfId }), { params: { period } });
  },

  /**
   * Update market option odds
   */
  updateMarketOptionOdds: async (optionId: number, odds: number): Promise<{ data: MarketOption }> => {
    return api.put(route('api.betting.market-options.update', { option: optionId }), { odds });
  },

  /**
   * Add new market option to existing market
   */
  addMarketOption: async (marketId: number, option: { name: string; odds: number }): Promise<{ data: MarketOption }> => {
    return api.post(route('api.betting.markets.options.store', { market: marketId }), option);
  },

  /**
   * Remove market option (only if no bets placed)
   */
  removeMarketOption: async (optionId: number): Promise<{ message: string }> => {
    return api.delete(route('api.betting.market-options.destroy', { option: optionId }));
  },
};

export default bettingMarketApi;
