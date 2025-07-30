import { useEffect, useState } from 'react';

interface UseMatchTimerProps {
  matchStartTime: string;
  status: 'upcoming' | 'in_progress' | 'completed' | 'postponed';
}

interface MatchTimerState {
  elapsed: number; // in seconds
  formattedTime: string;
  isRunning: boolean;
}

export const useMatchTimer = ({ matchStartTime, status }: UseMatchTimerProps): MatchTimerState => {
  const [elapsed, setElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    const isMatchInProgress = status === 'in_progress';
    setIsRunning(isMatchInProgress);

    if (!isMatchInProgress || !matchStartTime) {
      setElapsed(0);
      return;
    }

    const startTime = new Date(matchStartTime);

    // Calculate initial elapsed time
    const updateElapsed = () => {
      const now = new Date();
      const elapsedMs = now.getTime() - startTime.getTime();
      const elapsedSeconds = Math.max(0, Math.floor(elapsedMs / 1000));
      setElapsed(elapsedSeconds);
    };

    // Update immediately
    updateElapsed();

    // Set up interval to update every second
    const interval = setInterval(updateElapsed, 1000);

    return () => clearInterval(interval);
  }, [matchStartTime, status]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return {
    elapsed,
    formattedTime: formatTime(elapsed),
    isRunning,
  };
};
