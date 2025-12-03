import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { bettingApi } from '../apis';
import type {
  Bet,
  BetStatus,
  BettingFilters,
  BettingMarket,
  BettingStatsFilters,
  BettingStatsResponse,
  MarketOption,
  MarketType,
  PaymentMethod,
  PlaceBetRequest,
} from '../types/betting.types';

interface BettingStore {
  // Markets state
  markets: BettingMarket[];
  currentMarket: BettingMarket | null;
  marketsLoading: boolean;
  marketsError: string | null;

  // User bets state
  userBets: Bet[];
  bettingHistory: Bet[];
  historyLoading: boolean;
  historyError: string | null;

  // Bet slip state
  selectedOptions: MarketOption[];
  stakes: Record<number, number>;
  paymentMethod: PaymentMethod;
  betSlipOpen: boolean;
  placingBets: boolean;

  // Stats state
  bettingStats: BettingStatsResponse | null;
  statsLoading: boolean;
  statsError: string | null;

  // Filters state
  historyFilters: BettingFilters;
  statsFilters: BettingStatsFilters;

  // Market actions
  fetchMarkets: (gameMatchId?: number, turfId?: number) => Promise<void>;
  fetchMarket: (marketId: number) => Promise<void>;
  clearMarkets: () => void;

  // Betting actions
  placeBet: (request: PlaceBetRequest) => Promise<Bet>;
  placeBets: (requests: PlaceBetRequest[]) => Promise<Bet[]>;
  cancelBet: (betId: number) => Promise<void>;
  confirmPayment: (betId: number) => Promise<void>;

  // History actions
  fetchBettingHistory: (filters?: BettingFilters) => Promise<void>;
  updateHistoryFilters: (filters: Partial<BettingFilters>) => void;
  clearHistory: () => void;

  // Stats actions
  fetchBettingStats: (filters?: BettingStatsFilters) => Promise<void>;
  updateStatsFilters: (filters: Partial<BettingStatsFilters>) => void;
  clearStats: () => void;

  // Bet slip actions
  addToBetSlip: (option: MarketOption) => void;
  removeFromBetSlip: (optionId: number) => void;
  updateStake: (optionId: number, stake: number) => void;
  clearBetSlip: () => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  toggleBetSlip: () => void;

  // Utility actions
  getBetById: (betId: number) => Bet | undefined;
  getMarketById: (marketId: number) => BettingMarket | undefined;
  getOptionById: (optionId: number) => MarketOption | undefined;
  getTotalStake: () => number;
  getTotalPotentialPayout: () => number;
  reset: () => void;
}

const initialState = {
  markets: [],
  currentMarket: null,
  marketsLoading: false,
  marketsError: null,
  userBets: [],
  bettingHistory: [],
  historyLoading: false,
  historyError: null,
  selectedOptions: [],
  stakes: {},
  paymentMethod: 'online' as PaymentMethod,
  betSlipOpen: false,
  placingBets: false,
  bettingStats: null,
  statsLoading: false,
  statsError: null,
  historyFilters: {},
  statsFilters: { period: 'month' as const },
};

export const useBettingStore = create<BettingStore>()(
  devtools(
    persist(
      immer((set, get) => ({
        ...initialState,

        // Market actions
        fetchMarkets: async (gameMatchId?: number, turfId?: number) => {
          set((state) => {
            state.marketsLoading = true;
            state.marketsError = null;
          });

          try {
            const params: { game_match_id?: number; turf_id?: number } = {};
            if (gameMatchId) params.game_match_id = gameMatchId;
            if (turfId) params.turf_id = turfId;

            const response = await bettingApi.getMarkets(Object.keys(params).length > 0 ? params : undefined);
            console.log('Fetched markets for turf:', turfId, response);

            set((state) => {
              state.markets = response.data;
              state.marketsLoading = false;
            });
          } catch (error) {
            console.error('Failed to fetch betting markets:', error);
            set((state) => {
              state.marketsError = error instanceof Error ? error.message : 'Failed to fetch markets';
              state.marketsLoading = false;
            });
          }
        },

        fetchMarket: async (marketId: number) => {
          set((state) => {
            state.marketsLoading = true;
            state.marketsError = null;
          });

          try {
            const response = await bettingApi.getMarket(marketId);
            set((state) => {
              state.currentMarket = response.data;
              state.marketsLoading = false;

              // Update market in markets array if it exists
              const existingIndex = state.markets.findIndex((m: BettingMarket) => m.id === marketId);
              if (existingIndex >= 0) {
                state.markets[existingIndex] = response.data;
              }
            });
          } catch (error) {
            console.error('Failed to fetch betting market:', error);
            set((state) => {
              state.marketsError = error instanceof Error ? error.message : 'Failed to fetch market';
              state.marketsLoading = false;
            });
          }
        },

        clearMarkets: () => {
          set((state) => {
            state.markets = [];
            state.currentMarket = null;
            state.marketsError = null;
          });
        },

        // Betting actions
        placeBet: async (request: PlaceBetRequest) => {
          try {
            const newBet = await bettingApi.placeBet(request);

            set((state) => {
              state.userBets.unshift(newBet);
              // Remove option from bet slip after successful bet
              state.selectedOptions = state.selectedOptions.filter((opt: MarketOption) => opt.id !== request.market_option_id);
              delete state.stakes[request.market_option_id];
            });

            return newBet;
          } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } }; message?: string };
            const errorMessage = err?.response?.data?.message || err?.message || 'Failed to place bet';
            console.error('Failed to place bet:', errorMessage, error);
            throw new Error(errorMessage);
          }
        },

        placeBets: async (requests: PlaceBetRequest[]) => {
          set((state) => {
            state.placingBets = true;
          });

          try {
            const bets: Bet[] = [];
            const errors: string[] = [];

            // Place bets sequentially to handle any failures gracefully
            for (const request of requests) {
              try {
                const bet = await get().placeBet(request);
                bets.push(bet);
              } catch (error: unknown) {
                const err = error as { message?: string; response?: { data?: { message?: string } } };
                const errorMessage = err?.message || err?.response?.data?.message || 'Failed to place individual bet';
                console.error('Failed to place individual bet:', errorMessage, error);
                errors.push(errorMessage);
                // Continue with other bets even if one fails
              }
            }

            set((state) => {
              state.placingBets = false;
              // Clear bet slip after placing all bets
              state.selectedOptions = [];
              state.stakes = {};
            });

            // If all bets failed, throw an error
            if (bets.length === 0 && errors.length > 0) {
              throw new Error(errors.join(', '));
            }

            return bets;
          } catch (error: unknown) {
            set((state) => {
              state.placingBets = false;
            });
            throw error;
          }
        },

        cancelBet: async (betId: number) => {
          try {
            await bettingApi.cancelBet(betId);

            set((state) => {
              // Update bet status in both userBets and bettingHistory
              const updateBetStatus = (bet: Bet) => {
                if (bet.id === betId) {
                  return { ...bet, status: 'cancelled' as BetStatus };
                }
                return bet;
              };

              state.userBets = state.userBets.map(updateBetStatus);
              state.bettingHistory = state.bettingHistory.map(updateBetStatus);
            });
          } catch (error) {
            console.error('Failed to cancel bet:', error);
            throw error;
          }
        },

        confirmPayment: async (betId: number) => {
          try {
            await bettingApi.confirmPayment(betId);

            set((state) => {
              // Update bet status in both userBets and bettingHistory
              const updateBetStatus = (bet: Bet) => {
                if (bet.id === betId) {
                  return { ...bet, status: 'active' as BetStatus, payment_confirmed_at: new Date().toISOString() };
                }
                return bet;
              };

              state.userBets = state.userBets.map(updateBetStatus);
              state.bettingHistory = state.bettingHistory.map(updateBetStatus);
            });
          } catch (error) {
            console.error('Failed to confirm payment:', error);
            throw error;
          }
        },

        // History actions
        fetchBettingHistory: async (filters?: BettingFilters) => {
          set((state) => {
            state.historyLoading = true;
            state.historyError = null;
          });

          try {
            const currentState = get();
            const finalFilters = { ...currentState.historyFilters, ...filters };
            const response = await bettingApi.getBettingHistory(finalFilters);

            set((state) => {
              state.bettingHistory = response.data;
              state.historyLoading = false;
              if (filters) {
                state.historyFilters = finalFilters;
              }
            });
          } catch (error) {
            console.error('Failed to fetch betting history:', error);
            set((state) => {
              state.historyError = error instanceof Error ? error.message : 'Failed to fetch history';
              state.historyLoading = false;
            });
          }
        },

        updateHistoryFilters: (filters: Partial<BettingFilters>) => {
          set((state) => {
            state.historyFilters = { ...state.historyFilters, ...filters };
          });
        },

        clearHistory: () => {
          set((state) => {
            state.bettingHistory = [];
            state.historyError = null;
            state.historyFilters = {};
          });
        },

        // Stats actions
        fetchBettingStats: async (filters?: BettingStatsFilters) => {
          set((state) => {
            state.statsLoading = true;
            state.statsError = null;
          });

          try {
            const currentState = get();
            const finalFilters = { ...currentState.statsFilters, ...filters };
            const response = await bettingApi.getBettingStats(finalFilters);

            set((state) => {
              state.bettingStats = response;
              state.statsLoading = false;
              if (filters) {
                state.statsFilters = finalFilters;
              }
            });
          } catch (error) {
            console.error('Failed to fetch betting stats:', error);
            set((state) => {
              state.statsError = error instanceof Error ? error.message : 'Failed to fetch stats';
              state.statsLoading = false;
            });
          }
        },

        updateStatsFilters: (filters: Partial<BettingStatsFilters>) => {
          set((state) => {
            state.statsFilters = { ...state.statsFilters, ...filters };
          });
        },

        clearStats: () => {
          set((state) => {
            state.bettingStats = null;
            state.statsError = null;
            state.statsFilters = { period: 'month' };
          });
        },

        // Bet slip actions
        addToBetSlip: (option: MarketOption) => {
          set((state) => {
            const existingIndex = state.selectedOptions.findIndex((opt: MarketOption) => opt.id === option.id);

            if (existingIndex === -1) {
              state.selectedOptions.push(option);
              // Set default stake if not already set
              if (!state.stakes[option.id]) {
                state.stakes[option.id] = option?.betting_market?.min_stake_amount || 100; // Default stake amount
              }
            }
          });
        },

        removeFromBetSlip: (optionId: number) => {
          set((state) => {
            state.selectedOptions = state.selectedOptions.filter((opt: MarketOption) => opt.id !== optionId);
            delete state.stakes[optionId];
          });
        },

        updateStake: (optionId: number, stake: number) => {
          set((state) => {
            if (stake >= 0) {
              state.stakes[optionId] = stake;
            }
          });
        },

        clearBetSlip: () => {
          set((state) => {
            state.selectedOptions = [];
            state.stakes = {};
          });
        },

        setPaymentMethod: (method: PaymentMethod) => {
          set((state) => {
            state.paymentMethod = method;
          });
        },

        toggleBetSlip: () => {
          set((state) => {
            state.betSlipOpen = !state.betSlipOpen;
          });
        },

        // Utility actions
        getBetById: (betId: number) => {
          const state = get();
          return state.userBets.find((bet) => bet.id === betId) || state.bettingHistory.find((bet) => bet.id === betId);
        },

        getMarketById: (marketId: number) => {
          const state = get();
          return state.markets.find((market) => market.id === marketId) || (state.currentMarket?.id === marketId ? state.currentMarket : undefined);
        },

        getOptionById: (optionId: number) => {
          const state = get();
          for (const market of state.markets) {
            const option = market.market_options?.find((opt) => opt.id === optionId);
            if (option) return option;
          }

          if (state.currentMarket) {
            const option = state.currentMarket.market_options?.find((opt) => opt.id === optionId);
            if (option) return option;
          }

          return state.selectedOptions.find((opt) => opt.id === optionId);
        },

        getTotalStake: () => {
          const state = get();
          return Object.values(state.stakes).reduce((total, stake) => total + stake, 0);
        },

        getTotalPotentialPayout: () => {
          const state = get();
          return state.selectedOptions.reduce((total, option) => {
            const stake = state.stakes[option.id] || 0;
            const odds = typeof option.odds === 'string' ? parseFloat(option.odds) : option.odds;
            return total + stake * odds;
          }, 0);
        },

        reset: () => {
          set(initialState);
        },
      })),
      {
        name: 'betting-store',
        partialize: (state) => ({
          // Only persist bet slip and filters
          selectedOptions: state.selectedOptions,
          stakes: state.stakes,
          paymentMethod: state.paymentMethod,
          historyFilters: state.historyFilters,
          statsFilters: state.statsFilters,
        }),
      },
    ),
    { name: 'BettingStore' },
  ),
);

// Computed selectors for common use cases
export const useBettingSelectors = () => {
  const store = useBettingStore();

  return {
    // Market selectors
    availableMarkets: store.markets,
    marketsByType: (type: MarketType) => store.markets.filter((market) => market.market_type === type),

    // Bet selectors
    pendingBets: store.userBets?.filter((bet) => bet?.status === 'pending') ?? [],
    confirmedBets: store.userBets?.filter((bet) => bet?.status === 'active') ?? [],
    winningBets: store.userBets?.filter((bet) => bet?.status === 'won') ?? [],

    // Bet slip selectors
    hasBetsInSlip: store.selectedOptions.length > 0,
    betSlipCount: store.selectedOptions.length,
    totalStake: store.getTotalStake(),
    totalPotentialPayout: store.getTotalPotentialPayout(),

    // UI state selectors
    isLoading: store.marketsLoading || store.historyLoading || store.statsLoading || store.placingBets,
    hasErrors: !!(store.marketsError || store.historyError || store.statsError),
  };
};

export default useBettingStore;
