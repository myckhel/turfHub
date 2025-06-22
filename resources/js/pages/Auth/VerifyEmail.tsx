import { MailOutlined } from '@ant-design/icons';
import { Head, router } from '@inertiajs/react';
import { Alert, Button, Typography } from 'antd';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { useAuth } from '../../hooks/useAuth';

const { Title, Text } = Typography;

interface VerifyEmailProps {
  status?: string;
}

export default function VerifyEmail({ status }: VerifyEmailProps) {
  const { user } = useAuth();

  const resendVerification = () => {
    router.post(route('verification.send'));
  };

  const logout = () => {
    router.post(route('logout'));
  };

  return (
    <AuthLayout>
      <Head title="Email Verification" />

      <div className="space-y-6">
        {/* Header with icon */}
        <div className="text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/20 dark:to-emerald-800/20">
            <MailOutlined className="text-3xl text-emerald-600 dark:text-emerald-400" />
          </div>

          <Title level={2} className="!mt-6 !mb-2 !text-gray-900 dark:!text-white">
            Verify your email address
          </Title>
          <Text type="secondary" className="block text-base">
            Thanks for signing up! Before getting started, could you verify your email address by clicking on the link we just emailed to you?
          </Text>

          {user?.email && (
            <Text type="secondary" className="mt-3 block">
              We sent a verification link to <strong className="text-gray-900 dark:text-white">{user.email}</strong>
            </Text>
          )}
        </div>

        {/* Status message */}
        {status === 'verification-link-sent' && (
          <Alert
            message="A new verification link has been sent to your email address."
            type="success"
            showIcon
            className="rounded-lg border-emerald-200 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-900/20"
          />
        )}

        {/* Action buttons */}
        <div className="space-y-3">
          <Button
            type="primary"
            onClick={resendVerification}
            block
            size="large"
            className="h-12 rounded-lg border-none bg-gradient-to-r from-emerald-600 to-emerald-700 font-medium shadow-lg transition-all duration-200 hover:from-emerald-700 hover:to-emerald-800 hover:shadow-xl"
          >
            Resend Verification Email
          </Button>

          <Button
            type="default"
            onClick={logout}
            block
            size="large"
            className="h-12 rounded-lg border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:bg-gray-700 dark:hover:border-gray-500"
          >
            Log Out
          </Button>
        </div>

        {/* Help text */}
        <div className="border-t border-gray-200 pt-4 text-center dark:border-gray-700">
          <Text type="secondary" className="text-sm">
            Didn't receive the email? Check your spam folder or{' '}
            <button
              onClick={resendVerification}
              className="font-medium text-emerald-600 transition-colors hover:text-emerald-500 hover:underline dark:text-emerald-400 dark:hover:text-emerald-300"
            >
              click here to resend
            </button>
          </Text>
        </div>
      </div>
    </AuthLayout>
  );
}
