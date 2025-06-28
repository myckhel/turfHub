import { ReloadOutlined } from '@ant-design/icons';
import { Button, Card, Divider, Empty, Space, Spin, Typography } from 'antd';
import React, { useCallback, useEffect, useState } from 'react';
import { matchSessionApi } from '../../apis/matchSession';
import type { GameMatch } from '../../types/gameMatch.types';
import type { MatchSession } from '../../types/matchSession.types';
import OngoingGameMatch from './OngoingGameMatch';

const { Title, Text } = Typography;

interface OngoingMatchesProps {
  // Provide matchSession or matchSessionId for specific session
  matchSession?: MatchSession;
  matchSessionId?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
  showEmptyState?: boolean;
  title?: string;
}

const OngoingMatches: React.FC<OngoingMatchesProps> = ({
  matchSession,
  matchSessionId,
  autoRefresh = true,
  refreshInterval = 30000,
  showEmptyState = true,
  title,
}) => {
  const [ongoingMatches, setOngoingMatches] = useState<GameMatch[]>([]);
  const [currentMatchSession, setCurrentMatchSession] = useState<MatchSession | undefined>(matchSession);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadOngoingMatches = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        let sessionToUse = matchSession || currentMatchSession;

        // If no matchSession prop and we have matchSessionId, fetch the session
        if (!sessionToUse && matchSessionId) {
          try {
            const sessionResponse = await matchSessionApi.getById(matchSessionId);
            sessionToUse = sessionResponse.data;
            setCurrentMatchSession(sessionToUse);
          } catch (error) {
            console.error(`Failed to fetch match session ${matchSessionId}:`, error);
            setOngoingMatches([]);
            return;
          }
        }

        if (sessionToUse) {
          // Get ongoing match for specific session
          try {
            const ongoingMatchResponse = await matchSessionApi.getCurrentOngoingMatch(sessionToUse.id);
            setOngoingMatches(ongoingMatchResponse.data);
          } catch (error) {
            console.error(`Failed to get ongoing match for session ${sessionToUse.id}:`, error);
            setOngoingMatches([]);
          }
        } else {
          setOngoingMatches([]);
        }
      } catch (error) {
        console.error('Failed to load ongoing matches:', error);
        setOngoingMatches([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [matchSession, matchSessionId, currentMatchSession],
  );

  useEffect(() => {
    loadOngoingMatches();
  }, [loadOngoingMatches]);

  // Update currentMatchSession when matchSession prop changes
  useEffect(() => {
    if (matchSession) {
      setCurrentMatchSession(matchSession);
    }
  }, [matchSession]);

  // Auto-refresh ongoing matches
  useEffect(() => {
    if (autoRefresh && ongoingMatches.length > 0) {
      const interval = setInterval(() => {
        loadOngoingMatches(true);
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [autoRefresh, ongoingMatches.length, refreshInterval, loadOngoingMatches]);

  const handleMatchUpdate = useCallback(() => {
    loadOngoingMatches(true);
  }, [loadOngoingMatches]);

  const handleRefresh = () => {
    loadOngoingMatches(true);
  };

  if (loading) {
    return (
      <Card>
        <div className="py-8 text-center">
          <Spin size="large" />
          <div className="mt-4">
            <Text type="secondary">Loading ongoing matches...</Text>
          </div>
        </div>
      </Card>
    );
  }

  if (ongoingMatches.length === 0) {
    if (!showEmptyState) {
      return null;
    }

    return (
      <Card>
        <div className="py-8 text-center">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <span>
                <Text type="secondary">No ongoing matches</Text>
                <br />
                <Text type="secondary" className="text-sm">
                  Active matches will appear here when they start
                </Text>
              </span>
            }
          />
        </div>
      </Card>
    );
  }

  return (
    <div className="mb-6 space-y-6">
      {/* Header */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <Title level={3} className="mb-1">
              {title || '🔴 Live Matches'}
            </Title>
            <Text type="secondary">
              {ongoingMatches.length} ongoing match{ongoingMatches.length !== 1 ? 'es' : ''}
            </Text>
          </div>

          <Space>
            <Button icon={<ReloadOutlined spin={refreshing} />} onClick={handleRefresh} loading={refreshing} type="text">
              Refresh
            </Button>
          </Space>
        </div>
      </Card>

      {/* Ongoing Matches */}
      {ongoingMatches.map((gameMatch) => {
        const sessionForMatch = matchSession || currentMatchSession;
        if (!sessionForMatch) return null;

        return (
          <OngoingGameMatch
            key={`${gameMatch.id}-${sessionForMatch.id}`}
            gameMatch={gameMatch}
            matchSession={sessionForMatch}
            onMatchUpdate={handleMatchUpdate}
          />
        );
      })}

      {/* Divider after ongoing matches */}
      <Divider />
    </div>
  );
};

export default OngoingMatches;
