import { Head, Link, router } from '@inertiajs/react';
import { Alert, Button, Checkbox, Form, Input, Typography } from 'antd';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { LoginCredentials } from '../../types/auth.types';

const { Title, Text } = Typography;

interface LoginProps {
  status?: string;
  canResetPassword: boolean;
  errors: Record<string, string>;
}

export default function Login({ status, canResetPassword, errors }: LoginProps) {
  const [form] = Form.useForm();

  const onFinish = (values: LoginCredentials) => {
    router.post(route('login'), values);
  };

  return (
    <AuthLayout>
      <Head title="Log in" />

      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <Title level={2} className="!mb-2 !text-gray-900 dark:!text-white">
            Welcome back
          </Title>
          <Text type="secondary" className="text-base">
            Sign in to your account to continue
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

        {/* Login Form */}
        <Form form={form} name="login" layout="vertical" onFinish={onFinish} autoComplete="off" size="large" className="space-y-1">
          <Form.Item
            label={<span className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</span>}
            name="email"
            rules={[
              { required: true, message: 'Please input your email!' },
              { type: 'email', message: 'Please enter a valid email!' },
            ]}
            validateStatus={errors.email ? 'error' : ''}
            help={errors.email}
            className="mb-4"
          >
            <Input placeholder="Enter your email" className="h-12 rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700" />
          </Form.Item>

          <Form.Item
            label={<span className="text-sm font-medium text-gray-700 dark:text-gray-300">Password</span>}
            name="password"
            rules={[{ required: true, message: 'Please input your password!' }]}
            validateStatus={errors.password ? 'error' : ''}
            help={errors.password}
            className="mb-6"
          >
            <Input.Password placeholder="Enter your password" className="h-12 rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700" />
          </Form.Item>

          {/* Remember me and forgot password */}
          <div className="mb-6 flex items-center justify-between">
            <Form.Item name="remember" valuePropName="checked" noStyle>
              <Checkbox className="text-sm text-gray-600 dark:text-gray-400">Remember me</Checkbox>
            </Form.Item>

            {canResetPassword && (
              <Link
                href={route('password.request')}
                className="text-sm font-medium text-emerald-600 transition-colors hover:text-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-300"
              >
                Forgot password?
              </Link>
            )}
          </div>

          {/* Submit button */}
          <Form.Item className="mb-0">
            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              className="h-12 rounded-lg border-none bg-gradient-to-r from-emerald-600 to-emerald-700 font-medium shadow-lg transition-all duration-200 hover:from-emerald-700 hover:to-emerald-800 hover:shadow-xl"
            >
              Sign in
            </Button>
          </Form.Item>
        </Form>

        {/* Sign up link */}
        <div className="border-t border-gray-200 pt-4 text-center dark:border-gray-700">
          <Text type="secondary" className="text-sm">
            Don't have an account?{' '}
            <Link
              href={route('register')}
              className="font-medium text-emerald-600 transition-colors hover:text-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-300"
            >
              Sign up
            </Link>
          </Text>
        </div>
      </div>
    </AuthLayout>
  );
}
