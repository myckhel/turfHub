import { CreditCardOutlined, WalletOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Divider, Modal, Radio, Space, Typography } from 'antd';
import { capitalize } from 'lodash';
import React, { memo, useCallback, useState } from 'react';
import type { WalletBalance } from '../../types/wallet.types';

const { Text, Title } = Typography;

interface PaymentMethodModalProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: (paymentMethod: 'wallet' | 'paystack') => void;
  amount: number;
  title?: string;
  description?: string;
  walletBalance?: WalletBalance | null;
  loading?: boolean;
}

const PaymentMethodModal: React.FC<PaymentMethodModalProps> = memo(
  ({ open, onCancel, onConfirm, amount, title = 'Choose Payment Method', description, walletBalance, loading = false }) => {
    const [selectedMethod, setSelectedMethod] = useState<'wallet' | 'paystack'>('paystack');

    const handleConfirm = useCallback(() => {
      onConfirm(selectedMethod);
    }, [selectedMethod, onConfirm]);

    const hasInsufficientBalance = walletBalance && walletBalance.balance < amount;
    const canUseWallet = walletBalance && !hasInsufficientBalance;

    return (
      <Modal
        open={open}
        title={title}
        onCancel={onCancel}
        footer={[
          <Button key="cancel" onClick={onCancel}>
            Cancel
          </Button>,
          <Button key="confirm" type="primary" loading={loading} onClick={handleConfirm} disabled={selectedMethod === 'wallet' && !canUseWallet}>
            Continue with {capitalize(selectedMethod)}
          </Button>,
        ]}
        width={500}
      >
        <div className="space-y-6">
          {description && (
            <Text type="secondary" className="block text-center">
              {description}
            </Text>
          )}

          <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
            <div className="text-center">
              <Title level={4} className="mb-2">
                Amount to Pay
              </Title>
              <Text className="text-2xl font-bold text-blue-600 dark:text-blue-400">₦{amount.toLocaleString()}</Text>
            </div>
          </Card>

          <div className="space-y-4">
            <Title level={5}>Select Payment Method</Title>

            <Radio.Group value={selectedMethod} onChange={(e) => setSelectedMethod(e.target.value)} className="w-full">
              <Space direction="vertical" className="w-full" size="middle">
                {/* Wallet Payment Option */}
                <Card
                  className={`cursor-pointer transition-all ${
                    selectedMethod === 'wallet' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700'
                  } ${!canUseWallet ? 'opacity-50' : ''}`}
                  onClick={() => canUseWallet && setSelectedMethod('wallet')}
                  hoverable={canUseWallet || undefined}
                >
                  <Radio value="wallet" disabled={!canUseWallet}>
                    <div className="flex w-full items-center justify-between">
                      <div className="flex items-center gap-3">
                        <WalletOutlined className="text-xl text-green-600" />
                        <div>
                          <Text strong>Wallet Payment</Text>
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
                            Loading balance...
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
                      <CreditCardOutlined className="text-xl text-blue-600" />
                      <div>
                        <Text strong>Paystack Payment</Text>
                        <br />
                        <Text type="secondary" className="text-sm">
                          Pay with card, bank transfer, or USSD
                        </Text>
                      </div>
                    </div>
                  </Radio>
                </Card>
              </Space>
            </Radio.Group>
          </div>

          {hasInsufficientBalance && selectedMethod === 'wallet' && (
            <Alert
              type="warning"
              message="Insufficient Wallet Balance"
              description={
                <div>
                  You need ₦{amount.toLocaleString()} but only have ₦{walletBalance?.balance.toLocaleString()}.
                  <br />
                  Please top up your wallet or use Paystack payment.
                </div>
              }
              showIcon
            />
          )}

          <Divider />

          <div className="text-center">
            <Text type="secondary" className="text-xs">
              Your payment is secure and encrypted. No card details are stored.
            </Text>
          </div>
        </div>
      </Modal>
    );
  },
);

PaymentMethodModal.displayName = 'PaymentMethodModal';

export default PaymentMethodModal;
