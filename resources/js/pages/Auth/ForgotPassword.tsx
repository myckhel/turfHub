import { ArrowLeftOutlined } from '@ant-design/icons';
import { Head, Link, router } from '@inertiajs/react';
import { Alert, Button, Form, Input, Typography } from 'antd';
import { AuthLayout } from '../../components/layout/AuthLayout';
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
    <AuthLayout>
      <Head title="Forgot Password" />

      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <Title level={2} className="!mb-2 !text-gray-900 dark:!text-white">
            Forgot your password?
          </Title>
          <Text type="secondary" className="text-base">
            No problem. Just let us know your email address and we will email you a password reset link that will allow you to choose a new one.
          </Text>
        </div>

        {/* Status message */}
        {status && (
          <Alert
            message={status}
            type="success"
            showIcon
            className="rounded-lg border-emerald-200 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-900/20"
          />
        )}

        {/* Reset Form */}
        <Form form={form} name="forgot-password" layout="vertical" onFinish={onFinish} autoComplete="off" size="large" className="space-y-1">
          <Form.Item
            label={<span className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</span>}
            name="email"
            rules={[
              { required: true, message: 'Please input your email!' },
              { type: 'email', message: 'Please enter a valid email!' },
            ]}
            validateStatus={errors.email ? 'error' : ''}
            help={errors.email}
            className="mb-6"
          >
            <Input placeholder="Enter your email" className="h-12 rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700" />
          </Form.Item>

          {/* Submit button */}
          <Form.Item className="mb-0">
            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              className="h-12 rounded-lg border-none bg-gradient-to-r from-emerald-600 to-emerald-700 font-medium shadow-lg transition-all duration-200 hover:from-emerald-700 hover:to-emerald-800 hover:shadow-xl"
            >
              Email Password Reset Link
            </Button>
          </Form.Item>
        </Form>

        {/* Back to login */}
        <div className="border-t border-gray-200 pt-4 text-center dark:border-gray-700">
          <Link
            href={route('login')}
            className="inline-flex items-center text-sm font-medium text-emerald-600 transition-colors hover:text-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-300"
          >
            <ArrowLeftOutlined className="mr-2" />
            Back to login
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
