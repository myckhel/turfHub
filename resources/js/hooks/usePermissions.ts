import { useAuth } from './useAuth';

export const usePermissions = () => {
  const { hasPermission, hasRole, hasAnyRole, user } = useAuth();

  const permissions = {
    // Player permissions
    canBookField: () => hasPermission('book-field') || hasRole('player'),
    canViewOwnBookings: () => hasPermission('view-own-bookings') || hasRole('player'),
    canCancelOwnBooking: () => hasPermission('cancel-own-booking') || hasRole('player'),

    // Manager permissions
    canManageFields: () => hasPermission('manage-fields') || hasRole('manager'),
    canViewAllBookings: () => hasPermission('view-all-bookings') || hasAnyRole(['manager', 'admin']),
    canManageBookings: () => hasPermission('manage-bookings') || hasAnyRole(['manager', 'admin']),
    canViewReports: () => hasPermission('view-reports') || hasAnyRole(['manager', 'admin']),

    // Admin permissions
    canManageUsers: () => hasPermission('manage-users') || hasRole('admin'),
    canManageSettings: () => hasPermission('manage-settings') || hasRole('admin'),
    canViewAnalytics: () => hasPermission('view-analytics') || hasRole('admin'),
    canManagePayments: () => hasPermission('manage-payments') || hasAnyRole(['manager', 'admin']),

    // General permissions
    canAccessDashboard: () => hasAnyRole(['player', 'manager', 'admin']),
    canAccessAdminPanel: () => hasAnyRole(['manager', 'admin']),
    canAccessSuperAdmin: () => hasRole('admin'),
  };

  const roles = {
    isPlayer: () => hasRole('player'),
    isManager: () => hasRole('manager'),
    isAdmin: () => hasRole('admin'),
    isAuthenticated: () => !!user,
    isGuest: () => !user,
  };

  return {
    ...permissions,
    ...roles,
    hasPermission,
    hasRole,
    hasAnyRole,
    user,
  };
};
