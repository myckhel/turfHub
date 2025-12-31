import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { turfApi } from '../apis/turf';
import type { TurfSwitcherActions, TurfSwitcherState } from '../types/turf.types';

export const useTurfStore = create<TurfSwitcherState & TurfSwitcherActions>()(
  devtools(
    persist(
      (set, get) => ({
        // State
        selectedTurf: null,
        belongingTurfs: [],
        isLoading: false,
        error: null,

        // Actions
        setSelectedTurf: (turf) => set({ selectedTurf: turf }, false, 'turf/setSelectedTurf'),

        setBelongingTurfs: (turfs) => set({ belongingTurfs: turfs }, false, 'turf/setBelongingTurfs'),

        setLoading: (loading) => set({ isLoading: loading }, false, 'turf/setLoading'),

        setError: (error) => set({ error }, false, 'turf/setError'),

        fetchBelongingTurfs: async (userId: number) => {
          set({ isLoading: true, error: null });

          try {
            const turfs = await turfApi.getBelongingTurfs(userId);

            set({
              belongingTurfs: turfs || [],
              isLoading: false,
              error: null,
            });

            // Auto-select first turf if none selected and turfs are available
            const { selectedTurf } = get();
            if (!selectedTurf && turfs.length > 0) {
              set({ selectedTurf: turfs[0] });
            }
          } catch (error) {
            console.error('Failed to fetch belonging turfs:', error);
            set({
              error: error instanceof Error ? error.message : 'Failed to fetch turfs',
              isLoading: false,
            });
          }
        },

        autoSelectFirstTurf: () => {
          const { belongingTurfs, selectedTurf } = get();
          if (!selectedTurf && belongingTurfs.length > 0) {
            set({ selectedTurf: belongingTurfs[0] });
          }
        },

        addTurf: (turf) =>
          set(
            (state) => ({
              belongingTurfs: [turf, ...state.belongingTurfs],
              selectedTurf: turf,
            }),
            false,
            'turf/addTurf',
          ),

        updateTurf: (turf) =>
          set(
            (state) => ({
              belongingTurfs: state.belongingTurfs.map((t) => (t.id === turf.id ? turf : t)),
              selectedTurf: state.selectedTurf?.id === turf.id ? turf : state.selectedTurf,
            }),
            false,
            'turf/updateTurf',
          ),

        removeTurf: (turfId) =>
          set(
            (state) => ({
              belongingTurfs: state.belongingTurfs.filter((t) => t.id !== turfId),
              selectedTurf: state.selectedTurf?.id === turfId ? null : state.selectedTurf,
            }),
            false,
            'turf/removeTurf',
          ),

        clearTurfData: () =>
          set(
            {
              selectedTurf: null,
              belongingTurfs: [],
              error: null,
              isLoading: false,
            },
            false,
            'turf/clearTurfData',
          ),
      }),
      {
        name: 'turfmate-turf-store',
        partialize: (state) => ({
          selectedTurf: state.selectedTurf,
          belongingTurfs: state.belongingTurfs,
        }),
      },
    ),
    { name: 'TurfStore' },
  ),
);

// Utility hooks for easier consumption
export const useSelectedTurf = () => {
  const { selectedTurf, setSelectedTurf } = useTurfStore();
  return { selectedTurf, setSelectedTurf };
};

export const useBelongingTurfs = () => {
  const { belongingTurfs, isLoading, error, fetchBelongingTurfs, setBelongingTurfs } = useTurfStore();

  return {
    belongingTurfs,
    isLoading,
    error,
    fetchBelongingTurfs,
    setBelongingTurfs,
  };
};

export const useTurfSwitcher = () => {
  const store = useTurfStore();
  return store;
};
