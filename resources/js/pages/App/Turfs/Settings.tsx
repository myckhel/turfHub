import TurfSettingsForm from '@/components/Turf/TurfSettingsForm';
import { useAuth } from '@/hooks/useAuth';
import type { Turf } from '@/types/turf.types';
import { ArrowLeftOutlined, SettingOutlined } from '@ant-design/icons';
import { router } from '@inertiajs/react';
import { Button, message, Typography } from 'antd';
import React, { useEffect } from 'react';

const { Title, Text } = Typography;

interface TurfSettingsPageProps {
  turf: Turf;
}

const TurfSettingsPage: React.FC<TurfSettingsPageProps> = ({ turf }) => {
  const { user } = useAuth();

  // Check if user is authorized
  const isOwner = user?.id === turf.owner_id;
  const canManage = isOwner || turf.user_permissions?.can_manage_turf;

  useEffect(() => {
    if (!canManage) {
      message.error('You are not authorized to manage turf settings');
      router.visit(route('web.turfs.show', { turf: turf.id }));
    }
  }, [canManage, turf.id]);

  const handleBack = () => {
    router.visit(route('web.turfs.edit', { turf: turf.id }));
  };

  const handleSuccess = () => {
    message.success('Settings updated successfully');
  };

  if (!canManage) {
    return null;
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={handleBack} className="mb-4">
          Back to Edit Turf
        </Button>

        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
            <SettingOutlined className="text-2xl text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <Title level={1} className="mb-1">
              {turf.name} - Settings
            </Title>
            <Text type="secondary" className="text-base">
              Configure payment methods and manage bank accounts for your turf
            </Text>
          </div>
        </div>
      </div>

      {/* Settings Form */}
      <TurfSettingsForm turfId={turf.id} onSuccess={handleSuccess} />
    </div>
  );
};

export default TurfSettingsPage;
