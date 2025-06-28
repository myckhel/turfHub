import { CrownOutlined, PlusOutlined, TeamOutlined, TrophyOutlined, UserAddOutlined, UserDeleteOutlined, UserOutlined } from '@ant-design/icons';
import { Avatar, Button, Card, Col, Descriptions, List, Modal, Row, Space, Tag, Typography, message } from 'antd';
import React, { memo, useCallback, useState } from 'react';
import { teamApi } from '../../apis/team';
import { usePermissions } from '../../hooks/usePermissions';
import type { MatchSession } from '../../types/matchSession.types';
import type { TeamDetails, TeamPlayer } from '../../types/team.types';
import type { Turf } from '../../types/turf.types';
import AddPlayerModal from './AddPlayerModal';

const { Title, Text } = Typography;

interface TeamDetailsProps {
  team: TeamDetails;
  matchSession: MatchSession;
  turf: Turf;
  onUpdate?: () => void;
}

const TeamDetailsComponent: React.FC<TeamDetailsProps> = memo(({ team, matchSession, turf, onUpdate }) => {
  const permissions = usePermissions();
  const canManageTeams = permissions.canManageTeams();
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const [addPlayerModalVisible, setAddPlayerModalVisible] = useState(false);
  const [removePlayerModalVisible, setRemovePlayerModalVisible] = useState(false);
  const [playerToRemove, setPlayerToRemove] = useState<TeamPlayer | null>(null);

  const handleJoinTeam = useCallback(async () => {
    setLoading((prev) => ({ ...prev, join: true }));

    try {
      await teamApi.joinSlot({ team_id: team.id });
      message.success('Successfully joined team!');
      onUpdate?.();
    } catch (error) {
      console.error('Failed to join team:', error);
      message.error('Failed to join team. Please try again.');
    } finally {
      setLoading((prev) => ({ ...prev, join: false }));
    }
  }, [team.id, onUpdate]);

  const handleAddPlayer = useCallback(() => {
    setAddPlayerModalVisible(true);
  }, []);

  const handleAddPlayerSuccess = useCallback(() => {
    onUpdate?.();
  }, [onUpdate]);

  const handleRemovePlayer = useCallback((player: TeamPlayer) => {
    setPlayerToRemove(player);
    setRemovePlayerModalVisible(true);
  }, []);

  const handleConfirmRemovePlayer = useCallback(async () => {
    if (!playerToRemove) return;

    setLoading((prev) => ({ ...prev, 'remove-player': true }));

    try {
      await teamApi.removePlayerFromSlot(team.id, playerToRemove.player_id);
      message.success('Player removed from team successfully!');
      setRemovePlayerModalVisible(false);
      setPlayerToRemove(null);
      onUpdate?.();
    } catch (error) {
      console.error('Failed to remove player:', error);
      message.error('Failed to remove player from team');
    } finally {
      setLoading((prev) => ({ ...prev, 'remove-player': false }));
    }
  }, [team.id, playerToRemove, onUpdate]);

  const handleSetCaptain = useCallback(
    async (playerId: number) => {
      setLoading((prev) => ({ ...prev, 'set-captain': true }));

      try {
        await teamApi.setCaptain(team.id, playerId);
        message.success('Team captain updated successfully!');
        onUpdate?.();
      } catch (error) {
        console.error('Failed to set captain:', error);
        message.error('Failed to set team captain');
      } finally {
        setLoading((prev) => ({ ...prev, 'set-captain': false }));
      }
    },
    [team.id, onUpdate],
  );

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

  const playerCount = team.teamPlayers?.length || 0;
  const maxPlayers = 6;
  const isTeamFull = playerCount >= maxPlayers;
  const canJoin = !isTeamFull; // TODO: Add logic to check if current user is already in a team

  return (
    <div className="space-y-6">
      {/* Team Header */}
      <Card>
        <Row gutter={16} align="middle">
          <Col>
            <Avatar size={80} icon={<TeamOutlined />} className="bg-blue-500" />
          </Col>
          <Col flex="auto">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Title level={2} className="mb-0">
                  {team.name}
                </Title>
                <Tag color={getTeamStatusColor(team.status)}>{team.status.replace('_', ' ').toUpperCase()}</Tag>
              </div>

              {team.captain && (
                <div className="flex items-center gap-2">
                  <CrownOutlined className="text-yellow-500" />
                  <Text>
                    <strong>Captain:</strong> {team.captain.name}
                  </Text>
                </div>
              )}

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <UserOutlined />
                  <Text>
                    Players: {playerCount} / {maxPlayers}
                  </Text>
                </div>
                <div className="flex items-center gap-1">
                  <TrophyOutlined className="text-green-500" />
                  <Text>
                    W: {team.wins} • L: {team.losses} • D: {team.draws}
                  </Text>
                </div>
              </div>
            </div>
          </Col>
          <Col>
            <Space direction="vertical">
              {canJoin && (
                <Button type="primary" icon={<UserAddOutlined />} loading={loading.join} onClick={handleJoinTeam}>
                  Join Team
                </Button>
              )}

              {canManageTeams && (
                <Button icon={<PlusOutlined />} onClick={handleAddPlayer} disabled={isTeamFull}>
                  Add Player
                </Button>
              )}
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Team Stats */}
      <Card title="Team Statistics">
        <Descriptions column={3} bordered>
          <Descriptions.Item label="Total Matches">{team.wins + team.losses + team.draws}</Descriptions.Item>
          <Descriptions.Item label="Win Rate">
            {team.wins + team.losses + team.draws > 0 ? `${Math.round((team.wins / (team.wins + team.losses + team.draws)) * 100)}%` : '0%'}
          </Descriptions.Item>
          <Descriptions.Item label="Goals For/Against">
            {team.goals_for || 0} / {team.goals_against || 0}
          </Descriptions.Item>
          <Descriptions.Item label="Match Session">{matchSession.name}</Descriptions.Item>
          <Descriptions.Item label="Turf">{turf.name}</Descriptions.Item>
          <Descriptions.Item label="Session Date">{new Date(matchSession.session_date).toLocaleDateString()}</Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Team Players */}
      <Card
        title="Team Players"
        extra={
          canManageTeams &&
          !isTeamFull && (
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddPlayer}>
              Add Player
            </Button>
          )
        }
      >
        {team.teamPlayers && team.teamPlayers.length > 0 ? (
          <List
            dataSource={team.teamPlayers}
            renderItem={(player) => (
              <List.Item
                actions={[
                  ...(canManageTeams && player.player.user.id !== team.captain?.id
                    ? [
                        <Button
                          key="make-captain"
                          type="text"
                          icon={<CrownOutlined />}
                          loading={loading['set-captain']}
                          onClick={() => handleSetCaptain(player.player_id)}
                        >
                          Make Captain
                        </Button>,
                      ]
                    : []),
                  ...(canManageTeams
                    ? [
                        <Button key="remove" type="text" danger icon={<UserDeleteOutlined />} onClick={() => handleRemovePlayer(player)}>
                          Remove
                        </Button>,
                      ]
                    : []),
                ]}
              >
                <List.Item.Meta
                  avatar={<Avatar src={player.player.user.avatar}>{player.player.user.name.charAt(0).toUpperCase()}</Avatar>}
                  title={
                    <div className="flex items-center gap-2">
                      <span>{player.player.user.name}</span>
                      {player.player.user.id === team.captain?.id && (
                        <Tag color="gold" icon={<CrownOutlined />}>
                          Captain
                        </Tag>
                      )}
                    </div>
                  }
                  description={`Status: ${player.status} ${player.is_member ? '• Member' : ''}`}
                />
              </List.Item>
            )}
          />
        ) : (
          <div className="py-8 text-center">
            <Text type="secondary">No players in this team yet.</Text>
          </div>
        )}
      </Card>

      {/* Add Player Modal */}
      <AddPlayerModal
        open={addPlayerModalVisible}
        onCancel={() => setAddPlayerModalVisible(false)}
        onSuccess={handleAddPlayerSuccess}
        teamId={team.id}
        matchSessionId={matchSession.id}
        currentPlayerCount={playerCount}
        maxPlayers={maxPlayers}
      />

      {/* Remove Player Modal */}
      <Modal
        title="Remove Player"
        open={removePlayerModalVisible}
        onOk={handleConfirmRemovePlayer}
        onCancel={() => {
          setRemovePlayerModalVisible(false);
          setPlayerToRemove(null);
        }}
        confirmLoading={loading['remove-player']}
        okText="Remove"
        okButtonProps={{ danger: true }}
      >
        {playerToRemove && (
          <div className="space-y-4">
            <Text>
              Are you sure you want to remove <strong>{playerToRemove.player.user.name}</strong> from the team?
            </Text>

            {playerToRemove.player.user.id === team.captain?.id && (
              <div className="rounded border border-yellow-200 bg-yellow-50 p-3">
                <Text type="warning">⚠️ This player is the team captain. Removing them will automatically assign a new captain.</Text>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
});

TeamDetailsComponent.displayName = 'TeamDetails';

export default TeamDetailsComponent;
