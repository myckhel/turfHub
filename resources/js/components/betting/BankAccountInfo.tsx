import { BankOutlined, CheckCircleOutlined, CopyOutlined, DownOutlined } from '@ant-design/icons';
import { App, Card, Collapse, Divider, Space, Tag, Typography } from 'antd';
import { memo } from 'react';
import type { BankAccount } from '../../types/wallet.types';

const { Text, Paragraph } = Typography;
const { Panel } = Collapse;

interface BankAccountInfoProps {
  bankAccounts: BankAccount[];
  loading?: boolean;
}

const BankAccountInfo = memo(({ bankAccounts, loading = false }: BankAccountInfoProps) => {
  const { message } = App.useApp();

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      message.success(`${label} copied to clipboard!`);
    });
  };

  const activeBankAccounts = bankAccounts.filter((account) => account.is_active);

  if (loading) {
    return (
      <Card size="small" className="mb-4 animate-pulse border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20">
        <div className="space-y-2">
          <div className="h-4 w-3/4 rounded bg-gray-300 dark:bg-gray-700"></div>
          <div className="h-3 w-1/2 rounded bg-gray-300 dark:bg-gray-700"></div>
        </div>
      </Card>
    );
  }

  if (activeBankAccounts.length === 0) {
    return (
      <Card size="small" className="mb-4 border-yellow-200 bg-yellow-50/50 dark:border-yellow-800 dark:bg-yellow-950/20">
        <div className="flex items-start gap-3">
          <BankOutlined className="mt-1 text-xl text-yellow-600 dark:text-yellow-500" />
          <div className="flex-1">
            <Text className="font-medium text-yellow-800 dark:text-yellow-200">No bank account available</Text>
            <Paragraph className="mt-1 mb-0 text-sm text-yellow-700 dark:text-yellow-300">
              Please contact turf management for payment details.
            </Paragraph>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Collapse
      bordered={false}
      defaultActiveKey={['bank-info']}
      expandIcon={({ isActive }) => <DownOutlined rotate={isActive ? 180 : 0} />}
      className="mb-4 overflow-hidden rounded-lg border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:border-blue-800 dark:from-blue-950/30 dark:to-blue-950/10"
    >
      <Panel
        header={
          <div className="flex items-center gap-2">
            <BankOutlined className="text-lg text-blue-600 dark:text-blue-400" />
            <Text className="font-semibold text-blue-900 dark:text-blue-100">Bank Account for Transfer</Text>
          </div>
        }
        key="bank-info"
        className="border-0"
      >
        <div className="space-y-4">
          <Paragraph className="mb-3 text-sm text-blue-700 dark:text-blue-300">
            Transfer your stake amount to one of the accounts below and upload the payment receipt:
          </Paragraph>

          {activeBankAccounts.map((account, index) => (
            <Card
              key={account.id}
              size="small"
              className="overflow-hidden border border-blue-200 bg-white shadow-sm transition-all hover:shadow-md dark:border-blue-700 dark:bg-gray-800"
            >
              <div className="space-y-3">
                {/* Bank Name Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BankOutlined className="text-lg text-blue-600 dark:text-blue-400" />
                    <Text className="text-base font-bold text-gray-900 dark:text-white">{account.bank_name}</Text>
                  </div>
                  {account.is_verified && (
                    <Tag icon={<CheckCircleOutlined />} color="success" className="m-0">
                      Verified
                    </Tag>
                  )}
                </div>

                <Divider className="my-2" />

                {/* Account Details */}
                <Space direction="vertical" size="small" className="w-full">
                  {/* Account Name */}
                  <div className="group flex items-center justify-between rounded-md bg-gray-50 p-2 transition-colors hover:bg-gray-100 dark:bg-gray-900/50 dark:hover:bg-gray-900">
                    <div className="flex-1">
                      <Text className="block text-xs text-gray-500 dark:text-gray-400">Account Name</Text>
                      <Text className="block font-semibold text-gray-900 dark:text-white">{account.account_name}</Text>
                    </div>
                    <button
                      onClick={() => copyToClipboard(account.account_name, 'Account name')}
                      className="ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-blue-100 text-blue-600 opacity-0 transition-all group-hover:opacity-100 hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-400 dark:hover:bg-blue-900"
                      aria-label="Copy account name"
                    >
                      <CopyOutlined />
                    </button>
                  </div>

                  {/* Account Number */}
                  <div className="group flex items-center justify-between rounded-md bg-gray-50 p-2 transition-colors hover:bg-gray-100 dark:bg-gray-900/50 dark:hover:bg-gray-900">
                    <div className="flex-1">
                      <Text className="block text-xs text-gray-500 dark:text-gray-400">Account Number</Text>
                      <Text className="block font-mono text-lg font-bold tracking-wide text-gray-900 dark:text-white">{account.account_number}</Text>
                    </div>
                    <button
                      onClick={() => copyToClipboard(account.account_number, 'Account number')}
                      className="ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-blue-100 text-blue-600 opacity-0 transition-all group-hover:opacity-100 hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-400 dark:hover:bg-blue-900"
                      aria-label="Copy account number"
                    >
                      <CopyOutlined />
                    </button>
                  </div>
                </Space>

                {/* Alternative Account Badge */}
                {index > 0 && (
                  <div className="mt-2 rounded-md bg-blue-50 px-2 py-1 dark:bg-blue-950/30">
                    <Text className="text-xs text-blue-600 dark:text-blue-400">Alternative Account</Text>
                  </div>
                )}
              </div>
            </Card>
          ))}

          {/* Important Note */}
          <Card size="small" className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
            <div className="flex items-start gap-2">
              <span className="text-amber-600 dark:text-amber-400">⚠️</span>
              <Text className="text-xs text-amber-800 dark:text-amber-200">
                <strong>Important:</strong> Make sure the amount transferred matches your total stake. Upload the receipt immediately after transfer.
              </Text>
            </div>
          </Card>
        </div>
      </Panel>
    </Collapse>
  );
});

BankAccountInfo.displayName = 'BankAccountInfo';

export default BankAccountInfo;
