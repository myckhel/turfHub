import { useMemo } from 'react';
import { useTurfStore } from '../stores/turf.store';
import { useAuth } from './useAuth';

export const usePermissions = () => {
  const { user } = useAuth();
  const { selectedTurf } = useTurfStore();

  // Turf-specific role and permission checks
  const turfPermissions = useMemo(() => {
    if (!selectedTurf?.user_permissions) {
      return {
        canManageTurf: false,
        canInvitePlayers: false,
        canRemovePlayers: false,
        canManageSessions: false,
        canCreateTeams: false,
        canManageTeams: false,
        canViewAnalytics: false,
        canManagePayments: false,
        isOwner: false,
      };
    }

    return {
      canManageTurf: selectedTurf.user_permissions.can_manage_turf || false,
      canInvitePlayers: selectedTurf.user_permissions.can_invite_players || false,
      canRemovePlayers: selectedTurf.user_permissions.can_remove_players || false,
      canManageSessions: selectedTurf.user_permissions.can_manage_sessions || false,
      canCreateTeams: selectedTurf.user_permissions.can_create_teams || false,
      canManageTeams: selectedTurf.user_permissions.can_manage_teams || false,
      canViewAnalytics: selectedTurf.user_permissions.can_view_analytics || false,
      canManagePayments: selectedTurf.user_permissions.can_manage_payments || false,
      isOwner: selectedTurf.user_permissions.is_owner || false,
    };
  }, [selectedTurf]);

  // Get current user's role in selected turf
  const currentTurfRole = useMemo(() => {
    if (!selectedTurf || !user) return null;

    // Check if user is owner
    if (selectedTurf.owner_id === user.id) return 'owner';

    // Get role from turf permissions if available
    return selectedTurf.user_permissions?.role_in_turf || null;
  }, [selectedTurf, user]);

  const permissions = {
    // Turf-specific permissions (context-aware)
    canManageTurf: () => turfPermissions.canManageTurf,
    canInvitePlayers: () => turfPermissions.canInvitePlayers,
    canRemovePlayers: () => turfPermissions.canRemovePlayers,
    canManageSessions: () => turfPermissions.canManageSessions,
    canCreateTeams: () => turfPermissions.canCreateTeams,
    canManageTeams: () => turfPermissions.canCreateTeams,
    canViewTurfAnalytics: () => turfPermissions.canViewAnalytics,
    canManageTurfPayments: () => turfPermissions.canManagePayments,

    // Enhanced permission checks (now purely turf-based)
    canBookField: () => {
      // Allow booking if user is a member of the selected turf
      return currentTurfRole !== null;
    },

    canViewOwnBookings: () => {
      // Allow viewing own bookings if user is a member of the selected turf
      return currentTurfRole !== null;
    },

    canCancelOwnBooking: () => {
      // Allow canceling own bookings if user is a member of the selected turf
      return currentTurfRole !== null;
    },

    canViewAllBookings: () => {
      return turfPermissions.canManageSessions || currentTurfRole === 'admin' || currentTurfRole === 'manager' || currentTurfRole === 'owner';
    },

    canManageBookings: () => {
      return turfPermissions.canManageSessions || currentTurfRole === 'admin' || currentTurfRole === 'manager' || currentTurfRole === 'owner';
    },

    canViewReports: () => {
      return turfPermissions.canViewAnalytics || currentTurfRole === 'admin' || currentTurfRole === 'manager' || currentTurfRole === 'owner';
    },

    // Global admin permissions (these would need to be checked against backend)
    canManageUsers: () => {
      // This would need to be a global admin check against backend
      // For now, return false as global permissions are not stored locally
      return false;
    },

    canManageGlobalSettings: () => {
      // This would need to be a global admin check against backend
      return false;
    },

    canViewGlobalAnalytics: () => {
      // This would need to be a global admin check against backend
      return false;
    },

    // General access permissions
    canAccessDashboard: () => {
      return user !== null && currentTurfRole !== null;
    },

    canAccessTurfPanel: () => {
      return (
        currentTurfRole === 'admin' ||
        currentTurfRole === 'manager' ||
        currentTurfRole === 'owner' ||
        turfPermissions.canManageTurf ||
        turfPermissions.canManageSessions
      );
    },

    canAccessAdminPanel: () => {
      // This would need to be a global admin check against backend
      return false;
    },

    canAccessSuperAdmin: () => {
      // This would need to be a super admin check against backend
      return false;
    },
  };

  const roles = {
    // Turf-specific roles
    isTurfOwner: () => currentTurfRole === 'owner' || turfPermissions.isOwner,
    isTurfAdmin: () => currentTurfRole === 'admin',
    isTurfManager: () => currentTurfRole === 'manager',
    isTurfPlayer: () => currentTurfRole === 'player',

    // Helper role checks
    hasTurfRole: () => currentTurfRole !== null,
    getTurfRole: () => currentTurfRole,
    isTurfMember: () => currentTurfRole !== null,

    // Authentication status
    isAuthenticated: () => !!user,
    isGuest: () => !user,
  };

  // Enhanced helper functions
  const helpers = {
    // Check if user has specific permission in current turf context
    canInCurrentTurf: (action: string) => {
      switch (action) {
        case 'manage_turf':
          return permissions.canManageTurf();
        case 'invite_players':
          return permissions.canInvitePlayers();
        case 'remove_players':
          return permissions.canRemovePlayers();
        case 'manage_sessions':
          return permissions.canManageSessions();
        case 'create_teams':
          return permissions.canCreateTeams();
        case 'manage_teams':
          return permissions.canManageTeams();
        case 'view_analytics':
          return permissions.canViewTurfAnalytics();
        case 'manage_payments':
          return permissions.canManageTurfPayments();
        default:
          return false;
      }
    },

    // Check if user has any administrative role in current turf
    isTurfAdministrator: () => {
      return roles.isTurfOwner() || roles.isTurfAdmin() || roles.isTurfManager();
    },

    // Get user's highest role in current turf
    getHighestTurfRole: () => {
      if (roles.isTurfOwner()) return 'owner';
      if (roles.isTurfAdmin()) return 'admin';
      if (roles.isTurfManager()) return 'manager';
      if (roles.isTurfPlayer()) return 'player';
      return null;
    },

    // Check if user can perform any management actions
    canManageAnything: () => {
      return (
        permissions.canManageTurf() ||
        permissions.canManageSessions() ||
        permissions.canManageTeams() ||
        permissions.canInvitePlayers() ||
        permissions.canRemovePlayers()
      );
    },

    // Get readable role name
    getRoleDisplayName: (role?: string) => {
      const roleToCheck = role || currentTurfRole;
      switch (roleToCheck) {
        case 'owner':
          return 'Owner';
        case 'admin':
          return 'Administrator';
        case 'manager':
          return 'Manager';
        case 'player':
          return 'Player';
        default:
          return 'Guest';
      }
    },
  };

  return {
    // Core permissions
    ...permissions,
    ...roles,
    ...helpers,

    user,

    // Turf context data
    selectedTurf,
    currentTurfRole,
    turfPermissions,
  };
};
