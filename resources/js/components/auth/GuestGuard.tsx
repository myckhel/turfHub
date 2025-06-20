import { router } from '@inertiajs/react';
import React from 'react';
import { useAuthStore } from '../../stores/auth.store';

interface GuestGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export const GuestGuard: React.FC<GuestGuardProps> = ({ children, redirectTo = 'dashboard' }) => {
  const { user, isAuthenticated } = useAuthStore();

  // Redirect authenticated users
  if (user && isAuthenticated) {
    router.visit(route(redirectTo));
    return null;
  }

  return <>{children}</>;
};
