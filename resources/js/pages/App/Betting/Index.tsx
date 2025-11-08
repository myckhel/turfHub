import { ClockCircleOutlined, FilterOutlined, FireOutlined, SearchOutlined, TeamOutlined, TrophyOutlined } from '@ant-design/icons';
import { Head } from '@inertiajs/react';
import { Alert, Card, Col, Empty, Input, Row, Select, Space, Spin, Tabs, Typography } from 'antd';
import React, { useEffect, useState } from 'react';
import { BetSlip, MarketCard } from '../../../components/betting';
import { useBettingStore } from '../../../stores';
import type { MarketType } from '../../../types/betting.types';
import { MARKET_TYPE_CONFIGS } from '../../../types/betting.types';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Search } = Input;
const { Option } = Select;

const BettingIndex: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMarketType, setSelectedMarketType] = useState<MarketType | 'all'>('all');
  const [activeTab, setActiveTab] = useState('all');

  const { markets, marketsLoading, marketsError, fetchMarkets } = useBettingStore();

  useEffect(() => {
    fetchMarkets();
  }, [fetchMarkets]);

  // Filter markets based on search and type
  const filteredMarkets = markets.filter((market) => {
    const matchesSearch =
      !searchTerm ||
      market.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      market.game_match?.first_team?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      market.game_match?.second_team?.name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = selectedMarketType === 'all' || market.type === selectedMarketType;

    return matchesSearch && matchesType;
  });

  // Group markets by status for tabs - show ALL markets
  const activeMarkets = filteredMarkets.filter((market) => market.status === 'active');
  const suspendedMarkets = filteredMarkets.filter((market) => market.status === 'suspended');
  const settledMarkets = filteredMarkets.filter((market) => market.status === 'settled');
  const cancelledMarkets = filteredMarkets.filter((market) => market.status === 'cancelled');

  // Further organize active markets by game match status
  const liveMarkets = activeMarkets.filter((market) => market.game_match?.status === 'in_progress');
  const upcomingMarkets = activeMarkets.filter((market) => market.game_match?.status === 'upcoming');

  const getCurrentMarkets = () => {
    switch (activeTab) {
      case 'live':
        return liveMarkets;
      case 'upcoming':
        return upcomingMarkets;
      case 'suspended':
        return suspendedMarkets;
      case 'settled':
        return settledMarkets;
      case 'cancelled':
        return cancelledMarkets;
      case 'all':
      default:
        return activeMarkets;
    }
  };

  const currentMarkets = getCurrentMarkets();

  // Get popular market types for quick filters
  const popularTypes = Object.entries(MARKET_TYPE_CONFIGS)
    .slice(0, 4)
    .map(([type, config]) => ({ type: type as MarketType, config }));

  return (
    <>
      <Head title="Betting Markets" />

      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-6">
          {/* Header Section */}
          <div className="mb-8">
            <div className="mb-6 text-center">
              <Title level={1} className="mb-2 text-white">
                <TrophyOutlined className="mr-3" />
                Betting Markets
              </Title>
              <Text className="text-lg text-gray-300">Place your bets on upcoming football matches</Text>
            </div>

            {/* Quick Stats */}
            <Row gutter={16} className="mb-6">
              <Col xs={24} sm={8}>
                <Card className="border-blue-500 bg-blue-600 text-center">
                  <div className="text-white">
                    <div className="text-2xl font-bold">{activeMarkets.length}</div>
                    <div className="text-blue-200">Active Markets</div>
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card className="border-green-500 bg-green-600 text-center">
                  <div className="text-white">
                    <div className="text-2xl font-bold">{liveMarkets.length}</div>
                    <div className="text-green-200">Live Betting</div>
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card className="border-orange-500 bg-orange-600 text-center">
                  <div className="text-white">
                    <div className="text-2xl font-bold">{upcomingMarkets.length}</div>
                    <div className="text-orange-200">Upcoming</div>
                  </div>
                </Card>
              </Col>
            </Row>
          </div>

          {/* Filters Section */}
          <Card className="mb-6">
            <Row gutter={16} align="middle">
              <Col xs={24} sm={12} md={8}>
                <Search
                  placeholder="Search markets or teams..."
                  prefix={<SearchOutlined />}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  allowClear
                />
              </Col>

              <Col xs={24} sm={12} md={8}>
                <Select
                  placeholder="Filter by market type"
                  value={selectedMarketType}
                  onChange={setSelectedMarketType}
                  className="w-full"
                  suffixIcon={<FilterOutlined />}
                >
                  <Option value="all">All Market Types</Option>
                  {Object.entries(MARKET_TYPE_CONFIGS).map(([type, config]) => (
                    <Option key={type} value={type}>
                      <Space>
                        <span>{config.icon}</span>
                        <span>{config.label}</span>
                      </Space>
                    </Option>
                  ))}
                </Select>
              </Col>

              <Col xs={24} md={8}>
                <div className="flex flex-wrap gap-2">
                  {popularTypes.map(({ type, config }) => (
                    <button
                      key={type}
                      onClick={() => setSelectedMarketType(selectedMarketType === type ? 'all' : type)}
                      className={`rounded-full px-3 py-1 text-sm transition-all duration-200 ${
                        selectedMarketType === type ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      } `}
                    >
                      <span className="mr-1">{config.icon}</span>
                      {config.label}
                    </button>
                  ))}
                </div>
              </Col>
            </Row>
          </Card>

          {/* Error State */}
          {marketsError && <Alert type="error" message="Failed to load betting markets" description={marketsError} className="mb-6" showIcon />}

          {/* Markets Tabs */}
          <Card>
            <Tabs activeKey={activeTab} onChange={setActiveTab} size="large" tabBarStyle={{ marginBottom: 24 }}>
              <TabPane
                tab={
                  <Space>
                    <TrophyOutlined />
                    <span>Active Markets</span>
                    <span className="rounded-full bg-blue-500 px-2 py-1 text-xs text-white">{activeMarkets.length}</span>
                  </Space>
                }
                key="all"
              />

              <TabPane
                tab={
                  <Space>
                    <FireOutlined />
                    <span>Live Betting</span>
                    <span className="rounded-full bg-red-500 px-2 py-1 text-xs text-white">{liveMarkets.length}</span>
                  </Space>
                }
                key="live"
              />

              <TabPane
                tab={
                  <Space>
                    <ClockCircleOutlined />
                    <span>Upcoming</span>
                    <span className="rounded-full bg-orange-500 px-2 py-1 text-xs text-white">{upcomingMarkets.length}</span>
                  </Space>
                }
                key="upcoming"
              />

              <TabPane
                tab={
                  <Space>
                    <span>Suspended</span>
                    <span className="rounded-full bg-yellow-500 px-2 py-1 text-xs text-white">{suspendedMarkets.length}</span>
                  </Space>
                }
                key="suspended"
              />

              <TabPane
                tab={
                  <Space>
                    <span>Settled</span>
                    <span className="rounded-full bg-blue-500 px-2 py-1 text-xs text-white">{settledMarkets.length}</span>
                  </Space>
                }
                key="settled"
              />

              <TabPane
                tab={
                  <Space>
                    <span>Cancelled</span>
                    <span className="rounded-full bg-red-500 px-2 py-1 text-xs text-white">{cancelledMarkets.length}</span>
                  </Space>
                }
                key="cancelled"
              />
            </Tabs>

            {/* Loading State */}
            {marketsLoading ? (
              <div className="py-12 text-center">
                <Spin size="large" />
                <div className="mt-4 text-gray-500">Loading betting markets...</div>
              </div>
            ) : currentMarkets.length === 0 ? (
              /* Empty State */
              <Empty
                image={<TeamOutlined className="text-6xl text-gray-400" />}
                description={
                  <div className="text-center">
                    <div className="mb-2 text-lg text-gray-600">
                      {searchTerm || selectedMarketType !== 'all' ? 'No markets match your filters' : 'No betting markets available'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {searchTerm || selectedMarketType !== 'all'
                        ? 'Try adjusting your search or filters'
                        : 'Check back later for new betting opportunities'}
                    </div>
                  </div>
                }
                className="py-12"
              />
            ) : (
              /* Markets Grid */
              <Row gutter={[16, 16]}>
                {currentMarkets.map((market) => (
                  <Col key={market.id} xs={24} sm={12} lg={8} xl={6}>
                    <MarketCard market={market} />
                  </Col>
                ))}
              </Row>
            )}
          </Card>

          {/* Helpful Information */}
          <Card className="mt-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
            <Row gutter={24}>
              <Col xs={24} md={12}>
                <div className="text-center md:text-left">
                  <Title level={4} className="text-blue-700 dark:text-blue-300">
                    How to Bet
                  </Title>
                  <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                    <li>• Browse available markets above</li>
                    <li>• Click on odds to add to your bet slip</li>
                    <li>• Set your stake amount</li>
                    <li>• Choose payment method and place your bet</li>
                  </ul>
                </div>
              </Col>

              <Col xs={24} md={12}>
                <div className="text-center md:text-left">
                  <Title level={4} className="text-purple-700 dark:text-purple-300">
                    Market Types
                  </Title>
                  <div className="space-y-1 text-gray-600 dark:text-gray-300">
                    {Object.entries(MARKET_TYPE_CONFIGS)
                      .slice(0, 4)
                      .map(([type, config]) => (
                        <div key={type} className="flex items-center space-x-2">
                          <span>{config.icon}</span>
                          <span className="text-sm">
                            {config.label}: {config.description}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </Col>
            </Row>
          </Card>
        </div>
      </div>

      {/* Floating Bet Slip */}
      <BetSlip />
    </>
  );
};

export default BettingIndex;
