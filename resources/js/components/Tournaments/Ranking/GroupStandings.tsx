import { Empty, Space, Tabs, Typography } from 'antd';
import { memo, useMemo } from 'react';
import type { Group, Ranking } from '../../../types/tournament.types';
import RankingsTable from './RankingsTable';

const { Title } = Typography;

interface GroupStandingsProps {
  rankings: Ranking[];
  groups: Group[];
  loading?: boolean;
}

const GroupStandings = memo(({ rankings, groups, loading }: GroupStandingsProps) => {
  const groupedRankings = useMemo(() => {
    const grouped = new Map<number, Ranking[]>();

    groups.forEach((group) => {
      grouped.set(group.id, []);
    });

    rankings.forEach((ranking) => {
      if (ranking.group_id) {
        const groupRankings = grouped.get(ranking.group_id) || [];
        groupRankings.push(ranking);
        grouped.set(ranking.group_id, groupRankings);
      }
    });

    // Sort rankings within each group by rank
    grouped.forEach((groupRankings) => {
      groupRankings.sort((a, b) => a.rank - b.rank);
    });

    return grouped;
  }, [rankings, groups]);

  const tabItems = groups.map((group) => ({
    key: group.id.toString(),
    label: (
      <Space>
        <span>{group.name}</span>
        <span className="text-xs text-gray-500">({groupedRankings.get(group.id)?.length || 0} teams)</span>
      </Space>
    ),
    children: (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Title level={5} className="mb-0">
            {group.name} Standings
          </Title>
        </div>
        {groupedRankings.get(group.id)?.length ? (
          <RankingsTable rankings={groupedRankings.get(group.id) || []} loading={loading} />
        ) : (
          <Empty description="No teams in this group" />
        )}
      </div>
    ),
  }));

  if (groups.length === 0) {
    return <Empty description="No groups found" />;
  }

  return (
    <div className="space-y-4">
      <Tabs items={tabItems} type="card" />
    </div>
  );
});

GroupStandings.displayName = 'GroupStandings';

export default GroupStandings;
