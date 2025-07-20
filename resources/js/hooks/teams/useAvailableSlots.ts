import { message } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import { matchSessionApi } from '../../apis/matchSession';
import { teamApi } from '../../apis/team';
import { useTurfStore } from '../../stores/turf.store';
import type { AvailableTeamSlotsResponse } from '../../types/team.types';

export interface UseAvailableSlotsOptions {
  matchSessionId?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export interface UseAvailableSlotsReturn {
  availableSlots: AvailableTeamSlotsResponse | null;
  loading: boolean;
  error: string | null;
  activeSessionId: number | null;
  refreshSlots: () => Promise<void>;
  isSessionPlayer: boolean;
}

/**
 * Hook for fetching available team slots for a match session.
 * If no matchSessionId is provided, it will attempt to get the active session
 * from the selected turf.
 *
 * @param options Configuration options
 * @returns Available slots data and utilities
 *
 * @example
 * // With explicit match session ID
 * const { availableSlots, loading } = useAvailableSlots({
 *   matchSessionId: 123
 * });
 *
 * @example
 * // Auto-detect from selected turf
 * const { availableSlots, loading, activeSessionId } = useAvailableSlots({
 *   autoRefresh: true,
 *   refreshInterval: 30000
 * });
 */
export const useAvailableSlots = (options: UseAvailableSlotsOptions = {}): UseAvailableSlotsReturn => {
  const { matchSessionId, autoRefresh = false, refreshInterval = 30000 } = options;

  const { selectedTurf } = useTurfStore();

  const [availableSlots, setAvailableSlots] = useState<AvailableTeamSlotsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [isSessionPlayer, setIsSessionPlayer] = useState<boolean>(false);

  /**
   * Get the active match session ID to use for fetching slots
   */
  const getActiveSessionId = useCallback(async (): Promise<number | null> => {
    // If explicit matchSessionId provided, use it
    if (matchSessionId) {
      return matchSessionId;
    }

    // If no selected turf, can't auto-detect
    if (!selectedTurf) {
      throw new Error('No turf selected. Please select a turf or provide a match session ID.');
    }

    // Fetch active sessions for the selected turf
    try {
      const response = await matchSessionApi.getActiveTurfSessions(selectedTurf.id);
      const activeSessions = response.data || [];

      if (activeSessions.length === 0) {
        throw new Error(`No active match sessions found for ${selectedTurf.name}`);
      }

      // If multiple active sessions, use the first one
      // In a real scenario, you might want to let the user choose
      if (activeSessions.length > 1) {
        console.warn(`Multiple active sessions found for ${selectedTurf.name}. Using the first one.`);
      }

      setIsSessionPlayer(!!activeSessions[0].is_session_player);

      return activeSessions[0].id;
    } catch (error) {
      console.error('Failed to fetch active sessions:', error);
      throw new Error('Failed to find active match session');
    }
  }, [matchSessionId, selectedTurf]);

  /**
   * Fetch available slots for the determined session
   */
  const fetchAvailableSlots = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const sessionId = await getActiveSessionId();

      if (!sessionId) {
        throw new Error('No match session available');
      }

      setActiveSessionId(sessionId);

      const response = await teamApi.getAvailableSlots(sessionId);
      setAvailableSlots(response.data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load available team slots';
      console.error('Failed to load available slots:', error);
      setError(errorMessage);
      setAvailableSlots(null);
      setActiveSessionId(null);

      // Only show user-facing error messages for certain cases
      if (error instanceof Error && (error.message.includes('No active match sessions') || error.message.includes('No turf selected'))) {
        // These are expected user scenarios, don't show error toast
      } else {
        message.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }, [getActiveSessionId]);

  /**
   * Refresh slots manually
   */
  const refreshSlots = useCallback(async (): Promise<void> => {
    await fetchAvailableSlots();
  }, [fetchAvailableSlots]);

  // Initial load
  useEffect(() => {
    fetchAvailableSlots();
  }, [fetchAvailableSlots]);

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh || !refreshInterval || !activeSessionId) {
      return;
    }

    const interval = setInterval(() => {
      fetchAvailableSlots();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, activeSessionId, fetchAvailableSlots]);

  return {
    availableSlots,
    loading,
    error,
    activeSessionId,
    refreshSlots,
    isSessionPlayer,
  };
};

export default useAvailableSlots;
