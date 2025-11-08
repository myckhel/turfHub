import { TeamPlayer } from './matchSession.types';

export interface GameMatch {
  id: number;
  match_session_id: number;
  first_team_id: number;
  second_team_id: number;
  first_team_score: number;
  second_team_score: number;
  winning_team_id?: number;
  outcome?: 'win' | 'loss' | 'draw';
  match_time: string;
  status: 'upcoming' | 'in_progress' | 'completed' | 'postponed';
  betting_enabled?: boolean;
  created_at: string;
  updated_at: string;

  // Relationships
  match_session?: {
    id: number;
    name: string;
    status: string;
    turf?: {
      id: number;
      name: string;
      location?: string;
    };
  };
  first_team?: {
    id: number;
    name: string;
    color?: string;
    teamPlayers: TeamPlayer[];
  };
  second_team?: {
    id: number;
    name: string;
    color?: string;
    teamPlayers: TeamPlayer[];
  };
  winning_team?: {
    id: number;
    name: string;
  };
  match_events?: MatchEvent[];
}

export interface MatchEvent {
  id: number;
  game_match_id: number;
  player_id: number;
  team_id: number;
  type: 'goal' | 'yellow_card' | 'red_card' | 'substitution_in' | 'substitution_out';
  minute: number;
  comment?: string;
  related_player_id?: number;
  created_at: string;
  updated_at: string;

  // Relationships
  player?: {
    id: number;
    user_id: number;
    user: {
      id: number;
      name: string;
    };
  };
  team?: {
    id: number;
    name: string;
    color?: string;
  };
  related_player?: {
    id: number;
    user_id: number;
    user: {
      id: number;
      name: string;
    };
  };
}

// API Request types
export interface UpdateGameMatchRequest {
  match_session_id?: number;
  first_team_id?: number;
  second_team_id?: number;
  first_team_score?: number;
  second_team_score?: number;
  winning_team_id?: number;
  outcome?: 'win' | 'loss' | 'draw';
  match_time?: string;
  status?: 'upcoming' | 'in_progress' | 'completed' | 'postponed';
}

export interface CreateMatchEventRequest {
  game_match_id: number;
  player_id: number;
  team_id: number;
  type: 'goal' | 'yellow_card' | 'red_card' | 'substitution_in' | 'substitution_out';
  minute: number;
  comment?: string;
  related_player_id?: number;
}

export interface UpdateMatchEventRequest {
  player_id?: number;
  team_id?: number;
  type?: 'goal' | 'yellow_card' | 'red_card' | 'substitution_in' | 'substitution_out';
  minute?: number;
  comment?: string;
  related_player_id?: number;
}

export interface GameMatchFilters {
  match_session_id?: number;
  team_id?: number;
  status?: 'upcoming' | 'in_progress' | 'completed' | 'postponed';
  outcome?: 'win' | 'loss' | 'draw';
  date_from?: string;
  date_to?: string;
  include?: string;
  per_page?: number;
  page?: number;
}

export interface MatchEventFilters {
  game_match_id?: number;
  player_id?: number;
  team_id?: number;
  type?: 'goal' | 'yellow_card' | 'red_card' | 'substitution_in' | 'substitution_out';
  minute_from?: number;
  minute_to?: number;
  include?: string;
  per_page?: number;
  page?: number;
}

// Response types
export interface GameMatchListResponse {
  data: GameMatch[];
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

export interface MatchEventListResponse {
  data: MatchEvent[];
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
