import { TrophyOutlined, UserOutlined } from '@ant-design/icons';
import { router } from '@inertiajs/react';
import { Card, Table, Tag, Typography } from 'antd';
import React, { memo } from 'react';
import type { Team } from '../../types/matchSession.types';

const { Text } = Typography;

interface MatchSessionStandingsProps {
  teams: Team[];
  matchSessionId: number;
  turfId: number;
  maxPlayersPerTeam: number;
  className?: string;
}

interface StandingsTeam extends Team {
  position: number;
  points: number;
  played: number;
  goalDifference: number;
  form: string[];
}

const MatchSessionStandings: React.FC<MatchSessionStandingsProps> = ({ teams, matchSessionId, turfId, maxPlayersPerTeam, className }) => {
  const calculateStandings = (teams: Team[]): StandingsTeam[] => {
    const standings = teams.map((team) => {
      const points = team.wins * 3 + team.draws * 1; // 3 points for win, 1 for draw
      const played = team.wins + team.losses + team.draws;
      const goalDifference = team.goals_for - team.goals_against;

      return {
        ...team,
        points,
        played,
        goalDifference,
        position: 0, // Will be set after sorting
        form: [], // Could be enhanced with recent match results
      };
    });

    // Sort by: Points (desc), Goal Difference (desc), Goals For (desc), Wins (desc)
    standings.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
      if (b.goals_for !== a.goals_for) return b.goals_for - a.goals_for;
      return b.wins - a.wins;
    });

    // Assign positions
    standings.forEach((team, index) => {
      team.position = index + 1;
    });

    return standings;
  };

  const standingsData = calculateStandings(teams);

  const handleTeamClick = (teamId: number) => {
    router.visit(
      route('web.turfs.match-sessions.teams.show', {
        turf: turfId,
        matchSession: matchSessionId,
        team: teamId,
      }),
    );
  };

  const getPositionColor = (position: number) => {
    if (position === 1) return '#fbbf24'; // More vibrant gold
    if (position === 2) return '#9ca3af'; // Better silver
    if (position === 3) return '#f59e0b'; // Better bronze
    return '#6b7280'; // Default gray
  };

  const standingsColumns = [
    {
      title: 'Pos',
      dataIndex: 'position',
      key: 'position',
      width: 60,
      render: (position: number) => (
        <div className="flex items-center justify-center">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-full font-bold text-white shadow-md"
            style={{
              backgroundColor: getPositionColor(position),
              color: position <= 3 ? '#000' : '#fff', // Dark text for medal colors, white for others
            }}
          >
            {position}
          </span>
        </div>
      ),
    },
    {
      title: 'Team',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: StandingsTeam) => (
        <div
          className="cursor-pointer transition-colors hover:text-blue-600"
          onClick={() => handleTeamClick(record.id)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleTeamClick(record.id);
            }
          }}
        >
          <div className="flex items-center gap-2">
            <Text strong className="hover:text-blue-600">
              {name}
            </Text>
            {record.position <= 3 && <TrophyOutlined className="text-yellow-500 dark:text-yellow-400" />}
          </div>
          {record.captain && <div className="text-xs text-gray-500">Captain: {record.captain.name}</div>}
        </div>
      ),
    },
    {
      title: 'P',
      dataIndex: 'played',
      key: 'played',
      width: 50,
      align: 'center' as const,
      render: (played: number) => <Text strong>{played}</Text>,
    },
    {
      title: 'W',
      dataIndex: 'wins',
      key: 'wins',
      width: 50,
      align: 'center' as const,
      render: (wins: number) => <Tag color="green">{wins}</Tag>,
    },
    {
      title: 'D',
      dataIndex: 'draws',
      key: 'draws',
      width: 50,
      align: 'center' as const,
      render: (draws: number) => <Tag color="blue">{draws}</Tag>,
    },
    {
      title: 'L',
      dataIndex: 'losses',
      key: 'losses',
      width: 50,
      align: 'center' as const,
      render: (losses: number) => <Tag color="red">{losses}</Tag>,
    },
    {
      title: 'GF',
      dataIndex: 'goals_for',
      key: 'goals_for',
      width: 60,
      align: 'center' as const,
      render: (goalsFor: number) => <Text>{goalsFor}</Text>,
    },
    {
      title: 'GA',
      dataIndex: 'goals_against',
      key: 'goals_against',
      width: 60,
      align: 'center' as const,
      render: (goalsAgainst: number) => <Text>{goalsAgainst}</Text>,
    },
    {
      title: 'GD',
      dataIndex: 'goalDifference',
      key: 'goalDifference',
      width: 60,
      align: 'center' as const,
      render: (goalDifference: number) => (
        <Text className={goalDifference > 0 ? 'text-green-600' : goalDifference < 0 ? 'text-red-600' : ''}>
          {goalDifference > 0 ? '+' : ''}
          {goalDifference}
        </Text>
      ),
    },
    {
      title: 'Pts',
      dataIndex: 'points',
      key: 'points',
      width: 60,
      align: 'center' as const,
      render: (points: number) => (
        <Text strong className="text-lg">
          {points}
        </Text>
      ),
    },
    {
      title: 'Players',
      key: 'players',
      width: 80,
      align: 'center' as const,
      render: (record: StandingsTeam) => (
        <div className="flex items-center justify-center gap-1">
          <UserOutlined />
          <Text>
            {record.teamPlayers?.length || 0}/{maxPlayersPerTeam}
          </Text>
        </div>
      ),
    },
  ];

  if (!teams || teams.length === 0) {
    return (
      <Card title="Standings" className={className}>
        <div className="py-8 text-center">
          <Text type="secondary">No teams created yet</Text>
        </div>
      </Card>
    );
  }

  return (
    <Card
      title={
        <div className="flex items-center gap-2">
          <TrophyOutlined />
          <span>Standings</span>
        </div>
      }
      className={className}
    >
      <div className="mb-4 text-xs text-gray-500">
        <Text type="secondary">Points: 3 for Win, 1 for Draw • Sorted by Points, Goal Difference, Goals For, Wins</Text>
      </div>

      <Table
        dataSource={standingsData}
        columns={standingsColumns}
        rowKey="id"
        pagination={false}
        size="small"
        scroll={{ x: 'max-content' }}
        className="standings-table"
        rowClassName={(record) => {
          if (record.position === 1) return 'standings-first border-l-4 border-yellow-400 dark:border-yellow-300';
          if (record.position === 2) return 'standings-second border-l-4 border-gray-400 dark:border-gray-300';
          if (record.position === 3) return 'standings-third border-l-4 border-orange-400 dark:border-orange-300';
          return '';
        }}
      />

      <div className="mt-4 text-xs text-gray-500">
        <div className="flex flex-wrap gap-4">
          <span>
            <strong>P:</strong> Played
          </span>
          <span>
            <strong>W:</strong> Won
          </span>
          <span>
            <strong>D:</strong> Draw
          </span>
          <span>
            <strong>L:</strong> Lost
          </span>
          <span>
            <strong>GF:</strong> Goals For
          </span>
          <span>
            <strong>GA:</strong> Goals Against
          </span>
          <span>
            <strong>GD:</strong> Goal Difference
          </span>
          <span>
            <strong>Pts:</strong> Points
          </span>
        </div>
      </div>
    </Card>
  );
};

export default memo(MatchSessionStandings);
