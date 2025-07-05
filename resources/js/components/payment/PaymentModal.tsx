import { usePaystack } from '@/hooks/usePaystack';
import type { PaystackTransactionOptions, PaystackTransactionResponse } from '@/types/paystack';
import { CreditCardOutlined } from '@ant-design/icons';
import { Alert, Button, Form, InputNumber, Modal, Select, Space, Typography } from 'antd';
import React, { memo, useEffect, useState } from 'react';

const { Title, Text } = Typography;
const { Option } = Select;

interface PaymentModalProps {
  open: boolean;
  onCancel: () => void;
  onSuccess: (transaction: PaystackTransactionResponse) => void;
  title?: string;
  description?: string;
  amount?: number;
  currency?: string;
  minAmount?: number;
  maxAmount?: number;
  showAmountInput?: boolean;
  fixedAmount?: boolean;
  showCurrencySelector?: boolean;
  reference?: string;
  metadata?: Record<string, unknown>;
  channels?: Array<'card' | 'bank' | 'ussd' | 'qr' | 'eft' | 'mobile_money' | 'bank_transfer' | 'apple_pay'>;
  buttonText?: string;
  buttonIcon?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  width?: number;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  open,
  onCancel,
  onSuccess,
  title = 'Make Payment',
  description = 'Complete your payment using your preferred payment method. Your payment is processed securely by Paystack.',
  amount: initialAmount,
  currency = 'NGN',
  minAmount = 100,
  maxAmount = 1000000,
  showAmountInput = true,
  fixedAmount = false,
  showCurrencySelector = false,
  reference,
  metadata = {},
  channels = ['card', 'bank', 'ussd', 'mobile_money', 'bank_transfer'],
  buttonText = 'Pay with Paystack',
  buttonIcon = <CreditCardOutlined />,
  loading: externalLoading = false,
  disabled = false,
  className = '',
  width = 450,
}) => {
  const [form] = Form.useForm();
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const {
    initiatePayment,
    loading: paystackLoading,
    error: paystackError,
    generateReference,
  } = usePaystack({
    onSuccess: (transaction) => {
      setPaymentLoading(false);
      setPaymentError(null);
      form.resetFields();
      onSuccess(transaction);
    },
    onError: (error) => {
      setPaymentLoading(false);
      setPaymentError(error.message || 'Payment failed');
    },
    onCancel: () => {
      setPaymentLoading(false);
    },
    onLoad: () => {
      setPaymentLoading(true);
    },
  });

  const isLoading = paymentLoading || paystackLoading || externalLoading;

  // Set initial amount if provided
  useEffect(() => {
    if (initialAmount && showAmountInput) {
      form.setFieldsValue({ amount: initialAmount });
    }
  }, [form, initialAmount, showAmountInput]);

  // Clear error when modal opens
  useEffect(() => {
    if (open) {
      setPaymentError(null);
    }
  }, [open]);

  const handlePayment = async (values: { amount?: number; currency?: string }) => {
    try {
      setPaymentLoading(true);
      setPaymentError(null);

      const paymentAmount = fixedAmount && initialAmount ? initialAmount : values.amount || initialAmount || 0;
      const paymentCurrency = values.currency || currency;

      if (!paymentAmount || paymentAmount < minAmount) {
        throw new Error(`Minimum payment amount is ${currency}${minAmount.toLocaleString()}`);
      }

      if (paymentAmount > maxAmount) {
        throw new Error(`Maximum payment amount is ${currency}${maxAmount.toLocaleString()}`);
      }

      const paymentOptions: Partial<PaystackTransactionOptions> = {
        amount: paymentAmount,
        currency: paymentCurrency,
        reference: reference || generateReference(),
        channels,
        metadata: {
          ...metadata,
          payment_modal: true,
          timestamp: new Date().toISOString(),
        },
      };

      initiatePayment(paymentOptions);
    } catch (err) {
      const error = err as { message?: string };
      setPaymentError(error.message || 'Failed to initialize payment');
      setPaymentLoading(false);
    }
  };

  const handleCancel = () => {
    if (!isLoading) {
      form.resetFields();
      setPaymentError(null);
      onCancel();
    }
  };

  const currentAmount = form.getFieldValue('amount') || initialAmount || 0;
  const displayError = paymentError || paystackError;

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          {buttonIcon}
          <Title level={4} className="mb-0">
            {title}
          </Title>
        </div>
      }
      open={open}
      onCancel={handleCancel}
      footer={null}
      destroyOnClose
      width={width}
      className={className}
      maskClosable={!isLoading}
      closable={!isLoading}
    >
      <div className="py-4">
        <div className="mb-6">
          <Text type="secondary">{description}</Text>
        </div>

        {displayError && (
          <Alert
            message="Payment Error"
            description={displayError}
            type="error"
            showIcon
            className="mb-4"
            closable
            onClose={() => {
              setPaymentError(null);
            }}
          />
        )}

        <Form form={form} layout="vertical" onFinish={handlePayment}>
          {showAmountInput && !fixedAmount && (
            <Form.Item
              name="amount"
              label={`Amount (${currency})`}
              rules={[
                { required: true, message: 'Please enter an amount' },
                { type: 'number', min: minAmount, message: `Minimum amount is ${currency}${minAmount.toLocaleString()}` },
                { type: 'number', max: maxAmount, message: `Maximum amount is ${currency}${maxAmount.toLocaleString()}` },
              ]}
            >
              <InputNumber
                placeholder="Enter amount"
                style={{ width: '100%' }}
                size="large"
                prefix={currency === 'NGN' ? '₦' : currency}
                precision={2}
                min={minAmount}
                max={maxAmount}
                step={currency === 'NGN' ? 100 : 1}
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                disabled={isLoading}
              />
            </Form.Item>
          )}

          {showCurrencySelector && (
            <Form.Item name="currency" label="Currency" initialValue={currency} rules={[{ required: true, message: 'Please select a currency' }]}>
              <Select size="large" disabled={isLoading}>
                <Option value="NGN">Nigerian Naira (₦)</Option>
                <Option value="USD">US Dollar ($)</Option>
                <Option value="GHS">Ghanaian Cedi (₵)</Option>
                <Option value="ZAR">South African Rand (R)</Option>
              </Select>
            </Form.Item>
          )}

          {(fixedAmount || !showAmountInput) && initialAmount && (
            <div className="mb-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Amount:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {currency === 'NGN' ? '₦' : currency}
                  {initialAmount.toLocaleString()}
                </span>
              </div>
            </div>
          )}

          {!fixedAmount && showAmountInput && (
            <div className="mb-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Transaction Fee:</span>
                <span className="font-medium">₦0.00</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">You'll pay:</span>
                <span className="font-semibold text-green-600">
                  {currency === 'NGN' ? '₦' : currency}
                  {currentAmount?.toLocaleString() || '0.00'}
                </span>
              </div>
            </div>
          )}

          <Form.Item className="mb-0">
            <Space className="w-full" direction="vertical" size="middle">
              <Button type="primary" htmlType="submit" size="large" loading={isLoading} disabled={disabled} block icon={buttonIcon}>
                {isLoading ? 'Processing...' : buttonText}
              </Button>

              <Button onClick={handleCancel} size="large" block disabled={isLoading}>
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

export default memo(PaymentModal);
