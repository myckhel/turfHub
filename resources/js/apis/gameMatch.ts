import type {
  CreateMatchEventRequest,
  GameMatch,
  GameMatchFilters,
  GameMatchListResponse,
  MatchEvent,
  MatchEventFilters,
  MatchEventListResponse,
  UpdateGameMatchRequest,
  UpdateMatchEventRequest,
} from '../types/gameMatch.types';
import api, { type ApiResponse } from './index';

/**
 * Game Match API module
 * Handles all game match and match event related API calls
 */
export const gameMatchApi = {
  // Get all game matches with filtering and pagination
  getAll: async (params?: GameMatchFilters): Promise<GameMatchListResponse> => {
    return api.get('/game-matches', { params });
  },

  // Get a specific game match
  getById: async (
    id: number,
    params?: {
      include?: string;
    },
  ): Promise<ApiResponse<GameMatch>> => {
    return api.get(`/game-matches/${id}`, { params });
  },

  // Update a game match
  update: async (id: number, data: UpdateGameMatchRequest): Promise<ApiResponse<GameMatch>> => {
    return api.put(`/game-matches/${id}`, data);
  },

  // Delete a game match
  delete: async (id: number): Promise<ApiResponse<void>> => {
    return api.delete(`/game-matches/${id}`);
  },
};

/**
 * Match Event API module
 * Handles all match event related API calls
 */
export const matchEventApi = {
  // Get all match events with filtering and pagination
  getAll: async (params?: MatchEventFilters): Promise<MatchEventListResponse> => {
    return api.get('/match-events', { params });
  },

  // Get a specific match event
  getById: async (
    id: number,
    params?: {
      include?: string;
    },
  ): Promise<ApiResponse<MatchEvent>> => {
    return api.get(`/match-events/${id}`, { params });
  },

  // Create a new match event
  create: async (data: CreateMatchEventRequest): Promise<ApiResponse<MatchEvent>> => {
    return api.post('/match-events', data);
  },

  // Update a match event
  update: async (id: number, data: UpdateMatchEventRequest): Promise<ApiResponse<MatchEvent>> => {
    return api.put(`/match-events/${id}`, data);
  },

  // Delete a match event
  delete: async (id: number): Promise<ApiResponse<void>> => {
    return api.delete(`/match-events/${id}`);
  },

  // Get match events for a specific game match
  getByGameMatch: async (gameMatchId: number, params?: Omit<MatchEventFilters, 'game_match_id'>): Promise<MatchEventListResponse> => {
    return matchEventApi.getAll({ ...params, game_match_id: gameMatchId });
  },
};

export default { gameMatchApi, matchEventApi };
