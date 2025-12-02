import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { teamApi } from '../apis/team';
import type { Player } from '../types/player.types';

interface TeamStore {
  // State
  availablePlayers: Player[];
  isLoadingPlayers: boolean;
  selectedPlayers: number[];
  searchTerm: string;
  filterMode: 'all' | 'unassigned';

  // Actions
  fetchAvailablePlayers: (matchSessionId: number, filterUnassigned?: boolean, searchTerm?: string) => Promise<void>;
  setSelectedPlayers: (playerIds: number[]) => void;
  addSelectedPlayer: (playerId: number) => void;
  removeSelectedPlayer: (playerId: number) => void;
  clearSelectedPlayers: () => void;
  setSearchTerm: (term: string) => void;
  searchPlayers: (matchSessionId: number, searchTerm: string) => Promise<void>;
  setFilterMode: (mode: 'all' | 'unassigned') => void;
  reset: () => void;
}

export const useTeamStore = create<TeamStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      availablePlayers: [],
      isLoadingPlayers: false,
      selectedPlayers: [],
      searchTerm: '',
      filterMode: 'unassigned',

      // Actions
      fetchAvailablePlayers: async (matchSessionId: number, filterUnassigned = true, searchTerm?: string) => {
        set({ isLoadingPlayers: true });

        try {
          const params: { filter_unassigned?: boolean; search?: string } = {
            filter_unassigned: filterUnassigned,
          };

          if (searchTerm?.trim()) {
            params.search = searchTerm.trim();
          }

          const response = await teamApi.getAvailablePlayersForSession(matchSessionId, params);

          set({
            availablePlayers: response,
            isLoadingPlayers: false,
          });
        } catch (error) {
          console.error('Failed to fetch available players:', error);
          set({
            availablePlayers: [],
            isLoadingPlayers: false,
          });
          throw error;
        }
      },

      setSelectedPlayers: (playerIds: number[]) => {
        set({ selectedPlayers: playerIds });
      },

      addSelectedPlayer: (playerId: number) => {
        const { selectedPlayers } = get();
        if (!selectedPlayers.includes(playerId)) {
          set({ selectedPlayers: [...selectedPlayers, playerId] });
        }
      },

      removeSelectedPlayer: (playerId: number) => {
        const { selectedPlayers } = get();
        set({ selectedPlayers: selectedPlayers.filter((id) => id !== playerId) });
      },

      clearSelectedPlayers: () => {
        set({ selectedPlayers: [] });
      },

      setSearchTerm: (term: string) => {
        set({ searchTerm: term });
      },

      searchPlayers: async (matchSessionId: number, searchTerm: string) => {
        const { filterMode } = get();
        await get().fetchAvailablePlayers(matchSessionId, filterMode === 'unassigned', searchTerm);
      },

      setFilterMode: (mode: 'all' | 'unassigned') => {
        set({ filterMode: mode });
      },

      reset: () => {
        set({
          availablePlayers: [],
          isLoadingPlayers: false,
          selectedPlayers: [],
          searchTerm: '',
          filterMode: 'unassigned',
        });
      },
    }),
    {
      name: 'team-store',
    },
  ),
);
