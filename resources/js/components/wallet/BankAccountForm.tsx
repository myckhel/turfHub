import { bankAccountApi } from '@/apis/bankAccount';
import type { Bank, BankAccount } from '@/types';
import { BankOutlined, CheckCircleOutlined, InfoCircleOutlined, SaveOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Form, Input, message, Select, Space, Steps, Typography } from 'antd';
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';

const { Title, Text } = Typography;
const { Step } = Steps;

interface BankAccountFormProps {
  bankAccount?: BankAccount;
  onSave?: (bankAccount: BankAccount) => void;
  onCancel?: () => void;
  mode?: 'create' | 'edit';
  turfId?: number; // For turf bank accounts
}

const BankAccountForm: React.FC<BankAccountFormProps> = memo(({ bankAccount, onSave, onCancel, mode = 'create', turfId }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [banksLoading, setBanksLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [verificationData, setVerificationData] = useState<{
    account_name?: string;
    account_number?: string;
    bank_name?: string;
  } | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  // Load banks on component mount
  useEffect(() => {
    const loadBanks = async () => {
      try {
        setBanksLoading(true);
        const response = await bankAccountApi.getBanks();
        setBanks(response.data);
      } catch (error) {
        console.error('Failed to load banks:', error);
        message.error('Failed to load banks list');
      } finally {
        setBanksLoading(false);
      }
    };

    loadBanks();
  }, []);

  // Pre-fill form if editing
  useEffect(() => {
    if (bankAccount && mode === 'edit') {
      form.setFieldsValue({
        bank_code: bankAccount.bank_code,
        account_number: bankAccount.account_number,
        account_name: bankAccount.account_name,
      });
      setVerificationData({
        account_name: bankAccount.account_name,
        account_number: bankAccount.account_number,
        bank_name: bankAccount.bank_name,
      });
      setCurrentStep(2); // Skip to verification step since account is already verified
    }
  }, [bankAccount, mode, form]);

  const handleAccountVerification = useCallback(async () => {
    try {
      const values = await form.validateFields(['bank_code', 'account_number']);
      setVerifying(true);

      const response = await bankAccountApi.verifyAccount({
        bank_code: values.bank_code,
        account_number: values.account_number,
      });

      setVerificationData(response.data);
      form.setFieldValue('account_name', response.data.account_name);
      setCurrentStep(1);
      message.success('Account verified successfully!');
    } catch (error) {
      console.error('Account verification failed:', error);
      message.error('Failed to verify account. Please check your details.');
    } finally {
      setVerifying(false);
    }
  }, [form]);

  const handleSave = useCallback(async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const bank_name = banks.find((bank) => bank.code === values.bank_code)?.name;
      values.bank_name = bank_name;

      let response;
      if (mode === 'edit' && bankAccount) {
        // For editing, we would need an update API endpoint
        message.error('Edit functionality not yet implemented');
        return;
      } else {
        // Create new bank account
        if (turfId) {
          response = await bankAccountApi.addTurfBankAccount(turfId, values);
          onSave?.(response.data.bank_account);
        } else {
          response = await bankAccountApi.addUserBankAccount(values);
          onSave?.(response.data);
        }
      }

      message.success(`Bank account ${mode === 'edit' ? 'updated' : 'created'} successfully!`);
    } catch (error) {
      console.error('Failed to save bank account:', error);
      message.error(`Failed to ${mode === 'edit' ? 'update' : 'create'} bank account`);
    } finally {
      setLoading(false);
    }
  }, [form, mode, bankAccount, onSave, turfId, banks]);

  const selectedBank = banks.find((bank) => bank.code === form.getFieldValue('bank_code'));

  const steps = [
    {
      title: 'Enter Details',
      description: 'Provide bank and account information',
      icon: <BankOutlined />,
    },
    {
      title: 'Verify Account',
      description: 'Confirm account ownership',
      icon: <CheckCircleOutlined />,
    },
    {
      title: 'Save Account',
      description: 'Complete the setup',
      icon: <SaveOutlined />,
    },
  ];

  return (
    <Card
      title={
        <div className="flex items-center gap-2">
          <BankOutlined className="text-primary" />
          <Title level={4} className="mb-0">
            {mode === 'edit' ? 'Edit Bank Account' : 'Add Bank Account'}
          </Title>
        </div>
      }
      extra={onCancel && <Button onClick={onCancel}>Cancel</Button>}
    >
      <Steps current={currentStep} className="mb-6">
        {steps.map((step, index) => (
          <Step key={index} title={step.title} description={step.description} icon={step.icon} />
        ))}
      </Steps>

      <Form form={form} layout="vertical" onFinish={handleSave} className="bank-account-form">
        {/* Step 0: Enter bank details */}
        <div style={{ display: currentStep === 0 ? 'block' : 'none' }}>
          <Alert
            message="Bank Account Information"
            description="Please provide your bank details. We'll verify the account ownership before saving."
            type="info"
            icon={<InfoCircleOutlined />}
            className="mb-4"
            showIcon
          />

          <Form.Item label="Bank" name="bank_code" rules={[{ required: true, message: 'Please select a bank' }]}>
            <Select
              placeholder="Select your bank"
              loading={banksLoading}
              showSearch
              filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
              options={useMemo(
                () =>
                  banks.map((bank) => ({
                    label: bank.name,
                    value: bank.code,
                  })),
                [banks],
              )}
            />
          </Form.Item>

          <Form.Item
            label="Account Number"
            name="account_number"
            rules={[
              { required: true, message: 'Please enter your account number' },
              { len: 10, message: 'Account number must be 10 digits' },
              { pattern: /^\d+$/, message: 'Account number must contain only digits' },
            ]}
          >
            <Input placeholder="Enter your 10-digit account number" maxLength={10} />
          </Form.Item>

          <div className="flex justify-between">
            <Button onClick={onCancel}>Cancel</Button>
            <Button
              type="primary"
              onClick={handleAccountVerification}
              loading={verifying}
              // disabled={!form.getFieldValue('bank_code') || !form.getFieldValue('account_number')}
            >
              Verify Account
            </Button>
          </div>
        </div>

        {/* Step 1: Account verification result */}
        <div style={{ display: currentStep === 1 ? 'block' : 'none' }}>
          {verificationData && (
            <>
              <Alert
                message="Account Verification Successful"
                description="Please confirm the account details below are correct."
                type="success"
                icon={<CheckCircleOutlined />}
                className="mb-4"
                showIcon
              />

              <Card size="small" className="mb-4 bg-gray-50">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Text className="text-gray-600">Bank:</Text>
                    <Text strong>{selectedBank?.name}</Text>
                  </div>
                  <div className="flex justify-between">
                    <Text className="text-gray-600">Account Number:</Text>
                    <Text strong>{verificationData.account_number}</Text>
                  </div>
                  <div className="flex justify-between">
                    <Text className="text-gray-600">Account Name:</Text>
                    <Text strong>{verificationData.account_name}</Text>
                  </div>
                </div>
              </Card>

              <Form.Item label="Account Name" name="account_name" rules={[{ required: true, message: 'Account name is required' }]}>
                <Input disabled />
              </Form.Item>

              <div className="flex justify-between">
                <Button onClick={() => setCurrentStep(0)}>Back</Button>
                <Button type="primary" onClick={() => setCurrentStep(2)}>
                  Continue
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Step 2: Final confirmation and save */}
        <div style={{ display: currentStep === 2 ? 'block' : 'none' }}>
          <Alert
            message="Ready to Save"
            description="Your bank account details have been verified and are ready to be saved."
            type="success"
            className="mb-4"
            showIcon
          />

          <Card size="small" className="mb-4 border-green-200 bg-green-50">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Text className="text-gray-600">Bank:</Text>
                <Text strong>{selectedBank?.name}</Text>
              </div>
              <div className="flex justify-between">
                <Text className="text-gray-600">Account Number:</Text>
                <Text strong>{form.getFieldValue('account_number')}</Text>
              </div>
              <div className="flex justify-between">
                <Text className="text-gray-600">Account Name:</Text>
                <Text strong>{form.getFieldValue('account_name')}</Text>
              </div>
            </div>
          </Card>

          <div className="flex justify-between">
            <Button onClick={() => setCurrentStep(1)}>Back</Button>
            <Space>
              <Button onClick={onCancel}>Cancel</Button>
              <Button type="primary" loading={loading} onClick={handleSave}>
                {mode === 'edit' ? 'Update Account' : 'Save Account'}
              </Button>
            </Space>
          </div>
        </div>
      </Form>
    </Card>
  );
});

export default BankAccountForm;
