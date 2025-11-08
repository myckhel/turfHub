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
import {
  Alert,
  Button as AntButton,
  Card,
  Col,
  DatePicker,
  Empty,
  Input,
  Pagination,
  Row,
  Select,
  Space,
  Spin,
  Statistic,
  Tabs,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import React, { useCallback, useEffect, useState } from 'react';
import { BetCard } from '../../../components/betting';
import { useBettingStore } from '../../../stores';
import type { BetStatus, BettingFilters, MarketType, PaymentMethod } from '../../../types/betting.types';
import { MARKET_TYPE_CONFIGS } from '../../../types/betting.types';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;
const { Search } = Input;

const BettingHistory: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<BetStatus | 'all'>('all');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | 'all'>('all');
  const [selectedMarketType, setSelectedMarketType] = useState<MarketType | 'all'>('all');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([null, null]);

  const { bettingHistory, historyLoading, historyError, bettingStats, fetchBettingHistory, fetchBettingStats, updateHistoryFilters, historyFilters } =
    useBettingStore();

  // Build filters object
  const buildFilters = useCallback((): BettingFilters => {
    const filters: BettingFilters = {};

    if (selectedStatus !== 'all') {
      filters.status = [selectedStatus];
    }

    if (selectedPaymentMethod !== 'all') {
      filters.payment_method = [selectedPaymentMethod];
    }

    if (selectedMarketType !== 'all') {
      filters.market_type = [selectedMarketType];
    }

    if (dateRange[0] && dateRange[1]) {
      filters.date_from = dateRange[0].format('YYYY-MM-DD');
      filters.date_to = dateRange[1].format('YYYY-MM-DD');
    }

    return filters;
  }, [selectedStatus, selectedPaymentMethod, selectedMarketType, dateRange]);

  // Apply filters and fetch data
  const applyFilters = useCallback(() => {
    const filters = buildFilters();
    updateHistoryFilters(filters);
    fetchBettingHistory(filters);
    setCurrentPage(1);
  }, [buildFilters, updateHistoryFilters, fetchBettingHistory]);

  // Initial data load
  useEffect(() => {
    fetchBettingHistory();
    fetchBettingStats();
  }, [fetchBettingHistory, fetchBettingStats]);

  // Apply filters when they change
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // Filter bets by tab
  const getFilteredBets = () => {
    let filtered = bettingHistory || []; // Add null guard

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (bet) =>
          bet.market_option?.betting_market?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          bet.market_option?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          bet.market_option?.betting_market?.game_match?.first_team?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          bet.market_option?.betting_market?.game_match?.second_team?.name?.toLowerCase().includes(searchTerm.toLowerCase()),
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

  console.log({ filteredBets, bettingHistory });

  // Pagination
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedBets = filteredBets.slice(startIndex, endIndex);

  // Quick date filters
  const setQuickDateFilter = (days: number) => {
    const endDate = dayjs();
    const startDate = dayjs().subtract(days, 'day');
    setDateRange([startDate, endDate]);
  };

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

  const handleBetAction = () => {
    // Refresh data after bet action
    fetchBettingHistory(historyFilters);
    fetchBettingStats();
  };

  const clearAllFilters = () => {
    setSelectedStatus('all');
    setSelectedPaymentMethod('all');
    setSelectedMarketType('all');
    setDateRange([null, null]);
    setSearchTerm('');
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

          {/* Overall Stats Card */}
          {bettingStats && (
            <Card className="mb-6 border-none bg-gradient-to-r from-purple-600 to-blue-600">
              <div className="text-white">
                <Title level={3} className="!mb-4 !text-white">
                  Overall Performance
                </Title>
                <Row gutter={16}>
                  <Col xs={12} sm={6}>
                    <Statistic
                      title={<span className="text-purple-200">Total Bets</span>}
                      value={bettingStats.total_bets}
                      prefix={<FireOutlined />}
                      valueStyle={{ color: '#fff' }}
                    />
                  </Col>
                  <Col xs={12} sm={6}>
                    <Statistic
                      title={<span className="text-purple-200">Win Rate</span>}
                      value={bettingStats.win_rate}
                      suffix="%"
                      prefix={<TrophyOutlined />}
                      valueStyle={{ color: '#fff' }}
                      precision={1}
                    />
                  </Col>
                  <Col xs={12} sm={6}>
                    <Statistic
                      title={<span className="text-purple-200">Total Winnings</span>}
                      value={bettingStats.total_winnings}
                      prefix={<DollarOutlined />}
                      valueStyle={{ color: '#52c41a' }}
                      formatter={(value) => `₦${Number(value).toLocaleString()}`}
                    />
                  </Col>
                  <Col xs={12} sm={6}>
                    <Statistic
                      title={<span className="text-purple-200">Profit/Loss</span>}
                      value={bettingStats.profit_loss}
                      prefix={bettingStats.profit_loss >= 0 ? '+' : ''}
                      valueStyle={{
                        color: bettingStats.profit_loss >= 0 ? '#52c41a' : '#ff4d4f',
                      }}
                      formatter={(value) => `₦${Number(value).toLocaleString()}`}
                    />
                  </Col>
                </Row>
              </div>
            </Card>
          )}

          {/* Filters */}
          <Card className="mb-6">
            <Row gutter={[16, 16]} align="middle">
              <Col xs={24} sm={12} md={6}>
                <Search
                  placeholder="Search bets..."
                  prefix={<SearchOutlined />}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  allowClear
                />
              </Col>

              <Col xs={24} sm={12} md={4}>
                <Select placeholder="Status" value={selectedStatus} onChange={setSelectedStatus} className="w-full">
                  <Option value="all">All Status</Option>
                  <Option value="pending">Pending</Option>
                  <Option value="active">Active</Option>
                  <Option value="won">Won</Option>
                  <Option value="lost">Lost</Option>
                  <Option value="cancelled">Cancelled</Option>
                </Select>
              </Col>

              <Col xs={24} sm={12} md={4}>
                <Select placeholder="Payment" value={selectedPaymentMethod} onChange={setSelectedPaymentMethod} className="w-full">
                  <Option value="all">All Payment</Option>
                  <Option value="online">Online</Option>
                  <Option value="offline">Cash</Option>
                </Select>
              </Col>

              <Col xs={24} sm={12} md={4}>
                <Select placeholder="Market Type" value={selectedMarketType} onChange={setSelectedMarketType} className="w-full">
                  <Option value="all">All Markets</Option>
                  {Object.entries(MARKET_TYPE_CONFIGS).map(([type, config]) => (
                    <Option key={type} value={type}>
                      {config.icon} {config.label}
                    </Option>
                  ))}
                </Select>
              </Col>

              <Col xs={24} md={6}>
                <RangePicker
                  value={dateRange}
                  onChange={(dates) => setDateRange(dates as [dayjs.Dayjs | null, dayjs.Dayjs | null])}
                  className="w-full"
                  placeholder={['Start Date', 'End Date']}
                />
              </Col>
            </Row>

            {/* Quick Date Filters */}
            <div className="mt-4 flex flex-wrap gap-2">
              <AntButton size="small" onClick={() => setQuickDateFilter(7)}>
                Last 7 days
              </AntButton>
              <AntButton size="small" onClick={() => setQuickDateFilter(30)}>
                Last 30 days
              </AntButton>
              <AntButton size="small" onClick={() => setQuickDateFilter(90)}>
                Last 3 months
              </AntButton>
              <AntButton size="small" onClick={clearAllFilters}>
                Clear All Filters
              </AntButton>
            </div>
          </Card>

          {/* Current View Stats */}
          {filteredBets.length > 0 && (
            <Row gutter={16} className="mb-6">
              <Col xs={12} sm={6}>
                <Card className="text-center">
                  <Statistic title="Total Bets" value={summaryStats.totalBets} prefix={<FireOutlined />} valueStyle={{ color: '#1890ff' }} />
                </Card>
              </Col>
              <Col xs={12} sm={6}>
                <Card className="text-center">
                  <Statistic
                    title="Win Rate"
                    value={summaryStats.winRate}
                    suffix="%"
                    prefix={<PercentageOutlined />}
                    valueStyle={{ color: '#52c41a' }}
                    precision={1}
                  />
                </Card>
              </Col>
              <Col xs={12} sm={6}>
                <Card className="text-center">
                  <Statistic
                    title="Total Stake"
                    value={summaryStats.totalStake}
                    prefix={<DollarOutlined />}
                    valueStyle={{ color: '#fa8c16' }}
                    formatter={(value) => `₦${Number(value).toLocaleString()}`}
                  />
                </Card>
              </Col>
              <Col xs={12} sm={6}>
                <Card className="text-center">
                  <Statistic
                    title="Profit/Loss"
                    value={summaryStats.profitLoss}
                    prefix={summaryStats.profitLoss >= 0 ? '+' : ''}
                    valueStyle={{
                      color: summaryStats.profitLoss >= 0 ? '#52c41a' : '#ff4d4f',
                    }}
                    formatter={(value) => `₦${Number(value).toLocaleString()}`}
                  />
                </Card>
              </Col>
            </Row>
          )}

          {/* History Tabs & Content */}
          <Card>
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              size="large"
              tabBarStyle={{ marginBottom: 24 }}
              items={[
                {
                  key: 'all',
                  label: (
                    <Space>
                      <HistoryOutlined />
                      <span>All Bets</span>
                      <span className="rounded-full bg-blue-500 px-2 py-1 text-xs text-white">{statusCounts.all}</span>
                    </Space>
                  ),
                },
                {
                  key: 'pending',
                  label: (
                    <Space>
                      <ClockCircleOutlined />
                      <span>Pending</span>
                      <span className="rounded-full bg-orange-500 px-2 py-1 text-xs text-white">{statusCounts.pending}</span>
                    </Space>
                  ),
                },
                {
                  key: 'active',
                  label: (
                    <Space>
                      <CheckCircleOutlined />
                      <span>Active</span>
                      <span className="rounded-full bg-blue-500 px-2 py-1 text-xs text-white">{statusCounts.active}</span>
                    </Space>
                  ),
                },
                {
                  key: 'settled',
                  label: (
                    <Space>
                      <TrophyOutlined />
                      <span>Settled</span>
                      <span className="rounded-full bg-green-500 px-2 py-1 text-xs text-white">{statusCounts.settled}</span>
                    </Space>
                  ),
                },
              ]}
            />

            {/* Loading State */}
            {historyLoading ? (
              <div className="py-12 text-center">
                <Spin size="large" />
                <div className="mt-4 text-gray-500">Loading betting history...</div>
              </div>
            ) : historyError ? (
              /* Error State */
              <Alert type="error" message="Failed to load betting history" description={historyError} showIcon />
            ) : filteredBets.length === 0 ? (
              /* Empty State */
              <Empty
                image={<HistoryOutlined className="text-6xl text-gray-400" />}
                description={
                  <div className="text-center">
                    <div className="mb-2 text-lg text-gray-600">
                      {searchTerm || selectedStatus !== 'all' || selectedPaymentMethod !== 'all' || selectedMarketType !== 'all' || dateRange[0]
                        ? 'No bets match your filters'
                        : 'No betting history available'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {searchTerm || selectedStatus !== 'all' || selectedPaymentMethod !== 'all' || selectedMarketType !== 'all' || dateRange[0]
                        ? 'Try adjusting your filters'
                        : 'Start betting to see your history here'}
                    </div>
                  </div>
                }
                className="py-12"
              />
            ) : (
              /* Bets List */
              <>
                <div className="space-y-4">
                  {paginatedBets.map((bet) => (
                    <BetCard key={bet.id} bet={bet} onConfirmPayment={handleBetAction} showActions={true} />
                  ))}
                </div>

                {/* Pagination */}
                {filteredBets.length > pageSize && (
                  <div className="mt-6 text-center">
                    <Pagination
                      current={currentPage}
                      total={filteredBets.length}
                      pageSize={pageSize}
                      onChange={setCurrentPage}
                      showSizeChanger={false}
                      showQuickJumper
                      showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} bets`}
                    />
                  </div>
                )}
              </>
            )}
          </Card>

          {/* Performance Insights */}
          {bettingStats && bettingStats.recent_form && bettingStats.recent_form.length > 0 && (
            <Card className="mt-6">
              <Title level={4} className="mb-4">
                <LineChartOutlined className="mr-2" />
                Recent Form
              </Title>

              <div className="mb-4 flex items-center space-x-2">
                <Text>Last {bettingStats.recent_form.length} bets:</Text>
                <div className="flex space-x-1">
                  {bettingStats.recent_form.map((result, index) => (
                    <span
                      key={index}
                      className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white ${result === 'W' ? 'bg-green-500' : result === 'L' ? 'bg-red-500' : 'bg-gray-500'} `}
                    >
                      {result}
                    </span>
                  ))}
                </div>
              </div>

              {bettingStats.favorite_market_type && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <Text strong>Favorite Market Type:</Text>
                    <div className="mt-1 flex items-center space-x-2">
                      <span>{MARKET_TYPE_CONFIGS[bettingStats.favorite_market_type]?.icon}</span>
                      <span>{MARKET_TYPE_CONFIGS[bettingStats.favorite_market_type]?.label}</span>
                    </div>
                  </div>
                  <div>
                    <Text strong>Average Odds:</Text>
                    <div className="mt-1 text-lg font-semibold text-blue-600">{bettingStats.average_odds.toFixed(2)}</div>
                  </div>
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </>
  );
};

export default BettingHistory;
