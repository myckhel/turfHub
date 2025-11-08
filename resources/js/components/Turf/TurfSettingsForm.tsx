import { turfApi } from '@/apis/turf';
import BankAccountList from '@/components/wallet/BankAccountList';
import type { TurfSettings } from '@/types/turf.types';
import { BankOutlined, CreditCardOutlined, DollarOutlined, SaveOutlined, WalletOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Divider, Form, message, Space, Switch, Typography } from 'antd';
import React, { memo, useCallback, useEffect, useState } from 'react';

const { Title, Text, Paragraph } = Typography;

interface TurfSettingsFormProps {
  turfId: number;
  onSuccess?: () => void;
}

const TurfSettingsForm: React.FC<TurfSettingsFormProps> = memo(({ turfId, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fetchingSettings, setFetchingSettings] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      setFetchingSettings(true);
      setError(null);
      const response = await turfApi.getSettings(turfId);

      form.setFieldsValue({
        cash_enabled: response.settings.payment_methods.cash_enabled,
        wallet_enabled: response.settings.payment_methods.wallet_enabled,
        online_enabled: response.settings.payment_methods.online_enabled,
      });
    } catch (err: unknown) {
      const error = err as { message?: string };
      setError(error.message || 'Failed to fetch settings');
      message.error('Failed to load turf settings');
    } finally {
      setFetchingSettings(false);
    }
  }, [turfId, form]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSubmit = useCallback(
    async (values: { cash_enabled: boolean; wallet_enabled: boolean; online_enabled: boolean }) => {
      try {
        setLoading(true);
        setError(null);

        const settings: TurfSettings = {
          payment_methods: {
            cash_enabled: values.cash_enabled,
            wallet_enabled: values.wallet_enabled,
            online_enabled: values.online_enabled,
          },
        };

        await turfApi.updateSettings(turfId, settings);

        message.success('Turf settings updated successfully');
        onSuccess?.();
      } catch (err: unknown) {
        const error = err as { message?: string };
        const errorMessage = error.message || 'Failed to update settings';
        setError(errorMessage);
        message.error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [turfId, onSuccess],
  );

  return (
    <div className="space-y-6">
      {error && <Alert message="Error" description={error} type="error" showIcon closable onClose={() => setError(null)} />}

      <Form form={form} layout="vertical" onFinish={handleSubmit} disabled={fetchingSettings || loading}>
        {/* Payment Methods Section */}
        <Card
          title={
            <div className="flex items-center gap-2">
              <CreditCardOutlined className="text-blue-500" />
              <Title level={4} className="mb-0">
                Payment Methods
              </Title>
            </div>
          }
          loading={fetchingSettings}
          className="mb-6"
        >
          <Paragraph type="secondary" className="mb-4">
            Control which payment methods are available for your turf. Disabled payment methods will not be shown to users during checkout.
          </Paragraph>

          <Space direction="vertical" size="large" className="w-full">
            {/* Cash Payment */}
            <Card size="small" className="border-l-4 border-l-orange-500">
              <div className="flex items-start justify-between">
                <div className="flex flex-1 items-start gap-3">
                  <DollarOutlined className="mt-1 text-2xl text-orange-500" />
                  <div className="flex-1">
                    <Title level={5} className="mb-1">
                      Cash Payment (Offline)
                    </Title>
                    <Text type="secondary" className="text-sm">
                      Allow users to pay with cash or make offline payments. Payment must be verified manually by turf managers.
                    </Text>
                  </div>
                </div>
                <Form.Item name="cash_enabled" valuePropName="checked" className="mb-0">
                  <Switch checkedChildren="Enabled" unCheckedChildren="Disabled" />
                </Form.Item>
              </div>
            </Card>

            {/* Wallet Payment */}
            <Card size="small" className="border-l-4 border-l-green-500">
              <div className="flex items-start justify-between">
                <div className="flex flex-1 items-start gap-3">
                  <WalletOutlined className="mt-1 text-2xl text-green-500" />
                  <div className="flex-1">
                    <Title level={5} className="mb-1">
                      Wallet Payment
                    </Title>
                    <Text type="secondary" className="text-sm">
                      Enable instant payments using user wallet balance. Funds are transferred immediately upon payment.
                    </Text>
                  </div>
                </div>
                <Form.Item name="wallet_enabled" valuePropName="checked" className="mb-0">
                  <Switch checkedChildren="Enabled" unCheckedChildren="Disabled" />
                </Form.Item>
              </div>
            </Card>

            {/* Online Payment */}
            <Card size="small" className="border-l-4 border-l-blue-500">
              <div className="flex items-start justify-between">
                <div className="flex flex-1 items-start gap-3">
                  <CreditCardOutlined className="mt-1 text-2xl text-blue-500" />
                  <div className="flex-1">
                    <Title level={5} className="mb-1">
                      Online Payment (Paystack)
                    </Title>
                    <Text type="secondary" className="text-sm">
                      Accept card payments, bank transfers, and other online payment methods via Paystack gateway.
                    </Text>
                  </div>
                </div>
                <Form.Item name="online_enabled" valuePropName="checked" className="mb-0">
                  <Switch checkedChildren="Enabled" unCheckedChildren="Disabled" />
                </Form.Item>
              </div>
            </Card>
          </Space>

          <Divider />

          <div className="flex justify-end">
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading} size="large" className="min-w-[120px]">
              Save Settings
            </Button>
          </div>
        </Card>
      </Form>

      {/* Bank Accounts Section */}
      <Card
        title={
          <div className="flex items-center gap-2">
            <BankOutlined className="text-green-500" />
            <Title level={4} className="mb-0">
              Bank Accounts
            </Title>
          </div>
        }
        className="mb-6"
      >
        <Paragraph type="secondary" className="mb-4">
          Manage bank accounts for receiving payments and withdrawals. At least one active bank account is recommended.
        </Paragraph>
        <BankAccountList turfId={turfId} showActions compact={false} />
      </Card>
    </div>
  );
});

TurfSettingsForm.displayName = 'TurfSettingsForm';

export default TurfSettingsForm;
