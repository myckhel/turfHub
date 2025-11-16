import type {
  AssignTeamsRequest,
  CreateStagePromotionRequest,
  CreateStageRequest,
  CreateTournamentRequest,
  ExecutePromotionRequest,
  Fixture,
  FixtureFilters,
  FixtureListResponse,
  FixtureSimulationResponse,
  GenerateFixturesRequest,
  GroupListResponse,
  PromotionSimulationResponse,
  RankingListResponse,
  StageListResponse,
  StagePromotion,
  StageResponse,
  TournamentFilters,
  TournamentListResponse,
  TournamentResponse,
  UpdateStagePromotionRequest,
  UpdateStageRequest,
  UpdateTournamentRequest,
} from '../types/tournament.types';
import api, { type ApiResponse } from './index';

/**
 * Tournament API module
 * Handles all tournament-related API calls
 */
export const tournamentApi = {
  /**
   * Get all tournaments with filtering and pagination
   */
  getAll: async (params?: TournamentFilters): Promise<TournamentListResponse> => {
    return api.get(route('api.tournaments.index'), { params });
  },

  /**
   * Get a specific tournament by ID
   */
  getById: async (id: number, include?: string): Promise<TournamentResponse> => {
    return api.get(route('api.tournaments.show', { tournament: id }), {
      params: include ? { include } : undefined,
    });
  },

  /**
   * Create a new tournament
   */
  create: async (data: CreateTournamentRequest): Promise<TournamentResponse> => {
    return api.post(route('api.tournaments.store'), data);
  },

  /**
   * Update a tournament
   */
  update: async (id: number, data: UpdateTournamentRequest): Promise<TournamentResponse> => {
    return api.patch(route('api.tournaments.update', { tournament: id }), data);
  },

  /**
   * Delete a tournament
   */
  delete: async (id: number): Promise<ApiResponse<void>> => {
    return api.delete(route('api.tournaments.destroy', { tournament: id }));
  },

  /**
   * Export tournament data
   */
  export: async (id: number): Promise<Blob> => {
    return api.get(route('api.tournaments.export', { tournament: id }), {
      responseType: 'blob',
    });
  },

  /**
   * Get all stages for a tournament
   */
  getStages: async (tournamentId: number): Promise<StageListResponse> => {
    return api.get(route('api.tournaments.stages.index', { tournament: tournamentId }));
  },

  /**
   * Create a new stage for a tournament
   */
  createStage: async (tournamentId: number, data: CreateStageRequest): Promise<StageResponse> => {
    return api.post(route('api.tournaments.stages.store', { tournament: tournamentId }), data);
  },

  /**
   * Get teams for a tournament
   */
  getTeams: async (tournamentId: number, params?: { include?: string; search?: string; per_page?: number }): Promise<ApiResponse> => {
    return api.get(route('api.teams.index'), {
      params: { tournament_id: tournamentId, ...params },
    });
  },
};

/**
 * Stage API module
 * Handles stage-specific operations
 */
export const stageApi = {
  /**
   * Get a specific stage by ID
   */
  getById: async (id: number, include?: string): Promise<StageResponse> => {
    return api.get(route('api.stages.show', { stage: id }), {
      params: include ? { include } : undefined,
    });
  },

  /**
   * Update a stage
   */
  update: async (id: number, data: UpdateStageRequest): Promise<StageResponse> => {
    return api.patch(route('api.stages.update', { stage: id }), data);
  },

  /**
   * Delete a stage
   */
  delete: async (id: number): Promise<ApiResponse<void>> => {
    return api.delete(route('api.stages.destroy', { stage: id }));
  },

  /**
   * Assign teams to a stage
   */
  assignTeams: async (id: number, data: AssignTeamsRequest): Promise<ApiResponse<void>> => {
    return api.post(route('api.stages.assign-teams', { stage: id }), data);
  },

  /**
   * Simulate fixture generation (preview without saving)
   */
  simulateFixtures: async (id: number): Promise<FixtureSimulationResponse> => {
    return api.get(route('api.stages.simulate-fixtures', { stage: id }));
  },

  /**
   * Generate fixtures for a stage
   */
  generateFixtures: async (id: number, data: GenerateFixturesRequest): Promise<FixtureListResponse> => {
    return api.post(route('api.stages.generate-fixtures', { stage: id }), data);
  },

  /**
   * Simulate promotion (preview without executing)
   */
  simulatePromotion: async (id: number): Promise<PromotionSimulationResponse> => {
    return api.get(route('api.stages.simulate-promotion', { stage: id }));
  },

  /**
   * Execute promotion to next stage
   */
  executePromotion: async (id: number, data?: ExecutePromotionRequest): Promise<ApiResponse<void>> => {
    return api.post(route('api.stages.execute-promotion', { stage: id }), data);
  },

  /**
   * Get rankings for a stage
   */
  getRankings: async (id: number): Promise<RankingListResponse> => {
    return api.get(route('api.stages.rankings.index', { stage: id }));
  },

  /**
   * Refresh/recompute rankings for a stage
   */
  refreshRankings: async (id: number): Promise<RankingListResponse> => {
    return api.post(route('api.stages.rankings.refresh', { stage: id }));
  },

  /**
   * Get fixtures for a stage
   */
  getFixtures: async (params?: FixtureFilters): Promise<FixtureListResponse> => {
    return api.get(route('api.game-matches.index'), { params });
  },

  /**
   * Get groups for a stage
   */
  getGroups: async (id: number): Promise<GroupListResponse> => {
    return api.get(route('api.stages.groups.index', { stage: id }));
  },
};

/**
 * Stage Promotion API module
 * Handles promotion rule management
 */
export const promotionApi = {
  /**
   * Get promotion rule for a stage
   */
  get: async (stageId: number): Promise<ApiResponse<StagePromotion>> => {
    return api.get(route('api.stages.promotion.show', { stage: stageId }));
  },

  /**
   * Create promotion rule for a stage
   */
  create: async (stageId: number, data: CreateStagePromotionRequest): Promise<ApiResponse<StagePromotion>> => {
    return api.post(route('api.stages.promotion.store', { stage: stageId }), data);
  },

  /**
   * Update promotion rule for a stage
   */
  update: async (stageId: number, data: UpdateStagePromotionRequest): Promise<ApiResponse<StagePromotion>> => {
    return api.patch(route('api.stages.promotion.update', { stage: stageId }), data);
  },

  /**
   * Delete promotion rule for a stage
   */
  delete: async (stageId: number): Promise<ApiResponse<void>> => {
    return api.delete(route('api.stages.promotion.destroy', { stage: stageId }));
  },
};

/**
 * Group API module
 * Handles group-specific operations
 */
export const groupApi = {
  /**
   * Get rankings for a group
   */
  getRankings: async (groupId: number): Promise<RankingListResponse> => {
    return api.get(route('api.groups.rankings.index', { group: groupId }));
  },

  /**
   * Get fixtures for a group
   */
  getFixtures: async (params?: FixtureFilters): Promise<FixtureListResponse> => {
    return api.get(route('api.game-matches.index'), { params });
  },
};

/**
 * Fixture API module
 * Handles fixture/match operations
 */
export const fixtureApi = {
  /**
   * Update fixture details
   */
  update: async (id: number, data: Partial<Fixture>): Promise<ApiResponse<Fixture>> => {
    return api.patch(route('api.fixtures.update', { fixture: id }), data);
  },

  /**
   * Reschedule a fixture
   */
  reschedule: async (id: number, starts_at: string): Promise<ApiResponse<Fixture>> => {
    return api.patch(route('api.fixtures.reschedule', { fixture: id }), { starts_at });
  },
};
