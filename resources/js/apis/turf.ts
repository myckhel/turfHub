import api, { type ApiResponse } from './index';

// Turf-related types
export interface Turf {
  id: number;
  name: string;
  description?: string;
  location?: string;
  owner_id: number;
  requires_membership: boolean;
  membership_fee?: number;
  membership_type?: string;
  max_players_per_team: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  owner?: {
    id: number;
    name: string;
    email: string;
  };
  players?: Array<{
    id: number;
    user: {
      id: number;
      name: string;
      email: string;
    };
    is_member: boolean;
    status: string;
  }>;
  active_match_sessions?: Array<{
    id: number;
    name: string;
    session_date: string;
    time_slot: string;
    status: string;
  }>;
  user_permissions?: {
    can_manage_turf: boolean;
    can_invite_players: boolean;
    can_remove_players: boolean;
    can_manage_sessions: boolean;
    can_create_teams: boolean;
    can_manage_teams: boolean;
    can_view_analytics: boolean;
    can_manage_payments: boolean;
    is_owner: boolean;
    role_in_turf: string | null;
  };
}

export interface TurfListResponse {
  data: Turf[];
  links: {
    next?: string;
    prev?: string;
  };
  meta: {
    current_page: number;
    total: number;
    per_page: number;
  };
}

export interface JoinTurfRequest {
  is_member?: boolean;
}

// Turf API functions
export const turfApi = {
  // Get paginated list of turfs with optional search and filters
  getAll: async (params?: {
    search?: string;
    per_page?: number;
    page?: number;
    is_active?: boolean;
    requires_membership?: boolean;
    owner_id?: number;
    include?: string;
  }): Promise<TurfListResponse> => {
    return api.get('/turfs', { params });
  },

  // Get a single turf by ID with optional includes
  getById: async (id: number, includes?: string[]): Promise<ApiResponse<Turf>> => {
    const searchParams = new URLSearchParams();
    if (includes && includes.length > 0) {
      searchParams.append('include', includes.join(','));
    }

    const queryString = searchParams.toString();
    const url = queryString ? `/turfs/${id}?${queryString}` : `/turfs/${id}`;

    return api.get<Turf>(url);
  },

  // Get user's belonging turfs
  getBelongingTurfs: async (
    userId: number,
    params?: {
      is_active?: boolean;
      player_status?: string;
      include?: string[];
    },
  ): Promise<ApiResponse<Turf[]>> => {
    return api.get<Turf[]>(`/users/${userId}/belonging-turfs`, { params });
  },

  // Join a turf
  join: async (
    turfId: number,
    data: JoinTurfRequest,
  ): Promise<ApiResponse<{ id: number; user_id: number; turf_id: number; is_member: boolean; status: string }>> => {
    return api.post(`/turfs/${turfId}/join`, data);
  },

  // Leave a turf
  leave: async (turfId: number): Promise<ApiResponse<void>> => {
    return api.delete(`/turfs/${turfId}/leave`);
  },

  // Create a new turf
  create: async (data: Partial<Turf>): Promise<ApiResponse<Turf>> => {
    return api.post('/turfs', data);
  },

  // Update a turf
  update: async (id: number, data: Partial<Turf>): Promise<ApiResponse<Turf>> => {
    return api.put(`/turfs/${id}`, data);
  },

  // Delete a turf
  delete: async (id: number): Promise<ApiResponse<void>> => {
    return api.delete(`/turfs/${id}`);
  },
};

export default turfApi;
