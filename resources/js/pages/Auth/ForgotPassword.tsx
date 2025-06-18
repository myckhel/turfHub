import { Head, Link, router } from '@inertiajs/react';
import { Alert, Button, Form, Input, Typography } from 'antd';
import React from 'react';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { ForgotPasswordData } from '../../types/auth.types';

const { Title, Text } = Typography;

interface ForgotPasswordProps {
  status?: string;
  errors: Record<string, string>;
}

export default function ForgotPassword({ status, errors }: ForgotPasswordProps) {
  const [form] = Form.useForm();

  const onFinish = (values: ForgotPasswordData) => {
    router.post(route('password.email'), values);
  };

  return (
    <>
      <Head title="Forgot Password" />
      
      <div className="mx-auto w-full max-w-md space-y-8">
        <div className="text-center">
          <Title level={2} className="!mb-2">
            Forgot your password?
          </Title>
          <Text type="secondary">
            No problem. Just let us know your email address and we will email you a password reset link that will allow you to choose a new one.
          </Text>
        </div>

        {status && (
          <Alert
            message={status}
            type="success"
            showIcon
            className="mb-4"
          />
        )}

        <Form
          form={form}
          name="forgot-password"
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
          size="large"
        >
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: 'Please input your email!' },
              { type: 'email', message: 'Please enter a valid email!' },
            ]}
            validateStatus={errors.email ? 'error' : ''}
            help={errors.email}
          >
            <Input placeholder="Enter your email" />
          </Form.Item>

          <Form.Item className="mt-6">
            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              className="bg-emerald-600 border-emerald-600 hover:bg-emerald-700 hover:border-emerald-700"
            >
              Email Password Reset Link
            </Button>
          </Form.Item>
        </Form>

        <div className="text-center">
          <Link
            href={route('login')}
            className="inline-flex items-center text-sm text-emerald-600 hover:text-emerald-500"
          >
            <ArrowLeftOutlined className="mr-2" />
            Back to login
          </Link>
        </div>
      </div>
    </>
  );
}
