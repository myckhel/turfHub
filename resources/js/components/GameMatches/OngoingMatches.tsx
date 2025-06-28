import { ReloadOutlined } from '@ant-design/icons';
import { Button, Card, Divider, Empty, Space, Spin, Typography } from 'antd';
import React, { useCallback, useEffect, useState } from 'react';
import { matchSessionApi } from '../../apis/matchSession';
import type { GameMatch } from '../../types/gameMatch.types';
import type { MatchSession } from '../../types/matchSession.types';
import OngoingGameMatch from './OngoingGameMatch';

const { Title, Text } = Typography;

interface OngoingMatchData {
  gameMatch: GameMatch;
  matchSession: MatchSession;
}

interface OngoingMatchesProps {
  turfId: number;
  turf?: { id: number; name: string };
  autoRefresh?: boolean;
  refreshInterval?: number;
  showEmptyState?: boolean;
}

const OngoingMatches: React.FC<OngoingMatchesProps> = ({ turfId, turf, autoRefresh = true, refreshInterval = 30000, showEmptyState = true }) => {
  const [ongoingMatches, setOngoingMatches] = useState<OngoingMatchData[]>([]);
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

        // Get active match sessions for this turf
        const activeSessionsResponse = await matchSessionApi.getActiveTurfSessions(turfId);

        if (activeSessionsResponse.data?.length > 0) {
          const matches: OngoingMatchData[] = [];

          // Check each active session for ongoing matches
          for (const session of activeSessionsResponse.data) {
            try {
              const ongoingMatchResponse = await matchSessionApi.getCurrentOngoingMatch(session.id);
              if (ongoingMatchResponse.data) {
                matches.push(ongoingMatchResponse.data);
              }
            } catch (error) {
              console.error(`Failed to get ongoing match for session ${session.id}:`, error);
            }
          }

          setOngoingMatches(matches);
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
    [turfId],
  );

  useEffect(() => {
    loadOngoingMatches();
  }, [loadOngoingMatches]);

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
              🔴 Live Matches {turf?.name && `- ${turf.name}`}
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
      {ongoingMatches.map((matchData) => (
        <OngoingGameMatch
          key={`${matchData.gameMatch.id}-${matchData.matchSession.id}`}
          gameMatch={matchData.gameMatch}
          matchSession={matchData.matchSession}
          onMatchUpdate={handleMatchUpdate}
        />
      ))}

      {/* Divider after ongoing matches */}
      <Divider />
    </div>
  );
};

export default OngoingMatches;
