import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export interface User {
  id: number;
  name: string;
  email: string;
  roles: string[];
  permissions: string[];
  avatar?: string;
  email_verified_at?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  permissions: string[];
  roles: string[];
}

interface AuthActions {
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
}

export const useAuthStore = create<AuthState & AuthActions>()(
  devtools(
    persist(
      (set, get) => ({
        // State
        user: null,
        isAuthenticated: false,
        isLoading: false,
        permissions: [],
        roles: [],

        // Actions
        setUser: (user) =>
          set(
            {
              user,
              isAuthenticated: !!user,
              permissions: user?.permissions || [],
              roles: user?.roles || [],
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
              permissions: [],
              roles: [],
            },
            false,
            'auth/logout',
          );
        },

        hasPermission: (permission) => {
          const { permissions } = get();
          return permissions.includes(permission);
        },

        hasRole: (role) => {
          const { roles } = get();
          return roles.includes(role);
        },

        hasAnyRole: (targetRoles) => {
          const { roles } = get();
          return targetRoles.some((role) => roles.includes(role));
        },
      }),
      {
        name: 'turfhub-auth',
        partialize: (state) => ({
          user: state.user,
          isAuthenticated: state.isAuthenticated,
          permissions: state.permissions,
          roles: state.roles,
        }),
      },
    ),
    { name: 'AuthStore' },
  ),
);
