import { Head, Link, router } from '@inertiajs/react';
import { Alert, Button, Checkbox, Form, Input, Typography } from 'antd';
import { GuestGuard } from '../../components/auth';
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
    <GuestGuard>
      <Head title="Log in" />

      <div className="mx-auto min-w-sm space-y-8">
        <div className="text-center">
          <Title level={2} className="!mb-2">
            Welcome back
          </Title>
          <Text type="secondary">Sign in to your account to continue</Text>
        </div>

        {status && <Alert message={status} type="success" showIcon className="mb-4" />}

        <Form form={form} name="login" layout="vertical" onFinish={onFinish} autoComplete="off" size="large">
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

          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: 'Please input your password!' }]}
            validateStatus={errors.password ? 'error' : ''}
            help={errors.password}
          >
            <Input.Password placeholder="Enter your password" />
          </Form.Item>

          <div className="flex items-center justify-between">
            <Form.Item name="remember" valuePropName="checked" noStyle>
              <Checkbox>Remember me</Checkbox>
            </Form.Item>

            {canResetPassword && (
              <Link href={route('password.request')} className="text-sm text-emerald-600 hover:text-emerald-500">
                Forgot password?
              </Link>
            )}
          </div>

          <Form.Item className="mt-6">
            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              className="border-emerald-600 bg-emerald-600 hover:border-emerald-700 hover:bg-emerald-700"
            >
              Sign in
            </Button>
          </Form.Item>
        </Form>

        <div className="text-center">
          <Text type="secondary">
            Don't have an account?{' '}
            <Link href={route('register')} className="font-medium text-emerald-600 hover:text-emerald-500">
              Sign up
            </Link>
          </Text>
        </div>
      </div>
    </GuestGuard>
  );
}
