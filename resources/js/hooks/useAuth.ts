import { usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { useAuthStore, type User } from '../stores/auth.store';

interface PageProps extends Record<string, unknown> {
  auth?: {
    user: User | null;
  };
}

export const useAuth = () => {
  const { auth } = usePage<PageProps>().props;
  const { 
    user, 
    isAuthenticated, 
    isLoading, 
    setUser, 
    setLoading, 
    logout,
    hasPermission,
    hasRole,
    hasAnyRole
  } = useAuthStore();

  // Sync Inertia auth data with Zustand store
  useEffect(() => {
    if (auth?.user && (!user || user.id !== auth.user.id)) {
      setUser(auth.user);
    } else if (!auth?.user && user) {
      logout();
    }
  }, [auth?.user, user, setUser, logout]);

  const logoutUser = async () => {
    try {
      setLoading(true);
      // Call Laravel logout endpoint via Inertia
      window.location.href = route('logout');
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
    hasPermission,
    hasRole,
    hasAnyRole,
  };
};
