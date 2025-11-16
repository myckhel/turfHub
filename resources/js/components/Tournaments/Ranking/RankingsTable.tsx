import { Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { memo } from 'react';
import type { Ranking } from '../../../types/tournament.types';

const { Text } = Typography;

interface RankingsTableProps {
  rankings: Ranking[];
  showGroup?: boolean;
  loading?: boolean;
}

const RankingsTable = memo(({ rankings, showGroup = false, loading }: RankingsTableProps) => {
  const columns: ColumnsType<Ranking> = [
    {
      title: 'Pos',
      dataIndex: 'rank',
      key: 'rank',
      width: 60,
      align: 'center',
      render: (rank: number) => {
        if (rank === 1)
          return (
            <Text strong className="text-lg text-yellow-500">
              {rank}
            </Text>
          );
        if (rank <= 3)
          return (
            <Text strong className="text-base text-blue-500">
              {rank}
            </Text>
          );
        return <Text>{rank}</Text>;
      },
    },
    {
      title: 'Team',
      dataIndex: 'team',
      key: 'team',
      render: (team: { id: number; name: string }) => (
        <div className="flex items-center gap-2">
          <Text strong>{team.name}</Text>
        </div>
      ),
    },
    ...(showGroup
      ? [
          {
            title: 'Group',
            dataIndex: 'group',
            key: 'group',
            width: 100,
            render: (group: { id: number; name: string } | undefined) => (group ? <Tag color="blue">{group.name}</Tag> : '-'),
          },
        ]
      : []),
    {
      title: 'P',
      dataIndex: 'played',
      key: 'played',
      width: 60,
      align: 'center',
      sorter: (a, b) => a.played - b.played,
    },
    {
      title: 'W',
      dataIndex: 'wins',
      key: 'wins',
      width: 60,
      align: 'center',
      sorter: (a, b) => a.wins - b.wins,
      render: (wins: number) => <Text className="text-green-600">{wins}</Text>,
    },
    {
      title: 'D',
      dataIndex: 'draws',
      key: 'draws',
      width: 60,
      align: 'center',
      sorter: (a, b) => a.draws - b.draws,
      render: (draws: number) => <Text className="text-gray-600">{draws}</Text>,
    },
    {
      title: 'L',
      dataIndex: 'losses',
      key: 'losses',
      width: 60,
      align: 'center',
      sorter: (a, b) => a.losses - b.losses,
      render: (losses: number) => <Text className="text-red-600">{losses}</Text>,
    },
    {
      title: 'GF',
      dataIndex: 'goals_for',
      key: 'goals_for',
      width: 60,
      align: 'center',
      sorter: (a, b) => a.goals_for - b.goals_for,
    },
    {
      title: 'GA',
      dataIndex: 'goals_against',
      key: 'goals_against',
      width: 60,
      align: 'center',
      sorter: (a, b) => a.goals_against - b.goals_against,
    },
    {
      title: 'GD',
      dataIndex: 'goal_difference',
      key: 'goal_difference',
      width: 70,
      align: 'center',
      sorter: (a, b) => a.goal_difference - b.goal_difference,
      render: (gd: number) => {
        if (gd > 0) return <Text className="text-green-600">+{gd}</Text>;
        if (gd < 0) return <Text className="text-red-600">{gd}</Text>;
        return <Text>0</Text>;
      },
    },
    {
      title: 'Pts',
      dataIndex: 'points',
      key: 'points',
      width: 70,
      align: 'center',
      sorter: (a, b) => a.points - b.points,
      defaultSortOrder: 'descend',
      render: (points: number) => (
        <Text strong className="text-base">
          {points}
        </Text>
      ),
    },
  ];

  const sortedRankings = [...rankings].sort((a, b) => a.rank - b.rank);

  return (
    <Table
      columns={columns as ColumnsType<Ranking>}
      dataSource={sortedRankings}
      rowKey="id"
      loading={loading}
      pagination={false}
      size="small"
      className="rankings-table"
      rowClassName={(record) => {
        if (record.rank === 1) return 'bg-yellow-50';
        if (record.rank <= 3) return 'bg-blue-50';
        return '';
      }}
    />
  );
});

RankingsTable.displayName = 'RankingsTable';

export default RankingsTable;
