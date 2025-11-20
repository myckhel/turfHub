import { Card, Col, Row, Typography } from 'antd';
import React, { useCallback, useEffect, useState } from 'react';
import { gameMatchApi } from '../../apis/gameMatch';
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

const OngoingGameMatch: React.FC<OngoingGameMatchProps> = ({ gameMatch, matchSession, gameMatchId }) => {
  const permissions = usePermissions();
  const canManageSessions = permissions.canManageSessions();

  const [currentMatch, setCurrentMatch] = useState<GameMatch | null>(gameMatch || null);
  const [, setInitialLoading] = useState(!gameMatch || !matchSession);

  // Determine which IDs to use
  const resolvedGameMatchId = gameMatch?.id || gameMatchId;

  // Reload game match data
  const loadGameMatch = useCallback(async () => {
    if (!resolvedGameMatchId) return;

    try {
      const response = await gameMatchApi.getById(resolvedGameMatchId, {
        include:
          'firstTeam.teamPlayers,secondTeam.teamPlayers.player.user,winningTeam,matchEvents.player.user,matchEvents.team,matchEvents.relatedPlayer.user',
      });

      setCurrentMatch(response);
    } catch (error) {
      console.error('Failed to load game match:', error);
    }
  }, [resolvedGameMatchId]);

  const handleMatchUpdate = () => loadGameMatch();

  // Auto-refresh for ongoing matches
  useEffect(() => {
    if (currentMatch?.status === 'in_progress') {
      const interval = setInterval(loadGameMatch, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [currentMatch?.status, loadGameMatch]);

  // Initialize data
  useEffect(() => {
    const initializeData = async () => {
      if (!gameMatch) {
        setInitialLoading(true);
        try {
          await loadGameMatch();
        } catch (error) {
          console.error('Failed to initialize data:', error);
        } finally {
          setInitialLoading(false);
        }
      }
    };

    initializeData();
  }, [gameMatch, resolvedGameMatchId, loadGameMatch]);

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
