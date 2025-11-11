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
  team_slot_fee?: number;
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
  ): Promise<Turf[]> => {
    return api.get(`/users/${userId}/belonging-turfs`, { params });
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
  create: async (data: Partial<Turf>): Promise<Turf> => {
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

  // Get join cost breakdown
  getJoinCost: async (
    turfId: number,
  ): Promise<
    ApiResponse<{
      membership_fee: number;
      team_slot_fee: number;
      total: number;
      requires_payment: boolean;
      breakdown_details: Array<{
        type: string;
        description: string;
        amount: number;
      }>;
    }>
  > => {
    return api.get(`/turfs/${turfId}/join-cost`);
  },

  // Get team slot fee information
  getTeamSlotFeeInfo: async (
    turfId: number,
  ): Promise<
    ApiResponse<{
      has_team_slot_fee: boolean;
      team_slot_fee: number | null;
      formatted_fee: string | null;
    }>
  > => {
    return api.get(`/turfs/${turfId}/team-slot-fee-info`);
  },

  // Process team slot payment
  processTeamSlotPayment: async (
    turfId: number,
  ): Promise<
    ApiResponse<{
      success: boolean;
      message: string;
      amount_charged: number;
      transaction_id?: string;
    }>
  > => {
    return api.post(`/turfs/${turfId}/process-team-slot-payment`);
  },

  // Get turf settings
  getSettings: async (
    turfId: number,
  ): Promise<{
    settings: {
      payment_methods: {
        cash_enabled: boolean;
        wallet_enabled: boolean;
        online_enabled: boolean;
      };
    };
    payment_methods: {
      enabled: string[];
      cash_enabled: boolean;
      wallet_enabled: boolean;
      online_enabled: boolean;
    };
  }> => {
    return api.get(route('api.turfs.settings', { turf: turfId }));
  },

  // Update turf settings
  updateSettings: async (
    turfId: number,
    settings: {
      payment_methods?: {
        cash_enabled?: boolean;
        wallet_enabled?: boolean;
        online_enabled?: boolean;
      };
    },
  ): Promise<{
    message: string;
    settings: {
      payment_methods: {
        cash_enabled: boolean;
        wallet_enabled: boolean;
        online_enabled: boolean;
      };
    };
    payment_methods: {
      enabled: string[];
      cash_enabled: boolean;
      wallet_enabled: boolean;
      online_enabled: boolean;
    };
  }> => {
    return api.patch(route('api.turfs.settings.update', { turf: turfId }), { settings });
  },
};

export default turfApi;
