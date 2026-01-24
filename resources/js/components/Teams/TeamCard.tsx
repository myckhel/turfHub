import { CrownOutlined, PlusOutlined, TeamOutlined, TrophyOutlined, UserAddOutlined, UserOutlined } from '@ant-design/icons';
import { Avatar, Badge, Button, Card, Space, Tag, Typography } from 'antd';
import React, { memo } from 'react';
import type { MatchSession } from '../../types/matchSession.types';
import type { TeamDetails } from '../../types/team.types';

const { Text } = Typography;

interface TeamCardProps {
  team: TeamDetails;
  matchSession: MatchSession;
  showJoinButtons?: boolean;
  canManageTeams?: boolean;
  onViewDetails: (teamId: number) => void;
  onJoinTeam: (teamId: number) => void;
  onAddPlayer: (teamId: number) => void;
  getTeamStatusColor: (status: string) => string;
}

const TeamCard: React.FC<TeamCardProps> = memo(
  ({ team, matchSession, showJoinButtons = true, canManageTeams = false, onViewDetails, onJoinTeam, onAddPlayer, getTeamStatusColor }) => {
    const playerCount = team.teamPlayers?.length || 0;
    const maxPlayers = matchSession.max_players_per_team;
    const isTeamFull = playerCount >= maxPlayers;

    const actions: React.ReactNode[] = [
      <Button key="view" type="text" onClick={() => onViewDetails(team.id)}>
        View Details
      </Button>,
      ...(showJoinButtons && !isTeamFull
        ? [
            <Button
              disabled={isTeamFull || matchSession.is_session_player}
              title={isTeamFull ? 'Team is full' : matchSession.is_session_player ? 'Already in a team' : 'Join Team'}
              key="join"
              type="primary"
              icon={<UserAddOutlined />}
              onClick={() => onJoinTeam(team.id)}
              size="small"
            >
              Join Team
            </Button>,
          ]
        : []),
      ...(canManageTeams
        ? [
            <Button key="add" icon={<PlusOutlined />} onClick={() => onAddPlayer(team.id)} size="small" disabled={isTeamFull}>
              Add Player
            </Button>,
          ]
        : []),
    ];

    return (
      <Card
        hoverable
        className="flex h-full flex-col justify-between rounded-xl border-0 bg-white shadow-lg dark:bg-gray-900"
        bodyStyle={{ padding: 0 }}
        actions={[
          <div key="actions" className="flex w-full flex-wrap justify-center gap-x-2 gap-y-2 border-t border-gray-100 px-2 py-2 dark:border-gray-800">
            <Space size="small" wrap>
              {actions}
            </Space>
          </div>,
        ]}
      >
        <div className="flex items-center gap-4 border-b border-gray-100 px-4 pt-4 pb-2 dark:border-gray-800">
          <Avatar size={56} icon={<TeamOutlined />} className="bg-blue-500" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Text strong className="truncate text-lg">
                {team.name}
              </Text>
              <Tag color={getTeamStatusColor(team.status)} className="text-xs font-semibold tracking-wide uppercase">
                {team.status.replace('_', ' ')}
              </Tag>
            </div>
            {team.captain && (
              <div className="mt-1 flex items-center gap-2">
                <CrownOutlined className="text-yellow-500" />
                <Text type="secondary" className="truncate">
                  Captain: {team.captain.name}
                </Text>
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-2 px-4 py-2">
          <div className="flex items-center gap-3">
            <UserOutlined />
            <Text type="secondary">
              Players: {playerCount} / {maxPlayers}
              {isTeamFull && <Badge status="success" text="Full" className="ml-2" />}
            </Text>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <TrophyOutlined className="text-green-500" />
              <Text type="secondary">W: {team.wins}</Text>
            </div>
            <div className="flex items-center gap-1">
              <Text type="secondary">L: {team.losses}</Text>
            </div>
            <div className="flex items-center gap-1">
              <Text type="secondary">D: {team.draws}</Text>
            </div>
          </div>
          {team.teamPlayers && team.teamPlayers.length > 0 && (
            <div className="mt-1">
              <Text type="secondary" className="text-xs">
                Players:
              </Text>
              <div className="mt-1 flex max-h-16 flex-wrap gap-1 overflow-y-auto pr-1">
                {team.teamPlayers.map((player) => (
                  <Tag
                    key={player.id}
                    icon={player.player.user.id === team.captain?.id ? <CrownOutlined /> : undefined}
                    color={player.player.user.id === team.captain?.id ? 'gold' : 'default'}
                  >
                    {player.player.user.name}
                  </Tag>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>
    );
  },
);

TeamCard.displayName = 'TeamCard';

export default TeamCard;
