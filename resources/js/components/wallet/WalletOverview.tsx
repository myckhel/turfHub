import { walletApi, type WalletBalance } from '@/apis/wallet';
import { EyeInvisibleOutlined, EyeOutlined, MinusOutlined, PlusOutlined, WalletOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Col, Row, Spin, Statistic, Typography } from 'antd';
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
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <WalletOutlined className="text-primary" />
              <Title level={compact ? 5 : 4} className="mb-0 text-sm sm:text-base">
                {turfId ? 'Turf Wallet' : 'My Wallet'}
              </Title>
            </div>
            {showActions && (
              <Button
                type="text"
                icon={balanceVisible ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                onClick={() => setBalanceVisible(!balanceVisible)}
                className="self-start text-gray-500 sm:self-auto"
                size="small"
              />
            )}
          </div>
        }
      >
        <Row gutter={[8, 16]}>
          <Col xs={24} sm={compact ? 24 : 16} md={compact ? 24 : 12}>
            <Statistic
              title="Current Balance"
              value={balanceVisible ? balance?.balance : '****'}
              precision={2}
              prefix="₦"
              className="text-center sm:text-left"
              valueStyle={{
                color: '#52c41a',
                fontSize: compact ? '1.25rem' : window.innerWidth < 640 ? '1.5rem' : '2rem',
                fontWeight: 'bold',
              }}
            />
          </Col>
        </Row>

        {/* Mobile action buttons for non-compact mode */}
        {!compact && showActions && (
          <div className="mt-4 flex flex-col gap-2">
            {!turfId && (
              <Button type="primary" icon={<PlusOutlined />} onClick={handleDepositClick} className="min-h-[44px] w-full touch-manipulation">
                Deposit Money
              </Button>
            )}
            <Button icon={<MinusOutlined />} onClick={handleWithdrawClick} className="min-h-[44px] w-full touch-manipulation">
              Withdraw Money
            </Button>
          </div>
        )}

        {/* Compact mode action buttons */}
        {compact && showActions && (
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            {!turfId && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleDepositClick}
                size="small"
                className="min-h-[44px] flex-1 touch-manipulation"
              >
                Deposit
              </Button>
            )}
            <Button icon={<MinusOutlined />} onClick={handleWithdrawClick} size="small" className="min-h-[44px] flex-1 touch-manipulation">
              Withdraw
            </Button>
          </div>
        )}
      </Card>

      {!turfId && <DepositModal open={depositModalOpen} onCancel={() => setDepositModalOpen(false)} onSuccess={handleDepositSuccess} />}

      <WithdrawModal turfId={turfId} open={withdrawModalOpen} onCancel={() => setWithdrawModalOpen(false)} onSuccess={handleWithdrawSuccess} />
    </>
  );
};

export default WalletOverview;
