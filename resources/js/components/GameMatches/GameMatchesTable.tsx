import { DollarOutlined, EyeOutlined, SettingOutlined, TeamOutlined, TrophyOutlined } from '@ant-design/icons';
import { router } from '@inertiajs/react';
import { Button, Card, Space, Table, Tag, Typography, message } from 'antd';
import { format } from 'date-fns';
import { useCallback, useEffect, useState } from 'react';
import { gameMatchApi, matchEventApi } from '../../apis/gameMatch';
import { usePermissions } from '../../hooks/usePermissions';
import type { GameMatch } from '../../types/gameMatch.types';
import GameMatchBettingMarketsModal from '../betting/GameMatchBettingMarketsModal';

const { Text } = Typography;

interface GameMatchesTableProps {
  matchSessionId?: number; // Optional - can filter by turf instead
  turfId: number;
  title?: string;
  className?: string;
  showPagination?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

const GameMatchesTable: React.FC<GameMatchesTableProps> = ({
  matchSessionId,
  turfId,
  title = 'Match History',
  className,
  showPagination = false,
  autoRefresh = false,
  refreshInterval = 30000, // 30 seconds
}) => {
  const [gameMatches, setGameMatches] = useState<GameMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [bettingToggleLoading, setBettingToggleLoading] = useState<number | null>(null);
  const [marketsModalOpen, setMarketsModalOpen] = useState(false);
  const [selectedGameMatch, setSelectedGameMatch] = useState<GameMatch | null>(null);

  const permissions = usePermissions();
  const canManageBetting = permissions.canManageSessions(); // Assuming betting management requires session management permissions

  const loadGameMatches = useCallback(async () => {
    if (!matchSessionId && !turfId) return;

    setLoading(true);
    try {
      const includeParams =
        'firstTeam.teamPlayers.player.user,secondTeam.teamPlayers.player.user,winningTeam,matchEvents.player.user,matchEvents.team,matchEvents.relatedPlayer.user';

      const response = matchSessionId
        ? await gameMatchApi.getByMatchSession(matchSessionId, { include: includeParams })
        : await gameMatchApi.getByTurf(turfId, { include: includeParams });

      // Sort matches by match_time in descending order (most recent first)
      const sortedMatches = (response.data || []).sort((a, b) => new Date(b.match_time).getTime() - new Date(a.match_time).getTime());
      setGameMatches(sortedMatches);
    } catch (error) {
      console.error('Failed to load game matches:', error);
      message.error('Failed to load match history');
    } finally {
      setLoading(false);
    }
  }, [matchSessionId, turfId]);

  useEffect(() => {
    loadGameMatches();
  }, [loadGameMatches]);

  // Auto refresh functionality
  useEffect(() => {
    if (!autoRefresh || !refreshInterval) return;

    const interval = setInterval(loadGameMatches, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, loadGameMatches]);

  // Handle betting enable/disable
  const handleToggleBetting = useCallback(
    async (gameMatch: GameMatch) => {
      setBettingToggleLoading(gameMatch.id);
      try {
        if (gameMatch.betting_enabled) {
          await matchEventApi.disableBetting(gameMatch.id);
          message.success('Betting disabled for this match');
        } else {
          await matchEventApi.enableBetting(gameMatch.id);
          message.success('Betting enabled for this match');
        }
        // Refresh the game matches to get updated betting status
        await loadGameMatches();
      } catch (error) {
        console.error('Failed to toggle betting:', error);
        message.error('Failed to update betting status');
      } finally {
        setBettingToggleLoading(null);
      }
    },
    [loadGameMatches],
  );

  // Handle opening betting markets management
  const handleManageMarkets = useCallback((gameMatch: GameMatch) => {
    setSelectedGameMatch(gameMatch);
    setMarketsModalOpen(true);
  }, []);

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

  const handleViewMatch = (gameMatch: GameMatch) => {
    const sessionId = matchSessionId || gameMatch.match_session_id;

    if (sessionId) {
      router.visit(
        route('web.turfs.match-sessions.game-matches.show', {
          turf: turfId,
          matchSession: sessionId,
          gameMatch: gameMatch.id,
        }),
      );
    } else {
      // For standalone matches, show a message or handle differently
      message.info('Match details view coming soon for standalone matches');
    }
  };

  const columns = [
    {
      title: 'Match',
      key: 'match',
      render: (record: GameMatch) => (
        <div className="flex items-center space-x-2">
          <TrophyOutlined className="text-yellow-500" />
          <Text strong>#{record.id}</Text>
        </div>
      ),
      width: 100,
    },
    {
      title: 'Teams',
      key: 'teams',
      render: (record: GameMatch) => (
        <div className="flex space-x-1">
          <div className="flex items-center space-x-1">
            <div className="team-color-indicator h-3 w-3 rounded-full border" style={{ backgroundColor: record.first_team?.color || '#1890ff' }} />
            <Text className="truncate text-xs font-medium sm:text-sm">{record.first_team?.name}</Text>
          </div>
          <Text type="secondary" className="hidden text-center text-xs sm:block">
            vs
          </Text>
          <div className="flex items-center space-x-1">
            <div className="team-color-indicator h-3 w-3 rounded-full border" style={{ backgroundColor: record.second_team?.color || '#52c41a' }} />
            <Text className="truncate text-xs font-medium sm:text-sm">{record.second_team?.name}</Text>
          </div>
        </div>
      ),
    },
    {
      title: 'Score',
      key: 'score',
      render: (record: GameMatch) => (
        <div className="text-center">
          <Text strong className={`text-base sm:text-lg ${record.status === 'in_progress' ? 'live-score text-green-500' : ''}`}>
            {record.first_team_score} - {record.second_team_score}
          </Text>
          {record.winning_team && record.status === 'completed' && <div className="mt-1 text-xs text-green-600 dark:text-green-400">🏆 Winner</div>}
        </div>
      ),
      width: 100,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusText = status === 'in_progress' ? 'LIVE' : status.toUpperCase();
        return (
          <Tag color={getStatusColor(status)} className={status === 'in_progress' ? 'animate-pulse' : ''}>
            {statusText}
          </Tag>
        );
      },
      width: 100,
    },
    {
      title: 'Time',
      dataIndex: 'match_time',
      key: 'match_time',
      render: (time: string) => (
        <Text type="secondary" className="text-sm">
          {format(new Date(time), 'HH:mm')}
        </Text>
      ),
      width: 80,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: GameMatch) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              handleViewMatch(record);
            }}
            className="h-auto p-0 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            size="small"
          >
            <span className="ml-1 hidden sm:inline">View</span>
          </Button>

          {/* Betting Controls - Only show for upcoming matches and if user can manage betting */}
          {canManageBetting && (
            <>
              <Button
                type="link"
                icon={<DollarOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleBetting(record);
                }}
                loading={bettingToggleLoading === record.id}
                className={`h-auto p-0 ${record.betting_enabled ? 'text-red-500 hover:text-red-700' : 'text-green-500 hover:text-green-700'}`}
                size="small"
                title={record.betting_enabled ? 'Disable Betting' : 'Enable Betting'}
              >
                <span className="ml-1 hidden sm:inline">{record.betting_enabled ? 'Disable' : 'Enable'}</span>
              </Button>

              {/* Markets Management - Only show if betting is enabled */}
              {record.betting_enabled && (
                <Button
                  type="link"
                  icon={<SettingOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleManageMarkets(record);
                  }}
                  className="h-auto p-0 text-purple-500 hover:text-purple-700"
                  size="small"
                  title="Manage Markets"
                >
                  <span className="ml-1 hidden sm:inline">Markets</span>
                </Button>
              )}
            </>
          )}
        </Space>
      ),
      width: 120,
    },
  ];

  return (
    <>
      <Card
        title={
          <div className="flex items-center space-x-2">
            <TeamOutlined />
            <span>{title}</span>
            {gameMatches.length > 0 && (
              <Tag color="blue" className="ml-2">
                {gameMatches.length} {gameMatches.length === 1 ? 'match' : 'matches'}
              </Tag>
            )}
          </div>
        }
        className={className}
        size="small"
      >
        {gameMatches.length > 0 ? (
          <Table
            dataSource={gameMatches}
            columns={columns}
            rowKey="id"
            loading={loading}
            pagination={showPagination ? { pageSize: 10, size: 'small' } : false}
            size="small"
            scroll={{ x: 600 }}
            className="game-matches-table"
            rowClassName="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
            onRow={(record) => ({
              onClick: () => handleViewMatch(record),
            })}
          />
        ) : (
          <div className="py-8 text-center">
            <TrophyOutlined className="mb-2 text-4xl text-gray-300 dark:text-gray-600" />
            <Text type="secondary" className="block">
              No matches played yet
            </Text>
            <Text type="secondary" className="text-sm">
              Matches will appear here once they are scheduled
            </Text>
          </div>
        )}
      </Card>

      {/* Betting Markets Management Modal */}
      <GameMatchBettingMarketsModal open={marketsModalOpen} onClose={() => setMarketsModalOpen(false)} gameMatch={selectedGameMatch} />
    </>
  );
};

export default GameMatchesTable;
