import { ArrowLeftOutlined } from '@ant-design/icons';
import { Head, Link, router } from '@inertiajs/react';
import { Button, Form, Input, Typography } from 'antd';
import { useEffect } from 'react';
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
    <>
      <Head title="Reset Password" />

      <div className="mx-auto min-w-sm space-y-8">
        <div className="text-center">
          <Title level={2} className="!mb-2">
            Reset your password
          </Title>
          <Text type="secondary">Enter your new password below</Text>
        </div>

        <Form form={form} name="reset-password" layout="vertical" onFinish={onFinish} autoComplete="off" size="large">
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
            <Input placeholder="Enter your email" disabled />
          </Form.Item>

          <Form.Item
            label="New Password"
            name="password"
            rules={[
              { required: true, message: 'Please input your new password!' },
              { min: 8, message: 'Password must be at least 8 characters!' },
            ]}
            validateStatus={errors.password ? 'error' : ''}
            help={errors.password}
          >
            <Input.Password placeholder="Enter your new password" />
          </Form.Item>

          <Form.Item
            label="Confirm New Password"
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
          >
            <Input.Password placeholder="Confirm your new password" />
          </Form.Item>

          <Form.Item className="mt-6">
            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              className="border-emerald-600 bg-emerald-600 hover:border-emerald-700 hover:bg-emerald-700"
            >
              Reset Password
            </Button>
          </Form.Item>
        </Form>

        <div className="text-center">
          <Link href={route('login')} className="inline-flex items-center text-sm text-emerald-600 hover:text-emerald-500">
            <ArrowLeftOutlined className="mr-2" />
            Back to login
          </Link>
        </div>
      </div>
    </>
  );
}
