import { ArrowLeftOutlined } from '@ant-design/icons';
import { Head, Link, router } from '@inertiajs/react';
import { Button, Form, Input, Typography } from 'antd';
import { useEffect } from 'react';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { ResetPasswordData } from '../../types/auth.types';

const { Title, Text } = Typography;

interface ResetPasswordProps {
  token: string;
  email: string;
  errors: Record<string, string>;
}

export default function ResetPassword({ token, email, errors }: ResetPasswordProps) {
  const [form] = Form.useForm();

  useEffect(() => {
    form.setFieldsValue({ email });
  }, [form, email]);

  const onFinish = (values: { email: string; password: string; password_confirmation: string }) => {
    const data: ResetPasswordData = {
      ...values,
      token,
    };

    router.post(route('password.store'), data);
  };

  return (
    <AuthLayout>
      <Head title="Reset Password" />

      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <Title level={2} className="!mb-2 !text-gray-900 dark:!text-white">
            Reset your password
          </Title>
          <Text type="secondary" className="text-base">
            Enter your new password below
          </Text>
        </div>

        {/* Reset Form */}
        <Form form={form} name="reset-password" layout="vertical" onFinish={onFinish} autoComplete="off" size="large" className="space-y-1">
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
            <Input placeholder="Enter your email" disabled className="h-12 rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700" />
          </Form.Item>

          <Form.Item
            label={<span className="text-sm font-medium text-gray-700 dark:text-gray-300">New Password</span>}
            name="password"
            rules={[
              { required: true, message: 'Please input your new password!' },
              { min: 8, message: 'Password must be at least 8 characters!' },
            ]}
            validateStatus={errors.password ? 'error' : ''}
            help={errors.password}
            className="mb-4"
          >
            <Input.Password placeholder="Enter your new password" className="h-12 rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700" />
          </Form.Item>

          <Form.Item
            label={<span className="text-sm font-medium text-gray-700 dark:text-gray-300">Confirm New Password</span>}
            name="password_confirmation"
            dependencies={['password']}
            rules={[
              { required: true, message: 'Please confirm your new password!' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('The two passwords do not match!'));
                },
              }),
            ]}
            validateStatus={errors.password_confirmation ? 'error' : ''}
            help={errors.password_confirmation}
            className="mb-6"
          >
            <Input.Password
              placeholder="Confirm your new password"
              className="h-12 rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700"
            />
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
              Reset Password
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
