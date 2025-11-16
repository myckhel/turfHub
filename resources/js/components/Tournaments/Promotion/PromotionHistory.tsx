import { CheckCircleOutlined, ClockCircleOutlined, UserOutlined } from '@ant-design/icons';
import { Card, Empty, Space, Tag, Timeline, Typography } from 'antd';
import { format } from 'date-fns';
import { memo } from 'react';

const { Text, Title } = Typography;

interface PromotionEvent {
  id: number;
  stage_id: number;
  next_stage_id: number;
  promoted_teams_count: number;
  rule_type: string;
  executed_by?: { id: number; name: string };
  executed_at: string;
  override_reason?: string;
  stage_name?: string;
  next_stage_name?: string;
  team_names?: string[];
}

interface PromotionHistoryProps {
  events: PromotionEvent[];
  loading?: boolean;
}

const PromotionHistory = memo(({ events, loading }: PromotionHistoryProps) => {
  if (events.length === 0) {
    return (
      <Card>
        <Empty description="No promotion history available" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </Card>
    );
  }

  const sortedEvents = [...events].sort((a, b) => new Date(b.executed_at).getTime() - new Date(a.executed_at).getTime());

  return (
    <Card
      title={
        <Space>
          <ClockCircleOutlined />
          <span>Promotion History</span>
        </Space>
      }
      loading={loading}
    >
      <Timeline mode="left">
        {sortedEvents.map((event, index) => (
          <Timeline.Item
            key={event.id}
            color={index === 0 ? 'green' : 'blue'}
            dot={index === 0 ? <CheckCircleOutlined style={{ fontSize: '16px' }} /> : undefined}
          >
            <Card size="small" className="shadow-sm">
              <div className="space-y-2">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <Title level={5} className="mb-1">
                      {event.stage_name || `Stage ${event.stage_id}`}
                      <span className="mx-2 text-gray-400">→</span>
                      {event.next_stage_name || `Stage ${event.next_stage_id}`}
                    </Title>
                    <Text className="text-xs text-gray-500">{format(new Date(event.executed_at), 'PPp')}</Text>
                  </div>
                  <Tag color="success" icon={<CheckCircleOutlined />}>
                    {event.promoted_teams_count} Team{event.promoted_teams_count !== 1 ? 's' : ''}
                  </Tag>
                </div>

                {/* Rule Type */}
                <div className="flex items-center gap-2">
                  <Text className="text-xs text-gray-500">Rule:</Text>
                  <Tag color="blue">{event.rule_type.replace(/_/g, ' ')}</Tag>
                </div>

                {/* Team Names */}
                {event.team_names && event.team_names.length > 0 && (
                  <div>
                    <Text className="mb-1 block text-xs text-gray-500">Promoted Teams:</Text>
                    <Space wrap>
                      {event.team_names.map((name, idx) => (
                        <Tag key={idx} color="green">
                          {name}
                        </Tag>
                      ))}
                    </Space>
                  </div>
                )}

                {/* Executed By */}
                {event.executed_by && (
                  <div className="flex items-center gap-2">
                    <UserOutlined className="text-gray-400" />
                    <Text className="text-xs text-gray-600">
                      Executed by: <strong>{event.executed_by.name}</strong>
                    </Text>
                  </div>
                )}

                {/* Override Reason */}
                {event.override_reason && (
                  <div className="rounded bg-yellow-50 p-2">
                    <Text className="text-xs">
                      <strong>Override reason:</strong> {event.override_reason}
                    </Text>
                  </div>
                )}
              </div>
            </Card>
          </Timeline.Item>
        ))}
      </Timeline>

      {/* Summary */}
      <Card size="small" className="mt-4 bg-gray-50">
        <div className="flex items-center justify-between">
          <Text className="text-xs text-gray-600">
            Total Promotion Events: <strong>{events.length}</strong>
          </Text>
          <Text className="text-xs text-gray-600">
            Total Teams Promoted: <strong>{events.reduce((sum, e) => sum + e.promoted_teams_count, 0)}</strong>
          </Text>
        </div>
      </Card>
    </Card>
  );
});

PromotionHistory.displayName = 'PromotionHistory';

export default PromotionHistory;
