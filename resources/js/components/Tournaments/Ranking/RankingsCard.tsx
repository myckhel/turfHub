import { TrophyOutlined } from '@ant-design/icons';
import { Card, Col, Progress, Row, Space, Statistic, Tag, Typography } from 'antd';
import { memo } from 'react';
import type { Ranking } from '../../../types/tournament.types';

const { Text, Title } = Typography;

interface RankingsCardProps {
  ranking: Ranking;
  showGroup?: boolean;
}

const RankingsCard = memo(({ ranking, showGroup = false }: RankingsCardProps) => {
  const winRate = ranking.played > 0 ? Math.round((ranking.wins / ranking.played) * 100) : 0;
  const formPercentage = ranking.played > 0 ? Math.round(((ranking.wins + ranking.draws * 0.5) / ranking.played) * 100) : 0;

  return (
    <Card hoverable className="h-full">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              {ranking.rank === 1 && <TrophyOutlined className="text-2xl text-yellow-500" />}
              {ranking.rank === 2 && <TrophyOutlined className="text-xl text-gray-400" />}
              {ranking.rank === 3 && <TrophyOutlined className="text-xl text-orange-600" />}
              <Title level={5} className="mb-0">
                {ranking.team?.name}
              </Title>
            </div>
            <Space size="small" className="mt-1">
              <Tag color={ranking.rank === 1 ? 'gold' : ranking.rank <= 3 ? 'blue' : 'default'}>Rank #{ranking.rank}</Tag>
              {showGroup && ranking.group && <Tag color="cyan">{ranking.group.name}</Tag>}
            </Space>
          </div>
          <div className="text-right">
            <Text className="text-3xl font-bold text-blue-600">{ranking.points}</Text>
            <br />
            <Text className="text-xs text-gray-500">Points</Text>
          </div>
        </div>

        {/* Stats Grid */}
        <Row gutter={[8, 8]}>
          <Col span={8}>
            <Statistic title="Played" value={ranking.played} valueStyle={{ fontSize: '18px' }} />
          </Col>
          <Col span={8}>
            <Statistic title="Wins" value={ranking.wins} valueStyle={{ fontSize: '18px', color: '#52c41a' }} />
          </Col>
          <Col span={8}>
            <Statistic title="Losses" value={ranking.losses} valueStyle={{ fontSize: '18px', color: '#ff4d4f' }} />
          </Col>
        </Row>

        {/* Goals */}
        <div className="rounded bg-gray-50 p-3">
          <Row gutter={16}>
            <Col span={8} className="text-center">
              <Text className="text-xs text-gray-500">Goals For</Text>
              <br />
              <Text strong className="text-lg">
                {ranking.goals_for}
              </Text>
            </Col>
            <Col span={8} className="text-center">
              <Text className="text-xs text-gray-500">Goals Against</Text>
              <br />
              <Text strong className="text-lg">
                {ranking.goals_against}
              </Text>
            </Col>
            <Col span={8} className="text-center">
              <Text className="text-xs text-gray-500">Goal Diff</Text>
              <br />
              <Text
                strong
                className={`text-lg ${ranking.goal_difference > 0 ? 'text-green-600' : ranking.goal_difference < 0 ? 'text-red-600' : ''}`}
              >
                {ranking.goal_difference > 0 ? '+' : ''}
                {ranking.goal_difference}
              </Text>
            </Col>
          </Row>
        </div>

        {/* Win Rate Progress */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <Text className="text-xs text-gray-500">Win Rate</Text>
            <Text className="text-xs font-semibold">{winRate}%</Text>
          </div>
          <Progress
            percent={winRate}
            strokeColor={{
              '0%': '#108ee9',
              '100%': '#52c41a',
            }}
            showInfo={false}
          />
        </div>

        {/* Form Progress */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <Text className="text-xs text-gray-500">Form (W + 0.5D)</Text>
            <Text className="text-xs font-semibold">{formPercentage}%</Text>
          </div>
          <Progress percent={formPercentage} strokeColor="#faad14" showInfo={false} />
        </div>

        {/* Record */}
        <div className="flex items-center justify-center gap-2 text-xs">
          <Space size={4}>
            <div className="flex h-6 w-6 items-center justify-center rounded bg-green-500 font-bold text-white">{ranking.wins}</div>
            <Text className="text-gray-500">W</Text>
          </Space>
          <Space size={4}>
            <div className="flex h-6 w-6 items-center justify-center rounded bg-gray-400 font-bold text-white">{ranking.draws}</div>
            <Text className="text-gray-500">D</Text>
          </Space>
          <Space size={4}>
            <div className="flex h-6 w-6 items-center justify-center rounded bg-red-500 font-bold text-white">{ranking.losses}</div>
            <Text className="text-gray-500">L</Text>
          </Space>
        </div>
      </div>
    </Card>
  );
});

RankingsCard.displayName = 'RankingsCard';

export default RankingsCard;
