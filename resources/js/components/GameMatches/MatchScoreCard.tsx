import { MinusOutlined, PlayCircleOutlined, PlusOutlined, SaveOutlined, TrophyOutlined } from '@ant-design/icons';
import { Button, Card, Col, Row, Tag, Typography, message } from 'antd';
import { memo, useState } from 'react';
import { gameMatchApi } from '../../apis/gameMatch';
import type { GameMatch } from '../../types/gameMatch.types';
import MatchHeader from './MatchHeader';

const { Text } = Typography;

interface MatchScoreCardProps {
  gameMatch: GameMatch;
  canManageSessions: boolean;
  onMatchUpdate: () => void;
}

const MatchScoreCard = memo(({ gameMatch, canManageSessions, onMatchUpdate }: MatchScoreCardProps) => {
  const [firstTeamScore, setFirstTeamScore] = useState(gameMatch.first_team_score);
  const [secondTeamScore, setSecondTeamScore] = useState(gameMatch.second_team_score);
  const [loading, setLoading] = useState(false);

  const isLive = gameMatch.status === 'in_progress';
  const isCompleted = gameMatch.status === 'completed';
  const isUpcoming = gameMatch.status === 'upcoming';
  const hasScoreChanged = firstTeamScore !== gameMatch.first_team_score || secondTeamScore !== gameMatch.second_team_score;

  const handleScoreChange = (team: 'first' | 'second', delta: number) => {
    if (team === 'first') {
      setFirstTeamScore(Math.max(0, firstTeamScore + delta));
    } else {
      setSecondTeamScore(Math.max(0, secondTeamScore + delta));
    }
  };

  const handleSaveScore = async () => {
    setLoading(true);
    try {
      await gameMatchApi.update(gameMatch.id, {
        first_team_score: firstTeamScore,
        second_team_score: secondTeamScore,
      });

      message.success('Score updated successfully');
      onMatchUpdate();
    } catch (error) {
      console.error('Failed to update score:', error);
      message.error('Failed to update score');
    } finally {
      setLoading(false);
    }
  };

  const handleStartMatch = async () => {
    setLoading(true);
    try {
      await gameMatchApi.update(gameMatch.id, {
        status: 'in_progress',
        match_time: new Date().toISOString(),
        first_team_score: firstTeamScore,
        second_team_score: secondTeamScore,
      });

      message.success('Match started successfully');
      onMatchUpdate();
    } catch (error) {
      console.error('Failed to start match:', error);
      message.error('Failed to start match');
    } finally {
      setLoading(false);
    }
  };

  const handleEndMatch = async () => {
    setLoading(true);
    try {
      await gameMatchApi.update(gameMatch.id, {
        first_team_score: firstTeamScore,
        second_team_score: secondTeamScore,
        status: 'completed',
      });

      message.success('Match ended successfully');
      onMatchUpdate();
    } catch (error) {
      console.error('Failed to end match:', error);
      message.error('Failed to end match');
    } finally {
      setLoading(false);
    }
  };

  const handleResetScore = () => {
    setFirstTeamScore(gameMatch.first_team_score);
    setSecondTeamScore(gameMatch.second_team_score);
  };

  return (
    <Card title="Score" className="text-center">
      <div className="mb-4 flex justify-center">
        <MatchHeader gameMatch={gameMatch} />
      </div>
      <Row gutter={[16, 24]} align="middle" justify="center">
        {/* First Team */}
        <Col className="order-1 sm:order-1">
          <div className="space-y-3 text-center">
            <div>
              <Tag color={gameMatch.first_team?.color || 'blue'} className="px-3 py-1 text-sm font-medium sm:text-base">
                {gameMatch.first_team?.name}
              </Tag>
            </div>

            <div className="flex flex-col items-center gap-2">
              <Text className="block text-3xl font-bold sm:text-4xl">{firstTeamScore}</Text>

              {canManageSessions && !isCompleted && (
                <div className="flex items-center gap-1">
                  <Button
                    size="small"
                    icon={<MinusOutlined />}
                    onClick={() => handleScoreChange('first', -1)}
                    disabled={firstTeamScore === 0}
                    className="h-8 w-8"
                  />
                  <Button size="small" icon={<PlusOutlined />} onClick={() => handleScoreChange('first', 1)} className="h-8 w-8" />
                </div>
              )}
            </div>
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
              <Tag color={gameMatch.second_team?.color || 'red'} className="px-3 py-1 text-sm font-medium sm:text-base">
                {gameMatch.second_team?.name}
              </Tag>
            </div>

            <div className="flex flex-col items-center gap-2">
              <Text className="block text-3xl font-bold sm:text-4xl">{secondTeamScore}</Text>

              {canManageSessions && !isCompleted && (
                <div className="flex items-center gap-1">
                  <Button
                    size="small"
                    icon={<MinusOutlined />}
                    onClick={() => handleScoreChange('second', -1)}
                    disabled={secondTeamScore === 0}
                    className="h-8 w-8"
                  />
                  <Button size="small" icon={<PlusOutlined />} onClick={() => handleScoreChange('second', 1)} className="h-8 w-8" />
                </div>
              )}
            </div>
          </div>
        </Col>
      </Row>

      {/* Action Buttons - Show when score changes or for match state transitions */}
      {canManageSessions && (hasScoreChanged || isUpcoming || isLive) && !isCompleted && (
        <Row justify="center" className="mt-6">
          <Col xs={24} className="text-center">
            <div className="flex flex-wrap justify-center gap-2">
              {hasScoreChanged && (
                <>
                  <Button onClick={handleResetScore} size="small">
                    Reset
                  </Button>
                  <Button icon={<SaveOutlined />} onClick={handleSaveScore} loading={loading} size="small" type="default">
                    Save Score
                  </Button>
                </>
              )}

              {isUpcoming && (
                <Button type="primary" icon={<PlayCircleOutlined />} onClick={handleStartMatch} loading={loading} size="small">
                  Start Match
                </Button>
              )}

              {isLive && (
                <Button type="primary" danger icon={<TrophyOutlined />} onClick={handleEndMatch} loading={loading} size="small">
                  End Match
                </Button>
              )}
            </div>
          </Col>
        </Row>
      )}

      {/* Match Result */}
      {isCompleted && (
        <Row justify="center" className="mt-6">
          <Col xs={24} className="text-center">
            {gameMatch.winning_team ? (
              <Tag color="gold" className="px-4 py-2 text-base sm:text-lg">
                🏆 Winner: {gameMatch.winning_team.name}
              </Tag>
            ) : gameMatch.first_team_score === gameMatch.second_team_score ? (
              <Tag color="orange" className="px-4 py-2 text-base sm:text-lg">
                🤝 Draw
              </Tag>
            ) : null}
          </Col>
          {/* Next Match */}
          <Button
            type="primary"
            className="mt-4 text-sm sm:text-base"
            onClick={() => {
              window.location.reload(); // Reload to fetch next match
            }}
          >
            Next Match
          </Button>
        </Row>
      )}
    </Card>
  );
});

MatchScoreCard.displayName = 'MatchScoreCard';

export default MatchScoreCard;
