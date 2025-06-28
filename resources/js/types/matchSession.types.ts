export interface MatchSession {
  id: number;
  turf_id: number;
  name: string;
  session_date: string;
  time_slot: 'morning' | 'evening';
  start_time: string;
  end_time: string;
  max_teams: number;
  max_players_per_team: number;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  turf?: {
    id: number;
    name: string;
    location: string;
    owner_id: number;
  };
  teams?: Team[];
  game_matches?: GameMatch[];
  queue_logic?: QueueLogic[];
}

export interface Team {
  id: number;
  match_session_id: number;
  name: string;
  captain_id?: number;
  color?: string;
  wins: number;
  losses: number;
  draws: number;
  goals_for: number;
  goals_against: number;
  created_at: string;
  updated_at: string;
  captain?: {
    id: number;
    name: string;
    email: string;
  };
  teamPlayers?: TeamPlayer[];
}

export interface TeamPlayer {
  id: number;
  team_id: number;
  player_id: number;
  created_at: string;
  updated_at: string;
  player: {
    id: number;
    user_id: number;
    turf_id: number;
    is_member: boolean;
    status: string;
    user: {
      id: number;
      name: string;
      email: string;
    };
  };
}

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
  created_at: string;
  updated_at: string;
  first_team?: Team;
  second_team?: Team;
  winning_team?: Team;
  match_events?: Array<{
    id: number;
    game_match_id: number;
    type: 'goal' | 'yellow_card' | 'red_card' | 'substitution_in' | 'substitution_out';
    minute: number;
    player_id: number;
    team_id: number;
    comment?: string;
    created_at: string;
    updated_at: string;
  }>;
}

export interface QueueLogic {
  id: number;
  match_session_id: number;
  team_id: number;
  queue_position: number;
  status: 'waiting' | 'next_to_play' | 'playing' | 'completed';
  reason?: string;
  created_at: string;
  updated_at: string;
  team?: Team;
}

// API Request types
export interface CreateMatchSessionRequest {
  turf_id: number;
  name: string;
  session_date: string;
  time_slot: 'morning' | 'evening';
  start_time: string;
  end_time: string;
  max_teams: number;
  status?: 'scheduled' | 'active' | 'completed' | 'cancelled';
  is_active?: boolean;
}

export interface UpdateMatchSessionRequest {
  turf_id?: number;
  name?: string;
  session_date?: string;
  time_slot?: 'morning' | 'evening';
  start_time?: string;
  end_time?: string;
  max_teams?: number;
  status?: 'scheduled' | 'active' | 'completed' | 'cancelled';
  is_active?: boolean;
}

export interface AddPlayerToTeamRequest {
  team_id: number;
  player_id: number;
}

export interface SetGameResultRequest {
  game_match_id: number;
  first_team_score: number;
  second_team_score: number;
}

export interface MatchSessionFilters {
  turf_id?: number;
  status?: 'scheduled' | 'active' | 'completed' | 'cancelled';
  is_active?: boolean;
  time_slot?: 'morning' | 'evening';
  date_from?: string;
  date_to?: string;
  search?: string;
  include?: string;
  per_page?: number;
  page?: number;
}

export type QueueStatus = QueueLogic[];

// Response types
export interface MatchSessionListResponse {
  data: MatchSession[];
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
