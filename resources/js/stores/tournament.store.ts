import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { fixtureApi, groupApi, promotionApi, stageApi, tournamentApi } from '../apis/tournament';
import type {
  AssignTeamsRequest,
  CreateStagePromotionRequest,
  CreateStageRequest,
  CreateTournamentRequest,
  ExecutePromotionRequest,
  Fixture,
  FixtureFilters,
  FixtureSimulation,
  GenerateFixturesRequest,
  Group,
  PromotionSimulation,
  Ranking,
  Stage,
  StageTeam,
  Tournament,
  TournamentFilters,
  UpdateStagePromotionRequest,
  UpdateStageRequest,
  UpdateTournamentRequest,
} from '../types/tournament.types';

interface TournamentStore {
  // State
  tournaments: Tournament[];
  currentTournament: Tournament | null;
  currentStage: Stage | null;
  stages: Stage[];
  fixtures: Fixture[];
  rankings: Ranking[];
  groups: Group[];
  tournamentTeams: StageTeam[];
  fixtureSimulation: FixtureSimulation | null;
  promotionSimulation: PromotionSimulation | null;

  // Loading states
  isLoadingTournaments: boolean;
  isLoadingTournament: boolean;
  isLoadingStages: boolean;
  isLoadingStage: boolean;
  isLoadingFixtures: boolean;
  isLoadingRankings: boolean;
  isLoadingGroups: boolean;
  isLoadingTournamentTeams: boolean;
  isSimulating: boolean;
  isGenerating: boolean;
  isPromoting: boolean;

  // Pagination
  currentPage: number;
  totalPages: number;
  perPage: number;

  // Actions - Tournament
  fetchTournaments: (filters?: TournamentFilters) => Promise<void>;
  fetchTournament: (id: number, include?: string) => Promise<void>;
  createTournament: (data: CreateTournamentRequest) => Promise<Tournament>;
  updateTournament: (id: number, data: UpdateTournamentRequest) => Promise<void>;
  deleteTournament: (id: number) => Promise<void>;
  exportTournament: (id: number) => Promise<Blob>;

  // Actions - Stage
  fetchStages: (tournamentId: number) => Promise<void>;
  fetchStage: (id: number, include?: string) => Promise<void>;
  createStage: (tournamentId: number, data: CreateStageRequest) => Promise<Stage>;
  updateStage: (id: number, data: UpdateStageRequest) => Promise<Stage>;
  deleteStage: (id: number) => Promise<void>;
  assignTeamsToStage: (stageId: number, data: AssignTeamsRequest) => Promise<void>;

  // Actions - Tournament Teams
  fetchTournamentTeams: (tournamentId: number, params?: { include?: string; search?: string; per_page?: number }) => Promise<void>;

  // Actions - Fixtures
  fetchFixtures: (filters?: FixtureFilters) => Promise<void>;
  simulateFixtures: (stageId: number) => Promise<void>;
  generateFixtures: (stageId: number, data: GenerateFixturesRequest) => Promise<void>;
  rescheduleFixture: (fixtureId: number, startsAt: string) => Promise<void>;
  submitFixtureResult: (fixtureId: number, homeScore: number, awayScore: number) => Promise<void>;

  // Actions - Rankings
  fetchRankings: (stageId: number) => Promise<void>;
  fetchGroupRankings: (groupId: number) => Promise<void>;
  refreshRankings: (stageId: number) => Promise<void>;

  // Actions - Groups
  fetchGroups: (stageId: number) => Promise<void>;

  // Actions - Promotion
  fetchPromotionRule: (stageId: number) => Promise<void>;
  createPromotionRule: (stageId: number, data: CreateStagePromotionRequest) => Promise<void>;
  updatePromotionRule: (stageId: number, data: UpdateStagePromotionRequest) => Promise<void>;
  deletePromotionRule: (stageId: number) => Promise<void>;
  simulatePromotion: (stageId: number) => Promise<void>;
  executePromotion: (stageId: number, data?: ExecutePromotionRequest) => Promise<void>;

  // Utilities
  setCurrentTournament: (tournament: Tournament | null) => void;
  setCurrentStage: (stage: Stage | null) => void;
  clearSimulations: () => void;
  reset: () => void;
}

export const useTournamentStore = create<TournamentStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      tournaments: [],
      currentTournament: null,
      currentStage: null,
      stages: [],
      fixtures: [],
      rankings: [],
      groups: [],
      tournamentTeams: [],
      fixtureSimulation: null,
      promotionSimulation: null,
      isLoadingTournaments: false,
      isLoadingTournament: false,
      isLoadingStages: false,
      isLoadingStage: false,
      isLoadingFixtures: false,
      isLoadingRankings: false,
      isLoadingGroups: false,
      isLoadingTournamentTeams: false,
      isSimulating: false,
      isGenerating: false,
      isPromoting: false,
      currentPage: 1,
      totalPages: 1,
      perPage: 20,

      // Tournament Actions
      fetchTournaments: async (filters) => {
        set({ isLoadingTournaments: true });
        try {
          const response = await tournamentApi.getAll(filters);
          set({
            tournaments: response.data,
            currentPage: response.meta.current_page,
            totalPages: response.meta.last_page,
            perPage: response.meta.per_page,
            isLoadingTournaments: false,
          });
        } catch (error) {
          console.error('Failed to fetch tournaments:', error);
          set({ isLoadingTournaments: false });
          throw error;
        }
      },

      fetchTournament: async (id, include) => {
        set({ isLoadingTournament: true });
        try {
          const response = await tournamentApi.getById(id, include);
          set({
            currentTournament: response,
            isLoadingTournament: false,
          });
        } catch (error) {
          console.error('Failed to fetch tournament:', error);
          set({ isLoadingTournament: false });
          throw error;
        }
      },

      createTournament: async (data) => {
        try {
          const response = await tournamentApi.create(data);
          set({ currentTournament: response });
          return response;
        } catch (error) {
          console.error('Failed to create tournament:', error);
          throw error;
        }
      },

      updateTournament: async (id, data) => {
        try {
          const response = await tournamentApi.update(id, data);
          set({ currentTournament: response });

          // Update in list if exists
          const { tournaments } = get();
          const updatedTournaments = tournaments.map((t) => (t.id === id ? response : t));
          set({ tournaments: updatedTournaments });
        } catch (error) {
          console.error('Failed to update tournament:', error);
          throw error;
        }
      },

      deleteTournament: async (id) => {
        try {
          await tournamentApi.delete(id);

          // Remove from list
          const { tournaments } = get();
          set({ tournaments: tournaments.filter((t) => t.id !== id) });

          // Clear current if it was deleted
          const { currentTournament } = get();
          if (currentTournament?.id === id) {
            set({ currentTournament: null });
          }
        } catch (error) {
          console.error('Failed to delete tournament:', error);
          throw error;
        }
      },

      exportTournament: async (id) => {
        try {
          return await tournamentApi.export(id);
        } catch (error) {
          console.error('Failed to export tournament:', error);
          throw error;
        }
      },

      // Stage Actions
      fetchStages: async (tournamentId) => {
        set({ isLoadingStages: true });
        try {
          const response = await tournamentApi.getStages(tournamentId);
          set({
            stages: response.data,
            isLoadingStages: false,
          });
        } catch (error) {
          console.error('Failed to fetch stages:', error);
          set({ isLoadingStages: false });
          throw error;
        }
      },

      fetchStage: async (id, include) => {
        set({ isLoadingStage: true });
        try {
          const response = await stageApi.getById(id, include);
          set({
            currentStage: response,
            isLoadingStage: false,
          });
        } catch (error) {
          console.error('Failed to fetch stage:', error);
          set({ isLoadingStage: false });
          throw error;
        }
      },

      createStage: async (tournamentId, data) => {
        try {
          const response = await tournamentApi.createStage(tournamentId, data);
          const { stages } = get();
          set({ stages: [...stages, response] });
          return response;
        } catch (error) {
          console.error('Failed to create stage:', error);
          throw error;
        }
      },

      updateStage: async (id, data) => {
        try {
          const response = await stageApi.update(id, data);
          set({ currentStage: response });

          // Update in list if exists
          const { stages } = get();
          const updatedStages = stages.map((s) => (s.id === id ? response : s));
          set({ stages: updatedStages });
        } catch (error) {
          console.error('Failed to update stage:', error);
          throw error;
        }
      },

      deleteStage: async (id) => {
        try {
          await stageApi.delete(id);

          // Remove from list
          const { stages } = get();
          set({ stages: stages.filter((s) => s.id !== id) });

          // Clear current if it was deleted
          const { currentStage } = get();
          if (currentStage?.id === id) {
            set({ currentStage: null });
          }
        } catch (error) {
          console.error('Failed to delete stage:', error);
          throw error;
        }
      },

      assignTeamsToStage: async (stageId, data) => {
        try {
          await stageApi.assignTeams(stageId, data);

          // Refresh stage data
          await get().fetchStage(stageId);
        } catch (error) {
          console.error('Failed to assign teams to stage:', error);
          throw error;
        }
      },

      fetchTournamentTeams: async (tournamentId, params) => {
        set({ isLoadingTournamentTeams: true });
        try {
          const response = await tournamentApi.getTeams(tournamentId, params);
          set({
            tournamentTeams: (response as StageTeam[]) || [],
            isLoadingTournamentTeams: false,
          });
        } catch (error) {
          console.error('Failed to fetch tournament teams:', error);
          set({ isLoadingTournamentTeams: false });
          throw error;
        }
      },

      // Fixture Actions
      fetchFixtures: async (filters) => {
        set({ isLoadingFixtures: true });
        try {
          const response = await stageApi.getFixtures(filters);
          set({
            fixtures: response.data,
            isLoadingFixtures: false,
          });
        } catch (error) {
          console.error('Failed to fetch fixtures:', error);
          set({ isLoadingFixtures: false });
          throw error;
        }
      },

      simulateFixtures: async (stageId) => {
        set({ isSimulating: true });
        try {
          const response = await stageApi.simulateFixtures(stageId);
          set({
            fixtureSimulation: response.data,
            isSimulating: false,
          });
        } catch (error) {
          console.error('Failed to simulate fixtures:', error);
          set({ isSimulating: false });
          throw error;
        }
      },

      generateFixtures: async (stageId, data) => {
        set({ isGenerating: true });
        try {
          const response = await stageApi.generateFixtures(stageId, data);
          set({
            fixtures: response.data,
            fixtureSimulation: null,
            isGenerating: false,
          });

          // Refresh stage data
          await get().fetchStage(stageId);
        } catch (error) {
          console.error('Failed to generate fixtures:', error);
          set({ isGenerating: false });
          throw error;
        }
      },

      rescheduleFixture: async (fixtureId, startsAt) => {
        try {
          await fixtureApi.reschedule(fixtureId, startsAt);

          // Update fixture in list
          const { fixtures } = get();
          const updatedFixtures = fixtures.map((f) => (f.id === fixtureId ? { ...f, starts_at: startsAt } : f));
          set({ fixtures: updatedFixtures });
        } catch (error) {
          console.error('Failed to reschedule fixture:', error);
          throw error;
        }
      },

      submitFixtureResult: async (fixtureId, homeScore, awayScore) => {
        try {
          await fixtureApi.submitResult(fixtureId, {
            home_team_score: homeScore,
            away_team_score: awayScore,
          });

          // Update fixture in list
          const { fixtures } = get();
          const updatedFixtures = fixtures.map((f) =>
            f.id === fixtureId
              ? {
                  ...f,
                  first_team_score: homeScore,
                  second_team_score: awayScore,
                  status: 'completed' as const,
                }
              : f,
          );
          set({ fixtures: updatedFixtures });

          // Trigger rankings refresh if currentStage is set
          const { currentStage } = get();
          if (currentStage) {
            await get().refreshRankings(currentStage.id);
          }
        } catch (error) {
          console.error('Failed to submit fixture result:', error);
          throw error;
        }
      },

      // Ranking Actions
      fetchRankings: async (stageId) => {
        set({ isLoadingRankings: true });
        try {
          const response = await stageApi.getRankings(stageId);
          set({
            rankings: response.data,
            isLoadingRankings: false,
          });
        } catch (error) {
          console.error('Failed to fetch rankings:', error);
          set({ isLoadingRankings: false });
          throw error;
        }
      },

      fetchGroupRankings: async (groupId) => {
        set({ isLoadingRankings: true });
        try {
          const response = await groupApi.getRankings(groupId);
          set({
            rankings: response.data,
            isLoadingRankings: false,
          });
        } catch (error) {
          console.error('Failed to fetch group rankings:', error);
          set({ isLoadingRankings: false });
          throw error;
        }
      },

      refreshRankings: async (stageId) => {
        try {
          const response = await stageApi.refreshRankings(stageId);
          set({ rankings: response.data });
        } catch (error) {
          console.error('Failed to refresh rankings:', error);
          throw error;
        }
      },

      // Group Actions
      fetchGroups: async (stageId) => {
        set({ isLoadingGroups: true });
        try {
          const response = await stageApi.getGroups(stageId);
          set({
            groups: response.data,
            isLoadingGroups: false,
          });
        } catch (error) {
          console.error('Failed to fetch groups:', error);
          set({ isLoadingGroups: false });
          throw error;
        }
      },

      // Promotion Actions
      fetchPromotionRule: async (stageId) => {
        try {
          const response = await promotionApi.get(stageId);
          // Update current stage with promotion data
          const { currentStage } = get();
          if (currentStage && currentStage.id === stageId) {
            set({
              currentStage: {
                ...currentStage,
                promotion: response,
              },
            });
          }
        } catch (error) {
          console.error('Failed to fetch promotion rule:', error);
          throw error;
        }
      },

      createPromotionRule: async (stageId, data) => {
        try {
          await promotionApi.create(stageId, data);
          await get().fetchStage(stageId);
        } catch (error) {
          console.error('Failed to create promotion rule:', error);
          throw error;
        }
      },

      updatePromotionRule: async (stageId, data) => {
        try {
          await promotionApi.update(stageId, data);
          await get().fetchStage(stageId);
        } catch (error) {
          console.error('Failed to update promotion rule:', error);
          throw error;
        }
      },

      deletePromotionRule: async (stageId) => {
        try {
          await promotionApi.delete(stageId);
          await get().fetchStage(stageId);
        } catch (error) {
          console.error('Failed to delete promotion rule:', error);
          throw error;
        }
      },

      simulatePromotion: async (stageId) => {
        set({ isSimulating: true });
        try {
          const response = await stageApi.simulatePromotion(stageId);
          set({
            promotionSimulation: response.data,
            isSimulating: false,
          });
        } catch (error) {
          console.error('Failed to simulate promotion:', error);
          set({ isSimulating: false });
          throw error;
        }
      },

      executePromotion: async (stageId, data) => {
        set({ isPromoting: true });
        try {
          await stageApi.executePromotion(stageId, data);
          set({
            promotionSimulation: null,
            isPromoting: false,
          });

          // Refresh stage and next stage data
          await get().fetchStage(stageId);
        } catch (error) {
          console.error('Failed to execute promotion:', error);
          set({ isPromoting: false });
          throw error;
        }
      },

      // Utilities
      setCurrentTournament: (tournament) => {
        set({ currentTournament: tournament });
      },

      setCurrentStage: (stage) => {
        set({ currentStage: stage });
      },

      clearSimulations: () => {
        set({
          fixtureSimulation: null,
          promotionSimulation: null,
        });
      },

      reset: () => {
        set({
          tournaments: [],
          currentTournament: null,
          currentStage: null,
          stages: [],
          fixtures: [],
          rankings: [],
          groups: [],
          tournamentTeams: [],
          fixtureSimulation: null,
          promotionSimulation: null,
          isLoadingTournaments: false,
          isLoadingTournament: false,
          isLoadingStages: false,
          isLoadingStage: false,
          isLoadingFixtures: false,
          isLoadingRankings: false,
          isLoadingGroups: false,
          isLoadingTournamentTeams: false,
          isSimulating: false,
          isGenerating: false,
          isPromoting: false,
          currentPage: 1,
          totalPages: 1,
          perPage: 20,
        });
      },
    }),
    { name: 'TournamentStore' },
  ),
);
