import { AppstoreOutlined, TeamOutlined } from '@ant-design/icons';
import { router } from '@inertiajs/react';
import { Button, Card, Space, Typography } from 'antd';
import React from 'react';
import { SelectedTurfCard } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';
import { useTurfStore } from '../../stores/turf.store';

const { Title } = Typography;

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { selectedTurf } = useTurfStore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-green-900 p-6">
      <div className="mx-auto max-w-4xl">
        <Title level={2} className="mb-6 text-center text-white">
          Welcome back, {user?.name}!
        </Title>

        <SelectedTurfCard buttonText="View Turf" />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card
            hoverable
            className="text-center"
            cover={
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-8">
                <AppstoreOutlined className="text-6xl text-white" />
              </div>
            }
            onClick={() => router.visit(route('web.turfs.index'))}
          >
            <Card.Meta title="Browse Turfs" description="Discover and join football turfs in your area" />
          </Card>

          <Card
            hoverable
            className="text-center"
            cover={
              <div className="bg-gradient-to-r from-green-500 to-green-600 p-8">
                <TeamOutlined className="text-6xl text-white" />
              </div>
            }
            onClick={() => {
              if (selectedTurf) {
                router.visit(route('web.turfs.show', { turf: selectedTurf.id }));
              } else {
                router.visit(route('web.turfs.index'));
              }
            }}
          >
            <Card.Meta
              title={selectedTurf ? 'My Turf' : 'Join a Turf'}
              description={selectedTurf ? `Manage your activities at ${selectedTurf.name}` : 'Find and join a turf to start playing'}
            />
          </Card>
        </div>

        <div className="mt-8 text-center">
          <Space direction="vertical" size="large">
            <Title level={3} className="text-white">
              Quick Actions
            </Title>
            <Space wrap>
              <Button type="primary" size="large" icon={<AppstoreOutlined />} onClick={() => router.visit(route('web.turfs.index'))}>
                Browse All Turfs
              </Button>
              {selectedTurf && (
                <Button size="large" icon={<TeamOutlined />} onClick={() => router.visit(route('web.turfs.show', { turf: selectedTurf.id }))}>
                  Go to My Turf
                </Button>
              )}
            </Space>
          </Space>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
