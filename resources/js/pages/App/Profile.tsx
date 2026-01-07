import { userApi, type ProfileUpdateData } from '@/apis/user';
import {
  EditOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  KeyOutlined,
  LockOutlined,
  MailOutlined,
  SaveOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { router } from '@inertiajs/react';
import { Avatar, Button, Card, Col, Form, FormInstance, Input, Row, Space, Statistic, Typography, message } from 'antd';
import React, { memo, useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

const { Title, Text } = Typography;

interface ProfileStats {
  total_matches: number;
  total_turfs: number;
  total_goals: number;
  win_rate: number;
}

interface PasswordChangeData {
  current_password: string;
  password: string;
  password_confirmation: string;
}

// Extended user interface with all possible properties
interface ProfileUser {
  id?: number;
  name: string;
  email: string;
  avatar?: string;
  email_verified_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

const Profile: React.FC = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [isPasswordFormOpen, setIsPasswordFormOpen] = useState(false);
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();

  const handleEditToggle = useCallback(() => {
    if (isEditing) {
      form.resetFields();
    }
    setIsEditing(!isEditing);
  }, [isEditing, form]);

  const handleSubmit = useCallback(
    async (values: ProfileUpdateData) => {
      if (!user?.id) return;

      setLoading(true);
      try {
        await userApi.updateProfile(user.id, values);
        message.success('Profile updated successfully');
        setIsEditing(false);
        // Reload page to refresh user data
        router.reload({ only: ['auth'] });
      } catch (error) {
        message.error('Failed to update profile');
        console.error('Profile update error:', error);
      } finally {
        setLoading(false);
      }
    },
    [user?.id],
  );

  const handlePasswordChange = useCallback(
    async (values: PasswordChangeData) => {
      setPasswordLoading(true);
      try {
        router.put(
          route('password.update'),
          {
            current_password: values.current_password,
            password: values.password,
            password_confirmation: values.password_confirmation,
          },
          {
            preserveScroll: true,
            onSuccess: () => {
              message.success('Password changed successfully');
              passwordForm.resetFields();
              setIsPasswordFormOpen(false);
            },
            onError: (errors) => {
              if (errors.current_password) {
                message.error(errors.current_password);
              } else if (errors.password) {
                message.error(errors.password);
              } else {
                message.error('Failed to change password');
              }
            },
          },
        );
      } catch (error) {
        message.error('Failed to change password');
        console.error('Password change error:', error);
      } finally {
        setPasswordLoading(false);
      }
    },
    [passwordForm],
  );

  const togglePasswordForm = useCallback(() => {
    if (isPasswordFormOpen) {
      passwordForm.resetFields();
    }
    setIsPasswordFormOpen(!isPasswordFormOpen);
  }, [isPasswordFormOpen, passwordForm]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setStatsLoading(true);
        const data = await userApi.getUserStats();
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch user stats:', error);
        message.error('Failed to load profile statistics');
      } finally {
        setStatsLoading(false);
      }
    };

    if (user) {
      fetchStats();
    }
  }, [user]);

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen p-4 sm:p-6">
      <div className="mx-auto max-w-5xl">
        <Title level={2} className="mb-6 text-white">
          Profile Settings
        </Title>

        <Row gutter={[16, 16]}>
          {/* Profile Information Card */}
          <Col xs={24} lg={16}>
            <Card
              title={
                <Space>
                  <UserOutlined />
                  <span>Personal Information</span>
                </Space>
              }
              extra={
                !isEditing ? (
                  <Button type="primary" icon={<EditOutlined />} onClick={handleEditToggle}>
                    Edit
                  </Button>
                ) : (
                  <Button onClick={handleEditToggle}>Cancel</Button>
                )
              }
              className="shadow-md"
            >
              {!isEditing ? <ProfileView user={user} /> : <ProfileForm form={form} user={user} loading={loading} onSubmit={handleSubmit} />}
            </Card>
          </Col>

          {/* Profile Avatar and Quick Stats */}
          <Col xs={24} lg={8}>
            <Space direction="vertical" size="large" className="w-full">
              {/* Avatar Card */}
              <Card className="text-center shadow-md">
                <Space direction="vertical" size="middle" className="w-full">
                  <Avatar size={120} src={user.avatar} icon={<UserOutlined />} className="mx-auto border-4 border-blue-500" />
                  <div>
                    <Title level={4} className="mb-1">
                      {user.name}
                    </Title>
                    <Text type="secondary">{user.email}</Text>
                  </div>
                  {user.created_at && (
                    <Text type="secondary" className="text-xs">
                      Member since {new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </Text>
                  )}
                </Space>
              </Card>

              {/* Quick Stats Card */}
              <Card title="Quick Stats" className="shadow-md" loading={statsLoading}>
                {stats && (
                  <Row gutter={[16, 16]}>
                    <Col span={12}>
                      <Statistic title="Matches" value={stats.total_matches} prefix={<UserOutlined />} />
                    </Col>
                    <Col span={12}>
                      <Statistic title="Turfs" value={stats.total_turfs} prefix={<UserOutlined />} />
                    </Col>
                    <Col span={12}>
                      <Statistic title="Goals" value={stats.total_goals} />
                    </Col>
                    <Col span={12}>
                      <Statistic title="Win Rate" value={stats.win_rate} suffix="%" />
                    </Col>
                  </Row>
                )}
              </Card>
            </Space>
          </Col>

          {/* Security Settings Card */}
          <Col xs={24} lg={16}>
            <Card
              title={
                <Space>
                  <LockOutlined />
                  <span>Security Settings</span>
                </Space>
              }
              className="shadow-md"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                  <div>
                    <Text strong className="block">
                      Password
                    </Text>
                    <Text type="secondary" className="text-sm">
                      Change your password to keep your account secure
                    </Text>
                  </div>
                  <Button type={isPasswordFormOpen ? 'default' : 'primary'} icon={<KeyOutlined />} onClick={togglePasswordForm}>
                    {isPasswordFormOpen ? 'Cancel' : 'Change Password'}
                  </Button>
                </div>

                {isPasswordFormOpen && (
                  <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
                    <PasswordChangeForm form={passwordForm} loading={passwordLoading} onSubmit={handlePasswordChange} />
                  </div>
                )}
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
};

// Profile View Component
interface ProfileViewProps {
  user: ProfileUser;
}

const ProfileView = memo(({ user }: ProfileViewProps) => (
  <div className="space-y-6 py-4">
    {/* Name Section */}
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <UserOutlined className="text-lg text-blue-500" />
        <Text type="secondary" className="text-sm font-medium">
          Full Name
        </Text>
      </div>
      <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
        <Text strong className="text-base">
          {user.name}
        </Text>
      </div>
    </div>

    {/* Email Section */}
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <MailOutlined className="text-lg text-blue-500" />
        <Text type="secondary" className="text-sm font-medium">
          Email Address
        </Text>
      </div>
      <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <Text strong className="text-base">
            {user.email}
          </Text>
          {user.email_verified_at && (
            <div className="flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 dark:bg-green-900/30">
              <span className="text-xs font-medium text-green-700 dark:text-green-400">✓ Verified</span>
            </div>
          )}
        </div>
      </div>
    </div>

    {/* Account Info Section */}
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {user.created_at && (
        <div className="space-y-2">
          <Text type="secondary" className="text-sm font-medium">
            Member Since
          </Text>
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
            <Text className="text-base">
              {new Date(user.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
          </div>
        </div>
      )}
      {user.updated_at && (
        <div className="space-y-2">
          <Text type="secondary" className="text-sm font-medium">
            Last Updated
          </Text>
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
            <Text className="text-base">
              {new Date(user.updated_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
          </div>
        </div>
      )}
    </div>
  </div>
));

ProfileView.displayName = 'ProfileView';

// Profile Form Component
interface ProfileFormProps {
  form: FormInstance;
  user: {
    name: string;
    email: string;
  };
  loading: boolean;
  onSubmit: (values: ProfileUpdateData) => void;
}

const ProfileForm = memo(({ form, user, loading, onSubmit }: ProfileFormProps) => (
  <Form
    form={form}
    layout="vertical"
    onFinish={onSubmit}
    initialValues={{
      name: user.name,
      email: user.email,
    }}
  >
    <Form.Item
      label="Name"
      name="name"
      rules={[
        { required: true, message: 'Please enter your name' },
        { max: 255, message: 'Name must not exceed 255 characters' },
      ]}
    >
      <Input prefix={<UserOutlined />} placeholder="Enter your name" size="large" />
    </Form.Item>

    <Form.Item
      label="Email"
      name="email"
      rules={[
        { required: true, message: 'Please enter your email' },
        { type: 'email', message: 'Please enter a valid email' },
        { max: 255, message: 'Email must not exceed 255 characters' },
      ]}
    >
      <Input disabled prefix={<MailOutlined />} placeholder="Enter your email" size="large" />
    </Form.Item>

    <Form.Item>
      <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading} size="large" block>
        Save Changes
      </Button>
    </Form.Item>
  </Form>
));

ProfileForm.displayName = 'ProfileForm';

// Password Change Form Component
interface PasswordChangeFormProps {
  form: FormInstance;
  loading: boolean;
  onSubmit: (values: PasswordChangeData) => void;
}

const PasswordChangeForm = memo(({ form, loading, onSubmit }: PasswordChangeFormProps) => (
  <Form form={form} layout="vertical" onFinish={onSubmit} autoComplete="off">
    <Form.Item label="Current Password" name="current_password" rules={[{ required: true, message: 'Please enter your current password' }]}>
      <Input.Password
        prefix={<LockOutlined />}
        placeholder="Enter your current password"
        size="large"
        iconRender={(visible) => (visible ? <EyeOutlined /> : <EyeInvisibleOutlined />)}
      />
    </Form.Item>

    <Form.Item
      label="New Password"
      name="password"
      rules={[
        { required: true, message: 'Please enter your new password' },
        { min: 8, message: 'Password must be at least 8 characters' },
      ]}
    >
      <Input.Password
        prefix={<KeyOutlined />}
        placeholder="Enter your new password"
        size="large"
        iconRender={(visible) => (visible ? <EyeOutlined /> : <EyeInvisibleOutlined />)}
      />
    </Form.Item>

    <Form.Item
      label="Confirm New Password"
      name="password_confirmation"
      dependencies={['password']}
      rules={[
        { required: true, message: 'Please confirm your new password' },
        ({ getFieldValue }) => ({
          validator(_, value) {
            if (!value || getFieldValue('password') === value) {
              return Promise.resolve();
            }
            return Promise.reject(new Error('Passwords do not match'));
          },
        }),
      ]}
    >
      <Input.Password
        prefix={<KeyOutlined />}
        placeholder="Confirm your new password"
        size="large"
        iconRender={(visible) => (visible ? <EyeOutlined /> : <EyeInvisibleOutlined />)}
      />
    </Form.Item>

    <Form.Item>
      <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading} size="large" block>
        Update Password
      </Button>
    </Form.Item>
  </Form>
));

PasswordChangeForm.displayName = 'PasswordChangeForm';

export default Profile;
