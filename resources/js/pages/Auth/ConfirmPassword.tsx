import { Head, router } from '@inertiajs/react';
import { Button, Form, Input, Typography } from 'antd';
import React from 'react';
import { LockOutlined } from '@ant-design/icons';

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
    <>
      <Head title="Confirm Password" />
      
      <div className="mx-auto w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
            <LockOutlined className="h-8 w-8 text-amber-600" />
          </div>
          
          <Title level={2} className="!mb-2 !mt-6">
            Confirm your password
          </Title>
          <Text type="secondary">
            This is a secure area of the application. Please confirm your password before continuing.
          </Text>
        </div>

        <Form
          form={form}
          name="confirm-password"
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
          size="large"
        >
          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: 'Please input your password!' }]}
            validateStatus={errors.password ? 'error' : ''}
            help={errors.password}
          >
            <Input.Password placeholder="Enter your password" />
          </Form.Item>

          <Form.Item className="mt-6">
            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              className="bg-emerald-600 border-emerald-600 hover:bg-emerald-700 hover:border-emerald-700"
            >
              Confirm
            </Button>
          </Form.Item>
        </Form>
      </div>
    </>
  );
}
