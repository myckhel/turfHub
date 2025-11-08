import { ArrowLeftOutlined, CalendarOutlined, ClockCircleOutlined, DollarCircleOutlined, TrophyOutlined, UserOutlined } from '@ant-design/icons';
import { router, usePage } from '@inertiajs/react';
import { Col, Descriptions, Row, Space, Tag, Timeline, Typography } from 'antd';
import { format } from 'date-fns';
import React from 'react';
import { Button, Card } from '../../../components/ui';
import type { GameMatch } from '../../../types/gameMatch.types';
import type { PageProps } from '../../../types/global.types';
import type { MatchSession } from '../../../types/matchSession.types';
import type { Turf } from '../../../types/turf.types';

const { Title, Text } = Typography;

interface ShowProps extends PageProps {
  turf: Turf;
  matchSession: MatchSession;
  gameMatch: GameMatch;
}

const Show: React.FC = () => {
  const { turf, matchSession, gameMatch } = usePage<ShowProps>().props;

  const handleGoBack = () => {
    router.visit(
      route('web.turfs.match-sessions.show', {
        turf: turf.id,
        matchSession: matchSession.id,
      }),
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'in_progress':
        return 'processing';
      case 'upcoming':
        return 'blue';
      case 'postponed':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'goal':
        return '⚽';
      case 'yellow_card':
        return '🟨';
      case 'red_card':
        return '🟥';
      case 'substitution_in':
        return '🔄';
      case 'substitution_out':
        return '↩️';
      default:
        return '📝';
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'goal':
        return 'green';
      case 'yellow_card':
        return 'yellow';
      case 'red_card':
        return 'red';
      case 'substitution_in':
      case 'substitution_out':
        return 'blue';
      default:
        return 'default';
    }
  };

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <Button icon={<ArrowLeftOutlined />} onClick={handleGoBack} className="mb-4" size="large">
            Back to Match Session
          </Button>

          <Card>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="mb-4 lg:mb-0">
                <Title level={2} className="mb-2">
                  Match #{gameMatch.id}
                </Title>
                <Space wrap>
                  <Tag color={getStatusColor(gameMatch.status)}>{gameMatch.status === 'in_progress' ? 'LIVE' : gameMatch.status.toUpperCase()}</Tag>
                  <Text type="secondary">
                    <CalendarOutlined className="mr-1" />
                    {format(new Date(gameMatch.match_time), 'MMMM dd, yyyy')}
                  </Text>
                  <Text type="secondary">
                    <ClockCircleOutlined className="mr-1" />
                    {format(new Date(gameMatch.match_time), 'HH:mm')}
                  </Text>
                </Space>
              </div>

              {/* Score Display */}
              <div className="text-center lg:text-right">
                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-8">
                  <div className="mb-4 text-center sm:mb-0">
                    <div className="mb-2 flex items-center space-x-2">
                      <div className="h-4 w-4 rounded-full border" style={{ backgroundColor: gameMatch.first_team?.color || '#1890ff' }} />
                      <Text strong className="text-lg">
                        {gameMatch.first_team?.name}
                      </Text>
                    </div>
                  </div>

                  <div className="mb-4 text-center sm:mb-0">
                    <Text className="text-4xl font-bold">
                      {gameMatch.first_team_score} - {gameMatch.second_team_score}
                    </Text>
                  </div>

                  <div className="text-center">
                    <div className="mb-2 flex items-center space-x-2">
                      <div className="h-4 w-4 rounded-full border" style={{ backgroundColor: gameMatch.second_team?.color || '#52c41a' }} />
                      <Text strong className="text-lg">
                        {gameMatch.second_team?.name}
                      </Text>
                    </div>
                  </div>
                </div>

                {gameMatch.winning_team && gameMatch.status === 'completed' && (
                  <div className="mt-4">
                    <Tag color="gold" icon={<TrophyOutlined />} className="px-4 py-2 text-lg">
                      Winner: {gameMatch.winning_team.name}
                    </Tag>
                  </div>
                )}
              </div>
            </div>

            {/* Betting Actions */}
            {(gameMatch.status === 'upcoming' || gameMatch.status === 'in_progress') && (
              <div className="mt-4 flex justify-center lg:justify-end">
                <Button
                  variant="primary"
                  icon={<DollarCircleOutlined />}
                  onClick={() => router.visit(route('web.betting.game-matches.show', { gameMatch: gameMatch.id }))}
                  size="large"
                  className="border-0 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
                >
                  Place Bet
                </Button>
              </div>
            )}
          </Card>
        </div>

        <Row gutter={[16, 16]}>
          {/* Match Details */}
          <Col xs={24} lg={12}>
            <Card title="Match Details" className="h-full">
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Match Session">
                  <Button
                    variant="accent"
                    onClick={() =>
                      router.visit(
                        route('web.turfs.match-sessions.show', {
                          turf: turf.id,
                          matchSession: matchSession.id,
                        }),
                      )
                    }
                    className="h-auto p-0"
                  >
                    {matchSession.name}
                  </Button>
                </Descriptions.Item>
                <Descriptions.Item label="Turf">
                  <Button variant="accent" onClick={() => router.visit(route('web.turfs.show', { turf: turf.id }))} className="h-auto p-0">
                    {turf.name}
                  </Button>
                </Descriptions.Item>
                <Descriptions.Item label="Match Time">
                  <CalendarOutlined className="mr-1" />
                  {format(new Date(gameMatch.match_time), 'MMMM dd, yyyy HH:mm')}
                </Descriptions.Item>
                <Descriptions.Item label="Outcome">
                  {gameMatch.outcome ? (
                    <Tag color={gameMatch.outcome === 'win' ? 'green' : gameMatch.outcome === 'loss' ? 'red' : 'blue'}>
                      {gameMatch.outcome.toUpperCase()}
                    </Tag>
                  ) : (
                    <Text type="secondary">No outcome recorded</Text>
                  )}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>

          {/* Teams */}
          <Col xs={24} lg={12}>
            <Card title="Team Lineups" className="h-full">
              <Row gutter={16}>
                <Col span={12}>
                  <div className="mb-4 text-center">
                    <div className="mb-2 flex items-center justify-center space-x-2">
                      <div className="h-4 w-4 rounded-full border" style={{ backgroundColor: gameMatch.first_team?.color || '#1890ff' }} />
                      <Text strong>{gameMatch.first_team?.name}</Text>
                    </div>
                    <Text className="text-2xl font-bold">{gameMatch.first_team_score}</Text>
                  </div>
                  <div className="space-y-2">
                    {gameMatch.first_team?.teamPlayers?.map((teamPlayer) => (
                      <div key={teamPlayer.id} className="flex items-center space-x-2 text-sm">
                        <UserOutlined className="text-gray-400" />
                        <Text>{teamPlayer.player?.user?.name}</Text>
                      </div>
                    ))}
                    {(!gameMatch.first_team?.teamPlayers || gameMatch.first_team.teamPlayers.length === 0) && (
                      <Text type="secondary" className="text-sm">
                        No players listed
                      </Text>
                    )}
                  </div>
                </Col>
                <Col span={12}>
                  <div className="mb-4 text-center">
                    <div className="mb-2 flex items-center justify-center space-x-2">
                      <div className="h-4 w-4 rounded-full border" style={{ backgroundColor: gameMatch.second_team?.color || '#52c41a' }} />
                      <Text strong>{gameMatch.second_team?.name}</Text>
                    </div>
                    <Text className="text-2xl font-bold">{gameMatch.second_team_score}</Text>
                  </div>
                  <div className="space-y-2">
                    {gameMatch.second_team?.teamPlayers?.map((teamPlayer) => (
                      <div key={teamPlayer.id} className="flex items-center space-x-2 text-sm">
                        <UserOutlined className="text-gray-400" />
                        <Text>{teamPlayer.player?.user?.name}</Text>
                      </div>
                    ))}
                    {(!gameMatch.second_team?.teamPlayers || gameMatch.second_team.teamPlayers.length === 0) && (
                      <Text type="secondary" className="text-sm">
                        No players listed
                      </Text>
                    )}
                  </div>
                </Col>
              </Row>
            </Card>
          </Col>

          {/* Match Events */}
          <Col span={24}>
            <Card title="Match Events">
              {gameMatch.match_events && gameMatch.match_events.length > 0 ? (
                <Timeline mode="left" className="mt-4">
                  {gameMatch.match_events
                    .sort((a, b) => a.minute - b.minute)
                    .map((event) => (
                      <Timeline.Item
                        key={event.id}
                        label={
                          <Text strong className="text-blue-600">
                            {event.minute}'
                          </Text>
                        }
                        dot={<div className="text-lg">{getEventIcon(event.type)}</div>}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <Tag color={getEventColor(event.type)}>{event.type.replace('_', ' ').toUpperCase()}</Tag>
                            <div className="h-3 w-3 rounded-full border" style={{ backgroundColor: event.team?.color || '#1890ff' }} />
                            <Text strong>{event.team?.name}</Text>
                          </div>
                          <div className="flex items-center space-x-2">
                            <UserOutlined className="text-gray-400" />
                            <Text>{event.player?.user?.name}</Text>
                          </div>
                          {event.comment && (
                            <Text type="secondary" className="text-sm">
                              {event.comment}
                            </Text>
                          )}
                        </div>
                      </Timeline.Item>
                    ))}
                </Timeline>
              ) : (
                <div className="py-8 text-center">
                  <TrophyOutlined className="mb-2 text-4xl text-gray-300 dark:text-gray-600" />
                  <Text type="secondary" className="block">
                    No match events recorded
                  </Text>
                  <Text type="secondary" className="text-sm">
                    Goals, cards, and substitutions will appear here
                  </Text>
                </div>
              )}
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default Show;
