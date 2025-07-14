import { ClockCircleOutlined, EditOutlined, PauseCircleOutlined, PlayCircleOutlined, SaveOutlined, TrophyOutlined } from '@ant-design/icons';
import { Badge, Button, Card, Col, InputNumber, Row, Spin, Tag, Typography, message } from 'antd';
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
        <Row justify="center">
          <Col xs={24}>
            <Spin size="large" />
            <div className="mt-4">
              <Text type="secondary" className="text-sm sm:text-base">
                Loading match data...
              </Text>
            </div>
          </Col>
        </Row>
      </Card>
    );
  }

  // Show error state if no match data
  if (!currentMatch) {
    return (
      <Card className="py-8 text-center">
        <Row justify="center">
          <Col xs={24}>
            <Text type="secondary" className="text-sm sm:text-base">
              No match data available
            </Text>
          </Col>
        </Row>
      </Card>
    );
  }

  return (
    <div className="ongoing-game-match space-y-4 md:space-y-6">
      {/* Match Header */}
      <Card className="overflow-hidden">
        <Row gutter={[16, 16]} align="middle">
          {/* Title and Status Section */}
          <Col xs={24} lg={16}>
            <div className="space-y-3">
              {/* Team Names - Responsive Layout */}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                <Title level={3} className="mb-0 text-base leading-tight sm:text-lg md:text-xl lg:text-2xl">
                  <span className="block sm:inline">{currentMatch.first_team?.name}</span>
                  <span className="mx-2 hidden sm:inline">vs</span>
                  <span className="block sm:inline">{currentMatch.second_team?.name}</span>
                </Title>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge status={getStatusColor(currentMatch.status)} />
                  <Tag color={getStatusColor(currentMatch.status)} icon={getStatusIcon(currentMatch.status)} className="text-xs">
                    {currentMatch.status.replace('_', ' ').toUpperCase()}
                  </Tag>
                  {isLive && (
                    <Tag color="red" className="animate-pulse text-xs">
                      LIVE
                    </Tag>
                  )}
                </div>
              </div>

              {/* Match Time */}
              <div className="text-xs sm:text-sm">
                <Text type="secondary">
                  <ClockCircleOutlined className="mr-1" />
                  {format(new Date(currentMatch.match_time), 'MMM dd, yyyy HH:mm')}
                </Text>
              </div>
            </div>
          </Col>

          {/* Action Buttons Section */}
          {canManageSessions && (
            <Col xs={24} lg={8}>
              <div className="flex flex-col gap-2 sm:flex-row lg:flex-col lg:items-end xl:flex-row xl:items-center">
                {isUpcoming && (
                  <Button
                    type="primary"
                    icon={<PlayCircleOutlined />}
                    onClick={handleStartMatch}
                    loading={loading}
                    className="w-full sm:w-auto"
                    size="small"
                  >
                    <span className="hidden sm:inline">Start Match</span>
                    <span className="sm:hidden">Start</span>
                  </Button>
                )}

                {(isLive || isUpcoming) && !isEditingScore && (
                  <Button icon={<EditOutlined />} onClick={() => setIsEditingScore(true)} className="w-full sm:w-auto" size="small">
                    <span className="hidden sm:inline">Edit Score</span>
                    <span className="sm:hidden">Edit</span>
                  </Button>
                )}

                {isEditingScore && (
                  <div className="flex w-full flex-col gap-2 sm:flex-row">
                    <Button onClick={handleCancelEdit} className="w-full sm:w-auto" size="small">
                      Cancel
                    </Button>
                    <Button icon={<SaveOutlined />} onClick={handleSaveScore} loading={loading} className="w-full sm:w-auto" size="small">
                      Save
                    </Button>
                    {isLive && (
                      <Button type="primary" danger onClick={handleSetResult} loading={loading} className="w-full sm:w-auto" size="small">
                        <span className="hidden md:inline">End Match & Set Result</span>
                        <span className="md:hidden">End Match</span>
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </Col>
          )}
        </Row>
      </Card>

      {/* Score Display */}
      <Card title="Score" className="text-center">
        <Row gutter={[16, 24]} align="middle" justify="center">
          {/* First Team */}
          <Col className="order-1 sm:order-1">
            <div className="space-y-3 text-center">
              <div>
                <Tag color={currentMatch.first_team?.color || 'blue'} className="px-3 py-1 text-sm font-medium sm:text-base">
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
                  className="w-20 text-center sm:w-24"
                  style={{ fontSize: '1.5rem' }}
                />
              ) : (
                <Text className="block text-3xl font-bold sm:text-4xl">{currentMatch.first_team_score}</Text>
              )}
            </div>
          </Col>

          {/* VS Divider */}
          <Col className="order-2 sm:order-2">
            <div className="py-2 text-center sm:py-0">
              <Text className="text-4xl font-bold text-gray-400 sm:text-6xl">VS</Text>
            </div>
          </Col>

          {/* Second Team */}
          <Col className="order-3 sm:order-3">
            <div className="space-y-3 text-center">
              <div>
                <Tag color={currentMatch.second_team?.color || 'red'} className="px-3 py-1 text-sm font-medium sm:text-base">
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
                  className="w-20 text-center sm:w-24"
                  style={{ fontSize: '1.5rem' }}
                />
              ) : (
                <Text className="block text-3xl font-bold sm:text-4xl">{currentMatch.second_team_score}</Text>
              )}
            </div>
          </Col>
        </Row>

        {/* Match Result */}
        {isCompleted && (
          <Row justify="center" className="mt-6">
            <Col xs={24} className="text-center">
              {currentMatch.winning_team ? (
                <Tag color="gold" className="px-4 py-2 text-base sm:text-lg">
                  🏆 Winner: {currentMatch.winning_team.name}
                </Tag>
              ) : currentMatch.first_team_score === currentMatch.second_team_score ? (
                <Tag color="orange" className="px-4 py-2 text-base sm:text-lg">
                  🤝 Draw
                </Tag>
              ) : null}
            </Col>
          </Row>
        )}
      </Card>

      {/* Match Events */}
      {canManageSessions && (
        <Row>
          <Col xs={24}>
            <MatchEventsList gameMatch={currentMatch} onEventUpdate={loadGameMatch} />
          </Col>
        </Row>
      )}
    </div>
  );
};

export default OngoingGameMatch;
