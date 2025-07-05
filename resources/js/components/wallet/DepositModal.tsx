import { walletApi } from '@/apis/wallet';
import { usePaystack } from '@/hooks/usePaystack';
import type { PaystackTransactionResponse } from '@/types/paystack';
import { CreditCardOutlined } from '@ant-design/icons';
import { Alert, Button, Form, InputNumber, Modal, Space, Typography } from 'antd';
import React, { memo, useState } from 'react';

const { Title, Text } = Typography;

interface DepositModalProps {
  open: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

const DepositModal: React.FC<DepositModalProps> = ({ open, onCancel, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { initiatePayment, generateReference } = usePaystack({
    onSuccess: async (transaction: PaystackTransactionResponse) => {
      try {
        // Process the deposit with the payment reference
        await walletApi.deposit({
          amount: form.getFieldValue('amount'),
          payment_reference: transaction.reference,
          metadata: {
            paystack_response: transaction,
          },
        });

        onSuccess();
        form.resetFields();
        setError(null);
      } catch (depositError: unknown) {
        const error = depositError as { message?: string };
        setError(error.message || 'Failed to process deposit');
      } finally {
        setLoading(false);
      }
    },
    onError: (error) => {
      setError(error.message || 'Failed to initialize payment');
      setLoading(false);
    },
    onCancel: () => {
      setLoading(false);
    },
    onLoad: () => {
      setLoading(true);
    },
  });

  const handleDeposit = async (values: { amount: number }) => {
    try {
      setLoading(true);
      setError(null);

      const { amount } = values;

      // Initialize Paystack payment using the new hook
      initiatePayment({
        amount,
        currency: 'NGN',
        reference: generateReference('TM_DEP'),
        metadata: {
          deposit_type: 'wallet_deposit',
          amount,
        },
      });
    } catch (err: unknown) {
      const error = err as { message?: string };
      setError(error.message || 'Failed to initialize payment');
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (!loading) {
      form.resetFields();
      setError(null);
      onCancel();
    }
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <CreditCardOutlined className="text-primary" />
          <Title level={4} className="mb-0">
            Deposit to Wallet
          </Title>
        </div>
      }
      open={open}
      onCancel={handleCancel}
      footer={null}
      destroyOnClose
      width={400}
    >
      <div className="py-4">
        <div className="mb-6">
          <Text type="secondary">
            Add money to your wallet using your debit card, bank account, or USSD. Your payment is processed securely by Paystack.
          </Text>
        </div>

        {error && (
          <Alert message="Deposit Error" description={error} type="error" showIcon className="mb-4" closable onClose={() => setError(null)} />
        )}

        <Form form={form} layout="vertical" onFinish={handleDeposit}>
          <Form.Item
            name="amount"
            label="Amount (₦)"
            rules={[
              { required: true, message: 'Please enter an amount' },
              { type: 'number', min: 100, message: 'Minimum deposit is ₦100' },
              { type: 'number', max: 500000, message: 'Maximum deposit is ₦500,000' },
            ]}
          >
            <InputNumber
              placeholder="Enter amount"
              style={{ width: '100%' }}
              size="large"
              prefix="₦"
              precision={2}
              min={100}
              max={500000}
              step={100}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            />
          </Form.Item>

          <div className="mb-4 rounded-lg bg-gray-50 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Transaction Fee:</span>
              <span className="font-medium">₦0.00</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-gray-600">You'll receive:</span>
              <span className="font-medium text-green-600">₦{form.getFieldValue('amount')?.toLocaleString() || '0.00'}</span>
            </div>
          </div>

          <Form.Item className="mb-0">
            <Space className="w-full" direction="vertical" size="middle">
              <Button type="primary" htmlType="submit" size="large" loading={loading} block icon={<CreditCardOutlined />}>
                {loading ? 'Processing...' : 'Pay with Paystack'}
              </Button>

              <Button onClick={handleCancel} size="large" block disabled={loading}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>

        <div className="mt-4 text-center text-xs text-gray-500">
          <Text type="secondary">Secured by Paystack • Your payment details are encrypted and secure</Text>
        </div>
      </div>
    </Modal>
  );
};

export default memo(DepositModal);
