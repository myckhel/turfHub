import {
  CalendarOutlined,
  ClockCircleOutlined,
  EditOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  TeamOutlined,
  TrophyOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { router } from '@inertiajs/react';
import { Button, Card, Col, Descriptions, Row, Space, Spin, Table, Tag, Typography, message } from 'antd';
import { format } from 'date-fns';
import React, { useCallback, useEffect, useState } from 'react';
import { matchSessionApi } from '../../apis/matchSession';
import { usePermissions } from '../../hooks/usePermissions';
import type { GameMatch, MatchSession, QueueStatus, Team } from '../../types/matchSession.types';

const { Title, Text } = Typography;

interface MatchSessionDetailsProps {
  turfId: number;
  matchSessionId: number;
}

const MatchSessionDetails: React.FC<MatchSessionDetailsProps> = ({ turfId, matchSessionId }) => {
  const permissions = usePermissions();
  const canManageSessions = permissions.canManageSessions();

  const [matchSession, setMatchSession] = useState<MatchSession | null>(null);
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const loadMatchSession = useCallback(async () => {
    setLoading(true);
    try {
      const response = await matchSessionApi.getById(matchSessionId, {
        include: 'turf,teams,gameMatches,queueLogic',
      });
      setMatchSession(response.data);
    } catch (error) {
      console.error('Failed to load match session:', error);
      message.error('Failed to load match session details');
    } finally {
      setLoading(false);
    }
  }, [matchSessionId]);

  const loadQueueStatus = useCallback(async () => {
    try {
      const response = await matchSessionApi.getQueueStatus(matchSessionId);
      setQueueStatus(response.data);
    } catch (error) {
      console.error('Failed to load queue status:', error);
    }
  }, [matchSessionId]);

  useEffect(() => {
    loadMatchSession();
    loadQueueStatus();
  }, [loadMatchSession, loadQueueStatus]);

  // Auto-refresh queue status for active sessions
  useEffect(() => {
    if (matchSession?.is_active) {
      const interval = setInterval(loadQueueStatus, 10000); // Refresh every 10 seconds
      return () => clearInterval(interval);
    }
  }, [matchSession?.is_active, loadQueueStatus]);

  const handleStartSession = async () => {
    if (!matchSession) return;

    setActionLoading(true);
    try {
      await matchSessionApi.start(matchSession.id);
      message.success('Match session started successfully');
      await loadMatchSession();
      await loadQueueStatus();
    } catch (error) {
      console.error('Failed to start session:', error);
      message.error('Failed to start match session');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStopSession = async () => {
    if (!matchSession) return;

    setActionLoading(true);
    try {
      await matchSessionApi.stop(matchSession.id);
      message.success('Match session stopped successfully');
      await loadMatchSession();
      await loadQueueStatus();
    } catch (error) {
      console.error('Failed to stop session:', error);
      message.error('Failed to stop match session');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditSession = () => {
    router.visit(route('web.turfs.match-sessions.edit', { turf: turfId, matchSession: matchSessionId }));
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

  const teamsColumns = [
    {
      title: 'Team Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: Team) => (
        <div>
          <Text strong>{name}</Text>
          {record.captain && <div className="text-xs text-gray-500">Captain: {record.captain.name}</div>}
        </div>
      ),
    },
    {
      title: 'Players',
      key: 'players',
      render: (record: Team) => (
        <div className="flex items-center gap-1">
          <UserOutlined />
          <Text>{record.players?.length || 0} / 6</Text>
        </div>
      ),
    },
    {
      title: 'Stats',
      key: 'stats',
      render: (record: Team) => (
        <Space>
          <Tag color="green">W: {record.wins}</Tag>
          <Tag color="red">L: {record.losses}</Tag>
          <Tag color="blue">D: {record.draws}</Tag>
        </Space>
      ),
    },
    {
      title: 'Goals',
      key: 'goals',
      render: (record: Team) => (
        <Text>
          {record.goals_for} - {record.goals_against}
        </Text>
      ),
    },
  ];

  const matchesColumns = [
    {
      title: 'Match #',
      dataIndex: 'id',
      key: 'id',
      render: (id: number) => `Match #${id}`,
    },
    {
      title: 'Teams',
      key: 'teams',
      render: (record: GameMatch) => (
        <Text>
          {record.first_team?.name} vs {record.second_team?.name}
        </Text>
      ),
    },
    {
      title: 'Score',
      key: 'score',
      render: (record: GameMatch) => (
        <Text strong>
          {record.first_team_score} - {record.second_team_score}
        </Text>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <Tag color={getStatusColor(status)}>{status.toUpperCase()}</Tag>,
    },
    {
      title: 'Time',
      dataIndex: 'match_time',
      key: 'match_time',
      render: (time: string) => format(new Date(time), 'HH:mm'),
    },
  ];

  console.log({ queueStatus });

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Spin size="large" />
      </div>
    );
  }

  if (!matchSession) {
    return (
      <div className="py-8 text-center">
        <Text>Match session not found</Text>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-green-900">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <Card className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <Title level={2} className="mb-2">
                {matchSession.name}
              </Title>
              <Space>
                <Tag color={getStatusColor(matchSession.status)}>{matchSession.status.toUpperCase()}</Tag>
                {matchSession.is_active && (
                  <Tag color="green" icon={<PlayCircleOutlined />}>
                    LIVE
                  </Tag>
                )}
                <Text type="secondary">{matchSession.time_slot === 'morning' ? '🌅 Morning' : '🌆 Evening'}</Text>
              </Space>
            </div>

            {canManageSessions && (
              <Space>
                <Button icon={<EditOutlined />} onClick={handleEditSession} disabled={matchSession.status === 'completed'}>
                  Edit Session
                </Button>

                {matchSession.status === 'scheduled' && (
                  <Button
                    type="primary"
                    icon={<PlayCircleOutlined />}
                    onClick={handleStartSession}
                    loading={actionLoading}
                    className="border-green-600 bg-green-600 hover:border-green-700 hover:bg-green-700"
                  >
                    Start Session
                  </Button>
                )}

                {matchSession.is_active && (
                  <Button danger icon={<PauseCircleOutlined />} onClick={handleStopSession} loading={actionLoading}>
                    Stop Session
                  </Button>
                )}
              </Space>
            )}
          </div>
        </Card>

        <Row gutter={16}>
          {/* Session Details */}
          <Col span={24} md={12}>
            <Card title="Session Details" className="mb-6">
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Date">
                  <CalendarOutlined className="mr-1" />
                  {format(new Date(matchSession.session_date), 'MMMM dd, yyyy')}
                </Descriptions.Item>
                <Descriptions.Item label="Time">
                  <ClockCircleOutlined className="mr-1" />
                  {matchSession.start_time} - {matchSession.end_time}
                </Descriptions.Item>
                <Descriptions.Item label="Max Teams">
                  <TeamOutlined className="mr-1" />
                  {matchSession.max_teams}
                </Descriptions.Item>
                <Descriptions.Item label="Current Teams">
                  {matchSession.teams?.length || 0} / {matchSession.max_teams}
                </Descriptions.Item>
                <Descriptions.Item label="Matches Played">
                  <TrophyOutlined className="mr-1" />
                  {matchSession.game_matches?.length || 0}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>

          {/* Queue Status */}
          <Col span={24} md={12}>
            {queueStatus && (
              <Card title="Queue Status" className="mb-6">
                {/* {queueStatus.current_match && (
                  <div className="mb-4 rounded border border-green-200 bg-green-50 p-3">
                    <Text strong>Current Match:</Text>
                    <div className="mt-1">
                      {queueStatus.current_match.first_team.name} vs {queueStatus.current_match.second_team.name}
                    </div>
                  </div>
                )} */}

                <div className="space-y-2">
                  {queueStatus.map((team) => (
                    <div key={team.id} className="flex items-center justify-between rounded border p-2">
                      <div>
                        <Text strong>{team.team?.name}</Text>
                        <div className="text-xs text-gray-500">Position: {team.queue_position}</div>
                      </div>
                      <Tag color={team.status === 'playing' ? 'green' : team.status === 'next_to_play' ? 'blue' : 'default'}>
                        {team.status.replace('_', ' ').toUpperCase()}
                      </Tag>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </Col>
        </Row>

        {/* Teams */}
        <Card title="Teams" className="mb-6">
          {matchSession.teams && matchSession.teams.length > 0 ? (
            <Table dataSource={matchSession.teams} columns={teamsColumns} rowKey="id" pagination={false} size="middle" />
          ) : (
            <Text type="secondary">No teams created yet</Text>
          )}
        </Card>

        {/* Game Matches */}
        <Card title="Match History">
          {matchSession.game_matches && matchSession.game_matches.length > 0 ? (
            <Table dataSource={matchSession.game_matches} columns={matchesColumns} rowKey="id" pagination={false} size="middle" />
          ) : (
            <Text type="secondary">No matches played yet</Text>
          )}
        </Card>
      </div>
    </div>
  );
};

export default MatchSessionDetails;
