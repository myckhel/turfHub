import { bettingApi } from '@/apis/betting';
import type { WalletBalance } from '@/apis/wallet';
import { walletApi } from '@/apis/wallet';
import { usePaystack } from '@/hooks/usePaystack';
import type { Bet } from '@/types/betting.types';
import type { PaystackTransactionResponse } from '@/types/paystack';
import { CreditCardOutlined, DollarCircleOutlined, WalletOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Divider, Form, Modal, Radio, Space, Typography } from 'antd';
import React, { useEffect, useState } from 'react';

const { Text } = Typography;

interface BettingPaymentModalProps {
  open: boolean;
  onCancel: () => void;
  onSuccess: (bet: Bet) => void;
  bet?: Bet;
  marketOptionId: number;
  stakeAmount: number;
  potentialPayout: number;
  odds: number;
}

const BettingPaymentModal: React.FC<BettingPaymentModalProps> = ({
  open,
  onCancel,
  onSuccess,
  marketOptionId,
  stakeAmount,
  potentialPayout,
  odds,
}) => {
  const [form] = Form.useForm();
  const [selectedMethod, setSelectedMethod] = useState<'wallet' | 'paystack'>('wallet');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState<WalletBalance | null>(null);
  const [walletLoading, setWalletLoading] = useState(false);

  // Calculate if wallet has insufficient balance
  const hasInsufficientBalance = walletBalance ? walletBalance.balance < stakeAmount : false;

  // Fetch wallet balance
  useEffect(() => {
    if (open) {
      fetchWalletBalance();
    }
  }, [open]);

  const fetchWalletBalance = async () => {
    try {
      setWalletLoading(true);
      const response = await walletApi.getBalance();
      setWalletBalance(response.data);
    } catch (err) {
      console.error('Failed to fetch wallet balance:', err);
    } finally {
      setWalletLoading(false);
    }
  };

  const { initiatePayment, generateReference } = usePaystack({
    onSuccess: async (transaction: PaystackTransactionResponse) => {
      try {
        // Process bet with Paystack payment
        const result = await bettingApi.placeBet({
          market_option_id: marketOptionId,
          amount: stakeAmount,
          payment_method: 'online',
          payment_reference: transaction.reference,
        });

        if (result.status) {
          onSuccess(result.data.bet);
          form.resetFields();
          setError(null);
        } else {
          setError(result.message || 'Failed to place bet');
        }
      } catch (err: unknown) {
        const error = err as { message?: string };
        setError(error.message || 'Failed to process bet payment');
      } finally {
        setLoading(false);
      }
    },
    onError: (error) => {
      setError(error.message || 'Payment failed');
      setLoading(false);
    },
    onCancel: () => {
      setLoading(false);
    },
    onLoad: () => {
      setLoading(true);
    },
  });

  const handlePayment = async () => {
    try {
      setLoading(true);
      setError(null);

      if (selectedMethod === 'wallet') {
        // Process wallet payment
        const result = await bettingApi.placeBet({
          market_option_id: marketOptionId,
          amount: stakeAmount,
          payment_method: 'wallet',
        });

        if (result.status) {
          onSuccess(result.data.bet);
          form.resetFields();
        } else {
          setError(result.message || 'Failed to place bet with wallet');
        }
      } else {
        // Process Paystack payment
        initiatePayment({
          amount: stakeAmount,
          currency: 'NGN',
          reference: generateReference('BET'),
          metadata: {
            payment_type: 'bet',
            market_option_id: marketOptionId,
            stake_amount: stakeAmount,
          },
        });
      }
    } catch (err: unknown) {
      const error = err as { message?: string };
      setError(error.message || 'Failed to process payment');
    } finally {
      if (selectedMethod === 'wallet') {
        setLoading(false);
      }
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setError(null);
    setSelectedMethod('wallet');
    onCancel();
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <DollarCircleOutlined className="text-blue-500" />
          <span>Confirm Bet Payment</span>
        </div>
      }
      open={open}
      onCancel={handleCancel}
      footer={null}
      width={500}
      centered
    >
      <div className="py-4">
        {/* Bet Summary */}
        <Card className="mb-6 bg-gray-50">
          <div className="space-y-3">
            <div className="flex justify-between">
              <Text className="text-gray-600">Stake Amount:</Text>
              <Text className="font-semibold">₦{stakeAmount.toLocaleString()}</Text>
            </div>
            <div className="flex justify-between">
              <Text className="text-gray-600">Odds:</Text>
              <Text className="font-semibold">{odds.toFixed(2)}</Text>
            </div>
            <Divider className="my-2" />
            <div className="flex justify-between">
              <Text className="text-gray-600">Potential Payout:</Text>
              <Text className="font-semibold text-green-600">₦{potentialPayout.toLocaleString()}</Text>
            </div>
          </div>
        </Card>

        {error && <Alert message="Payment Error" description={error} type="error" showIcon className="mb-4" />}

        <Form form={form} layout="vertical">
          <Form.Item label="Select Payment Method" className="mb-4">
            <Radio.Group value={selectedMethod} onChange={(e) => setSelectedMethod(e.target.value)} className="w-full">
              <Space direction="vertical" className="w-full" size="middle">
                {/* Wallet Payment Option */}
                <Card
                  className={`cursor-pointer transition-all ${
                    selectedMethod === 'wallet' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700'
                  }`}
                  onClick={() => setSelectedMethod('wallet')}
                  hoverable
                >
                  <Radio value="wallet">
                    <div className="flex w-full items-center justify-between">
                      <div className="flex items-center gap-3">
                        <WalletOutlined className="text-xl text-green-500" />
                        <div>
                          <Text className="font-medium">Wallet Payment</Text>
                          <br />
                          <Text type="secondary" className="text-sm">
                            Pay instantly from your wallet balance
                          </Text>
                        </div>
                      </div>
                      <div className="text-right">
                        {walletBalance ? (
                          <>
                            <Text className="text-sm">Balance: ₦{walletBalance.balance.toLocaleString()}</Text>
                            {hasInsufficientBalance && (
                              <>
                                <br />
                                <Text type="danger" className="text-xs">
                                  Insufficient funds
                                </Text>
                              </>
                            )}
                          </>
                        ) : (
                          <Text type="secondary" className="text-sm">
                            {walletLoading ? 'Loading...' : 'Unable to load balance'}
                          </Text>
                        )}
                      </div>
                    </div>
                  </Radio>
                </Card>

                {/* Paystack Payment Option */}
                <Card
                  className={`cursor-pointer transition-all ${
                    selectedMethod === 'paystack' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700'
                  }`}
                  onClick={() => setSelectedMethod('paystack')}
                  hoverable
                >
                  <Radio value="paystack">
                    <div className="flex items-center gap-3">
                      <CreditCardOutlined className="text-xl text-blue-500" />
                      <div>
                        <Text className="font-medium">Card Payment</Text>
                        <br />
                        <Text type="secondary" className="text-sm">
                          Pay with your debit/credit card via Paystack
                        </Text>
                      </div>
                    </div>
                  </Radio>
                </Card>
              </Space>
            </Radio.Group>
          </Form.Item>

          <div className="mt-6 flex gap-3">
            <Button
              type="primary"
              size="large"
              block
              loading={loading}
              disabled={selectedMethod === 'wallet' && hasInsufficientBalance}
              onClick={handlePayment}
              icon={selectedMethod === 'wallet' ? <WalletOutlined /> : <CreditCardOutlined />}
            >
              {loading
                ? 'Processing...'
                : selectedMethod === 'wallet'
                  ? `Pay ₦${stakeAmount.toLocaleString()} from Wallet`
                  : `Pay ₦${stakeAmount.toLocaleString()} with Card`}
            </Button>
          </div>

          <div className="mt-3 flex gap-3">
            <Button size="large" block onClick={handleCancel} disabled={loading}>
              Cancel
            </Button>
          </div>

          {selectedMethod === 'wallet' && hasInsufficientBalance && (
            <Alert
              message="Insufficient Wallet Balance"
              description={
                <div>
                  <Text>You need ₦{(stakeAmount - (walletBalance?.balance || 0)).toLocaleString()} more in your wallet to place this bet.</Text>
                  <br />
                  <Button type="link" size="small" className="h-auto p-0">
                    Top up your wallet
                  </Button>
                </div>
              }
              type="warning"
              showIcon
              className="mt-4"
            />
          )}
        </Form>
      </div>
    </Modal>
  );
};

export default BettingPaymentModal;
