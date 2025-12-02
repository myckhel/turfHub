import { GameMatch } from './gameMatch.types';
import { User } from './global.types';

// Core Betting Types
export interface BettingMarket {
  id: number;
  market_type: MarketType;
  type: MarketType; // Alias for market_type to support both naming conventions
  name: string;
  description?: string;
  is_active: boolean;
  status: MarketStatus;
  opens_at?: string;
  closes_at?: string;
  settled_at?: string;
  metadata?: Record<string, unknown>;
  is_open_for_betting: boolean;
  is_settled: boolean;
  total_stake: number;
  total_bets: number;
  total_bet_amount?: number; // For backwards compatibility
  total_bets_count?: number; // For components expecting this property
  total_stake_amount?: number; // For components expecting this property
  game_match_id?: number; // For components expecting this property
  created_at: string;
  updated_at: string;

  // Relationships
  game_match?: GameMatch;
  market_options?: MarketOption[];
  bets?: Bet[];
}

export interface MarketOption {
  id: number;
  betting_market_id: number;
  name: string;
  key: string;
  odds: string | number;
  is_winning_option?: boolean;
  is_winning?: boolean;
  can_accept_bets?: boolean;
  is_active?: boolean;
  implied_probability?: number;
  bet_count?: number;
  bets_count?: number;
  total_stake?: string | number;
  created_at?: string;
  updated_at?: string;

  // Relationships
  betting_market?: BettingMarket;
  bets?: Bet[];
}

export interface Bet {
  id: number;
  user_id: number;
  market_option_id: number;
  stake_amount: number;
  potential_payout: number;
  status: BetStatus;
  payment_method: PaymentMethod;
  payment_status?: 'pending' | 'confirmed' | 'failed';
  payment_confirmed_at?: string;
  settled_at?: string;
  payout_amount?: number;
  has_receipt?: boolean;
  receipt?: {
    url: string;
    preview_url?: string;
    thumb_url?: string;
    file_name: string;
    size: number;
    mime_type: string;
    uploaded_at: string;
  };
  created_at: string;
  updated_at: string;

  // Relationships
  user?: User;
  market_option?: MarketOption;
}

export interface BetOutcome {
  id: number;
  bet_id: number;
  result: 'win' | 'loss' | 'void';
  payout_amount?: number;
  processed_at: string;
  created_at: string;
  updated_at: string;

  // Relationships
  bet?: Bet;
}

// Enums and Constants
export type MarketType = '1x2' | 'player_scoring' | 'correct_score' | 'total_goals' | 'both_teams_score' | 'first_half_result' | 'double_chance';

export type MarketStatus = 'active' | 'suspended' | 'settled' | 'cancelled';

export type BetStatus = 'pending' | 'active' | 'won' | 'lost' | 'cancelled' | 'refunded';

export type PaymentMethod = 'online' | 'offline' | 'wallet';

// API Request Types
export interface PlaceBetRequest {
  market_option_id: number;
  stake_amount: number; // Keep for backwards compatibility
  payment_method: PaymentMethod;
  payment_reference?: string;
  receipt?: File; // Payment receipt for offline payments
}

export interface CreateMarketRequest {
  game_match_id: number;
  name: string;
  description?: string;
  market_type: MarketType;
  options: CreateMarketOptionRequest[];
}

export interface CreateMarketOptionRequest {
  name: string;
  key: string;
  odds: number;
}

export interface SettleMarketRequest {
  settlement_result?: 'settled' | 'cancelled' | 'refunded';
  winning_option_ids?: number[];
  settlement_notes?: string;
}

export interface BettingFilters {
  status?: BetStatus[];
  payment_method?: PaymentMethod[];
  date_from?: string;
  date_to?: string;
  market_type?: MarketType[];
  game_match_id?: number;
  turf_id?: number;
}

export interface BettingStatsFilters {
  period?: 'week' | 'month' | 'year' | 'all';
  market_type?: MarketType;
}

// API Response Types
export interface BettingMarketResponse {
  data: BettingMarket[];
  links: {
    first?: string;
    last?: string;
    prev?: string;
    next?: string;
  };
  meta: {
    current_page: number;
    from: number;
    last_page: number;
    path: string;
    per_page: number;
    to: number;
    total: number;
  };
}

export interface BetResponse extends Bet {
  payment_url?: string;
  payment_reference?: string;
  requires_payment?: boolean;
  new_wallet_balance?: number;
  transaction_id?: string;
}

export interface BettingHistoryResponse {
  data: Bet[];
  meta?: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
  };
}

export interface BettingStatsResponse {
  total_bets: number;
  total_staked: number;
  total_winnings: number;
  win_rate: number;
  roi: number;
  profit_loss: number;
  average_odds: number;
  recent_form: Array<'W' | 'L'>;
  favorite_market_type?: MarketType; // Add this property
  by_market_type: Record<
    string,
    {
      bets: number;
      stake: number;
      winnings: number;
      win_rate: number;
    }
  >;
}

// API Response Types
export interface BetActionResponse {
  status: boolean;
  message: string;
  data?: {
    bet: Bet;
    new_wallet_balance?: number;
    transaction_id?: string;
    refund_amount?: number;
    payment_data?: Record<string, unknown>;
  };
}

// UI Component Props Types
export interface BetCardProps {
  bet: Bet;
  onConfirmPayment?: (betId: number) => void;
  showActions?: boolean;
}

export interface MarketCardProps {
  market: BettingMarket;
  onSelectOption?: (option: MarketOption) => void;
  selectedOptions?: number[];
  disabled?: boolean;
}

export interface BetSlipProps {
  selectedOptions?: MarketOption[];
  stakes?: Record<number, number>;
  onUpdateStake?: (optionId: number, stake: number) => void;
  onRemoveOption?: (optionId: number) => void;
  onPlaceBets?: (bets: PlaceBetRequest[]) => Promise<void>;
  paymentMethod?: PaymentMethod;
  onPaymentMethodChange?: (method: PaymentMethod) => void;
  isLoading?: boolean;
}

export interface OddsDisplayProps {
  odds: string | number;
  format?: 'decimal' | 'fractional' | 'american';
  size?: 'small' | 'medium' | 'large';
  highlight?: boolean;
}

// Store State Types
export interface BettingStoreState {
  // Markets
  markets: BettingMarket[];
  currentMarket: BettingMarket | null;
  marketsLoading: boolean;

  // Bets
  userBets: Bet[];
  bettingHistory: Bet[];
  historyLoading: boolean;

  // Bet Slip
  selectedOptions: MarketOption[];
  stakes: Record<number, number>;
  paymentMethod: PaymentMethod;

  // Stats
  bettingStats: BettingStatsResponse | null;
  statsLoading: boolean;

  // UI State
  betSlipOpen: boolean;
  filters: BettingFilters;
}

export interface BettingStoreActions {
  // Market actions
  fetchMarkets: (gameMatchId?: number) => Promise<void>;
  fetchMarket: (marketId: number) => Promise<void>;

  // Betting actions
  placeBet: (request: PlaceBetRequest) => Promise<void>;
  cancelBet: (betId: number) => Promise<void>;
  confirmPayment: (betId: number) => Promise<void>;

  // History actions
  fetchBettingHistory: (filters?: BettingFilters) => Promise<void>;
  fetchBettingStats: (filters?: BettingStatsFilters) => Promise<void>;

  // Bet slip actions
  addToBetSlip: (option: MarketOption) => void;
  removeFromBetSlip: (optionId: number) => void;
  updateStake: (optionId: number, stake: number) => void;
  clearBetSlip: () => void;
  setPaymentMethod: (method: PaymentMethod) => void;

  // UI actions
  toggleBetSlip: () => void;
  updateFilters: (filters: Partial<BettingFilters>) => void;
}

// Utility Types
export interface MarketTypeConfig {
  label: string;
  description: string;
  defaultOptions: string[];
  icon?: string;
}

export const MARKET_TYPE_CONFIGS: Record<MarketType, MarketTypeConfig> = {
  '1x2': {
    label: 'Match Result',
    description: 'Predict the winner of the match',
    defaultOptions: ['Home Win', 'Draw', 'Away Win'],
    icon: '🏆',
  },
  player_scoring: {
    label: 'Player to Score',
    description: 'Predict if a specific player will score',
    defaultOptions: [], // Dynamic options will be generated based on players in both teams
    icon: '⚽',
  },
  correct_score: {
    label: 'Correct Score',
    description: 'Predict the exact final score',
    defaultOptions: ['1-0', '2-0', '2-1', '1-1', '0-0'],
    icon: '🎯',
  },
  total_goals: {
    label: 'Total Goals',
    description: 'Predict the total number of goals',
    defaultOptions: ['Over 2.5', 'Under 2.5'],
    icon: '📊',
  },
  both_teams_score: {
    label: 'Both Teams to Score',
    description: 'Predict if both teams will score',
    defaultOptions: ['Yes', 'No'],
    icon: '⚽⚽',
  },
  first_half_result: {
    label: 'First Half Result',
    description: 'Predict the first half winner',
    defaultOptions: ['Home Win', 'Draw', 'Away Win'],
    icon: '🕐',
  },
  double_chance: {
    label: 'Double Chance',
    description: 'Predict two possible outcomes',
    defaultOptions: ['Team 1 or Draw', 'Team 2 or Draw', 'Team 1 or Team 2'],
    icon: '🎲',
  },
};
