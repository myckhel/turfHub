import { Head, Link, router } from '@inertiajs/react';
import { Button, Checkbox, Form, Input, Typography } from 'antd';
import { RegisterData } from '../../types/auth.types';

const { Title, Text } = Typography;

interface RegisterProps {
  errors: Record<string, string>;
}

export default function Register({ errors }: RegisterProps) {
  const [form] = Form.useForm();

  const onFinish = (values: RegisterData) => {
    router.post(route('register'), values);
  };

  return (
    <>
      <Head title="Register" />

      <div className="mx-auto min-w-sm space-y-8">
        <div className="text-center">
          <Title level={2} className="!mb-2">
            Create your account
          </Title>
          <Text type="secondary">Join TurfMate and start managing your turf bookings</Text>
        </div>

        <Form form={form} name="register" layout="vertical" onFinish={onFinish} autoComplete="off" size="large">
          <Form.Item
            label="Full Name"
            name="name"
            rules={[
              { required: true, message: 'Please input your name!' },
              { min: 2, message: 'Name must be at least 2 characters!' },
            ]}
            validateStatus={errors.name ? 'error' : ''}
            help={errors.name}
          >
            <Input placeholder="Enter your full name" />
          </Form.Item>

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
            rules={[
              { required: true, message: 'Please input your password!' },
              { min: 8, message: 'Password must be at least 8 characters!' },
            ]}
            validateStatus={errors.password ? 'error' : ''}
            help={errors.password}
          >
            <Input.Password placeholder="Enter your password" />
          </Form.Item>

          <Form.Item
            label="Confirm Password"
            name="password_confirmation"
            dependencies={['password']}
            rules={[
              { required: true, message: 'Please confirm your password!' },
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
            <Input.Password placeholder="Confirm your password" />
          </Form.Item>

          <Form.Item
            name="terms"
            valuePropName="checked"
            rules={[
              {
                validator: (_, value) => (value ? Promise.resolve() : Promise.reject(new Error('Please accept the terms and conditions'))),
              },
            ]}
          >
            <Checkbox>
              I agree to the{' '}
              <Link href="#" className="text-emerald-600 hover:text-emerald-500">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="#" className="text-emerald-600 hover:text-emerald-500">
                Privacy Policy
              </Link>
            </Checkbox>
          </Form.Item>

          <Form.Item className="mt-6">
            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              className="border-emerald-600 bg-emerald-600 hover:border-emerald-700 hover:bg-emerald-700"
            >
              Create account
            </Button>
          </Form.Item>
        </Form>

        <div className="text-center">
          <Text type="secondary">
            Already have an account?{' '}
            <Link href={route('login')} className="font-medium text-emerald-600 hover:text-emerald-500">
              Sign in
            </Link>
          </Text>
        </div>
      </div>
    </>
  );
}
