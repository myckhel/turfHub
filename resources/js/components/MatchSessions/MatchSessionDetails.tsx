import {
  CalendarOutlined,
  ClockCircleOutlined,
  EditOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  TeamOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import { router } from '@inertiajs/react';
import { Button, Card, Col, Descriptions, Row, Space, Table, Tag, Typography, message } from 'antd';
import { format } from 'date-fns';
import React, { useState } from 'react';
import { matchSessionApi } from '../../apis/matchSession';
import { usePermissions } from '../../hooks/usePermissions';
import type { GameMatch as GameMatchType } from '../../types/gameMatch.types';
import type { GameMatch, MatchSession } from '../../types/matchSession.types';
import { Turf } from '../../types/turf.types';
import { OngoingGameMatch } from '../GameMatches';
import { PlayerTeamFlow } from '../Teams';
import { MatchSessionStandings, QueueStatus } from './index';

const { Title, Text } = Typography;

interface MatchSessionDetailsProps {
  turf: Turf;
  matchSession: MatchSession;
}

const MatchSessionDetails: React.FC<MatchSessionDetailsProps> = ({ turf, matchSession }) => {
  const permissions = usePermissions();
  const canManageSessions = permissions.canManageSessions();

  const matchSessionId = matchSession.id;
  const turfId = turf.id;

  const [actionLoading, setActionLoading] = useState(false);

  const handleStartSession = async () => {
    if (!matchSession) return;

    setActionLoading(true);
    try {
      await matchSessionApi.start(matchSession.id);
      message.success('Match session started successfully');
      // await loadMatchSession();
      // Trigger refresh in QueueStatus component via key change or other method
      window.location.reload(); // Temporary solution, ideally use state management
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
      // await loadMatchSession();
      // Trigger refresh in QueueStatus component via key change or other method
      window.location.reload(); // Temporary solution, ideally use state management
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

  const handleTeamClick = (teamId: number) => {
    router.visit(
      route('web.turfs.match-sessions.teams.show', {
        turf: turfId,
        matchSession: matchSessionId,
        team: teamId,
      }),
    );
  };

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

  // Find ongoing/current game match
  const ongoingMatch = matchSession.game_matches?.find(
    (match) => match.status === 'in_progress' || (match.status === 'upcoming' && matchSession.is_active),
  );

  // if (loading) {
  //   return (
  //     <div className="flex justify-center py-8">
  //       <Spin size="large" />
  //     </div>
  //   );
  // }

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

                <Button
                  icon={<TeamOutlined />}
                  onClick={() =>
                    router.visit(
                      route('web.turfs.match-sessions.teams.index', {
                        turf: turfId,
                        matchSession: matchSessionId,
                      }),
                    )
                  }
                >
                  Manage Teams
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

        {/* Ongoing Game Match */}
        {ongoingMatch && (
          <OngoingGameMatch gameMatch={ongoingMatch as GameMatchType} matchSession={matchSession} onMatchUpdate={() => window.location.reload()} />
        )}

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
            <QueueStatus
              matchSessionId={matchSessionId}
              turfId={turfId}
              isActive={matchSession.is_active}
              autoRefresh={true}
              refreshInterval={10000}
              showTitle={true}
              className="mb-6"
            />
          </Col>
        </Row>

        {/* Player Team Flow - For players to join teams */}
        {!canManageSessions && (
          <PlayerTeamFlow
            matchSessionId={matchSessionId}
            onJoinSuccess={() => {
              // loadMatchSession();
              window.location.reload(); // Temporary solution, ideally use state management
            }}
          />
        )}

        {/* Standings */}
        <MatchSessionStandings teams={matchSession.teams || []} matchSessionId={matchSessionId} turfId={turfId} className="mb-6" />

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
