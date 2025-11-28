import { gameMatchApi } from '@/apis/gameMatch';
import { BetSlip, MarketCard } from '@/components/betting';
import { useBettingStore } from '@/stores';
import type { MarketType } from '@/types/betting.types';
import { MARKET_TYPE_CONFIGS } from '@/types/betting.types';
import type { GameMatch } from '@/types/gameMatch.types';
import {
  ArrowLeftOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  EnvironmentOutlined,
  FireOutlined,
  InfoCircleOutlined,
  PlayCircleOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import { Head, router } from '@inertiajs/react';
import { Alert, Button as AntButton, Card, Col, Empty, Result, Row, Spin, Statistic, Tag, Typography } from 'antd';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';

const { Title, Text } = Typography;

interface GameMatchBettingProps {
  turfId: number;
  gameMatchId: number;
}

const GameMatchBetting = ({ turfId, gameMatchId }: GameMatchBettingProps) => {
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
    if (gameMatch) {
      fetchMarkets(gameMatch.id, turfId);
    }
  }, [fetchMarkets, gameMatch, turfId]);

  // Filter markets by type
  const matchMarkets = gameMatch ? markets.filter((market) => market.game_match_id === gameMatch.id) : [];
  const filteredMarkets = selectedMarketType === 'all' ? matchMarkets : matchMarkets.filter((market) => market.type === selectedMarketType);

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
      return format(date, 'PPpp');
    } catch {
      return dateString;
    }
  };

  if (gameMatchLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (gameMatchError || !gameMatch) {
    return (
      <Result
        status="error"
        title="Failed to Load Match"
        subTitle={gameMatchError || 'The game match could not be found'}
        extra={
          <AntButton type="primary" onClick={() => router.visit(route('web.turfs.betting.index', { turf: turfId }))}>
            Back to Betting Markets
          </AntButton>
        }
      />
    );
  }

  return (
    <>
      <Head title={`Betting - ${gameMatch.first_team?.name} vs ${gameMatch.second_team?.name}`} />

      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-6">
          {/* Back Button */}
          <AntButton icon={<ArrowLeftOutlined />} onClick={() => router.visit(route('web.turfs.betting.index', { turf: turfId }))} className="mb-4">
            Back to Markets
          </AntButton>

          {/* Match Header */}
          <Card className="mb-6">
            <Row gutter={[24, 24]} align="middle">
              <Col xs={24} md={16}>
                <div className="mb-4 flex items-center gap-2">
                  <Tag color={matchStatusConfig.color} icon={matchStatusConfig.icon}>
                    {matchStatusConfig.text}
                  </Tag>
                  {gameMatch.status === 'in_progress' && (
                    <Tag color="red" icon={<FireOutlined />}>
                      LIVE
                    </Tag>
                  )}
                  {gameMatch.betting_enabled && (
                    <Tag color="green" icon={<DollarOutlined />}>
                      Betting Open
                    </Tag>
                  )}
                </div>

                <div className="mb-4 text-center md:text-left">
                  <Row gutter={16} align="middle" justify="center">
                    <Col>
                      <div className="text-center">
                        <Title level={3} className="mb-0">
                          {gameMatch.first_team?.name || 'TBD'}
                        </Title>
                      </div>
                    </Col>
                    <Col>
                      <Title level={2} className="mb-0 text-gray-400">
                        VS
                      </Title>
                    </Col>
                    <Col>
                      <div className="text-center">
                        <Title level={3} className="mb-0">
                          {gameMatch.second_team?.name || 'TBD'}
                        </Title>
                      </div>
                    </Col>
                  </Row>
                </div>

                <div className="flex flex-wrap gap-4 text-gray-600">
                  <span>
                    <CalendarOutlined className="mr-2" />
                    {gameMatch.starts_at ? formatMatchTime(gameMatch.starts_at) : 'Time TBD'}
                  </span>
                  {gameMatch.match_session?.turf?.name && (
                    <span>
                      <EnvironmentOutlined className="mr-2" />
                      {gameMatch.match_session.turf.name}
                    </span>
                  )}
                </div>
              </Col>

              <Col xs={24} md={8}>
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Statistic title="Total Markets" value={matchMarkets.length} prefix={<TrophyOutlined />} valueStyle={{ color: '#1890ff' }} />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="Active Markets"
                      value={matchMarkets.filter((m) => m.status === 'active').length}
                      prefix={<FireOutlined />}
                      valueStyle={{ color: '#52c41a' }}
                    />
                  </Col>
                </Row>
              </Col>
            </Row>
          </Card>

          {/* Market Type Filter */}
          <Card className="mb-6">
            <div className="mb-3">
              <Text strong>Filter by Market Type:</Text>
            </div>
            <div className="flex flex-wrap gap-2">
              <AntButton type={selectedMarketType === 'all' ? 'primary' : 'default'} onClick={() => setSelectedMarketType('all')}>
                All Markets ({matchMarkets.length})
              </AntButton>
              {Object.entries(MARKET_TYPE_CONFIGS).map(([type, config]) => {
                const count = matchMarkets.filter((m) => m.type === type).length;
                if (count === 0) return null;
                return (
                  <AntButton
                    key={type}
                    type={selectedMarketType === type ? 'primary' : 'default'}
                    onClick={() => setSelectedMarketType(type as MarketType)}
                  >
                    <span className="mr-1">{config.icon}</span>
                    {config.label} ({count})
                  </AntButton>
                );
              })}
            </div>
          </Card>

          {/* Error State */}
          {marketsError && <Alert type="error" message="Failed to load betting markets" description={marketsError} className="mb-6" showIcon />}

          {/* Markets */}
          <Card title={<Title level={4}>Available Markets</Title>}>
            {marketsLoading ? (
              <div className="py-12 text-center">
                <Spin size="large" />
                <div className="mt-4 text-gray-500">Loading betting markets...</div>
              </div>
            ) : filteredMarkets.length === 0 ? (
              <Empty
                description={
                  <div className="text-center">
                    <div className="mb-2 text-lg text-gray-600">
                      {selectedMarketType !== 'all' ? 'No markets of this type' : 'No betting markets available for this match'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {selectedMarketType !== 'all' ? 'Try selecting a different market type' : 'Check back later'}
                    </div>
                  </div>
                }
                className="py-12"
              />
            ) : (
              <Row gutter={[16, 16]}>
                {filteredMarkets.map((market) => (
                  <Col key={market.id} xs={24} sm={12} lg={8} xl={6}>
                    <MarketCard market={market} />
                  </Col>
                ))}
              </Row>
            )}
          </Card>
        </div>
      </div>

      {/* Floating Bet Slip */}
      <BetSlip />
    </>
  );
};

GameMatchBetting.displayName = 'GameMatchBetting';

export default GameMatchBetting;
