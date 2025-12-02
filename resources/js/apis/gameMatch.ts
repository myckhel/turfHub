import type {
  CreateGameMatchRequest,
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
import api from './index';

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
  ): Promise<GameMatch> => {
    return api.get(`/game-matches/${id}`, { params });
  },

  // Create a new game match
  create: async (data: CreateGameMatchRequest): Promise<GameMatch> => {
    return api.post('/game-matches', data);
  },

  // Update a game match
  update: async (id: number, data: UpdateGameMatchRequest): Promise<GameMatch> => {
    return api.put(`/game-matches/${id}`, data);
  },

  // Delete a game match
  delete: async (id: number): Promise<void> => {
    return api.delete(`/game-matches/${id}`);
  },

  // Get game matches for a specific match session
  getByMatchSession: async (matchSessionId: number, params?: Omit<GameMatchFilters, 'match_session_id'>): Promise<GameMatchListResponse> => {
    return gameMatchApi.getAll({ ...params, match_session_id: matchSessionId });
  },

  // Get game matches for a specific turf (standalone matches)
  getByTurf: async (turfId: number, params?: Omit<GameMatchFilters, 'turf_id'>): Promise<GameMatchListResponse> => {
    return gameMatchApi.getAll({ ...params, turf_id: turfId });
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
  ): Promise<MatchEvent> => {
    return api.get(`/match-events/${id}`, { params });
  },

  // Create a new match event
  create: async (data: CreateMatchEventRequest): Promise<MatchEvent> => {
    return api.post('/match-events', data);
  },

  // Update a match event
  update: async (id: number, data: UpdateMatchEventRequest): Promise<MatchEvent> => {
    return api.put(`/match-events/${id}`, data);
  },

  // Delete a match event
  delete: async (id: number): Promise<void> => {
    return api.delete(`/match-events/${id}`);
  },

  // Get match events for a specific game match
  getByGameMatch: async (gameMatchId: number, params?: Omit<MatchEventFilters, 'game_match_id'>): Promise<MatchEventListResponse> => {
    return matchEventApi.getAll({ ...params, game_match_id: gameMatchId });
  },

  // Enable betting for a game match (moved to bettingMarketApi for better organization)
  enableBetting: async (gameMatchId: number): Promise<{ message: string }> => {
    return api.post(route('api.betting.game-matches.enable-betting', { gameMatch: gameMatchId }));
  },

  // Disable betting for a game match (moved to bettingMarketApi for better organization)
  disableBetting: async (gameMatchId: number): Promise<{ message: string }> => {
    return api.post(route('api.betting.game-matches.disable-betting', { gameMatch: gameMatchId }));
  },
};

export default { gameMatchApi, matchEventApi };
