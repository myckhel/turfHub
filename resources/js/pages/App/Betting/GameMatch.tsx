import {
  ArrowLeftOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  EnvironmentOutlined,
  FireOutlined,
  InfoCircleOutlined,
  PlayCircleOutlined,
  TeamOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import { Head, router } from '@inertiajs/react';
import { Alert, Button as AntButton, Card, Col, Divider, Empty, Result, Row, Spin, Statistic, Tag, Tooltip, Typography } from 'antd';
import { format, formatDistanceToNow } from 'date-fns';
import React, { useEffect, useState } from 'react';
import { gameMatchApi } from '../../../apis/gameMatch';
import { BetSlip, MarketCard } from '../../../components/betting';
import { useBettingStore } from '../../../stores';
import type { MarketType } from '../../../types/betting.types';
import { MARKET_TYPE_CONFIGS } from '../../../types/betting.types';
import type { GameMatch } from '../../../types/gameMatch.types';

const { Title, Text } = Typography;

interface GameMatchBettingProps {
  gameMatchId: number;
}

const GameMatchBetting: React.FC<GameMatchBettingProps> = ({ gameMatchId }) => {
  const [gameMatch, setGameMatch] = useState<GameMatch | null>(null);
  const [gameMatchLoading, setGameMatchLoading] = useState(true);
  const [gameMatchError, setGameMatchError] = useState<string | null>(null);
  const [selectedMarketType, setSelectedMarketType] = useState<MarketType | 'all'>('all');

  const { markets, marketsLoading, marketsError, fetchMarkets } = useBettingStore();

  // Fetch game match data
  useEffect(() => {
    const fetchGameMatch = async () => {
      try {
        setGameMatchLoading(true);
        setGameMatchError(null);
        const gameMatchData = await gameMatchApi.getById(gameMatchId, { include: 'first_team,second_team,match_session.turf' });
        setGameMatch(gameMatchData);
      } catch (error) {
        console.error('Error fetching game match:', error);
        setGameMatchError('Failed to load game match data');
      } finally {
        setGameMatchLoading(false);
      }
    };

    fetchGameMatch();
  }, [gameMatchId]);

  useEffect(() => {
    // Fetch markets specific to this game match
    if (gameMatch) {
      fetchMarkets(gameMatch.id);
    }
  }, [fetchMarkets, gameMatch]);

  // Filter markets by type
  const matchMarkets = gameMatch ? markets.filter((market) => market.game_match_id === gameMatch.id) : [];
  const filteredMarkets = selectedMarketType === 'all' ? matchMarkets : matchMarkets.filter((market) => market.type === selectedMarketType);

  // Group markets by type for better organization
  const marketsByType = matchMarkets.reduce(
    (acc, market) => {
      if (!acc[market.type]) {
        acc[market.type] = [];
      }
      acc[market.type].push(market);
      return acc;
    },
    {} as Record<MarketType, typeof markets>,
  );

  // Get match status styling
  const getMatchStatusConfig = (status: string) => {
    switch (status) {
      case 'upcoming':
        return { color: 'blue', icon: <ClockCircleOutlined />, text: 'Upcoming' };
      case 'in_progress':
        return { color: 'green', icon: <PlayCircleOutlined />, text: 'Live' };
      case 'completed':
        return { color: 'purple', icon: <TrophyOutlined />, text: 'Completed' };
      case 'postponed':
        return { color: 'orange', icon: <InfoCircleOutlined />, text: 'Postponed' };
      default:
        return { color: 'default', icon: <InfoCircleOutlined />, text: status };
    }
  };

  const matchStatusConfig = gameMatch ? getMatchStatusConfig(gameMatch.status) : getMatchStatusConfig('scheduled');

  const formatMatchTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return {
        formatted: format(date, "EEEE, MMMM dd, yyyy 'at' HH:mm"),
        relative: formatDistanceToNow(date, { addSuffix: true }),
      };
    } catch {
      return { formatted: dateString, relative: '' };
    }
  };

  const matchTime = gameMatch ? formatMatchTime(gameMatch.match_time) : { formatted: '', relative: '' };

  const handleGoBack = () => {
    router.visit(route('web.betting.index'));
  };

  // Calculate total market stats
  const totalBets = matchMarkets.reduce((sum, market) => sum + (market.total_bets_count || 0), 0);
  const totalVolume = matchMarkets.reduce((sum, market) => sum + (market.total_stake_amount || 0), 0);

  return (
    <>
      <Head title={gameMatch ? `Betting - ${gameMatch.first_team?.name} vs ${gameMatch.second_team?.name}` : 'Betting - Game Match'} />

      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-6">
          {/* Loading State */}
          {gameMatchLoading && (
            <div className="flex min-h-[400px] items-center justify-center">
              <Spin size="large" className="text-white" />
            </div>
          )}

          {/* Error State */}
          {gameMatchError && (
            <div className="flex min-h-[400px] items-center justify-center">
              <Result
                status="error"
                title="Failed to Load Game Match"
                subTitle={gameMatchError}
                extra={
                  <AntButton type="primary" onClick={() => window.location.reload()}>
                    Try Again
                  </AntButton>
                }
              />
            </div>
          )}

          {/* Main Content - Only show when gameMatch is loaded */}
          {!gameMatchLoading && !gameMatchError && gameMatch && (
            <>
              {/* Header Section */}
              <div className="mb-6">
                <div className="mb-4 flex items-center">
                  <AntButton type="text" icon={<ArrowLeftOutlined />} onClick={handleGoBack} className="mr-4 text-white hover:text-gray-300">
                    Back to Markets
                  </AntButton>
                </div>

                <Card className="mb-6">
                  <div className="text-center">
                    {/* Match Teams */}
                    <div className="mb-4 flex items-center justify-center space-x-6">
                      <div className="text-center">
                        <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-blue-500">
                          <TeamOutlined className="text-2xl text-white" />
                        </div>
                        <Title level={4} className="!mb-0">
                          {gameMatch.first_team?.name || 'Team 1'}
                        </Title>
                        {gameMatch.status === 'completed' && <Text className="text-2xl font-bold">{gameMatch.first_team_score}</Text>}
                      </div>

                      <div className="text-center">
                        <div className="mb-2 text-3xl font-bold text-gray-400">VS</div>
                        <Tag color={matchStatusConfig.color} icon={matchStatusConfig.icon} className="text-sm">
                          {matchStatusConfig.text}
                        </Tag>
                      </div>

                      <div className="text-center">
                        <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-red-500">
                          <TeamOutlined className="text-2xl text-white" />
                        </div>
                        <Title level={4} className="!mb-0">
                          {gameMatch.second_team?.name || 'Team 2'}
                        </Title>
                        {gameMatch.status === 'completed' && <Text className="text-2xl font-bold">{gameMatch.second_team_score}</Text>}
                      </div>
                    </div>

                    {/* Match Info */}
                    <div className="flex items-center justify-center space-x-6 text-gray-600">
                      <div className="flex items-center space-x-1">
                        <CalendarOutlined />
                        <span className="text-sm">{matchTime.formatted}</span>
                      </div>
                      {matchTime.relative && (
                        <div className="flex items-center space-x-1">
                          <ClockCircleOutlined />
                          <span className="text-sm">{matchTime.relative}</span>
                        </div>
                      )}
                      {gameMatch.match_session?.turf && (
                        <div className="flex items-center space-x-1">
                          <EnvironmentOutlined />
                          <span className="text-sm">{gameMatch.match_session.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>

                {/* Match Stats */}
                <Row gutter={16} className="mb-6">
                  <Col xs={24} sm={8}>
                    <Card className="text-center">
                      <Statistic
                        title="Available Markets"
                        value={matchMarkets.length}
                        prefix={<TrophyOutlined />}
                        valueStyle={{ color: '#1890ff' }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Card className="text-center">
                      <Statistic title="Total Bets" value={totalBets} prefix={<FireOutlined />} valueStyle={{ color: '#f5222d' }} />
                    </Card>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Card className="text-center">
                      <Statistic
                        title="Total Volume"
                        value={totalVolume}
                        prefix={<DollarOutlined />}
                        formatter={(value) => `₦${value?.toLocaleString()}`}
                        valueStyle={{ color: '#52c41a' }}
                      />
                    </Card>
                  </Col>
                </Row>
              </div>

              {/* Market Type Filters */}
              <Card className="mb-6">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedMarketType('all')}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
                      selectedMarketType === 'all' ? 'bg-blue-500 text-white shadow-lg' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    } `}
                  >
                    All Markets ({matchMarkets.length})
                  </button>

                  {Object.entries(marketsByType).map(([type, typeMarkets]) => {
                    const config = MARKET_TYPE_CONFIGS[type as MarketType];
                    return (
                      <Tooltip key={type} title={config?.description}>
                        <button
                          onClick={() => setSelectedMarketType(type as MarketType)}
                          className={`rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
                            selectedMarketType === type ? 'bg-blue-500 text-white shadow-lg' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          } `}
                        >
                          <span className="mr-2">{config?.icon}</span>
                          {config?.label} ({typeMarkets.length})
                        </button>
                      </Tooltip>
                    );
                  })}
                </div>
              </Card>

              {/* Error State */}
              {marketsError && <Alert type="error" message="Failed to load betting markets" description={marketsError} className="mb-6" showIcon />}

              {/* Markets Section */}
              <Card>
                <div className="mb-4 flex items-center justify-between">
                  <Title level={3} className="!mb-0">
                    <TrophyOutlined className="mr-2" />
                    Betting Markets
                    {selectedMarketType !== 'all' && (
                      <span className="ml-2 text-base font-normal text-gray-500">- {MARKET_TYPE_CONFIGS[selectedMarketType]?.label}</span>
                    )}
                  </Title>

                  {!gameMatch.betting_enabled && (
                    <Tag color="orange" icon={<InfoCircleOutlined />}>
                      Betting Disabled
                    </Tag>
                  )}
                </div>

                {/* Loading State */}
                {marketsLoading ? (
                  <div className="py-12 text-center">
                    <Spin size="large" />
                    <div className="mt-4 text-gray-500">Loading betting markets...</div>
                  </div>
                ) : filteredMarkets.length === 0 ? (
                  /* Empty State */
                  <Empty
                    image={<TrophyOutlined className="text-6xl text-gray-400" />}
                    description={
                      <div className="text-center">
                        <div className="mb-2 text-lg text-gray-600">
                          {!gameMatch.betting_enabled
                            ? 'Betting is not enabled for this match'
                            : selectedMarketType === 'all'
                              ? 'No betting markets available'
                              : `No ${MARKET_TYPE_CONFIGS[selectedMarketType]?.label} markets available`}
                        </div>
                        <div className="text-sm text-gray-500">
                          {!gameMatch.betting_enabled
                            ? 'Check with the turf manager for betting availability'
                            : 'Markets may be added closer to match time'}
                        </div>
                      </div>
                    }
                    className="py-12"
                  />
                ) : (
                  /* Markets Grid */
                  <div className="space-y-6">
                    {selectedMarketType === 'all' ? (
                      /* Grouped by Market Type */
                      Object.entries(marketsByType).map(([type, typeMarkets]) => {
                        const config = MARKET_TYPE_CONFIGS[type as MarketType];
                        return (
                          <div key={type}>
                            <div className="mb-4 flex items-center space-x-2">
                              <span className="text-2xl">{config?.icon}</span>
                              <Title level={4} className="!mb-0">
                                {config?.label}
                              </Title>
                              <Text type="secondary" className="text-sm">
                                {config?.description}
                              </Text>
                            </div>

                            <Row gutter={[16, 16]}>
                              {typeMarkets.map((market) => (
                                <Col key={market.id} xs={24} sm={12} lg={8} xl={6}>
                                  <MarketCard market={market} />
                                </Col>
                              ))}
                            </Row>

                            {Object.keys(marketsByType).indexOf(type) < Object.keys(marketsByType).length - 1 && <Divider />}
                          </div>
                        );
                      })
                    ) : (
                      /* Single Market Type */
                      <Row gutter={[16, 16]}>
                        {filteredMarkets.map((market) => (
                          <Col key={market.id} xs={24} sm={12} lg={8} xl={6}>
                            <MarketCard market={market} />
                          </Col>
                        ))}
                      </Row>
                    )}
                  </div>
                )}
              </Card>

              {/* Betting Guidelines */}
              {gameMatch.betting_enabled && filteredMarkets.length > 0 && (
                <Card className="mt-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
                  <Row gutter={24}>
                    <Col xs={24} md={12}>
                      <div className="text-center md:text-left">
                        <Title level={4} className="text-blue-700 dark:text-blue-300">
                          Quick Tips
                        </Title>
                        <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                          <li>• Click on any odds to add to your bet slip</li>
                          <li>• You can bet on multiple markets for this match</li>
                          <li>• Live betting available during the match</li>
                          <li>• Cash payments require turf manager confirmation</li>
                        </ul>
                      </div>
                    </Col>

                    <Col xs={24} md={12}>
                      <div className="text-center md:text-left">
                        <Title level={4} className="text-purple-700 dark:text-purple-300">
                          Match Info
                        </Title>
                        <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                          <div>
                            Status: <strong>{matchStatusConfig.text}</strong>
                          </div>
                          <div>
                            Time: <strong>{matchTime.formatted}</strong>
                          </div>
                          {gameMatch.match_session && (
                            <div>
                              Session: <strong>{gameMatch.match_session.name}</strong>
                            </div>
                          )}
                          <div>
                            Markets: <strong>{matchMarkets.length} available</strong>
                          </div>
                        </div>
                      </div>
                    </Col>
                  </Row>
                </Card>
              )}
            </>
          )}
        </div>
      </div>

      {/* Floating Bet Slip */}
      <BetSlip />
    </>
  );
};

export default GameMatchBetting;
