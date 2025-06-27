import type {
  AddPlayerToTeamSlotRequest,
  AvailableTeamSlotsResponse,
  JoinTeamSlotRequest,
  Player,
  ProcessTeamSlotPaymentRequest,
  TeamDetails,
  TeamSlotPaymentResponse,
  UpdateTeamSlotRequest,
} from '../types/team.types';
import api, { type ApiResponse } from './index';

/**
 * Team API module
 * Handles all team-related API calls including slot management and payments
 */
export const teamApi = {
  // Get team details with slots and players
  getById: async (
    id: number,
    params?: {
      include?: string;
    },
  ): Promise<ApiResponse<TeamDetails>> => {
    return api.get(`/teams/${id}`, { params });
  },

  // Get teams for a match session
  getByMatchSession: async (matchSessionId: number): Promise<ApiResponse<TeamDetails[]>> => {
    return api.get(`/match-sessions/${matchSessionId}/teams`, {
      params: { include: 'slots,players,captain,match_session' },
    });
  },

  // Get available team slots for a match session
  getAvailableSlots: async (matchSessionId: number): Promise<ApiResponse<AvailableTeamSlotsResponse>> => {
    return api.get(`/match-sessions/${matchSessionId}/available-slots`);
  },

  // Join a team slot (for players)
  joinSlot: async (data: JoinTeamSlotRequest): Promise<ApiResponse<void>> => {
    return api.post(`/teams/${data.team_id}/join-slot`, data);
  },

  // Leave a team slot (for players)
  leaveSlot: async (teamId: number): Promise<ApiResponse<void>> => {
    return api.delete(`/teams/${teamId}/leave-slot`);
  },

  // Add player to team slot (for admins/managers)
  addPlayerToSlot: async (data: AddPlayerToTeamSlotRequest): Promise<ApiResponse<void>> => {
    return api.post(`/teams/${data.team_id}/add-player`, data);
  },

  // Remove player from team slot (for admins/managers)
  removePlayerFromSlot: async (teamId: number, playerId: number): Promise<ApiResponse<void>> => {
    return api.delete(`/teams/${teamId}/remove-player/${playerId}`);
  },

  // Update team slot (captain status, position)
  updateSlot: async (teamId: number, playerId: number, data: UpdateTeamSlotRequest): Promise<ApiResponse<void>> => {
    return api.put(`/teams/${teamId}/update-slot/${playerId}`, data);
  },

  // Process payment for team slot
  processSlotPayment: async (data: ProcessTeamSlotPaymentRequest): Promise<ApiResponse<TeamSlotPaymentResponse>> => {
    return api.post(`/teams/${data.team_id}/process-payment`, data);
  },

  // Get payment status for a slot
  getPaymentStatus: async (teamId: number, playerId: number): Promise<ApiResponse<{ status: string; payment_id?: string }>> => {
    return api.get(`/teams/${teamId}/payment-status/${playerId}`);
  },

  // Get available players for a turf (for admin/manager selection)
  getAvailablePlayers: async (turfId: number): Promise<ApiResponse<Player[]>> => {
    return api.get(`/turfs/${turfId}/available-players`);
  },

  // Set team captain
  setCaptain: async (teamId: number, playerId: number): Promise<ApiResponse<void>> => {
    return api.post(`/teams/${teamId}/set-captain`, { player_id: playerId });
  },

  // Get team statistics
  getStats: async (
    teamId: number,
  ): Promise<
    ApiResponse<{
      total_matches: number;
      wins: number;
      losses: number;
      draws: number;
      goals_for: number;
      goals_against: number;
      win_rate: number;
    }>
  > => {
    return api.get(`/teams/${teamId}/stats`);
  },
};

export default teamApi;
