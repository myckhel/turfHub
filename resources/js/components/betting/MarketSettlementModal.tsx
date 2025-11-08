import { formatCurrency } from '@/utils/format';
import { CheckCircleOutlined, DollarOutlined, TrophyOutlined, WarningOutlined } from '@ant-design/icons';
import { Alert, App, Button, Card, Checkbox, Form, Modal, Space, Table, Typography } from 'antd';
import React, { memo, useCallback, useState } from 'react';
import { bettingApi } from '../../apis/betting';
import type { BettingMarket, MarketOption, SettleMarketRequest } from '../../types/betting.types';

const { Text } = Typography;

interface MarketSettlementModalProps {
  open: boolean;
  market: BettingMarket | null;
  onClose: () => void;
  onSuccess?: () => void;
}

const MarketSettlementModal: React.FC<MarketSettlementModalProps> = memo(({ open, market, onClose, onSuccess }) => {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [selectedWinningOptions, setSelectedWinningOptions] = useState<number[]>([]);

  const handleOptionSelect = useCallback((optionId: number, checked: boolean) => {
    setSelectedWinningOptions((prev) => {
      if (checked) {
        return [...prev, optionId];
      } else {
        return prev.filter((id) => id !== optionId);
      }
    });
  }, []);

  const handleSettle = useCallback(async () => {
    if (!market || selectedWinningOptions.length === 0) {
      message.error('Please select at least one winning option');
      return;
    }

    setLoading(true);
    try {
      const settlementData: SettleMarketRequest = {
        settlement_result: 'settled',
        winning_option_ids: selectedWinningOptions,
      };

      await bettingApi.settleMarket(market.id, settlementData);
      message.success('Market settled successfully');
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Failed to settle market:', error);
      message.error('Failed to settle market. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [market, selectedWinningOptions, onSuccess, onClose, message]);

  const handleCancel = useCallback(() => {
    setSelectedWinningOptions([]);
    form.resetFields();
    onClose();
  }, [form, onClose]);

  if (!market) return null;

  const marketOptionsColumns = [
    {
      title: 'Select Winner',
      key: 'select',
      width: 120,
      align: 'center' as const,
      render: (_: unknown, record: MarketOption) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={selectedWinningOptions.includes(record.id)}
            onChange={(e) => handleOptionSelect(record.id, e.target.checked)}
            disabled={market.status !== 'active'}
          />
        </div>
      ),
    },
    {
      title: 'Option',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => <Text strong>{name}</Text>,
    },
    {
      title: 'Odds',
      dataIndex: 'odds',
      key: 'odds',
      render: (odds: string | number) => <Text>{odds ? parseFloat(String(odds)).toFixed(2) : '-'}</Text>,
    },
    {
      title: 'Total Bets',
      dataIndex: 'bet_count',
      key: 'bet_count',
      render: (count: number) => count || 0,
    },
    {
      title: 'Total Stake',
      dataIndex: 'total_stake',
      key: 'total_stake',
      render: (stake: string | number) => formatCurrency(parseFloat(String(stake)) || 0),
    },
  ];

  const totalPayout = selectedWinningOptions.reduce((total, optionId) => {
    const option = market.market_options?.find((opt) => opt.id === optionId);
    console.log({ option, total, optionId });

    if (option) {
      const stake = parseFloat(String(option.total_stake || 0));
      const odds = parseFloat(String(option.odds || 0));
      return total + stake * odds;
    }
    return total;
  }, 0);

  const isAlreadySettled = market.status === 'settled';
  const isCancelled = market.status === 'cancelled';
  const isSuspended = market.status === 'suspended';
  const canSettle = market.status === 'active';

  return (
    <Modal
      title={
        <Space>
          <TrophyOutlined />
          <span>Settle Market</span>
        </Space>
      }
      open={open}
      onCancel={handleCancel}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          Cancel
        </Button>,
        <Button
          key="settle"
          type="primary"
          onClick={handleSettle}
          loading={loading}
          disabled={selectedWinningOptions.length === 0 || !canSettle}
          icon={<CheckCircleOutlined />}
        >
          Settle Market
        </Button>,
      ]}
      width={800}
    >
      <div className="space-y-4">
        {isAlreadySettled && (
          <Alert
            message="Market Already Settled"
            description="This market has already been settled and cannot be modified."
            type="warning"
            icon={<WarningOutlined />}
            showIcon
          />
        )}

        {isCancelled && (
          <Alert
            message="Market Cancelled"
            description="This market has been cancelled and cannot be settled."
            type="error"
            icon={<WarningOutlined />}
            showIcon
          />
        )}

        {isSuspended && (
          <Alert
            message="Market Suspended"
            description="This market is currently suspended. Reactivate it before settling."
            type="warning"
            icon={<WarningOutlined />}
            showIcon
          />
        )}

        <Card title="Market Information" size="small">
          <div className="space-y-2">
            <div>
              <Text strong>Market: </Text>
              <Text>{market.name}</Text>
            </div>
            {market.game_match && (
              <div>
                <Text strong>Match: </Text>
                <Text>
                  {market.game_match.first_team?.name || 'Team 1'} vs {market.game_match.second_team?.name || 'Team 2'}
                </Text>
                {market.game_match.first_team_score !== undefined && market.game_match.second_team_score !== undefined && (
                  <Text>
                    {' '}
                    ({market.game_match.first_team_score} - {market.game_match.second_team_score})
                  </Text>
                )}
              </div>
            )}
            <div>
              <Text strong>Total Bets: </Text>
              <Text>{market.total_bets || 0}</Text>
            </div>
            <div>
              <Text strong>Total Stake: </Text>
              <Text>{formatCurrency(market.total_stake || 0)}</Text>
            </div>
          </div>
        </Card>

        <Card title="Select Winning Options" size="small">
          <Alert
            message="Settlement Instructions"
            description="Select the winning betting options based on the actual match result. Multiple options can be selected if applicable (e.g., for accumulator bets)."
            type="info"
            className="mb-4"
          />

          <Table dataSource={market.market_options} columns={marketOptionsColumns} rowKey="id" pagination={false} size="small" />
        </Card>

        {selectedWinningOptions.length > 0 && (
          <Card title="Settlement Summary" size="small">
            <div className="space-y-2">
              <div>
                <Text strong>Selected Winners: </Text>
                <Text>
                  {selectedWinningOptions
                    .map((optionId) => {
                      const option = market.market_options?.find((opt) => opt.id === optionId);
                      return option?.name;
                    })
                    .join(', ')}
                </Text>
              </div>
              <div>
                <Text strong>Estimated Total Payout: </Text>
                <Text strong style={{ color: '#f5222d' }}>
                  <DollarOutlined /> {formatCurrency(totalPayout)}
                </Text>
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  * This is an estimate. Actual payouts will be calculated based on individual bet amounts and odds.
                </Text>
              </div>
            </div>
          </Card>
        )}
      </div>
    </Modal>
  );
});

MarketSettlementModal.displayName = 'MarketSettlementModal';

export default MarketSettlementModal;
