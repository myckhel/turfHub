import { CheckCircleOutlined, TrophyOutlined } from '@ant-design/icons';
import { Card, Empty, List, Space, Tag, Typography } from 'antd';
import { memo } from 'react';
import type { StageTeam } from '../../../types/tournament.types';

const { Text, Title } = Typography;

interface PromotedTeamsListProps {
  teams: StageTeam[];
  nextStageName?: string;
  showRank?: boolean;
}

const PromotedTeamsList = memo(({ teams, nextStageName, showRank = true }: PromotedTeamsListProps) => {
  if (teams.length === 0) {
    return (
      <Card>
        <Empty description="No teams promoted yet" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </Card>
    );
  }

  const sortedTeams = showRank && teams.every((t) => t.seed !== undefined) ? [...teams].sort((a, b) => (a.seed || 0) - (b.seed || 0)) : teams;

  return (
    <Card
      title={
        <Space>
          <TrophyOutlined className="text-yellow-500" />
          <span>Promoted Teams</span>
          {nextStageName && <Tag color="green">→ {nextStageName}</Tag>}
        </Space>
      }
      extra={
        <Tag color="success" icon={<CheckCircleOutlined />}>
          {teams.length} Team{teams.length !== 1 ? 's' : ''}
        </Tag>
      }
    >
      <List
        dataSource={sortedTeams}
        renderItem={(team, index) => (
          <List.Item>
            <div className="flex w-full items-center justify-between">
              <Space>
                {showRank && (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-600">
                    {team.seed || index + 1}
                  </div>
                )}
                <div>
                  <Title level={5} className="mb-0">
                    {team.name}
                  </Title>
                  {team.captain && <Text className="text-xs text-gray-500">Captain: {team.captain.name}</Text>}
                </div>
              </Space>
              <Space>
                {team.group_id && <Tag color="cyan">Group {team.group_id}</Tag>}
                {team.players_count !== undefined && <Tag>{team.players_count} players</Tag>}
                <CheckCircleOutlined className="text-xl text-green-500" />
              </Space>
            </div>
          </List.Item>
        )}
      />

      {nextStageName && (
        <div className="mt-4 rounded bg-green-50 p-3 text-center">
          <Text className="text-green-700">
            These teams have been successfully promoted to <strong>{nextStageName}</strong>
          </Text>
        </div>
      )}
    </Card>
  );
});

PromotedTeamsList.displayName = 'PromotedTeamsList';

export default PromotedTeamsList;
