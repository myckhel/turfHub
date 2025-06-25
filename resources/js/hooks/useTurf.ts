import { useEffect } from 'react';
import { useTurfStore } from '../stores/turf.store';
import { useAuth } from './useAuth';

/**
 * Hook for managing turf data and selection
 * Automatically fetches belonging turfs when user is authenticated
 * and provides utilities for turf selection
 */
export const useTurf = () => {
  const { user, isAuthenticated } = useAuth();
  const { selectedTurf, belongingTurfs, isLoading, error, setSelectedTurf, fetchBelongingTurfs, autoSelectFirstTurf, clearTurfData } = useTurfStore();

  // Auto-fetch belonging turfs when user is authenticated
  useEffect(() => {
    if (user?.id) {
      fetchBelongingTurfs(user.id);
    }
  }, [user?.id, fetchBelongingTurfs]);

  // Clear turf data when user is not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      clearTurfData();
    }
  }, [isAuthenticated, clearTurfData]);

  // Auto-select first turf when available
  useEffect(() => {
    if (belongingTurfs.length > 0 && !selectedTurf) {
      autoSelectFirstTurf();
    }
  }, [belongingTurfs, selectedTurf, autoSelectFirstTurf]);

  const refreshTurfs = () => {
    if (user?.id) {
      fetchBelongingTurfs(user.id);
    }
  };

  const hasMultipleTurfs = belongingTurfs.length > 1;
  const hasTurfs = belongingTurfs.length > 0;

  return {
    // State
    selectedTurf,
    belongingTurfs,
    isLoading,
    error,
    hasTurfs,
    hasMultipleTurfs,

    // Actions
    setSelectedTurf,
    refreshTurfs,
    clearTurfData,
  };
};

export default useTurf;
