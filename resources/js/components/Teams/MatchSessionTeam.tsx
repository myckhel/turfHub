import { TeamOutlined, UserAddOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Col, Row, Space, Spin, Tag, Typography, message } from 'antd';
import React, { memo, useCallback, useEffect, useState } from 'react';
import { teamApi } from '../../apis/team';
import type { AvailableTeamSlotsResponse, TeamDetails } from '../../types/team.types';
import JoinTeamPaymentModal from './JoinTeamPaymentModal';

const { Text } = Typography;

interface PlayerTeamFlowProps {
  matchSessionId: number;
}

const MatchSessionTeam: React.FC<PlayerTeamFlowProps> = memo(({ matchSessionId }) => {
  const [loading, setLoading] = useState(true);
  const [availableSlots, setAvailableSlots] = useState<AvailableTeamSlotsResponse | null>(null);
  const [joinModalVisible, setJoinModalVisible] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<TeamDetails | null>(null);

  const loadAvailableSlots = useCallback(async () => {
    setLoading(true);
    try {
      const response = await teamApi.getAvailableSlots(matchSessionId);
      setAvailableSlots(response.data);
    } catch (error) {
      console.error('Failed to load available slots:', error);
      message.error('Failed to load available team slots');
    } finally {
      setLoading(false);
    }
  }, [matchSessionId]);

  useEffect(() => {
    loadAvailableSlots();
  }, [loadAvailableSlots]);

  const handleJoinTeam = useCallback((team: TeamDetails) => {
    setSelectedTeam(team);
    setJoinModalVisible(true);
  }, []);

  const handleJoinSuccess = useCallback(() => {
    setJoinModalVisible(false);
    setSelectedTeam(null);
    message.success('Successfully joined the team!');
    loadAvailableSlots();
  }, [loadAvailableSlots]);

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

  if (loading) {
    return (
      <Card>
        <div className="py-8 text-center">
          <Spin size="large" />
          <div className="mt-4">
            <Text>Loading available team slots...</Text>
          </div>
        </div>
      </Card>
    );
  }

  if (!availableSlots) {
    return (
      <Card>
        <div className="py-8 text-center">
          <Text type="secondary">Unable to load team slots</Text>
        </div>
      </Card>
    );
  }

  const { teams, total_slots, available_slots, slot_fee } = availableSlots;

  return (
    <>
      <Card
        title={
          <div className="flex items-center gap-2">
            <TeamOutlined />
            <span>Join a Team</span>
          </div>
        }
        extra={
          <Space>
            <Tag color="blue">
              Available Slots: {available_slots} / {total_slots}
            </Tag>
            {slot_fee > 0 && <Tag color="green">💰 ₦{availableSlots.slot_fee.toLocaleString()} per slot</Tag>}
          </Space>
        }
      >
        {available_slots === 0 ? (
          <Alert
            message="No Available Slots"
            description="All team slots are currently full. Please check back later or contact the turf manager."
            type="warning"
            showIcon
          />
        ) : (
          <div className="space-y-4">
            {slot_fee > 0 && (
              <Alert
                message="Payment Required"
                description={`A slot fee of ₦${availableSlots.slot_fee.toLocaleString()} is required to join a team. Payment can be made via Paystack or your wallet balance.`}
                type="info"
                showIcon
                style={{ marginBottom: '1rem' }}
              />
            )}

            <Row gutter={[16, 16]}>
              {teams.map((team) => {
                const playerCount = team.teamPlayers?.length || 0;
                const maxPlayers = availableSlots.max_players_per_team;
                const isTeamFull = playerCount >= maxPlayers;
                const slotsLeft = maxPlayers - playerCount;

                return (
                  <Col key={team.id} xs={24} sm={12} lg={8}>
                    <Card
                      size="small"
                      className={`h-full ${isTeamFull ? 'opacity-60' : 'hover:shadow-md'}`}
                      actions={[
                        <Button key="join" type="primary" icon={<UserAddOutlined />} disabled={isTeamFull} onClick={() => handleJoinTeam(team)}>
                          Join Team
                        </Button>,
                      ]}
                    >
                      <Card.Meta
                        title={
                          <Space>
                            <span>{team.name}</span>
                            <Tag color={getTeamStatusColor(team.status)}>{team.status.replace('_', ' ').toUpperCase()}</Tag>
                          </Space>
                        }
                        description={
                          <div className="space-y-2">
                            <div>
                              <Text type="secondary">
                                Players: {playerCount} / {maxPlayers}
                              </Text>
                              {!isTeamFull && (
                                <Text type="success" className="ml-2">
                                  ({slotsLeft} slots available)
                                </Text>
                              )}
                            </div>

                            {team.captain && (
                              <div>
                                <Text type="secondary" className="text-xs">
                                  Captain: {team.captain.name}
                                </Text>
                              </div>
                            )}

                            <div className="flex gap-2 text-xs">
                              <span>W: {team.wins}</span>
                              <span>L: {team.losses}</span>
                              <span>D: {team.draws}</span>
                            </div>
                          </div>
                        }
                      />
                    </Card>
                  </Col>
                );
              })}
            </Row>
          </div>
        )}
      </Card>

      {/* Join Team Payment Modal */}
      {selectedTeam && (
        <JoinTeamPaymentModal
          open={joinModalVisible}
          onCancel={() => {
            setJoinModalVisible(false);
            setSelectedTeam(null);
          }}
          onSuccess={handleJoinSuccess}
          team={selectedTeam}
          slotFee={availableSlots?.slot_fee || 0}
          title={`Join ${selectedTeam.name}`}
          description={`Join ${selectedTeam.name} and start playing!`}
        />
      )}
    </>
  );
});

MatchSessionTeam.displayName = 'MatchSessionTeam';

export default MatchSessionTeam;
