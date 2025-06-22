import api, { type ApiResponse } from './index';

// Player-related types
export interface Player {
  id: number;
  user_id: number;
  username: string;
  full_name: string;
  email: string;
  phone_number?: string;
  preferred_position?: 'goalkeeper' | 'defender' | 'midfielder' | 'forward' | 'any';
  skill_level: 'beginner' | 'intermediate' | 'advanced' | 'professional';
  avatar?: string;
  bio?: string;
  date_of_birth?: string;
  height?: number;
  weight?: number;
  is_active: boolean;
  is_verified: boolean;
  total_matches: number;
  total_wins: number;
  total_losses: number;
  total_draws: number;
  rating: number;
  created_at: string;
  updated_at: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
}

// Player API functions
export const playerApi = {
  // Get a single player by ID
  getById: async (id: number): Promise<ApiResponse<Player>> => {
    return api.get<Player>(`/players/${id}`);
  },
};

export default playerApi;
