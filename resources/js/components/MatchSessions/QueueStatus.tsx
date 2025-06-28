import { router } from '@inertiajs/react';
import { Alert, Button, Card, Spin, Tag, Typography } from 'antd';
import React, { useCallback, useEffect, useState } from 'react';
import { matchSessionApi } from '../../apis/matchSession';
import type { QueueStatus as QueueStatusType } from '../../types/matchSession.types';

const { Text } = Typography;

/**
 * QueueStatus Component
 *
 * A reusable component that displays the queue status for a match session.
 * Teams are displayed in their queue order with their current status (waiting, next_to_play, playing, completed).
 *
 * Features:
 * - Auto-refresh for active sessions
 * - Clickable teams that navigate to team details
 * - Customizable refresh intervals
 * - Loading and error states
 * - Responsive design with hover effects
 * - Accessibility support (keyboard navigation)
 *
 * @example
 * // Basic usage
 * <QueueStatus
 *   matchSessionId={123}
 *   turfId={456}
 *   isActive={true}
 * />
 *
 * @example
 * // Custom configuration
 * <QueueStatus
 *   matchSessionId={123}
 *   turfId={456}
 *   isActive={true}
 *   autoRefresh={false}
 *   showTitle={false}
 *   onTeamClick={(teamId) => console.log('Custom action', teamId)}
 * />
 */
interface QueueStatusProps {
  matchSessionId: number;
  turfId: number;
  isActive?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
  showTitle?: boolean;
  className?: string;
  onTeamClick?: (teamId: number) => void;
}

const QueueStatus: React.FC<QueueStatusProps> = ({
  matchSessionId,
  turfId,
  isActive = false,
  autoRefresh = true,
  refreshInterval = 10000,
  showTitle = true,
  className,
  onTeamClick,
}) => {
  const [queueStatus, setQueueStatus] = useState<QueueStatusType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadQueueStatus = useCallback(async () => {
    try {
      setError(null);
      const response = await matchSessionApi.getQueueStatus(matchSessionId);
      setQueueStatus(response.data);
    } catch (error) {
      console.error('Failed to load queue status:', error);
      setError('Failed to load queue status');
    } finally {
      setLoading(false);
    }
  }, [matchSessionId]);

  useEffect(() => {
    loadQueueStatus();
  }, [loadQueueStatus]);

  // Auto-refresh queue status for active sessions
  useEffect(() => {
    if (isActive && autoRefresh) {
      const interval = setInterval(loadQueueStatus, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [isActive, autoRefresh, refreshInterval, loadQueueStatus]);

  const handleTeamClick = useCallback(
    (teamId: number) => {
      if (onTeamClick) {
        onTeamClick(teamId);
      } else {
        // Default navigation to team show page
        router.visit(
          route('web.turfs.match-sessions.teams.show', {
            turf: turfId,
            matchSession: matchSessionId,
            team: teamId,
          }),
        );
      }
    },
    [onTeamClick, turfId, matchSessionId],
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'playing':
        return 'green';
      case 'next_to_play':
        return 'blue';
      case 'waiting':
        return 'default';
      case 'completed':
        return 'purple';
      default:
        return 'default';
    }
  };

  const getStatusText = (status: string) => {
    return status.replace('_', ' ').toUpperCase();
  };

  if (loading) {
    return (
      <Card title={showTitle ? 'Queue Status' : undefined} className={className}>
        <div className="flex justify-center py-4">
          <Spin size="default" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card title={showTitle ? 'Queue Status' : undefined} className={className}>
        <Alert
          message="Error"
          description={error}
          type="error"
          action={
            <Button size="small" onClick={loadQueueStatus}>
              Retry
            </Button>
          }
        />
      </Card>
    );
  }

  if (!queueStatus || queueStatus.length === 0) {
    return (
      <Card title={showTitle ? 'Queue Status' : undefined} className={className}>
        <Text type="secondary">No teams in queue</Text>
      </Card>
    );
  }

  return (
    <Card title={showTitle ? 'Queue Status' : undefined} className={className}>
      <div className="space-y-2">
        {queueStatus.map((queueItem) => (
          <div
            key={queueItem.id}
            className="flex cursor-pointer items-center justify-between rounded border p-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
            onClick={() => queueItem.team && handleTeamClick(queueItem.team.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if ((e.key === 'Enter' || e.key === ' ') && queueItem.team) {
                e.preventDefault();
                handleTeamClick(queueItem.team.id);
              }
            }}
          >
            <div className="flex-1">
              <Text strong className="block">
                {queueItem.team?.name || 'Unknown Team'}
              </Text>
              <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                <span>Position: {queueItem.queue_position}</span>
                {queueItem.reason && <span>• {queueItem.reason}</span>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Tag color={getStatusColor(queueItem.status)}>{getStatusText(queueItem.status)}</Tag>
              {queueItem.status === 'playing' && <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" title="Currently playing" />}
            </div>
          </div>
        ))}
      </div>

      {isActive && (
        <div className="mt-3 flex items-center justify-between border-t pt-3 text-xs text-gray-500">
          <span>Auto-refreshing every {refreshInterval / 1000}s</span>
          <Button size="small" type="text" onClick={loadQueueStatus}>
            Refresh Now
          </Button>
        </div>
      )}
    </Card>
  );
};

export default QueueStatus;
