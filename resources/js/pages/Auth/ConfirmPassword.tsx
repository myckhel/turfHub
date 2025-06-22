import { LockOutlined } from '@ant-design/icons';
import { Head, router } from '@inertiajs/react';
import { Button, Form, Input, Typography } from 'antd';
import { AuthLayout } from '../../components/layout/AuthLayout';

const { Title, Text } = Typography;

interface ConfirmPasswordProps {
  errors: Record<string, string>;
}

export default function ConfirmPassword({ errors }: ConfirmPasswordProps) {
  const [form] = Form.useForm();

  const onFinish = (values: { password: string }) => {
    router.post(route('password.confirm'), values);
  };

  return (
    <AuthLayout>
      <Head title="Confirm Password" />

      <div className="rounded-2xl border border-gray-200 bg-white/80 p-8 shadow-2xl backdrop-blur-sm dark:border-gray-700 dark:bg-gray-800/80">
        {/* Header with icon */}
        <div className="text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/20 dark:to-amber-800/20">
            <LockOutlined className="text-3xl text-amber-600 dark:text-amber-400" />
          </div>

          <Title level={2} className="!mt-6 !mb-2 !text-gray-900 dark:!text-white">
            Confirm your password
          </Title>
          <Text type="secondary" className="text-base">
            This is a secure area of the application. Please confirm your password before continuing.
          </Text>
        </div>

        {/* Confirm Form */}
        <Form form={form} name="confirm-password" layout="vertical" onFinish={onFinish} autoComplete="off" size="large" className="space-y-1">
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

          {/* Submit button */}
          <Form.Item className="mb-0">
            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              className="h-12 rounded-lg border-none bg-gradient-to-r from-emerald-600 to-emerald-700 font-medium shadow-lg transition-all duration-200 hover:from-emerald-700 hover:to-emerald-800 hover:shadow-xl"
            >
              Confirm
            </Button>
          </Form.Item>
        </Form>
      </div>
    </AuthLayout>
  );
}
