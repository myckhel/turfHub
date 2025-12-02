import { InfoCircleOutlined } from '@ant-design/icons';
import { Alert, Card, List, Space, Tag, Typography } from 'antd';
import { memo } from 'react';
import type { TieBreaker } from '../../../types/tournament.types';

const { Text } = Typography;

interface TieBreakersDisplayProps {
  tieBreakers: TieBreaker[];
  appliedCount?: number;
}

const TieBreakersDisplay = memo(({ tieBreakers, appliedCount = 0 }: TieBreakersDisplayProps) => {
  const getTieBreakerIcon = (type: string) => {
    const icons: Record<string, string> = {
      head_to_head: '⚔️',
      goal_difference: '🎯',
      goals_scored: '⚽',
      goals_conceded: '🛡️',
      wins: '🏆',
      away_goals: '✈️',
      fair_play: '🤝',
      drawing_lots: '🎲',
    };
    return icons[type] || '📊';
  };

  const getTieBreakerDescription = (type: string) => {
    const descriptions: Record<string, string> = {
      head_to_head: 'Result of direct match between tied teams',
      goal_difference: 'Difference between goals scored and conceded',
      goals_scored: 'Total number of goals scored',
      goals_conceded: 'Total number of goals conceded (lower is better)',
      wins: 'Total number of matches won',
      away_goals: 'Goals scored in away matches',
      fair_play: 'Fair play points (fewer cards = better)',
      drawing_lots: 'Random selection by drawing lots',
    };
    return descriptions[type] || 'Custom tie-breaking rule';
  };

  const getPriorityColor = (priority: number, maxPriority: number) => {
    if (priority === 1) return 'red';
    if (priority === 2) return 'orange';
    if (priority === 3) return 'gold';
    if (priority <= maxPriority / 2) return 'blue';
    return 'default';
  };

  const sortedTieBreakers = [...tieBreakers].sort((a, b) => a.priority - b.priority);

  return (
    <Card
      title={
        <Space>
          <InfoCircleOutlined />
          <span>Tie-Breaking Rules</span>
        </Space>
      }
      size="small"
    >
      {appliedCount > 0 && (
        <Alert message={`${appliedCount} tie-breaker${appliedCount > 1 ? 's' : ''} currently applied`} type="info" showIcon className="mb-4" />
      )}

      {tieBreakers.length === 0 ? (
        <Text className="text-gray-500">No tie-breaker rules configured</Text>
      ) : (
        <List
          dataSource={sortedTieBreakers}
          size="small"
          renderItem={(tieBreaker) => (
            <List.Item className="hover:bg-gray-50">
              <div className="w-full">
                <div className="flex items-start justify-between">
                  <Space>
                    <Tag color={getPriorityColor(tieBreaker.priority, tieBreakers.length)}>#{tieBreaker.priority}</Tag>
                    <Text className="text-lg">{getTieBreakerIcon(tieBreaker.type)}</Text>
                    <div>
                      <Text strong className="capitalize">
                        {tieBreaker.type.replace(/_/g, ' ')}
                      </Text>
                      <br />
                      <Text className="text-xs text-gray-500">{getTieBreakerDescription(tieBreaker.type)}</Text>
                    </div>
                  </Space>
                </div>
              </div>
            </List.Item>
          )}
        />
      )}

      <div className="mt-4 rounded bg-gray-50 p-3">
        <Text className="text-xs text-gray-600">
          <strong>How it works:</strong> When teams have equal points, the system applies tie-breaker rules in priority order (1 = highest priority).
          The first rule that produces a different result breaks the tie.
        </Text>
      </div>
    </Card>
  );
});

TieBreakersDisplay.displayName = 'TieBreakersDisplay';

export default TieBreakersDisplay;
