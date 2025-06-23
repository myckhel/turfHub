import { router } from '@inertiajs/react';
import React from 'react';
import { useAuthStore } from '../../stores/auth.store';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
  roles?: string[];
  permissions?: string[];
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children, fallback = null, redirectTo = 'login', roles = [], permissions = [] }) => {
  const { isAuthenticated } = useAuthStore();

  // Check if user is authenticated
  if (!isAuthenticated) {
    if (redirectTo) {
      router.visit(route(redirectTo));
      return fallback;
    }
    return fallback;
  }

  // Check role requirements
  if (roles.length > 0) {
    if (redirectTo) {
      router.visit(route('dashboard'));
      return fallback;
    }
    return fallback;
  }

  // Check permission requirements
  if (permissions.length > 0) {
    if (redirectTo) {
      router.visit(route('dashboard'));
      return fallback;
    }
    return fallback;
  }

  return <>{children}</>;
};
