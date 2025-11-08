import { formatCurrency } from '@/utils/format';
import { BarChartOutlined, DollarOutlined, LineChartOutlined, PieChartOutlined, TrophyOutlined } from '@ant-design/icons';
import { Card, Col, Row, Statistic, Typography } from 'antd';
import React, { memo, useCallback, useEffect, useState } from 'react';
import { bettingApi } from '../../apis/betting';

const { Title, Text } = Typography;

interface BettingAnalyticsProps {
  turfId: number;
  className?: string;
}

interface BettingStats {
  total_revenue: number;
  total_bets: number;
  total_markets: number;
  active_markets: number;
  total_players: number;
  average_bet_amount: number;
  commission_earned: number;
  total_payouts: number;
  profit_margin: number;
  popular_market_types: Array<{
    type: string;
    count: number;
    revenue: number;
  }>;
  recent_activity: Array<{
    date: string;
    bets: number;
    revenue: number;
  }>;
}

const BettingAnalytics: React.FC<BettingAnalyticsProps> = memo(({ turfId, className }) => {
  const [stats, setStats] = useState<BettingStats | null>(null);
  const [loading, setLoading] = useState(false);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const response = await bettingApi.getTurfAnalytics(turfId);
      setStats(response);
    } catch (error) {
      console.error('Failed to load betting analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [turfId]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  if (!stats) {
    return (
      <div className={className}>
        <Card loading={loading}>
          <Title level={4}>
            <BarChartOutlined className="mr-2" />
            Betting Analytics
          </Title>
        </Card>
      </div>
    );
  }

  return (
    <div className={className}>
      <Card>
        <Title level={4} className="mb-4">
          <BarChartOutlined className="mr-2" />
          Betting Analytics
        </Title>

        {/* Key Metrics */}
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={12} sm={8} md={6}>
            <Card size="small">
              <Statistic
                title="Total Revenue"
                value={stats.total_revenue}
                formatter={(value) => formatCurrency(Number(value))}
                prefix={<DollarOutlined />}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Card size="small">
              <Statistic
                title="Commission Earned"
                value={stats.commission_earned}
                formatter={(value) => formatCurrency(Number(value))}
                prefix={<DollarOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Card size="small">
              <Statistic title="Total Bets" value={stats.total_bets} prefix={<TrophyOutlined />} />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Card size="small">
              <Statistic title="Active Markets" value={stats.active_markets} suffix={`/ ${stats.total_markets}`} prefix={<LineChartOutlined />} />
            </Card>
          </Col>
        </Row>

        {/* Secondary Metrics */}
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={12} sm={8} md={6}>
            <Card size="small">
              <Statistic
                title="Average Bet"
                value={stats.average_bet_amount}
                formatter={(value) => formatCurrency(Number(value))}
                valueStyle={{ fontSize: '16px' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Card size="small">
              <Statistic title="Total Players" value={stats.total_players} valueStyle={{ fontSize: '16px' }} />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Card size="small">
              <Statistic
                title="Total Payouts"
                value={stats.total_payouts}
                formatter={(value) => formatCurrency(Number(value))}
                valueStyle={{ fontSize: '16px' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Card size="small">
              <Statistic
                title="Profit Margin"
                value={stats.profit_margin}
                suffix="%"
                precision={1}
                valueStyle={{
                  fontSize: '16px',
                  color: stats.profit_margin > 0 ? '#3f8600' : '#cf1322',
                }}
              />
            </Card>
          </Col>
        </Row>

        {/* Popular Market Types */}
        {stats.popular_market_types && stats.popular_market_types.length > 0 && (
          <Card size="small" className="mb-4">
            <Title level={5}>
              <PieChartOutlined className="mr-2" />
              Popular Market Types
            </Title>
            <div className="space-y-3">
              {stats.popular_market_types.map((market, index) => (
                <div key={market.type} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{
                        backgroundColor: `hsl(${(index * 360) / stats.popular_market_types.length}, 70%, 50%)`,
                      }}
                    />
                    <Text className="font-medium">{market.type.replace('_', ' ').toUpperCase()}</Text>
                  </div>
                  <div className="text-right">
                    <Text strong>{market.count} bets</Text>
                    <br />
                    <Text type="secondary" className="text-xs">
                      {formatCurrency(market.revenue)}
                    </Text>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Performance Summary */}
        <Card size="small">
          <Title level={5}>Performance Summary</Title>
          <div className="space-y-2">
            <div className="flex justify-between">
              <Text type="secondary">Revenue Growth:</Text>
              <Text strong className="text-green-600">
                {stats.recent_activity && stats.recent_activity.length > 1
                  ? `${((stats.recent_activity[stats.recent_activity.length - 1].revenue / stats.recent_activity[0].revenue - 1) * 100).toFixed(1)}%`
                  : 'N/A'}
              </Text>
            </div>
            <div className="flex justify-between">
              <Text type="secondary">Active Market Ratio:</Text>
              <Text strong>{((stats.active_markets / stats.total_markets) * 100).toFixed(1)}%</Text>
            </div>
            <div className="flex justify-between">
              <Text type="secondary">Average Bets per Market:</Text>
              <Text strong>{stats.total_markets > 0 ? (stats.total_bets / stats.total_markets).toFixed(1) : '0'}</Text>
            </div>
          </div>
        </Card>
      </Card>
    </div>
  );
});

BettingAnalytics.displayName = 'BettingAnalytics';

export default BettingAnalytics;
