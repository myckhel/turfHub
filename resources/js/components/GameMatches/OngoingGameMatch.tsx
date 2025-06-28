import { ClockCircleOutlined, EditOutlined, PauseCircleOutlined, PlayCircleOutlined, SaveOutlined, TrophyOutlined } from '@ant-design/icons';
import { Badge, Button, Card, Col, Descriptions, InputNumber, Row, Space, Spin, Tag, Typography, message } from 'antd';
import { format } from 'date-fns';
import React, { useCallback, useEffect, useState } from 'react';
import { gameMatchApi } from '../../apis/gameMatch';
import { matchSessionApi } from '../../apis/matchSession';
import { usePermissions } from '../../hooks/usePermissions';
import type { GameMatch } from '../../types/gameMatch.types';
import type { MatchSession } from '../../types/matchSession.types';
import { MatchEventsList } from './index';

const { Title, Text } = Typography;

interface OngoingGameMatchProps {
  gameMatch?: GameMatch;
  matchSession?: MatchSession;
  gameMatchId?: number;
  matchSessionId?: number;
  onMatchUpdate?: () => void;
}

const OngoingGameMatch: React.FC<OngoingGameMatchProps> = ({ gameMatch, matchSession, gameMatchId, matchSessionId, onMatchUpdate }) => {
  const permissions = usePermissions();
  const canManageSessions = permissions.canManageSessions();

  const [currentMatch, setCurrentMatch] = useState<GameMatch | null>(gameMatch || null);
  const [currentMatchSession, setCurrentMatchSession] = useState<MatchSession | null>(matchSession || null);
  const [isEditingScore, setIsEditingScore] = useState(false);
  const [firstTeamScore, setFirstTeamScore] = useState(0);
  const [secondTeamScore, setSecondTeamScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!gameMatch || !matchSession);

  // Determine which IDs to use
  const resolvedGameMatchId = gameMatch?.id || gameMatchId;
  const resolvedMatchSessionId = matchSession?.id || matchSessionId;

  // Initialize data
  useEffect(() => {
    const initializeData = async () => {
      if (!gameMatch || !matchSession) {
        setInitialLoading(true);
        try {
          const requests = [];

          if (!gameMatch && resolvedGameMatchId) {
            requests.push({
              type: 'gameMatch',
              promise: gameMatchApi.getById(resolvedGameMatchId, {
                include:
                  'firstTeam.teamPlayers.player.user,secondTeam.teamPlayers.player.user,winningTeam,matchEvents.player.user,matchEvents.team,matchEvents.relatedPlayer.user',
              }),
            });
          }

          if (!matchSession && resolvedMatchSessionId) {
            requests.push({
              type: 'matchSession',
              promise: matchSessionApi.getById(resolvedMatchSessionId),
            });
          }

          const results = await Promise.all(requests.map((req) => req.promise));
          let gameMatchResult = gameMatch;

          requests.forEach((req, index) => {
            if (req.type === 'gameMatch') {
              const result = results[index].data as GameMatch;
              if (result) {
                setCurrentMatch(result);
                gameMatchResult = result;
              }
            } else if (req.type === 'matchSession') {
              const result = results[index].data as MatchSession;
              if (result) {
                setCurrentMatchSession(result);
              }
            }
          });

          // Initialize score states
          if (gameMatchResult) {
            setFirstTeamScore(gameMatchResult.first_team_score);
            setSecondTeamScore(gameMatchResult.second_team_score);
          }
        } catch (error) {
          console.error('Failed to initialize data:', error);
        } finally {
          setInitialLoading(false);
        }
      } else {
        setFirstTeamScore(gameMatch.first_team_score);
        setSecondTeamScore(gameMatch.second_team_score);
      }
    };

    initializeData();
  }, [gameMatch, matchSession, resolvedGameMatchId, resolvedMatchSessionId]);

  // Reload game match data
  const loadGameMatch = useCallback(async () => {
    if (!resolvedGameMatchId) return;

    try {
      const response = await gameMatchApi.getById(resolvedGameMatchId, {
        include:
          'firstTeam.teamPlayers.player.user,secondTeam.teamPlayers.player.user,winningTeam,matchEvents.player.user,matchEvents.team,matchEvents.relatedPlayer.user',
      });
      setCurrentMatch(response.data);
    } catch (error) {
      console.error('Failed to load game match:', error);
    }
  }, [resolvedGameMatchId]);

  useEffect(() => {
    if (gameMatch) {
      loadGameMatch();
    }
  }, [gameMatch, loadGameMatch]);

  // Auto-refresh for ongoing matches
  useEffect(() => {
    if (currentMatch?.status === 'in_progress') {
      const interval = setInterval(loadGameMatch, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [currentMatch?.status, loadGameMatch]);

  const handleSaveScore = async () => {
    if (!currentMatch) return;

    setLoading(true);
    try {
      await gameMatchApi.update(currentMatch.id, {
        first_team_score: firstTeamScore,
        second_team_score: secondTeamScore,
      });

      message.success('Score updated successfully');
      setIsEditingScore(false);
      await loadGameMatch();
      onMatchUpdate?.();
    } catch (error) {
      console.error('Failed to update score:', error);
      message.error('Failed to update score');
    } finally {
      setLoading(false);
    }
  };

  const handleSetResult = async () => {
    if (!currentMatch) return;

    setLoading(true);
    try {
      // First update the match status to completed
      await gameMatchApi.update(currentMatch.id, {
        first_team_score: firstTeamScore,
        second_team_score: secondTeamScore,
        status: 'completed',
      });

      // Then use the match session API to set the result (this will trigger queue logic)

      message.success('Match result set successfully');
      setIsEditingScore(false);
      await loadGameMatch();
      onMatchUpdate?.();
    } catch (error) {
      console.error('Failed to set match result:', error);
      message.error('Failed to set match result');
    } finally {
      setLoading(false);
    }
  };

  const handleStartMatch = async () => {
    if (!currentMatch) return;

    setLoading(true);
    try {
      await gameMatchApi.update(currentMatch.id, {
        status: 'in_progress',
        match_time: new Date().toISOString(),
      });

      message.success('Match started successfully');
      await loadGameMatch();
      onMatchUpdate?.();
    } catch (error) {
      console.error('Failed to start match:', error);
      message.error('Failed to start match');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    if (!currentMatch) return;

    setIsEditingScore(false);
    setFirstTeamScore(currentMatch.first_team_score);
    setSecondTeamScore(currentMatch.second_team_score);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress':
        return 'processing';
      case 'completed':
        return 'success';
      case 'upcoming':
        return 'default';
      case 'postponed':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'in_progress':
        return <PlayCircleOutlined />;
      case 'completed':
        return <TrophyOutlined />;
      case 'upcoming':
        return <ClockCircleOutlined />;
      case 'postponed':
        return <PauseCircleOutlined />;
      default:
        return null;
    }
  };

  const isLive = currentMatch?.status === 'in_progress';
  const isCompleted = currentMatch?.status === 'completed';
  const isUpcoming = currentMatch?.status === 'upcoming';

  // Show loading state while fetching data
  if (initialLoading) {
    return (
      <Card className="py-8 text-center">
        <Spin size="large" />
        <div className="mt-4">
          <Text type="secondary">Loading match data...</Text>
        </div>
      </Card>
    );
  }

  // Show error state if no match data
  if (!currentMatch) {
    return (
      <Card className="py-8 text-center">
        <Text type="secondary">No match data available</Text>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Match Header */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <Space align="center">
              <Title level={3} className="mb-0">
                {currentMatch.first_team?.name} vs {currentMatch.second_team?.name}
              </Title>
              <Badge status={getStatusColor(currentMatch.status)} />
              <Tag color={getStatusColor(currentMatch.status)} icon={getStatusIcon(currentMatch.status)}>
                {currentMatch.status.replace('_', ' ').toUpperCase()}
              </Tag>
              {isLive && (
                <Tag color="red" className="animate-pulse">
                  LIVE
                </Tag>
              )}
            </Space>
            <div className="mt-2">
              <Text type="secondary">
                <ClockCircleOutlined className="mr-1" />
                {format(new Date(currentMatch.match_time), 'MMM dd, yyyy HH:mm')}
              </Text>
            </div>
          </div>

          {canManageSessions && (
            <Space>
              {isUpcoming && (
                <Button type="primary" icon={<PlayCircleOutlined />} onClick={handleStartMatch} loading={loading}>
                  Start Match
                </Button>
              )}

              {(isLive || isUpcoming) && !isEditingScore && (
                <Button icon={<EditOutlined />} onClick={() => setIsEditingScore(true)}>
                  Edit Score
                </Button>
              )}

              {isEditingScore && (
                <Space>
                  <Button onClick={handleCancelEdit}>Cancel</Button>
                  <Button icon={<SaveOutlined />} onClick={handleSaveScore} loading={loading}>
                    Save Score
                  </Button>
                  {isLive && (
                    <Button type="primary" danger onClick={handleSetResult} loading={loading}>
                      End Match & Set Result
                    </Button>
                  )}
                </Space>
              )}
            </Space>
          )}
        </div>
      </Card>

      {/* Score Display */}
      <Card title="Score" className="text-center">
        <Row gutter={24} align="middle" justify="center">
          <Col span={8}>
            <div className="text-center">
              <div className="mb-2">
                <Tag color={currentMatch.first_team?.color || 'blue'} className="px-4 py-2 text-lg">
                  {currentMatch.first_team?.name}
                </Tag>
              </div>
              {isEditingScore ? (
                <InputNumber
                  size="large"
                  value={firstTeamScore}
                  onChange={(value) => setFirstTeamScore(value || 0)}
                  min={0}
                  max={50}
                  className="text-center"
                  style={{ fontSize: '2rem', width: '100px' }}
                />
              ) : (
                <Text className="text-4xl font-bold">{currentMatch.first_team_score}</Text>
              )}
            </div>
          </Col>

          <Col span={8}>
            <div className="text-center">
              <Text className="text-6xl font-bold text-gray-400">VS</Text>
            </div>
          </Col>

          <Col span={8}>
            <div className="text-center">
              <div className="mb-2">
                <Tag color={currentMatch.second_team?.color || 'red'} className="px-4 py-2 text-lg">
                  {currentMatch.second_team?.name}
                </Tag>
              </div>
              {isEditingScore ? (
                <InputNumber
                  size="large"
                  value={secondTeamScore}
                  onChange={(value) => setSecondTeamScore(value || 0)}
                  min={0}
                  max={50}
                  className="text-center"
                  style={{ fontSize: '2rem', width: '100px' }}
                />
              ) : (
                <Text className="text-4xl font-bold">{currentMatch.second_team_score}</Text>
              )}
            </div>
          </Col>
        </Row>

        {isCompleted && currentMatch.winning_team && (
          <div className="mt-6">
            <Tag color="gold" className="px-4 py-2 text-lg">
              🏆 Winner: {currentMatch.winning_team.name}
            </Tag>
          </div>
        )}

        {isCompleted && !currentMatch.winning_team && currentMatch.first_team_score === currentMatch.second_team_score && (
          <div className="mt-6">
            <Tag color="orange" className="px-4 py-2 text-lg">
              🤝 Draw
            </Tag>
          </div>
        )}
      </Card>

      {/* Match Details */}
      <Row gutter={16}>
        <Col span={24} md={12}>
          <Card title="Match Information" size="small">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Match Session">{currentMatchSession?.name || matchSession?.name}</Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={getStatusColor(currentMatch.status)} icon={getStatusIcon(currentMatch.status)}>
                  {currentMatch.status.replace('_', ' ').toUpperCase()}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Start Time">{format(new Date(currentMatch.match_time), 'MMM dd, yyyy HH:mm')}</Descriptions.Item>
              {currentMatch.outcome && (
                <Descriptions.Item label="Outcome">
                  <Tag color={currentMatch.outcome === 'win' ? 'green' : currentMatch.outcome === 'loss' ? 'red' : 'orange'}>
                    {currentMatch.outcome.toUpperCase()}
                  </Tag>
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>
        </Col>

        <Col span={24} md={12}>
          <Card title="Teams" size="small">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span>{currentMatch.first_team?.name}</span>
                <Tag color={currentMatch.first_team?.color || 'blue'}>Team 1</Tag>
              </div>
              <div className="flex items-center justify-between">
                <span>{currentMatch.second_team?.name}</span>
                <Tag color={currentMatch.second_team?.color || 'red'}>Team 2</Tag>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Match Events */}
      {canManageSessions && <MatchEventsList gameMatch={currentMatch} onEventUpdate={loadGameMatch} />}
    </div>
  );
};

export default OngoingGameMatch;
