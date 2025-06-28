import { CalendarOutlined } from '@ant-design/icons';
import { Head, router } from '@inertiajs/react';
import { Button, Card, Space, Typography } from 'antd';
import React, { memo } from 'react';
import { MatchSessionList } from '../../../components/MatchSessions';
import TurfLiveSessions from '../../../components/TurfLiveSessions';
import { usePermissions } from '../../../hooks/usePermissions';
import type { Turf } from '../../../types/turf.types';

const { Title, Text } = Typography;

interface IndexProps {
  turf: { data: Turf };
}

const Index: React.FC<IndexProps> = ({ turf }) => {
  const permissions = usePermissions();
  const canManageSessions = permissions.canManageSessions();

  const handleScheduleSession = () => {
    router.visit(route('web.turfs.match-sessions.create', { turf: turf.data }));
  };

  return (
    <>
      <Head title={`Match Sessions - ${turf?.data.name}`} />
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-green-900">
        <div className="container mx-auto px-4 py-6">
          {/* Header Section */}
          {canManageSessions && (
            <Card className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <Title level={2} className="mb-2">
                    Match Sessions
                  </Title>
                  <Text className="text-gray-600">Manage and schedule match sessions for {turf?.data.name}</Text>
                </div>

                <Space>
                  <Button
                    type="primary"
                    size="large"
                    icon={<CalendarOutlined />}
                    onClick={handleScheduleSession}
                    className="border-green-600 bg-green-600 hover:border-green-700 hover:bg-green-700"
                  >
                    Schedule Session
                  </Button>
                </Space>
              </div>
            </Card>
          )}

          {/* Live Sessions Section */}
          <TurfLiveSessions turfId={turf?.data.id} turf={{ id: turf?.data.id, name: turf?.data.name }} autoRefresh={true} refreshInterval={30000} />

          {/* Match Sessions List */}
          <MatchSessionList turfId={turf?.data.id} showCreateButton={false} maxHeight={600} />
        </div>
      </div>
    </>
  );
};

export default memo(Index);
