import type { Player, PlayerFilters, PlayerResponse, UpdatePlayerRoleRequest } from '../types/player.types';
import api from './index';

/**
 * API module for player operations
 * Handles player management, role updates, and player queries
 */
export const playerApi = {
  /**
   * Get players for a specific turf with optional filters
   */
  getByTurf: async (turfId: number, params?: PlayerFilters): Promise<PlayerResponse> => {
    return api.get(route('api.turfs.players.index', { turf: turfId }), { params });
  },

  /**
   * Get a single player by ID
   */
  getById: async (playerId: number): Promise<{ data: Player }> => {
    return api.get(route('api.players.show', { player: playerId }));
  },

  /**
   * Update a player's role
   */
  updateRole: async (playerId: number, payload: UpdatePlayerRoleRequest): Promise<Player> => {
    return api.put(route('api.players.update-role', { player: playerId }), payload);
  },
};

export default playerApi;
