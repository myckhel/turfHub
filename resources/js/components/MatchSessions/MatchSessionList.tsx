import {
  CalendarOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  PlusOutlined,
  TeamOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import { router } from '@inertiajs/react';
import { Button, Card, Empty, message, Popconfirm, Space, Spin, Table, Tag, Tooltip, Typography } from 'antd';
import { format } from 'date-fns';
import React, { useCallback, useEffect, useState } from 'react';
import { matchSessionApi } from '../../apis/matchSession';
import { usePermissions } from '../../hooks/usePermissions';
import type { MatchSession } from '../../types/matchSession.types';

const { Title, Text } = Typography;

interface MatchSessionListProps {
  turfId: number;
  showCreateButton?: boolean;
  maxHeight?: number;
}

const MatchSessionList: React.FC<MatchSessionListProps> = ({ turfId, showCreateButton = true, maxHeight = 400 }) => {
  const permissions = usePermissions();
  const canManageSessions = permissions.canManageSessions();

  const [matchSessions, setMatchSessions] = useState<MatchSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<{ [key: number]: boolean }>({});

  // Move getStatusColor function to be accessible by both table and cards
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'scheduled':
        return 'blue';
      case 'completed':
        return 'default';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const loadMatchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const response = await matchSessionApi.getByTurf(turfId, {
        include: 'teams,gameMatches',
        per_page: 20,
      });
      setMatchSessions(response.data);
    } catch (error) {
      console.error('Failed to load match sessions:', error);
      message.error('Failed to load match sessions');
    } finally {
      setLoading(false);
    }
  }, [turfId]);

  useEffect(() => {
    loadMatchSessions();
  }, [loadMatchSessions]);

  const handleCreateSession = () => {
    router.visit(route('web.turfs.match-sessions.create', { turf: turfId }));
  };

  const handleViewSession = (sessionId: number) => {
    router.visit(route('web.turfs.match-sessions.show', { turf: turfId, matchSession: sessionId }));
  };

  const handleEditSession = (sessionId: number) => {
    router.visit(route('web.turfs.match-sessions.edit', { turf: turfId, matchSession: sessionId }));
  };

  const handleStartSession = async (sessionId: number) => {
    setActionLoading((prev) => ({ ...prev, [sessionId]: true }));
    try {
      await matchSessionApi.start(sessionId);
      message.success('Match session started successfully');
      await loadMatchSessions();
    } catch (error) {
      console.error('Failed to start session:', error);
      message.error('Failed to start match session');
    } finally {
      setActionLoading((prev) => ({ ...prev, [sessionId]: false }));
    }
  };

  const handleStopSession = async (sessionId: number) => {
    setActionLoading((prev) => ({ ...prev, [sessionId]: true }));
    try {
      await matchSessionApi.stop(sessionId);
      message.success('Match session stopped successfully');
      await loadMatchSessions();
    } catch (error) {
      console.error('Failed to stop session:', error);
      message.error('Failed to stop match session');
    } finally {
      setActionLoading((prev) => ({ ...prev, [sessionId]: false }));
    }
  };

  const handleDeleteSession = async (sessionId: number) => {
    setActionLoading((prev) => ({ ...prev, [sessionId]: true }));
    try {
      await matchSessionApi.delete(sessionId);
      message.success('Match session deleted successfully');
      await loadMatchSessions();
    } catch (error) {
      console.error('Failed to delete session:', error);
      message.error('Failed to delete match session');
    } finally {
      setActionLoading((prev) => ({ ...prev, [sessionId]: false }));
    }
  };

  // Mobile-friendly card component for match sessions
  interface MatchSessionCardProps {
    session: MatchSession;
    canManageSessions: boolean;
    actionLoading: { [key: number]: boolean };
    onView: (sessionId: number) => void;
    onEdit: (sessionId: number) => void;
    onStart: (sessionId: number) => void;
    onStop: (sessionId: number) => void;
    onDelete: (sessionId: number) => void;
  }

  const MatchSessionCard: React.FC<MatchSessionCardProps> = ({
    session,
    canManageSessions,
    actionLoading,
    onView,
    onEdit,
    onStart,
    onStop,
    onDelete,
  }) => {
    return (
      <Card
        size="small"
        className="mb-3"
        extra={
          <div className="flex flex-wrap gap-1">
            <Tag color={getStatusColor(session.status)} className="text-xs">
              {session.status.toUpperCase()}
            </Tag>
            {session.is_active && (
              <Tag color="green" icon={<PlayCircleOutlined />} className="text-xs">
                LIVE
              </Tag>
            )}
          </div>
        }
      >
        <div className="space-y-3">
          {/* Header */}
          <div>
            <Title level={5} className="mb-1 text-sm">
              {session.name}
            </Title>
            <Text type="secondary" className="text-xs">
              {session.time_slot === 'morning' ? '🌅 Morning' : '🌆 Evening'}
            </Text>
          </div>

          {/* Date & Time */}
          <div className="flex flex-col gap-1 text-xs">
            <div className="flex items-center gap-1">
              <CalendarOutlined />
              <span>{format(new Date(session.session_date), 'MMM dd, yyyy')}</span>
            </div>
            <div className="flex items-center gap-1 text-gray-500">
              <ClockCircleOutlined />
              <span>
                {session.start_time} - {session.end_time}
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1">
              <TeamOutlined />
              <span>
                {session.teams?.length || 0} / {session.max_teams} teams
              </span>
            </div>
            <div className="flex items-center gap-1">
              <TrophyOutlined />
              <span>{session.game_matches?.length || 0} matches</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-1">
            <Button type="text" size="small" icon={<EyeOutlined />} onClick={() => onView(session.id)}>
              View
            </Button>

            {canManageSessions && (
              <>
                <Button type="text" size="small" icon={<EditOutlined />} onClick={() => onEdit(session.id)} disabled={session.status === 'completed'}>
                  Edit
                </Button>

                {session.status === 'scheduled' && (
                  <Button
                    type="text"
                    size="small"
                    icon={<PlayCircleOutlined />}
                    onClick={() => onStart(session.id)}
                    loading={actionLoading[session.id]}
                    className="text-green-600 hover:text-green-700"
                  >
                    Start
                  </Button>
                )}

                {session.is_active && (
                  <Button
                    type="text"
                    size="small"
                    icon={<PauseCircleOutlined />}
                    onClick={() => onStop(session.id)}
                    loading={actionLoading[session.id]}
                    className="text-orange-600 hover:text-orange-700"
                  >
                    Stop
                  </Button>
                )}

                <Popconfirm
                  title="Delete session?"
                  description="This action cannot be undone"
                  onConfirm={() => onDelete(session.id)}
                  okText="Yes"
                  cancelText="No"
                >
                  <Button type="text" size="small" icon={<DeleteOutlined />} loading={actionLoading[session.id]} danger>
                    Delete
                  </Button>
                </Popconfirm>
              </>
            )}
          </div>
        </div>
      </Card>
    );
  };

  const columns = [
    {
      title: 'Session Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: MatchSession) => (
        <div>
          <Text strong>{name}</Text>
          <br />
          <Text type="secondary" className="text-xs">
            {record.time_slot === 'morning' ? '🌅 Morning' : '🌆 Evening'}
          </Text>
        </div>
      ),
    },
    {
      title: 'Date & Time',
      key: 'datetime',
      render: (record: MatchSession) => (
        <div>
          <div className="flex items-center gap-1 text-sm">
            <CalendarOutlined />
            {format(new Date(record.session_date), 'MMM dd, yyyy')}
          </div>
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <ClockCircleOutlined />
            {record.start_time} - {record.end_time}
          </div>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string, record: MatchSession) => (
        <Space>
          <Tag color={getStatusColor(status)}>{status.toUpperCase()}</Tag>
          {record.is_active && (
            <Tag color="green" icon={<PlayCircleOutlined />}>
              LIVE
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'Teams',
      key: 'teams',
      render: (record: MatchSession) => (
        <div className="flex items-center gap-1">
          <TeamOutlined />
          <Text>
            {record.teams?.length || 0} / {record.max_teams}
          </Text>
        </div>
      ),
    },
    {
      title: 'Matches',
      key: 'matches',
      render: (record: MatchSession) => (
        <div className="flex items-center gap-1">
          <TrophyOutlined />
          <Text>{record.game_matches?.length || 0}</Text>
        </div>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: MatchSession) => (
        <Space size="small">
          <Tooltip title="View Details">
            <Button type="text" size="small" icon={<EyeOutlined />} onClick={() => handleViewSession(record.id)} />
          </Tooltip>

          {canManageSessions && (
            <>
              <Tooltip title="Edit Session">
                <Button
                  type="text"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => handleEditSession(record.id)}
                  disabled={record.status === 'completed'}
                />
              </Tooltip>

              {record.status === 'scheduled' && (
                <Tooltip title="Start Session">
                  <Button
                    type="text"
                    size="small"
                    icon={<PlayCircleOutlined />}
                    onClick={() => handleStartSession(record.id)}
                    loading={actionLoading[record.id]}
                    className="text-green-600 hover:text-green-700"
                  />
                </Tooltip>
              )}

              {record.is_active && (
                <Tooltip title="Stop Session">
                  <Button
                    type="text"
                    size="small"
                    icon={<PauseCircleOutlined />}
                    onClick={() => handleStopSession(record.id)}
                    loading={actionLoading[record.id]}
                    className="text-orange-600 hover:text-orange-700"
                  />
                </Tooltip>
              )}

              <Popconfirm
                title="Delete Session"
                description="Are you sure you want to delete this match session? This action cannot be undone."
                onConfirm={() => handleDeleteSession(record.id)}
                okText="Delete"
                cancelText="Cancel"
                okButtonProps={{ danger: true }}
              >
                <Tooltip title="Delete Session">
                  <Button
                    type="text"
                    size="small"
                    icon={<DeleteOutlined />}
                    loading={actionLoading[record.id]}
                    danger
                    disabled={record.is_active || record.status === 'active'}
                  />
                </Tooltip>
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ];

  if (loading && matchSessions.length === 0) {
    return (
      <Card>
        <div className="flex justify-center py-8">
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  return (
    <Card
      title={
        <div className="flex items-center justify-between">
          <Title level={4} className="mb-0">
            Match Sessions
          </Title>
          {showCreateButton && canManageSessions && (
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateSession}>
              Create Session
            </Button>
          )}
        </div>
      }
      className="w-full"
    >
      {matchSessions.length > 0 ? (
        <>
          <div className="hidden md:block">
            <Table
              dataSource={matchSessions}
              columns={columns}
              rowKey="id"
              pagination={false}
              size="middle"
              scroll={{ y: maxHeight }}
              loading={loading}
            />
          </div>

          <div className="block md:hidden">
            {matchSessions.map((session) => (
              <MatchSessionCard
                key={session.id}
                session={session}
                canManageSessions={canManageSessions}
                actionLoading={actionLoading}
                onView={handleViewSession}
                onEdit={handleEditSession}
                onStart={handleStartSession}
                onStop={handleStopSession}
                onDelete={handleDeleteSession}
              />
            ))}
          </div>
        </>
      ) : (
        <Empty description="No match sessions found" image={Empty.PRESENTED_IMAGE_SIMPLE}>
          {canManageSessions && (
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateSession}>
              Create First Session
            </Button>
          )}
        </Empty>
      )}
    </Card>
  );
};

export default MatchSessionList;
