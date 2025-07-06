import { bankAccountApi } from '@/apis/bankAccount';
import type { BankAccount } from '@/types';
import { BankOutlined, CheckCircleOutlined, DeleteOutlined, EditOutlined, ExclamationCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Empty, List, message, Modal, Popconfirm, Spin, Tag, Tooltip, Typography } from 'antd';
import React, { memo, useCallback, useEffect, useState } from 'react';
import BankAccountForm from './BankAccountForm';

const { Title, Text } = Typography;

interface BankAccountListProps {
  turfId?: number;
  onAccountSelect?: (account: BankAccount) => void;
  selectable?: boolean;
  showActions?: boolean;
  compact?: boolean;
}

const BankAccountList: React.FC<BankAccountListProps> = memo(
  ({ turfId, onAccountSelect, selectable = false, showActions = true, compact = false }) => {
    const [accounts, setAccounts] = useState<BankAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [addModalVisible, setAddModalVisible] = useState(false);
    const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
    const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);

    const fetchAccounts = useCallback(async () => {
      try {
        setLoading(true);
        setError(null);

        let response;
        if (turfId) {
          response = await bankAccountApi.getTurfBankAccounts(turfId);
          setAccounts(response.bank_accounts);
        } else {
          response = await bankAccountApi.getUserBankAccounts();
          setAccounts(response);
        }
      } catch (err: unknown) {
        const error = err as { message?: string };
        setError(error.message || 'Failed to fetch bank accounts');
      } finally {
        setLoading(false);
      }
    }, [turfId]);

    useEffect(() => {
      fetchAccounts();
    }, [fetchAccounts]);

    const handleAddAccount = useCallback(() => {
      setAddModalVisible(true);
      setEditingAccount(null);
    }, []);

    const handleEditAccount = useCallback((account: BankAccount) => {
      setEditingAccount(account);
      setAddModalVisible(true);
    }, []);

    const handleDeleteAccount = useCallback(
      async (accountId: number) => {
        try {
          await bankAccountApi.removeUserBankAccount(accountId);
          message.success('Bank account removed successfully');
          fetchAccounts();
        } catch (error) {
          console.error('Failed to delete bank account:', error);
          message.error('Failed to remove bank account');
        }
      },
      [fetchAccounts],
    );

    const handleAccountSave = useCallback(() => {
      setAddModalVisible(false);
      setEditingAccount(null);
      fetchAccounts();
    }, [fetchAccounts]);

    const handleAccountSelect = useCallback(
      (account: BankAccount) => {
        setSelectedAccount(account);
        onAccountSelect?.(account);
      },
      [onAccountSelect],
    );

    const renderAccountItem = (account: BankAccount) => (
      <List.Item
        key={account.id}
        className={`bank-account-item transition-colors duration-200 ${selectable ? 'cursor-pointer touch-manipulation hover:bg-gray-50' : ''} ${
          selectedAccount?.id === account.id ? 'border-blue-200 bg-blue-50' : ''
        } p-3 sm:p-4`}
        onClick={selectable ? () => handleAccountSelect(account) : undefined}
        actions={
          showActions && !selectable
            ? [
                <div key="actions" className="flex gap-1">
                  <Tooltip title="Edit Account">
                    <Button
                      type="text"
                      icon={<EditOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditAccount(account);
                      }}
                      size="small"
                      className="min-h-[36px] min-w-[36px] touch-manipulation"
                    />
                  </Tooltip>
                  <Popconfirm
                    title="Remove Bank Account"
                    description="Are you sure you want to remove this bank account?"
                    onConfirm={(e) => {
                      e?.stopPropagation();
                      handleDeleteAccount(account.id);
                    }}
                    okText="Remove"
                    cancelText="Cancel"
                    okType="danger"
                    placement="topRight"
                  >
                    <Tooltip title="Remove Account">
                      <Button
                        type="text"
                        icon={<DeleteOutlined />}
                        danger
                        onClick={(e) => e.stopPropagation()}
                        size="small"
                        className="min-h-[36px] min-w-[36px] touch-manipulation"
                      />
                    </Tooltip>
                  </Popconfirm>
                </div>,
              ]
            : selectable && selectedAccount?.id === account.id
              ? [
                  <Tag color="blue" key="selected" className="touch-manipulation">
                    <span className="text-xs">Selected</span>
                  </Tag>,
                ]
              : []
        }
      >
        <List.Item.Meta
          avatar={
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full sm:h-12 sm:w-12 ${
                account.is_verified ? 'bg-green-100' : 'bg-orange-100'
              }`}
            >
              <BankOutlined className={`${account.is_verified ? 'text-green-600' : 'text-orange-600'} text-lg sm:text-xl`} />
            </div>
          }
          title={
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
              <Text strong className={`${compact ? 'text-sm' : 'text-base'} leading-tight`}>
                {account.bank_name}
              </Text>
              {account.is_verified ? (
                <Tag color="green" icon={<CheckCircleOutlined />} className="text-xs">
                  Verified
                </Tag>
              ) : (
                <Tag color="orange" icon={<ExclamationCircleOutlined />} className="text-xs">
                  Pending
                </Tag>
              )}
            </div>
          }
          description={
            <div className="mt-1 space-y-1">
              <div className={`text-gray-600 ${compact ? 'text-xs' : 'text-sm'} leading-tight`}>
                <span className="font-medium">Account:</span> {account.account_number}
              </div>
              <div className={`text-gray-600 ${compact ? 'text-xs' : 'text-sm'} leading-tight`}>
                <span className="font-medium">Name:</span> {account.account_name}
              </div>
            </div>
          }
        />
      </List.Item>
    );

    if (loading) {
      return (
        <Card className={compact ? '' : 'min-h-48'}>
          <div className="flex h-full items-center justify-center py-8">
            <Spin size="large" />
            <div className="ml-4">
              <Text>Loading bank accounts...</Text>
            </div>
          </div>
        </Card>
      );
    }

    if (error) {
      return (
        <Card className={compact ? '' : 'min-h-48'}>
          <Alert
            message="Error Loading Bank Accounts"
            description={error}
            type="error"
            showIcon
            action={
              <Button size="small" onClick={fetchAccounts}>
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
          title={
            <div className="flex items-center gap-2">
              <BankOutlined className="text-primary" />
              <Title level={compact ? 5 : 4} className="mb-0">
                {turfId ? 'Turf Bank Accounts' : 'My Bank Accounts'}
              </Title>
            </div>
          }
          extra={
            showActions && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAddAccount}
                size={compact ? 'small' : undefined}
                className="min-h-[36px] touch-manipulation"
              >
                <span className="hidden sm:inline">Add Account</span>
                <span className="sm:hidden">Add</span>
              </Button>
            )
          }
          className={`bank-account-list ${compact ? 'bank-account-list-compact' : ''}`}
        >
          {accounts.length === 0 ? (
            <Empty
              description={
                <div className="text-center">
                  <Text type="secondary">No bank accounts found</Text>
                  {showActions && (
                    <div className="mt-4">
                      <Button type="primary" icon={<PlusOutlined />} onClick={handleAddAccount} className="min-h-[44px] touch-manipulation">
                        Add Your First Bank Account
                      </Button>
                    </div>
                  )}
                </div>
              }
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            <>
              {' '}
              {selectable && (
                <Alert
                  message="Select a Bank Account"
                  description="Choose the bank account you want to use for withdrawals."
                  type="info"
                  className="mb-4 text-sm"
                  showIcon
                />
              )}
              <List
                dataSource={accounts}
                renderItem={renderAccountItem}
                size={compact ? 'small' : 'default'}
                className="bank-account-list-items"
                split={true}
                itemLayout="horizontal"
              />
            </>
          )}
        </Card>

        <Modal
          title={editingAccount ? 'Edit Bank Account' : 'Add Bank Account'}
          open={addModalVisible}
          onCancel={() => {
            setAddModalVisible(false);
            setEditingAccount(null);
          }}
          footer={null}
          width={600}
          destroyOnClose
        >
          <BankAccountForm
            bankAccount={editingAccount || undefined}
            mode={editingAccount ? 'edit' : 'create'}
            turfId={turfId}
            onSave={handleAccountSave}
            onCancel={() => {
              setAddModalVisible(false);
              setEditingAccount(null);
            }}
          />
        </Modal>
      </>
    );
  },
);

export default BankAccountList;
