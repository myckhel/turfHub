import type { GameMatch } from '../types/gameMatch.types';
import type {
  AddPlayerToTeamRequest,
  CreateMatchSessionRequest,
  MatchSession,
  MatchSessionFilters,
  MatchSessionListResponse,
  QueueStatus,
  SetGameResultRequest,
  UpdateMatchSessionRequest,
} from '../types/matchSession.types';
import api from './index';

/**
 * Match Session API module
 * Handles all match session related API calls
 */
export const matchSessionApi = {
  // Get all match sessions with filtering and pagination
  getAll: async (params?: MatchSessionFilters): Promise<MatchSessionListResponse> => {
    return api.get('/match-sessions', { params });
  },

  // Get a specific match session
  getById: async (
    id: number,
    params?: {
      include?: string;
    },
  ): Promise<MatchSession> => {
    return api.get(`/match-sessions/${id}`, { params });
  },

  // Create a new match session
  create: async (data: CreateMatchSessionRequest): Promise<MatchSession> => {
    return api.post('/match-sessions', data);
  },

  // Update a match session
  update: async (id: number, data: UpdateMatchSessionRequest): Promise<MatchSession> => {
    return api.put(`/match-sessions/${id}`, data);
  },

  // Delete a match session
  delete: async (id: number): Promise<void> => {
    return api.delete(`/match-sessions/${id}`);
  },

  // Start a match session
  start: async (id: number): Promise<MatchSession> => {
    return api.post(`/match-sessions/${id}/start`);
  },

  // Stop a match session
  stop: async (id: number): Promise<MatchSession> => {
    return api.post(`/match-sessions/${id}/stop`);
  },

  // Add player to team
  addPlayerToTeam: async (matchSessionId: number, data: AddPlayerToTeamRequest): Promise<void> => {
    return api.post(`/match-sessions/${matchSessionId}/add-player-to-team`, data);
  },

  // Set game result
  setGameResult: async (matchSessionId: number, data: SetGameResultRequest): Promise<MatchSession> => {
    return api.post(`/match-sessions/${matchSessionId}/set-game-result`, data);
  },

  // Get queue status
  getQueueStatus: async (id: number): Promise<QueueStatus> => {
    return api.get(`/match-sessions/${id}/queue-status`);
  },

  // Get match sessions for a specific turf
  getByTurf: async (turfId: number, params?: Omit<MatchSessionFilters, 'turf_id'>): Promise<MatchSessionListResponse> => {
    return matchSessionApi.getAll({ ...params, turf_id: turfId });
  },

  // Get active match sessions for a specific turf
  getActiveTurfSessions: async (turfId: number): Promise<MatchSessionListResponse> => {
    return matchSessionApi.getAll({ turf_id: turfId, status: 'active' });
  },

  // Get scheduled match sessions for a specific turf
  getScheduledTurfSessions: async (turfId: number): Promise<MatchSessionListResponse> => {
    return matchSessionApi.getAll({
      turf_id: turfId,
      status: 'scheduled',
      include: 'teams',
    });
  },

  // Get current ongoing game match for a match session
  getCurrentOngoingMatch: (matchSessionId: number): Promise<GameMatch[]> => {
    return api.get(`/match-sessions/${matchSessionId}/game-matches`, {
      params: {
        status: ['in_progress', 'upcoming'],
        per_page: 1,
        include:
          'firstTeam.teamPlayers.player.user,secondTeam.teamPlayers.player.user,winningTeam,matchEvents.player.user,matchEvents.team,matchEvents.relatedPlayer.user',
      },
    });
  },
};

export default matchSessionApi;
