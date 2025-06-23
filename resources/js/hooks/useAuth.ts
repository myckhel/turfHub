import { router, usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { useAuthStore, type User } from '../stores/auth.store';

interface PageProps extends Record<string, unknown> {
  auth?: {
    user: User | null;
  };
}

export const useAuth = () => {
  const { auth } = usePage<PageProps>().props;
  const { user, isAuthenticated, isLoading, setUser, setLoading, logout } = useAuthStore();

  // Sync Inertia auth data with Zustand store
  useEffect(() => {
    if (auth?.user) {
      setUser(auth.user);
    } else if (!auth?.user) {
      logout();
    }
  }, [auth?.user, setUser, logout]);

  const logoutUser = async () => {
    try {
      setLoading(true);
      logout();
      // Call Laravel logout endpoint via Inertia
      router.post(route('logout'));
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    logout: logoutUser,
  };
};
