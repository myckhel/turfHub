import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PlaceBetRequest } from '../types/betting.types';

interface OfflineBet extends PlaceBetRequest {
  id: string;
  timestamp: number;
  marketName: string;
  optionName: string;
  odds: number;
}

interface OfflineBettingState {
  draftBets: OfflineBet[];
  pendingSyncBets: OfflineBet[];

  // Actions
  saveDraftBet: (bet: Omit<OfflineBet, 'id' | 'timestamp'>) => void;
  removeDraftBet: (id: string) => void;
  clearDraftBets: () => void;
  moveToPendingSync: (id: string) => void;
  removeFromPendingSync: (id: string) => void;
  clearPendingSyncBets: () => void;
  getDraftBetsCount: () => number;
  getPendingSyncBetsCount: () => number;
}

export const useOfflineBettingStore = create<OfflineBettingState>()(
  persist(
    (set, get) => ({
      draftBets: [],
      pendingSyncBets: [],

      saveDraftBet: (bet) => {
        const draftBet: OfflineBet = {
          ...bet,
          id: `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now(),
        };

        set((state) => ({
          draftBets: [...state.draftBets, draftBet],
        }));
      },

      removeDraftBet: (id) => {
        set((state) => ({
          draftBets: state.draftBets.filter((bet) => bet.id !== id),
        }));
      },

      clearDraftBets: () => {
        set({ draftBets: [] });
      },

      moveToPendingSync: (id) => {
        const { draftBets, pendingSyncBets } = get();
        const bet = draftBets.find((bet) => bet.id === id);

        if (bet) {
          set({
            draftBets: draftBets.filter((bet) => bet.id !== id),
            pendingSyncBets: [...pendingSyncBets, bet],
          });
        }
      },

      removeFromPendingSync: (id) => {
        set((state) => ({
          pendingSyncBets: state.pendingSyncBets.filter((bet) => bet.id !== id),
        }));
      },

      clearPendingSyncBets: () => {
        set({ pendingSyncBets: [] });
      },

      getDraftBetsCount: () => get().draftBets.length,

      getPendingSyncBetsCount: () => get().pendingSyncBets.length,
    }),
    {
      name: 'offline-betting-storage',
      partialize: (state) => ({
        draftBets: state.draftBets,
        pendingSyncBets: state.pendingSyncBets,
      }),
    },
  ),
);
