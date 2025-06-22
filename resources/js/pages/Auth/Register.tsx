import { Head, Link, router } from '@inertiajs/react';
import { Button, Checkbox, Form, Input, Typography } from 'antd';
import { AuthLayout } from '../../components/layout/AuthLayout';
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
    <AuthLayout>
      <Head title="Register" />

      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <Title level={2} className="!mb-2 !text-gray-900 dark:!text-white">
            Create your account
          </Title>
          <Text type="secondary" className="text-base">
            Join TurfMate and start managing your turf bookings
          </Text>
        </div>

        {/* Registration Form */}
        <Form form={form} name="register" layout="vertical" onFinish={onFinish} autoComplete="off" size="large" className="space-y-1">
          <Form.Item
            label={<span className="text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</span>}
            name="name"
            rules={[
              { required: true, message: 'Please input your name!' },
              { min: 2, message: 'Name must be at least 2 characters!' },
            ]}
            validateStatus={errors.name ? 'error' : ''}
            help={errors.name}
            className="mb-4"
          >
            <Input placeholder="Enter your full name" className="h-12 rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700" />
          </Form.Item>

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
            rules={[
              { required: true, message: 'Please input your password!' },
              { min: 8, message: 'Password must be at least 8 characters!' },
            ]}
            validateStatus={errors.password ? 'error' : ''}
            help={errors.password}
            className="mb-4"
          >
            <Input.Password placeholder="Enter your password" className="h-12 rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700" />
          </Form.Item>

          <Form.Item
            label={<span className="text-sm font-medium text-gray-700 dark:text-gray-300">Confirm Password</span>}
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
            className="mb-6"
          >
            <Input.Password placeholder="Confirm your password" className="h-12 rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700" />
          </Form.Item>

          <Form.Item
            name="terms"
            valuePropName="checked"
            rules={[
              {
                validator: (_, value) => (value ? Promise.resolve() : Promise.reject(new Error('Please accept the terms and conditions'))),
              },
            ]}
            className="mb-6"
          >
            <Checkbox className="text-sm text-gray-600 dark:text-gray-400">
              I agree to the{' '}
              <Link
                href="#"
                className="font-medium text-emerald-600 transition-colors hover:text-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-300"
              >
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link
                href="#"
                className="font-medium text-emerald-600 transition-colors hover:text-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-300"
              >
                Privacy Policy
              </Link>
            </Checkbox>
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
              Create account
            </Button>
          </Form.Item>
        </Form>

        {/* Sign in link */}
        <div className="border-t border-gray-200 pt-4 text-center dark:border-gray-700">
          <Text type="secondary" className="text-sm">
            Already have an account?{' '}
            <Link
              href={route('login')}
              className="font-medium text-emerald-600 transition-colors hover:text-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-300"
            >
              Sign in
            </Link>
          </Text>
        </div>
      </div>
    </AuthLayout>
  );
}
