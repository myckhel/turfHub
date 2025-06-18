import { MailOutlined } from '@ant-design/icons';
import { Head, router } from '@inertiajs/react';
import { Alert, Button, Typography } from 'antd';
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
    <>
      <Head title="Email Verification" />

      <div className="mx-auto min-w-sm space-y-8">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <MailOutlined className="h-8 w-8 text-emerald-600" />
          </div>

          <Title level={2} className="!mt-6 !mb-2">
            Verify your email address
          </Title>
          <Text type="secondary" className="block">
            Thanks for signing up! Before getting started, could you verify your email address by clicking on the link we just emailed to you?
          </Text>

          {user?.email && (
            <Text type="secondary" className="mt-2 block">
              We sent a verification link to <strong>{user.email}</strong>
            </Text>
          )}
        </div>

        {status === 'verification-link-sent' && (
          <Alert message="A new verification link has been sent to your email address." type="success" showIcon className="mb-4" />
        )}

        <div className="space-y-4">
          <Button
            type="primary"
            onClick={resendVerification}
            block
            size="large"
            className="border-emerald-600 bg-emerald-600 hover:border-emerald-700 hover:bg-emerald-700"
          >
            Resend Verification Email
          </Button>

          <Button type="default" onClick={logout} block size="large">
            Log Out
          </Button>
        </div>

        <div className="text-center">
          <Text type="secondary" className="text-sm">
            Didn't receive the email? Check your spam folder or{' '}
            <button onClick={resendVerification} className="text-emerald-600 underline hover:text-emerald-500">
              click here to resend
            </button>
          </Text>
        </div>
      </div>
    </>
  );
}
