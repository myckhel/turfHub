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
        <Table
          dataSource={matchSessions}
          columns={columns}
          rowKey="id"
          pagination={false}
          size="middle"
          scroll={{ y: maxHeight }}
          loading={loading}
        />
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
