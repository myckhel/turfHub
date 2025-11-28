export interface TeamPlayer {
  id: number;
  player_id: number;
  turf_id: number;
  is_member: boolean;
  status: 'active' | 'inactive' | 'banned';
  created_at: string;
  updated_at: string;
  player: {
    id: number;
    user: {
      id: number;
      name: string;
      email: string;
      avatar?: string;
    };
  };
}

export interface TeamSlot {
  id: number;
  team_id: number;
  player_id?: number;
  position: number;
  is_captain: boolean;
  payment_status: 'pending' | 'paid' | 'failed';
  payment_id?: string;
  fee_amount?: number;
  joined_at?: string;
  created_at: string;
  updated_at: string;
  player?: TeamPlayer;
}

export interface TeamDetails {
  id: number;
  match_session_id?: number; // Optional - null for standalone teams
  turf_id?: number; // For standalone teams not tied to sessions
  name: string;
  captain_id?: number;
  color?: string;
  wins: number;
  losses: number;
  draws: number;
  goals_for: number;
  goals_against: number;
  status: 'waiting' | 'next_to_play' | 'playing' | 'completed';
  created_at: string;
  updated_at: string;
  captain?: {
    id: number;
    name: string;
    email: string;
    avatar?: string;
  };
  slots?: TeamSlot[];
  teamPlayers?: TeamPlayer[];
  match_session?: {
    id: number;
    name: string;
    turf_id: number;
    team_slot_fee?: number;
  };
}

// API Request types
export interface CreateTeamRequest {
  match_session_id?: number;
  turf_id?: number;
  tournament_id?: number;
  name: string;
  color?: string;
  captain_id?: number;
  status?: string;
}

export interface JoinTeamSlotRequest {
  team_id: number;
  position?: number; // Optional, will auto-assign if not provided
}

export interface AddPlayerToTeamSlotRequest {
  team_id: number;
  player_id: number;
  position?: number;
  is_captain?: boolean;
}

export interface ProcessTeamSlotPaymentRequest {
  team_id: number;
  position: number;
  payment_method: 'paystack' | 'wallet';
  redirect_url?: string;
}

export interface UpdateTeamSlotRequest {
  is_captain?: boolean;
  position?: number;
}

// Response types
export interface TeamSlotPaymentResponse {
  payment_id: string;
  amount: number;
  status: 'pending' | 'success' | 'failed';
  payment_url?: string; // For Paystack redirect
  reference?: string;
  access_code: string;
  message: string;
  payment_method: string;
  success: boolean;
}

export interface PaymentVerificationResponse {
  success: boolean;
  message: string;
  payment_status: 'verified' | 'failed' | 'pending';
  team_slot?: {
    id: number;
    position: number;
    payment_status: string;
  };
}

export interface AvailableTeamSlotsResponse {
  teams: TeamDetails[];
  total_slots: number;
  available_slots: number;
  slot_fee: number;
  max_players_per_team: number;
}
