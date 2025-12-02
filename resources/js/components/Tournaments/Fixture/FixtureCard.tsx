import { CalendarOutlined, ClockCircleOutlined, EditOutlined, TrophyOutlined } from '@ant-design/icons';
import { Badge, Card, Space, Tag, Typography } from 'antd';
import { format } from 'date-fns';
import { memo } from 'react';
import type { Fixture } from '../../../types/tournament.types';

const { Text, Title } = Typography;

interface FixtureCardProps {
  fixture: Fixture;
  onEditScore?: (fixture: Fixture) => void;
  showActions?: boolean;
}

const FixtureCard = memo(({ fixture, onEditScore, showActions = true }: FixtureCardProps) => {
  const getStatusConfig = (status: Fixture['status']) => {
    const configs: Record<Fixture['status'], { color: 'default' | 'processing' | 'success' | 'error' | 'warning'; text: string }> = {
      // scheduled: { color: 'default', text: 'Scheduled' },
      upcoming: { color: 'default', text: 'Upcoming' },
      in_progress: { color: 'processing', text: 'Ongoing' },
      completed: { color: 'success', text: 'Completed' },
      cancelled: { color: 'error', text: 'Cancelled' },
      postponed: { color: 'warning', text: 'Postponed' },
    };
    return configs[status];
  };

  const statusConfig = getStatusConfig(fixture.status);
  const isCompleted = fixture.status === 'completed';
  const canEdit = fixture.status !== 'cancelled' && onEditScore && showActions;

  return (
    <Card
      size="small"
      className="transition-shadow hover:shadow-md"
      extra={
        <Space>
          <Badge status={statusConfig.color} text={statusConfig.text} />
          {canEdit && <EditOutlined className="cursor-pointer text-blue-500 hover:text-blue-700" onClick={() => onEditScore(fixture)} />}
        </Space>
      }
    >
      <div className="space-y-3">
        {/* Teams and Score */}
        <div className="flex items-center justify-between">
          {/* Home Team */}
          <div className="flex-1 text-right">
            <Text strong className="text-base">
              {fixture.first_team?.name || 'TBD'}
            </Text>
            {fixture.winning_team?.id === fixture.first_team_id && <TrophyOutlined className="ml-2 text-yellow-500" />}
          </div>

          {/* Score */}
          <div className="mx-6">
            {isCompleted && fixture.outcome ? (
              <div className="flex items-center gap-2">
                <Title level={3} className="mb-0 font-bold text-blue-600">
                  {fixture.first_team_score}
                </Title>
                <Text className="text-gray-400">-</Text>
                <Title level={3} className="mb-0 font-bold text-blue-600">
                  {fixture.second_team_score}
                </Title>
              </div>
            ) : (
              <Text className="text-lg text-gray-400">vs</Text>
            )}
          </div>

          {/* Away Team */}
          <div className="flex-1">
            {fixture.winning_team?.id === fixture.second_team_id && <TrophyOutlined className="mr-2 text-yellow-500" />}
            <Text strong className="text-base">
              {fixture.second_team?.name || 'TBD'}
            </Text>
          </div>
        </div>

        {/* Match Info */}
        <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
          {fixture.match_time && (
            <Space size="small">
              <CalendarOutlined />
              <Text className="text-xs">{format(new Date(fixture.match_time), 'MMM dd, yyyy')}</Text>
              <ClockCircleOutlined />
              <Text className="text-xs">{format(new Date(fixture.match_time), 'HH:mm')}</Text>
            </Space>
          )}
          {fixture.match_time && (
            <Space size="small">
              <ClockCircleOutlined />
              <Text className="text-xs">{fixture.match_time} min</Text>
            </Space>
          )}
          {fixture.group && (
            <Tag color="blue" className="text-xs">
              {fixture.group.name}
            </Tag>
          )}
        </div>

        {/* Metadata */}
        {/* {fixture.metadata && Object.keys(fixture.metadata).length > 0 && (
          <div className="text-center text-xs text-gray-400">
            {Object.entries(fixture.metadata).map(([key, value]) => (
              <span key={key} className="mx-1">
                {key}: {String(value)}
              </span>
            ))}
          </div>
        )} */}
      </div>
    </Card>
  );
});

FixtureCard.displayName = 'FixtureCard';

export default FixtureCard;
