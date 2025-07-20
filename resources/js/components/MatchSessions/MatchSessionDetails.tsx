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
import { Col, Descriptions, Row, Space, Tag, Typography, message } from 'antd';
import { format } from 'date-fns';
import React, { memo, useState } from 'react';
import { matchSessionApi } from '../../apis/matchSession';
import { usePermissions } from '../../hooks/usePermissions';
import type { GameMatch as GameMatchType } from '../../types/gameMatch.types';
import type { MatchSession } from '../../types/matchSession.types';
import { Turf } from '../../types/turf.types';
import { GameMatchesTable, OngoingGameMatch } from '../GameMatches';
import MatchSessionTeam from '../Teams/MatchSessionTeam';
import { Button, Card } from '../ui';
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
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <Card className="mb-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1">
              <Title level={2} className="mb-2 text-lg sm:text-xl lg:text-2xl">
                {matchSession.name}
              </Title>
              <Space wrap className="flex-wrap">
                <Tag color={getStatusColor(matchSession.status)} className="text-xs sm:text-sm">
                  {matchSession.status.toUpperCase()}
                </Tag>
                {matchSession.is_active && (
                  <Tag color="green" icon={<PlayCircleOutlined />} className="text-xs sm:text-sm">
                    LIVE
                  </Tag>
                )}
                <Text type="secondary" className="text-xs sm:text-sm">
                  {matchSession.time_slot === 'morning' ? '🌅 Morning' : '🌆 Evening'}
                </Text>
              </Space>
            </div>

            {canManageSessions && (
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap lg:flex-nowrap">
                <Button
                  icon={<EditOutlined />}
                  onClick={handleEditSession}
                  disabled={matchSession.status === 'completed'}
                  size="small"
                  className="min-h-[36px] touch-manipulation"
                >
                  <span className="hidden sm:inline">Edit Session</span>
                  <span className="sm:hidden">Edit</span>
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
                  size="small"
                  className="min-h-[36px] touch-manipulation"
                >
                  <span className="hidden sm:inline">Manage Teams</span>
                  <span className="sm:hidden">Teams</span>
                </Button>

                {matchSession.status === 'scheduled' && (
                  <Button
                    variant="primary"
                    icon={<PlayCircleOutlined />}
                    onClick={handleStartSession}
                    loading={actionLoading}
                    className="min-h-[36px] touch-manipulation border-green-600 bg-green-600 hover:border-green-700 hover:bg-green-700"
                    size="small"
                  >
                    <span className="hidden sm:inline">Start Session</span>
                    <span className="sm:hidden">Start</span>
                  </Button>
                )}

                {matchSession.is_active && (
                  <Button
                    danger
                    icon={<PauseCircleOutlined />}
                    onClick={handleStopSession}
                    loading={actionLoading}
                    size="small"
                    className="min-h-[36px] touch-manipulation"
                  >
                    <span className="hidden sm:inline">Stop Session</span>
                    <span className="sm:hidden">Stop</span>
                  </Button>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* Ongoing Game Match */}
        {ongoingMatch && <OngoingGameMatch gameMatch={ongoingMatch as GameMatchType} matchSession={matchSession} />}

        <Row gutter={[12, 16]}>
          {/* Session Details */}
          <Col xs={24} lg={12}>
            <Card title="Session Details" className="mb-4 lg:mb-6">
              <Descriptions column={1} size="small" className="text-sm">
                <Descriptions.Item label="Date">
                  <CalendarOutlined className="mr-1" />
                  <span className="text-xs sm:text-sm">{format(new Date(matchSession.session_date), 'MMMM dd, yyyy')}</span>
                </Descriptions.Item>
                <Descriptions.Item label="Time">
                  <ClockCircleOutlined className="mr-1" />
                  <span className="text-xs sm:text-sm">
                    {matchSession.start_time} - {matchSession.end_time}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="Max Teams">
                  <TeamOutlined className="mr-1" />
                  <span className="text-xs sm:text-sm">{matchSession.max_teams}</span>
                </Descriptions.Item>
                <Descriptions.Item label="Current Teams">
                  <span className="text-xs sm:text-sm">
                    {matchSession.teams?.length || 0} / {matchSession.max_teams}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="Matches Played">
                  <TrophyOutlined className="mr-1" />
                  <span className="text-xs sm:text-sm">{matchSession.game_matches?.length || 0}</span>
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>

          {/* Queue Status */}
          <Col xs={24} lg={12}>
            <QueueStatus
              matchSessionId={matchSessionId}
              turfId={turfId}
              isActive={matchSession.is_active}
              autoRefresh={true}
              refreshInterval={10000}
              showTitle={true}
              className="mb-4 lg:mb-6"
            />
          </Col>
        </Row>

        {/* Player Team Flow - For players to join teams */}
        {!canManageSessions && <MatchSessionTeam matchSessionId={matchSessionId} />}

        {/* Standings */}
        <MatchSessionStandings
          teams={matchSession.teams || []}
          matchSessionId={matchSessionId}
          turfId={turfId}
          maxPlayersPerTeam={matchSession.max_players_per_team}
          className="mb-4 lg:mb-6"
        />

        {/* Game Matches */}
        <GameMatchesTable
          matchSessionId={matchSessionId}
          turfId={turfId}
          title="Match History"
          className="mb-4 lg:mb-6"
          autoRefresh={matchSession.is_active}
          refreshInterval={15000}
        />
      </div>
    </div>
  );
};

export default memo(MatchSessionDetails);
