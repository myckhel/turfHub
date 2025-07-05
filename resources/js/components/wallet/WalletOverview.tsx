import { walletApi, type WalletBalance } from '@/apis/wallet';
import { EyeInvisibleOutlined, EyeOutlined, MinusOutlined, PlusOutlined, WalletOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Col, Row, Space, Spin, Statistic, Typography } from 'antd';
import React, { useCallback, useEffect, useState } from 'react';
import DepositModal from './DepositModal';
import WithdrawModal from './WithdrawModal';

const { Title } = Typography;

interface WalletOverviewProps {
  userId?: number;
  turfId?: number;
  showActions?: boolean;
  compact?: boolean;
}

const WalletOverview: React.FC<WalletOverviewProps> = ({ userId, turfId, showActions = true, compact = false }) => {
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);

  const fetchBalance = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let response;
      if (turfId) {
        response = await walletApi.getTurfBalance(turfId);
      } else {
        response = await walletApi.getBalance();
      }

      setBalance(response.data);
    } catch (err: unknown) {
      const error = err as { message?: string };
      setError(error.message || 'Failed to fetch wallet balance');
    } finally {
      setLoading(false);
    }
  }, [turfId]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance, userId]);

  const handleDepositClick = () => {
    setDepositModalOpen(true);
  };

  const handleWithdrawClick = () => {
    setWithdrawModalOpen(true);
  };

  const handleDepositSuccess = () => {
    setDepositModalOpen(false);
    fetchBalance();
  };

  const handleWithdrawSuccess = () => {
    setWithdrawModalOpen(false);
    fetchBalance();
  };

  if (loading) {
    return (
      <Card className={compact ? '' : 'h-48'}>
        <div className="flex h-full items-center justify-center">
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={compact ? '' : 'h-48'}>
        <Alert
          message="Error Loading Wallet"
          description={error}
          type="error"
          showIcon
          action={
            <Button size="small" onClick={fetchBalance}>
              Retry
            </Button>
          }
        />
      </Card>
    );
  }

  return (
    <>
      <Card
        className={`wallet-overview ${compact ? '' : 'min-h-48'}`}
        title={
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <WalletOutlined className="text-primary" />
              <Title level={compact ? 5 : 4} className="mb-0">
                {turfId ? 'Turf Wallet' : 'My Wallet'}
              </Title>
            </div>
            {showActions && (
              <Button
                type="text"
                icon={balanceVisible ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                onClick={() => setBalanceVisible(!balanceVisible)}
                className="text-gray-500"
              />
            )}
          </div>
        }
        extra={
          showActions &&
          !compact && (
            <Space>
              <Button type="primary" icon={<PlusOutlined />} onClick={handleDepositClick} size={compact ? 'small' : undefined}>
                Deposit
              </Button>
              <Button icon={<MinusOutlined />} onClick={handleWithdrawClick} size={compact ? 'small' : undefined}>
                Withdraw
              </Button>
            </Space>
          )
        }
      >
        <Row gutter={compact ? 8 : 16}>
          <Col span={compact ? 24 : 12}>
            <Statistic
              title="Current Balance"
              value={balanceVisible ? balance?.balance : '****'}
              precision={2}
              prefix="₦"
              className="text-center"
              valueStyle={{
                color: '#52c41a',
                fontSize: compact ? '1.5rem' : '2rem',
                fontWeight: 'bold',
              }}
            />
          </Col>

          {!compact && (
            <Col span={12}>
              <div className="flex flex-col gap-2">
                <div className="text-xs tracking-wide text-gray-500 uppercase">Quick Actions</div>
                <div className="flex gap-2">
                  <Button type="primary" ghost icon={<PlusOutlined />} onClick={handleDepositClick} className="flex-1" size="small">
                    Add Money
                  </Button>
                  <Button icon={<MinusOutlined />} onClick={handleWithdrawClick} className="flex-1" size="small">
                    Withdraw
                  </Button>
                </div>
              </div>
            </Col>
          )}
        </Row>

        {compact && showActions && (
          <div className="mt-4 flex gap-2">
            <Button type="primary" icon={<PlusOutlined />} onClick={handleDepositClick} size="small" className="flex-1">
              Deposit
            </Button>
            <Button icon={<MinusOutlined />} onClick={handleWithdrawClick} size="small" className="flex-1">
              Withdraw
            </Button>
          </div>
        )}
      </Card>

      <DepositModal open={depositModalOpen} onCancel={() => setDepositModalOpen(false)} onSuccess={handleDepositSuccess} />

      <WithdrawModal open={withdrawModalOpen} onCancel={() => setWithdrawModalOpen(false)} onSuccess={handleWithdrawSuccess} />
    </>
  );
};

export default WalletOverview;
