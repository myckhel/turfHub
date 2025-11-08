import { formatCurrency } from '@/utils/format';
import { CheckCircleOutlined, CloseCircleOutlined, DollarOutlined, UserOutlined } from '@ant-design/icons';
import { Card, Col, Descriptions, Modal, Row, Space, Statistic, Table, Tag, Typography } from 'antd';
import { format } from 'date-fns';
import React, { memo } from 'react';
import type { BettingMarket } from '../../types/betting.types';

const { Text } = Typography;

interface MarketDetailsModalProps {
  open: boolean;
  market: BettingMarket | null;
  onClose: () => void;
}

const MarketDetailsModal: React.FC<MarketDetailsModalProps> = memo(({ open, market, onClose }) => {
  if (!market) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'settled':
        return 'default';
      case 'cancelled':
        return 'warning';
      case 'suspended':
        return 'error';
      default:
        return 'processing';
    }
  };

  const marketOptionsColumns = [
    {
      title: 'Option',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: { is_winning?: boolean }) => (
        <Space>
          <span>{name}</span>
          {record.is_winning && <CheckCircleOutlined style={{ color: '#52c41a' }} />}
        </Space>
      ),
    },
    {
      title: 'Odds',
      dataIndex: 'odds',
      key: 'odds',
      render: (odds: number) => <Text strong>{odds || '-'}</Text>,
    },
    {
      title: 'Bets',
      dataIndex: 'bets_count',
      key: 'bets_count',
      render: (count: number) => count || 0,
    },
    {
      title: 'Total Stake',
      dataIndex: 'total_stake',
      key: 'total_stake',
      render: (stake: number) => formatCurrency(stake || 0),
    },
  ];

  return (
    <Modal
      title={
        <Space>
          <DollarOutlined />
          <span>Market Details</span>
        </Space>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={800}
    >
      <div className="space-y-4">
        {/* Market Info */}
        <Card title="Market Information" size="small">
          <Descriptions column={2}>
            <Descriptions.Item label="Name">{market.name}</Descriptions.Item>
            <Descriptions.Item label="Type">
              <Tag color="blue">{market.market_type.replace('_', ' ').toUpperCase()}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={getStatusColor(market.status)}>{market.status.toUpperCase()}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Active">
              {market.is_active ? (
                <Tag color="success" icon={<CheckCircleOutlined />}>
                  Active
                </Tag>
              ) : (
                <Tag color="error" icon={<CloseCircleOutlined />}>
                  Inactive
                </Tag>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Created">{format(new Date(market.created_at), 'MMM dd, yyyy HH:mm')}</Descriptions.Item>
            {market.closes_at && <Descriptions.Item label="Closes">{format(new Date(market.closes_at), 'MMM dd, yyyy HH:mm')}</Descriptions.Item>}
          </Descriptions>
          {market.description && (
            <div className="mt-3">
              <Text type="secondary">{market.description}</Text>
            </div>
          )}
        </Card>

        {/* Game Match Info */}
        {market.game_match && (
          <Card title="Game Match" size="small">
            <Descriptions column={2}>
              <Descriptions.Item label="Teams">
                {market.game_match.first_team?.name || 'Team 1'} vs {market.game_match.second_team?.name || 'Team 2'}
              </Descriptions.Item>
              <Descriptions.Item label="Match Time">
                {market.game_match.match_time ? format(new Date(market.game_match.match_time), 'MMM dd, yyyy HH:mm') : 'Not scheduled'}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag>{market.game_match.status.toUpperCase()}</Tag>
              </Descriptions.Item>
              {market.game_match.first_team_score !== undefined && market.game_match.second_team_score !== undefined && (
                <Descriptions.Item label="Score">
                  {market.game_match.first_team_score} - {market.game_match.second_team_score}
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>
        )}

        {/* Statistics */}
        <Card title="Betting Statistics" size="small">
          <Row gutter={16}>
            <Col span={6}>
              <Statistic title="Total Bets" value={market.total_bets || 0} prefix={<UserOutlined />} />
            </Col>
            <Col span={6}>
              <Statistic
                title="Total Stake"
                value={market.total_stake || 0}
                formatter={(value) => formatCurrency(Number(value))}
                prefix={<DollarOutlined />}
              />
            </Col>
            <Col span={6}>
              <Statistic title="Options" value={market.market_options?.length || 0} />
            </Col>
            <Col span={6}>
              <Statistic
                title="Avg Bet"
                value={market.total_stake && market.total_bets ? market.total_stake / market.total_bets : 0}
                formatter={(value) => formatCurrency(Number(value))}
              />
            </Col>
          </Row>
        </Card>

        {/* Market Options */}
        {market.market_options && market.market_options.length > 0 && (
          <Card title="Betting Options" size="small">
            <Table dataSource={market.market_options} columns={marketOptionsColumns} rowKey="id" pagination={false} size="small" />
          </Card>
        )}
      </div>
    </Modal>
  );
});

MarketDetailsModal.displayName = 'MarketDetailsModal';

export default MarketDetailsModal;
