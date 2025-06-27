import { CrownOutlined, PlusOutlined, TeamOutlined, TrophyOutlined, UserAddOutlined, UserOutlined } from '@ant-design/icons';
import { router } from '@inertiajs/react';
import { Avatar, Badge, Button, Card, Col, Empty, Modal, Row, Select, Space, Tag, Typography, message } from 'antd';
import React, { memo, useCallback, useState } from 'react';
import { teamApi } from '../../apis/team';
import { usePermissions } from '../../hooks/usePermissions';
import type { MatchSession } from '../../types/matchSession.types';
import { Player } from '../../types/player.types';
import type { TeamDetails } from '../../types/team.types';
import type { Turf } from '../../types/turf.types';

const { Text } = Typography;
const { Option } = Select;

interface TeamListProps {
  teams: TeamDetails[];
  matchSession: MatchSession;
  turf: Turf;
  showJoinButtons?: boolean;
  onTeamUpdate?: () => void;
}

const TeamList: React.FC<TeamListProps> = memo(({ teams, matchSession, turf, showJoinButtons = true, onTeamUpdate }) => {
  const permissions = usePermissions();
  const canManageTeams = permissions.canManageTeams();
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const [addPlayerModalVisible, setAddPlayerModalVisible] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<TeamDetails | null>(null);
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null);

  const handleJoinTeam = useCallback(
    async (teamId: number) => {
      setLoading((prev) => ({ ...prev, [`join-${teamId}`]: true }));

      try {
        await teamApi.joinSlot({ team_id: teamId });
        message.success('Successfully joined team!');
        onTeamUpdate?.();
      } catch (error) {
        console.error('Failed to join team:', error);
        message.error('Failed to join team. Please try again.');
      } finally {
        setLoading((prev) => ({ ...prev, [`join-${teamId}`]: false }));
      }
    },
    [onTeamUpdate],
  );

  const handleViewTeam = useCallback(
    (teamId: number) => {
      router.visit(
        route('web.turfs.match-sessions.teams.show', {
          turf: turf.id,
          matchSession: matchSession.id,
          team: teamId,
        }),
      );
    },
    [turf.id, matchSession.id],
  );

  const handleAddPlayer = useCallback(
    async (teamId: number) => {
      const team = teams.find((t) => t.id === teamId);
      if (!team) return;

      setSelectedTeam(team);

      try {
        const response = await teamApi.getAvailablePlayers(turf.id);
        setAvailablePlayers(response.data);
        setAddPlayerModalVisible(true);
      } catch (error) {
        console.error('Failed to load available players:', error);
        message.error('Failed to load available players');
      }
    },
    [teams, turf.id],
  );

  const handleConfirmAddPlayer = useCallback(async () => {
    if (!selectedTeam || !selectedPlayer) return;

    setLoading((prev) => ({ ...prev, 'add-player': true }));

    try {
      await teamApi.addPlayerToSlot({
        team_id: selectedTeam.id,
        player_id: selectedPlayer,
      });

      message.success('Player added to team successfully!');
      setAddPlayerModalVisible(false);
      setSelectedTeam(null);
      setSelectedPlayer(null);
      onTeamUpdate?.();
    } catch (error) {
      console.error('Failed to add player:', error);
      message.error('Failed to add player to team');
    } finally {
      setLoading((prev) => ({ ...prev, 'add-player': false }));
    }
  }, [selectedTeam, selectedPlayer, onTeamUpdate]);

  const getTeamStatusColor = (status: string) => {
    switch (status) {
      case 'playing':
        return 'green';
      case 'next_to_play':
        return 'blue';
      case 'waiting':
        return 'orange';
      case 'completed':
        return 'default';
      default:
        return 'default';
    }
  };

  const TeamCard = memo(({ team }: { team: TeamDetails }) => {
    const playerCount = team.teamPlayers?.length || 0;
    const maxPlayers = 6;
    const isTeamFull = playerCount >= maxPlayers;

    // Collect action buttons in an array
    const actions: React.ReactNode[] = [
      <Button key="view" type="text" onClick={() => handleViewTeam(team.id)}>
        View Details
      </Button>,
      ...(showJoinButtons && !isTeamFull
        ? [
            <Button
              key="join"
              type="primary"
              icon={<UserAddOutlined />}
              loading={loading[`join-${team.id}`]}
              onClick={() => handleJoinTeam(team.id)}
              size="small"
            >
              Join Team
            </Button>,
          ]
        : []),
      ...(canManageTeams
        ? [
            <Button
              key="add"
              icon={<PlusOutlined />}
              loading={loading[`add-${team.id}`]}
              onClick={() => handleAddPlayer(team.id)}
              size="small"
              disabled={isTeamFull}
            >
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
  });

  if (!teams || teams.length === 0) {
    return (
      <Card>
        <Empty description="No teams available" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </Card>
    );
  }

  return (
    <>
      <Row gutter={[16, 16]}>
        {teams.map((team) => (
          <Col key={team.id} xs={24} sm={12} lg={8} xl={6}>
            <TeamCard team={team} />
          </Col>
        ))}
      </Row>

      {/* Add Player Modal */}
      <Modal
        title={`Add Player to ${selectedTeam?.name}`}
        open={addPlayerModalVisible}
        onOk={handleConfirmAddPlayer}
        onCancel={() => {
          setAddPlayerModalVisible(false);
          setSelectedTeam(null);
          setSelectedPlayer(null);
        }}
        confirmLoading={loading['add-player']}
        okButtonProps={{
          disabled: !selectedPlayer,
        }}
      >
        <div className="space-y-4">
          <div>
            <Text strong>Select a player to add:</Text>
            <Select
              className="mt-2 w-full"
              placeholder="Choose a player"
              value={selectedPlayer}
              onChange={setSelectedPlayer}
              showSearch
              filterOption={(input, option) => option?.children?.toString().toLowerCase().includes(input.toLowerCase()) ?? false}
            >
              {availablePlayers.map((player) => (
                <Option key={player.id} value={player.id}>
                  <div className="flex items-center gap-2">
                    <Avatar size="small" src={player.user.avatar}>
                      {player.user.name.charAt(0).toUpperCase()}
                    </Avatar>
                    <span>{player.user.name}</span>
                    <Text type="secondary">({player.user.email})</Text>
                  </div>
                </Option>
              ))}
            </Select>
          </div>

          {selectedTeam && (
            <div className="rounded bg-gray-50 p-3">
              <Text type="secondary">Current team size: {selectedTeam.teamPlayers?.length || 0} / 6 players</Text>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
});

TeamList.displayName = 'TeamList';

export default TeamList;
