import { BetCard } from '@/components/betting';
import { useBettingStore } from '@/stores';
import type { BetStatus, BettingFilters, MarketType, PaymentMethod } from '@/types/betting.types';
import { MARKET_TYPE_CONFIGS } from '@/types/betting.types';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  FireOutlined,
  HistoryOutlined,
  LineChartOutlined,
  PercentageOutlined,
  SearchOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import { Head } from '@inertiajs/react';
import { Alert, Button as AntButton, Card, Col, Empty, Input, Pagination, Row, Select, Space, Spin, Statistic, Tabs, Typography } from 'antd';
import { useCallback, useEffect, useState, useTransition } from 'react';

const { Title, Text } = Typography;
const { Option } = Select;
const { Search } = Input;

interface BettingHistoryProps {
  turfId: number;
}

const BettingHistory = ({ turfId }: BettingHistoryProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [deferredSearchTerm, setDeferredSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<BetStatus | 'all'>('all');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | 'all'>('all');
  const [selectedMarketType, setSelectedMarketType] = useState<MarketType | 'all'>('all');
  const [isPending, startTransition] = useTransition();

  const { bettingHistory, historyLoading, historyError, fetchBettingHistory, fetchBettingStats, updateHistoryFilters } = useBettingStore();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    startTransition(() => {
      setDeferredSearchTerm(value);
    });
  };

  // Build filters object
  const buildFilters = useCallback((): BettingFilters => {
    const filters: BettingFilters = { turf_id: turfId };

    if (selectedStatus !== 'all') {
      filters.status = [selectedStatus];
    }

    if (selectedPaymentMethod !== 'all') {
      filters.payment_method = [selectedPaymentMethod];
    }

    if (selectedMarketType !== 'all') {
      filters.market_type = [selectedMarketType];
    }

    return filters;
  }, [turfId, selectedStatus, selectedPaymentMethod, selectedMarketType]);

  // Apply filters and fetch data
  const applyFilters = useCallback(() => {
    const filters = buildFilters();
    updateHistoryFilters(filters);
    fetchBettingHistory(filters);
    setCurrentPage(1);
  }, [buildFilters, updateHistoryFilters, fetchBettingHistory]);

  // Initial data load
  useEffect(() => {
    const filters = { turf_id: turfId };
    fetchBettingHistory(filters);
    fetchBettingStats();
  }, [fetchBettingHistory, fetchBettingStats, turfId]);

  // Apply filters when they change
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // Filter bets by tab
  const getFilteredBets = () => {
    let filtered = bettingHistory || [];

    // Apply search filter
    if (deferredSearchTerm) {
      filtered = filtered.filter(
        (bet) =>
          bet.market_option?.betting_market?.name?.toLowerCase().includes(deferredSearchTerm.toLowerCase()) ||
          bet.market_option?.name?.toLowerCase().includes(deferredSearchTerm.toLowerCase()) ||
          bet.market_option?.betting_market?.game_match?.first_team?.name?.toLowerCase().includes(deferredSearchTerm.toLowerCase()) ||
          bet.market_option?.betting_market?.game_match?.second_team?.name?.toLowerCase().includes(deferredSearchTerm.toLowerCase()),
      );
    }

    // Apply tab filter
    switch (activeTab) {
      case 'pending':
        return filtered.filter((bet) => bet.status === 'pending');
      case 'active':
        return filtered.filter((bet) => bet.status === 'active');
      case 'settled':
        return filtered.filter((bet) => ['won', 'lost'].includes(bet.status));
      case 'all':
      default:
        return filtered;
    }
  };

  const filteredBets = getFilteredBets();

  // Pagination
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedBets = filteredBets.slice(startIndex, endIndex);

  // Calculate summary stats for current view
  const calculateSummaryStats = () => {
    const bets = filteredBets;
    const totalBets = bets.length;
    const totalStake = bets.reduce((sum, bet) => sum + bet.stake_amount, 0);
    const totalPayout = bets.filter((bet) => bet.status === 'won').reduce((sum, bet) => sum + (bet.payout_amount || 0), 0);
    const winningBets = bets.filter((bet) => bet.status === 'won').length;
    const winRate = totalBets > 0 ? (winningBets / totalBets) * 100 : 0;
    const profitLoss = totalPayout - totalStake;

    return {
      totalBets,
      totalStake,
      totalPayout,
      winRate,
      profitLoss,
    };
  };

  const summaryStats = calculateSummaryStats();

  // Get status counts for tabs
  const statusCounts = {
    all: bettingHistory?.length || 0,
    pending: bettingHistory?.filter((bet) => bet.status === 'pending').length || 0,
    active: bettingHistory?.filter((bet) => bet.status === 'active').length || 0,
    settled: bettingHistory?.filter((bet) => ['won', 'lost'].includes(bet.status)).length || 0,
  };

  const clearAllFilters = () => {
    setSelectedStatus('all');
    setSelectedPaymentMethod('all');
    setSelectedMarketType('all');
    setSearchTerm('');
    setDeferredSearchTerm('');
    setActiveTab('all');
  };

  return (
    <>
      <Head title="Betting History" />

      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-6">
          {/* Header */}
          <div className="mb-8 text-center">
            <Title level={1} className="mb-2 text-white">
              <HistoryOutlined className="mr-3" />
              Betting History
            </Title>
            <Text className="text-lg text-gray-300">Track your betting performance and manage your bets</Text>
          </div>

          {/* Summary Stats */}
          <Row gutter={[16, 16]} className="mb-6">
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic title="Total Bets" value={summaryStats.totalBets} prefix={<TrophyOutlined />} valueStyle={{ color: '#1890ff' }} />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Total Stake"
                  value={summaryStats.totalStake}
                  prefix={<DollarOutlined />}
                  precision={2}
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Win Rate"
                  value={summaryStats.winRate}
                  prefix={<PercentageOutlined />}
                  suffix="%"
                  precision={1}
                  valueStyle={{ color: summaryStats.winRate >= 50 ? '#52c41a' : '#ff4d4f' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Profit/Loss"
                  value={summaryStats.profitLoss}
                  prefix={<LineChartOutlined />}
                  precision={2}
                  valueStyle={{ color: summaryStats.profitLoss >= 0 ? '#52c41a' : '#ff4d4f' }}
                />
              </Card>
            </Col>
          </Row>

          {/* Filters */}
          <Card className="mb-6">
            <Row gutter={[16, 16]}>
              <Col xs={24} md={8}>
                <Search placeholder="Search bets..." prefix={<SearchOutlined />} value={searchTerm} onChange={handleSearchChange} allowClear />
              </Col>
              <Col xs={24} sm={12} md={4}>
                <Select value={selectedStatus} onChange={setSelectedStatus} className="w-full" placeholder="Status">
                  <Option value="all">All Status</Option>
                  <Option value="pending">Pending</Option>
                  <Option value="active">Active</Option>
                  <Option value="won">Won</Option>
                  <Option value="lost">Lost</Option>
                  <Option value="cancelled">Cancelled</Option>
                </Select>
              </Col>
              <Col xs={24} sm={12} md={4}>
                <Select value={selectedPaymentMethod} onChange={setSelectedPaymentMethod} className="w-full" placeholder="Payment">
                  <Option value="all">All Payments</Option>
                  <Option value="online">Online</Option>
                  <Option value="offline">Offline</Option>
                  <Option value="wallet">Wallet</Option>
                </Select>
              </Col>
              <Col xs={24} sm={12} md={4}>
                <Select value={selectedMarketType} onChange={setSelectedMarketType} className="w-full" placeholder="Market Type">
                  <Option value="all">All Types</Option>
                  {Object.entries(MARKET_TYPE_CONFIGS).map(([type, config]) => (
                    <Option key={type} value={type}>
                      {config.label}
                    </Option>
                  ))}
                </Select>
              </Col>
              <Col xs={24} sm={12} md={4}>
                <AntButton onClick={clearAllFilters} block>
                  Clear Filters
                </AntButton>
              </Col>
            </Row>
          </Card>

          {/* Error State */}
          {historyError && <Alert type="error" message="Failed to load betting history" description={historyError} className="mb-6" showIcon />}

          {/* Betting History */}
          <Card>
            <Tabs activeKey={activeTab} onChange={setActiveTab} tabBarStyle={{ marginBottom: 24 }}>
              <Tabs.TabPane
                tab={
                  <Space>
                    <span>All Bets</span>
                    <span className="rounded-full bg-blue-500 px-2 py-1 text-xs text-white">{statusCounts.all}</span>
                  </Space>
                }
                key="all"
              />
              <Tabs.TabPane
                tab={
                  <Space>
                    <ClockCircleOutlined />
                    <span>Pending</span>
                    <span className="rounded-full bg-yellow-500 px-2 py-1 text-xs text-white">{statusCounts.pending}</span>
                  </Space>
                }
                key="pending"
              />
              <Tabs.TabPane
                tab={
                  <Space>
                    <FireOutlined />
                    <span>Active</span>
                    <span className="rounded-full bg-orange-500 px-2 py-1 text-xs text-white">{statusCounts.active}</span>
                  </Space>
                }
                key="active"
              />
              <Tabs.TabPane
                tab={
                  <Space>
                    <CheckCircleOutlined />
                    <span>Settled</span>
                    <span className="rounded-full bg-green-500 px-2 py-1 text-xs text-white">{statusCounts.settled}</span>
                  </Space>
                }
                key="settled"
              />
            </Tabs>

            {historyLoading || isPending ? (
              <div className="py-12 text-center">
                <Spin size="large" />
                <div className="mt-4 text-gray-500">Loading betting history...</div>
              </div>
            ) : paginatedBets.length === 0 ? (
              <Empty
                description={
                  <div className="text-center">
                    <div className="mb-2 text-lg text-gray-600">No bets found</div>
                    <div className="text-sm text-gray-500">
                      {searchTerm || selectedStatus !== 'all' ? 'Try adjusting your filters' : 'Start betting to see your history here'}
                    </div>
                  </div>
                }
                className="py-12"
              />
            ) : (
              <>
                <div className="space-y-4">
                  {paginatedBets.map((bet) => (
                    <BetCard key={bet.id} bet={bet} />
                  ))}
                </div>

                {filteredBets.length > pageSize && (
                  <div className="mt-6 text-center">
                    <Pagination
                      current={currentPage}
                      total={filteredBets.length}
                      pageSize={pageSize}
                      onChange={setCurrentPage}
                      showSizeChanger={false}
                    />
                  </div>
                )}
              </>
            )}
          </Card>
        </div>
      </div>
    </>
  );
};

BettingHistory.displayName = 'BettingHistory';

export default BettingHistory;
