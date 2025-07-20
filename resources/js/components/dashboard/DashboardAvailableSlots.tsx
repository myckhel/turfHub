import { TeamOutlined } from '@ant-design/icons';
import { Card, Tag, Typography } from 'antd';
import React, { memo } from 'react';
import { useTurfStore } from '../../stores/turf.store';
import { MatchSessionTeam } from '../Teams';

const { Title, Text } = Typography;

interface DashboardAvailableSlotsProps {
  className?: string;
}

const DashboardAvailableSlots: React.FC<DashboardAvailableSlotsProps> = memo(({ className }) => {
  const { selectedTurf } = useTurfStore();

  // Don't render if no turf is selected
  if (!selectedTurf) {
    return null;
  }

  return (
    <Card
      className={className}
      title={
        <div className="flex items-center gap-2">
          <TeamOutlined className="text-blue-500" />
          <span>Live Match Session</span>
          <Tag color="green" className="ml-auto">
            ACTIVE
          </Tag>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Session Info */}
        <div className="text-center">
          <Title level={4} className="mb-2 text-blue-600">
            Join the Action at {selectedTurf.name}!
          </Title>
          <Text type="secondary" className="block">
            There's an active match session with available player slots
          </Text>
        </div>

        <MatchSessionTeam />
      </div>
    </Card>
  );
});

DashboardAvailableSlots.displayName = 'DashboardAvailableSlots';

export default DashboardAvailableSlots;
