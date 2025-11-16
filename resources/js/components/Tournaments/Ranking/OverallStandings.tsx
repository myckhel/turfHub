import { BarChartOutlined, TableOutlined } from '@ant-design/icons';
import { Card, Col, Row, Segmented, Space, Statistic, Typography } from 'antd';
import { memo, useMemo, useState } from 'react';
import type { Ranking } from '../../../types/tournament.types';
import RankingsCard from './RankingsCard';
import RankingsTable from './RankingsTable';

const { Title, Text } = Typography;

interface OverallStandingsProps {
  rankings: Ranking[];
  showGroup?: boolean;
  loading?: boolean;
}

const OverallStandings = memo(({ rankings, showGroup = false, loading }: OverallStandingsProps) => {
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  const stats = useMemo(() => {
    const totalMatches = rankings.reduce((sum, r) => sum + r.played, 0) / 2; // Divide by 2 since each match involves 2 teams
    const totalGoals = rankings.reduce((sum, r) => sum + r.goals_for, 0);
    const avgGoalsPerMatch = totalMatches > 0 ? (totalGoals / totalMatches).toFixed(2) : '0.00';
    const teamsWithPoints = rankings.filter((r) => r.points > 0).length;

    return {
      totalTeams: rankings.length,
      totalMatches: Math.round(totalMatches),
      totalGoals,
      avgGoalsPerMatch,
      teamsWithPoints,
    };
  }, [rankings]);

  const sortedRankings = useMemo(() => {
    return [...rankings].sort((a, b) => a.rank - b.rank);
  }, [rankings]);

  return (
    <div className="space-y-4">
      {/* Stats Overview */}
      <Card>
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={6}>
            <Statistic title="Total Teams" value={stats.totalTeams} prefix="👥" />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic title="Matches Played" value={stats.totalMatches} prefix="⚽" />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic title="Total Goals" value={stats.totalGoals} prefix="🎯" />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic title="Avg Goals/Match" value={stats.avgGoalsPerMatch} prefix="📊" precision={2} />
          </Col>
        </Row>
      </Card>

      {/* View Controls */}
      <div className="flex items-center justify-between">
        <Title level={4} className="mb-0">
          Overall Standings
        </Title>
        <Segmented
          value={viewMode}
          onChange={(value) => setViewMode(value as 'table' | 'cards')}
          options={[
            {
              label: (
                <Space>
                  <TableOutlined />
                  <span>Table</span>
                </Space>
              ),
              value: 'table',
            },
            {
              label: (
                <Space>
                  <BarChartOutlined />
                  <span>Cards</span>
                </Space>
              ),
              value: 'cards',
            },
          ]}
        />
      </div>

      {/* Rankings Display */}
      {viewMode === 'table' ? (
        <RankingsTable rankings={sortedRankings} showGroup={showGroup} loading={loading} />
      ) : (
        <Row gutter={[16, 16]}>
          {sortedRankings.map((ranking) => (
            <Col xs={24} sm={12} lg={8} key={ranking.id}>
              <RankingsCard ranking={ranking} showGroup={showGroup} />
            </Col>
          ))}
        </Row>
      )}

      {/* Legend */}
      {viewMode === 'table' && (
        <Card size="small" className="bg-gray-50">
          <Space size="large" wrap>
            <Text className="text-xs">
              <strong>P:</strong> Played
            </Text>
            <Text className="text-xs">
              <strong>W:</strong> Wins
            </Text>
            <Text className="text-xs">
              <strong>D:</strong> Draws
            </Text>
            <Text className="text-xs">
              <strong>L:</strong> Losses
            </Text>
            <Text className="text-xs">
              <strong>GF:</strong> Goals For
            </Text>
            <Text className="text-xs">
              <strong>GA:</strong> Goals Against
            </Text>
            <Text className="text-xs">
              <strong>GD:</strong> Goal Difference
            </Text>
            <Text className="text-xs">
              <strong>Pts:</strong> Points
            </Text>
          </Space>
        </Card>
      )}
    </div>
  );
});

OverallStandings.displayName = 'OverallStandings';

export default OverallStandings;
