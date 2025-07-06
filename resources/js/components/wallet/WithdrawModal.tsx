import { bankAccountApi } from '@/apis/bankAccount';
import { walletApi } from '@/apis/wallet';
import type { BankAccount } from '@/types';
import { BankOutlined, PlusOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Form, InputNumber, Modal, Select, Space, Typography } from 'antd';
import React, { useEffect, useState } from 'react';

const { Title, Text } = Typography;
const { Option } = Select;

interface WithdrawModalProps {
  open: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

const WithdrawModal: React.FC<WithdrawModalProps> = ({ open, onCancel, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loadingBankAccounts, setLoadingBankAccounts] = useState(false);

  const fetchBankAccounts = async () => {
    try {
      setLoadingBankAccounts(true);
      const response = await bankAccountApi.getUserBankAccounts();
      setBankAccounts(response);
    } catch (err: unknown) {
      const error = err as { message?: string };
      console.error('Failed to fetch bank accounts:', error.message);
    } finally {
      setLoadingBankAccounts(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchBankAccounts();
    }
  }, [open]);

  const handleWithdraw = async (values: { amount: number; bank_account_id: number }) => {
    try {
      setLoading(true);
      setError(null);

      await walletApi.withdraw({
        amount: values.amount,
        bank_account_id: values.bank_account_id,
        metadata: {
          withdrawal_type: 'bank_transfer',
        },
      });

      onSuccess();
      form.resetFields();
    } catch (err: unknown) {
      const error = err as { message?: string };
      setError(error.message || 'Failed to process withdrawal');
    } finally {
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

  const handleAddBankAccount = () => {
    // TODO: Open bank account modal or navigate to bank account page
    console.log('Add bank account clicked');
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <BankOutlined className="text-primary" />
          <Title level={4} className="mb-0">
            Withdraw from Wallet
          </Title>
        </div>
      }
      open={open}
      onCancel={handleCancel}
      footer={null}
      destroyOnClose
      width={500}
    >
      <div className="py-4">
        <div className="mb-6">
          <Text type="secondary">Transfer money from your wallet to your bank account. Withdrawals are processed within 1-2 business days.</Text>
        </div>

        {error && (
          <Alert message="Withdrawal Error" description={error} type="error" showIcon className="mb-4" closable onClose={() => setError(null)} />
        )}

        {bankAccounts.length === 0 && !loadingBankAccounts && (
          <Card className="mb-4 border-dashed">
            <div className="py-4 text-center">
              <BankOutlined className="mb-2 text-2xl text-gray-400" />
              <Text type="secondary" className="mb-3 block">
                No bank accounts found. Add a bank account to withdraw funds.
              </Text>
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAddBankAccount}>
                Add Bank Account
              </Button>
            </div>
          </Card>
        )}

        {bankAccounts.length > 0 && (
          <Form form={form} layout="vertical" onFinish={handleWithdraw}>
            <Form.Item name="bank_account_id" label="Bank Account" rules={[{ required: true, message: 'Please select a bank account' }]}>
              <Select placeholder="Select bank account" size="large" loading={loadingBankAccounts} optionLabelProp="label">
                {bankAccounts.map((account) => (
                  <Option key={account.id} value={account.id} label={`${account.bank_name} - ${account.account_number}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{account.account_name}</div>
                        <div className="text-sm text-gray-500">
                          {account.bank_name} • {account.account_number}
                        </div>
                      </div>
                      {account.is_verified && <div className="text-xs font-medium text-green-600">Verified</div>}
                    </div>
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="amount"
              label="Amount (₦)"
              rules={[
                { required: true, message: 'Please enter an amount' },
                { type: 'number', min: 100, message: 'Minimum withdrawal is ₦100' },
                { type: 'number', max: 1000000, message: 'Maximum withdrawal is ₦1,000,000' },
              ]}
            >
              <InputNumber
                placeholder="Enter amount"
                style={{ width: '100%' }}
                size="large"
                prefix="₦"
                precision={2}
                min={100}
                max={1000000}
                step={100}
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              />
            </Form.Item>

            <div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Transfer Fee:</span>
                <span className="font-medium">₦50.00</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-gray-600">You'll receive:</span>
                <span className="font-medium text-green-600">₦{(form.getFieldValue('amount') - 50)?.toLocaleString() || '0.00'}</span>
              </div>
              <div className="mt-2 text-xs text-yellow-700">* Transfer fees are deducted from your withdrawal amount</div>
            </div>

            <Form.Item className="mb-0">
              <Space className="w-full" direction="vertical" size="middle">
                <Button type="primary" htmlType="submit" size="large" loading={loading} block icon={<BankOutlined />}>
                  {loading ? 'Processing...' : 'Withdraw to Bank'}
                </Button>

                <Button onClick={handleCancel} size="large" block disabled={loading}>
                  Cancel
                </Button>
              </Space>
            </Form.Item>
          </Form>
        )}

        <div className="mt-4 text-center text-xs text-gray-500">
          <Text type="secondary">Withdrawals are processed securely • Funds typically arrive in 1-2 business days</Text>
        </div>
      </div>
    </Modal>
  );
};

export default WithdrawModal;
