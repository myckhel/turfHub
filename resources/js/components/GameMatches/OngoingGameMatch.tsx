import { Card, Col, Row, Spin, Typography } from 'antd';
import React, { useCallback, useEffect, useState } from 'react';
import { gameMatchApi } from '../../apis/gameMatch';
import { matchSessionApi } from '../../apis/matchSession';
import { usePermissions } from '../../hooks/usePermissions';
import type { GameMatch } from '../../types/gameMatch.types';
import type { MatchSession } from '../../types/matchSession.types';
import { MatchEventsList } from './index';
import MatchScoreCard from './MatchScoreCard';

const { Text } = Typography;

interface OngoingGameMatchProps {
  gameMatch?: GameMatch;
  matchSession?: MatchSession;
  gameMatchId?: number;
  matchSessionId?: number;
}

const OngoingGameMatch: React.FC<OngoingGameMatchProps> = ({ gameMatch, matchSession, gameMatchId, matchSessionId }) => {
  const permissions = usePermissions();
  const canManageSessions = permissions.canManageSessions();

  const [currentMatch, setCurrentMatch] = useState<GameMatch | null>(gameMatch || null);
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

          requests.forEach((req, index) => {
            if (req.type === 'gameMatch') {
              const result = results[index].data as GameMatch;
              if (result) {
                setCurrentMatch(result);
              }
            } else if (req.type === 'matchSession') {
              // Match session data fetched but not currently used in UI
            }
          });
        } catch (error) {
          console.error('Failed to initialize data:', error);
        } finally {
          setInitialLoading(false);
        }
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

  const handleMatchUpdate = () => {
    loadGameMatch();
  };

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

      {/* Score Display with integrated actions */}
      <MatchScoreCard gameMatch={currentMatch} canManageSessions={canManageSessions} onMatchUpdate={handleMatchUpdate} />

      {/* Match Events */}
      {canManageSessions && (
        <Row>
          <Col xs={24}>
            <MatchEventsList gameMatch={currentMatch} />
          </Col>
        </Row>
      )}
    </div>
  );
};

export default OngoingGameMatch;
