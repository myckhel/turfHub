import { useCallback, useMemo } from 'react';
import { BRAND_COLORS } from '../stores/theme.store';
import { useTurfStore } from '../stores/turf.store';
import type { Turf } from '../types/turf.types';
import { useAuth } from './useAuth';
import { useTheme } from './useTheme';

/**
 * Enhanced hook for TurfSwitcher component
 * Provides optimized state management, theme integration, and utility functions
 */
export const useTurfSwitcher = () => {
  const { user, isAuthenticated } = useAuth();
  const { isDark, reducedMotion } = useTheme();
  const { selectedTurf, belongingTurfs, isLoading, error, setSelectedTurf, fetchBelongingTurfs, autoSelectFirstTurf, clearTurfData } = useTurfStore();

  // Memoized theme colors for optimal performance
  const themeColors = useMemo(() => {
    const primary = BRAND_COLORS.turfGreen;
    const accent = isDark ? BRAND_COLORS.lightSky : BRAND_COLORS.skyBlue;
    const success = BRAND_COLORS.success;

    return {
      primary,
      accent,
      success,
      indicator: success,
      hover: isDark ? 'rgba(93, 173, 226, 0.1)' : 'rgba(27, 94, 32, 0.1)',
      activeHover: isDark ? 'rgba(93, 173, 226, 0.2)' : 'rgba(27, 94, 32, 0.2)',
      background: isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
      border: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
      shadow: isDark
        ? '0 20px 40px rgba(0, 0, 0, 0.4), 0 8px 16px rgba(0, 0, 0, 0.2)'
        : '0 20px 40px rgba(0, 0, 0, 0.15), 0 8px 16px rgba(0, 0, 0, 0.1)',
    };
  }, [isDark]);

  // Optimized turf selection with callback support
  const selectTurf = useCallback(
    (turf: Turf | null, callback?: (turf: Turf | null) => void) => {
      setSelectedTurf(turf);
      callback?.(turf);
    },
    [setSelectedTurf],
  );

  // Refresh turfs with error handling
  const refreshTurfs = useCallback(async () => {
    if (!user?.id) return false;

    try {
      await fetchBelongingTurfs(user.id);
      return true;
    } catch (error) {
      console.error('Failed to refresh turfs:', error);
      return false;
    }
  }, [user?.id, fetchBelongingTurfs]);

  // Check if user is member of specific turf
  const isMemberOfTurf = useCallback(
    (turfId: number) => {
      return belongingTurfs.some((turf) => turf.id === turfId);
    },
    [belongingTurfs],
  );

  // Check if turf is currently selected
  const isSelectedTurf = useCallback(
    (turfId: number) => {
      return selectedTurf?.id === turfId;
    },
    [selectedTurf],
  );

  // Get turf by ID from belonging turfs
  const getTurfById = useCallback(
    (turfId: number): Turf | undefined => {
      return belongingTurfs.find((turf) => turf.id === turfId);
    },
    [belongingTurfs],
  );

  // Check if user has multiple turfs
  const hasMultipleTurfs = useMemo(() => belongingTurfs.length > 1, [belongingTurfs.length]);

  // Check if user has any turfs
  const hasTurfs = useMemo(() => belongingTurfs.length > 0, [belongingTurfs.length]);

  // Get available turfs (active only)
  const availableTurfs = useMemo(() => {
    return belongingTurfs.filter((turf) => turf.is_active);
  }, [belongingTurfs]);

  // Get turf statistics
  const turfStats = useMemo(() => {
    const total = belongingTurfs.length;
    const active = belongingTurfs.filter((turf) => turf.is_active).length;
    const inactive = total - active;
    const withMembership = belongingTurfs.filter((turf) => turf.requires_membership).length;

    return { total, active, inactive, withMembership };
  }, [belongingTurfs]);

  // Validate if switching is possible
  const canSwitch = useMemo(() => {
    return isAuthenticated && hasTurfs && hasMultipleTurfs && !isLoading;
  }, [isAuthenticated, hasTurfs, hasMultipleTurfs, isLoading]);

  // Get next/previous turf for keyboard navigation
  const getNextTurf = useCallback(() => {
    if (!selectedTurf || !hasMultipleTurfs) return null;

    const currentIndex = belongingTurfs.findIndex((turf) => turf.id === selectedTurf.id);
    const nextIndex = (currentIndex + 1) % belongingTurfs.length;
    return belongingTurfs[nextIndex];
  }, [selectedTurf, belongingTurfs, hasMultipleTurfs]);

  const getPreviousTurf = useCallback(() => {
    if (!selectedTurf || !hasMultipleTurfs) return null;

    const currentIndex = belongingTurfs.findIndex((turf) => turf.id === selectedTurf.id);
    const prevIndex = currentIndex === 0 ? belongingTurfs.length - 1 : currentIndex - 1;
    return belongingTurfs[prevIndex];
  }, [selectedTurf, belongingTurfs, hasMultipleTurfs]);

  // Keyboard navigation handlers
  const navigateNext = useCallback(
    (callback?: (turf: Turf | null) => void) => {
      const nextTurf = getNextTurf();
      if (nextTurf) {
        selectTurf(nextTurf, callback);
      }
    },
    [getNextTurf, selectTurf],
  );

  const navigatePrevious = useCallback(
    (callback?: (turf: Turf | null) => void) => {
      const prevTurf = getPreviousTurf();
      if (prevTurf) {
        selectTurf(prevTurf, callback);
      }
    },
    [getPreviousTurf, selectTurf],
  );

  // Utility to truncate text consistently
  const truncateText = useCallback((text: string, maxLength: number = 25) => {
    if (text.length <= maxLength) return text;
    return `${text.substring(0, maxLength - 3)}...`;
  }, []);

  // Generate accessibility labels
  const getAriaLabel = useCallback((turf?: Turf | null) => {
    if (!turf) return 'No turf selected. Click to choose a turf.';
    return `Current turf: ${turf.name}${turf.location ? ` at ${turf.location}` : ''}. Click to switch turfs.`;
  }, []);

  return {
    // Core state
    selectedTurf,
    belongingTurfs,
    availableTurfs,
    isLoading,
    error,

    // Theme integration
    themeColors,
    isDark,
    reducedMotion,

    // User state
    user,
    isAuthenticated,

    // Computed state
    hasMultipleTurfs,
    hasTurfs,
    canSwitch,
    turfStats,

    // Actions
    selectTurf,
    refreshTurfs,
    autoSelectFirstTurf,
    clearTurfData,

    // Navigation
    navigateNext,
    navigatePrevious,
    getNextTurf,
    getPreviousTurf,

    // Utilities
    isMemberOfTurf,
    isSelectedTurf,
    getTurfById,
    truncateText,
    getAriaLabel,
  };
};

export default useTurfSwitcher;
