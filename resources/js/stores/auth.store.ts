import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  email_verified_at?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthActions {
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState & AuthActions>()(
  devtools(
    persist(
      (set) => ({
        // State
        user: null,
        isAuthenticated: false,
        isLoading: false,

        // Actions
        setUser: (user) =>
          set(
            {
              user,
              isAuthenticated: !!user,
            },
            false,
            'auth/setUser',
          ),

        setLoading: (isLoading) => set({ isLoading }, false, 'auth/setLoading'),
        logout: () => {
          // Clear turf data when logging out
          try {
            // Dynamic import to avoid circular dependency
            import('./turf.store')
              .then(({ useTurfStore }) => {
                useTurfStore.getState().clearTurfData();
              })
              .catch(() => {
                // Ignore error if turf store is not available
              });
          } catch {
            // Ignore error
          }

          set(
            {
              user: null,
              isAuthenticated: false,
            },
            false,
            'auth/logout',
          );
        },
      }),
      {
        name: 'turfhub-auth',
        partialize: (state) => ({
          user: state.user,
          isAuthenticated: state.isAuthenticated,
        }),
      },
    ),
    { name: 'AuthStore' },
  ),
);
