import { CalendarOutlined, PauseCircleOutlined, PlayCircleOutlined, TeamOutlined, TrophyOutlined } from '@ant-design/icons';
import { router } from '@inertiajs/react';
import { Button, Card, Empty, Row, Space, Spin, Tag, Typography } from 'antd';
import { format } from 'date-fns';
import React, { useCallback, useEffect, useState } from 'react';
import { matchSessionApi } from '../apis/matchSession';
import { usePermissions } from '../hooks/usePermissions';
import type { MatchSession } from '../types/matchSession.types';
import { OngoingMatches } from './GameMatches';

const { Title, Text } = Typography;

interface TurfLiveSessionsProps {
  turfId: number;
  turf?: { id: number; name: string };
  autoRefresh?: boolean;
  refreshInterval?: number;
}

const SessionCard: React.FC<{
  session: MatchSession;
}> = React.memo(({ session }) => {
  const permissions = usePermissions();
  const canManageSessions = permissions.canManageSessions();

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Tag color="green" icon={<PlayCircleOutlined />}>
            Active
          </Tag>
        );
      case 'scheduled':
        return (
          <Tag color="blue" icon={<CalendarOutlined />}>
            Scheduled
          </Tag>
        );
      case 'completed':
        return (
          <Tag color="gold" icon={<TrophyOutlined />}>
            Completed
          </Tag>
        );
      case 'cancelled':
        return (
          <Tag color="red" icon={<PauseCircleOutlined />}>
            Cancelled
          </Tag>
        );
      default:
        return <Tag>{status}</Tag>;
    }
  };

  const formatTime = (time: string) => {
    return format(time, 'h:mm a');
  };

  return (
    <Card
      className="mb-4 w-full"
      size="small"
      extra={
        <Space>
          {getStatusTag(session.status)}
          {canManageSessions && session.status === 'active' && (
            <Button
              size="small"
              type="link"
              onClick={() => router.visit(route('web.turfs.match-sessions.show', { turf: session.turf_id, matchSession: session.id }))}
            >
              Manage
            </Button>
          )}
        </Space>
      }
    >
      <div className="flex items-center justify-between">
        <div>
          <Title level={5} className="mb-1">
            {session.name}
          </Title>
          <Text type="secondary" className="text-sm">
            {formatTime(session.start_time)} - {formatTime(session.end_time)}
          </Text>
        </div>

        <div className="text-right">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <TeamOutlined />
            <span>
              {session.teams?.length || 0}/{session.max_teams} teams
            </span>
          </div>
        </div>
      </div>

      {/* Show ongoing matches for this session */}
      {session.status === 'active' && (
        <div className="mt-4">
          <OngoingMatches
            matchSession={session}
            autoRefresh={true}
            refreshInterval={15000}
            showEmptyState={false}
            title={`🔴 Live Match - ${session.name}`}
          />
        </div>
      )}
    </Card>
  );
});

const TurfLiveSessions: React.FC<TurfLiveSessionsProps> = ({ turfId, turf, autoRefresh = true, refreshInterval = 60000 }) => {
  const [activeSessions, setActiveSessions] = useState<MatchSession[]>([]);
  const [loading, setLoading] = useState(true);

  const loadActiveSessions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await matchSessionApi.getActiveTurfSessions(turfId);
      setActiveSessions(response.data || []);
    } catch (error) {
      console.error('Failed to load active sessions:', error);
      setActiveSessions([]);
    } finally {
      setLoading(false);
    }
  }, [turfId]);

  useEffect(() => {
    loadActiveSessions();
  }, [loadActiveSessions]);

  // Auto-refresh active sessions
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        loadActiveSessions();
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, loadActiveSessions]);

  if (loading) {
    return (
      <Card>
        <div className="py-8 text-center">
          <Spin size="large" />
          <div className="mt-4">
            <Text type="secondary">Loading live sessions...</Text>
          </div>
        </div>
      </Card>
    );
  }

  if (activeSessions.length === 0) {
    return (
      <Card>
        <div className="py-8 text-center">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <span>
                <Text type="secondary">No active sessions</Text>
                <br />
                <Text type="secondary" className="text-sm">
                  Live sessions will appear here when they are started
                </Text>
              </span>
            }
          />
        </div>
      </Card>
    );
  }

  return (
    <div className="mb-6">
      {/* Header */}
      <Card className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <Title level={3} className="mb-1">
              🟢 Live Sessions {turf?.name && `- ${turf.name}`}
            </Title>
            <Text type="secondary">
              {activeSessions.length} active session{activeSessions.length !== 1 ? 's' : ''}
            </Text>
          </div>
        </div>
      </Card>

      {/* Active Sessions */}
      <Row className="w-full">
        {activeSessions.map((session) => (
          <SessionCard key={session.id} session={session} />
        ))}
      </Row>
    </div>
  );
};

export default TurfLiveSessions;
