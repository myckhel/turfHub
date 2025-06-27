import { CreditCardOutlined, MoneyCollectOutlined, TeamOutlined, UserAddOutlined, WalletOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Col, Divider, List, Modal, Radio, Row, Space, Spin, Tag, Typography, message } from 'antd';
import React, { memo, useCallback, useEffect, useState } from 'react';
import { teamApi } from '../../apis/team';
import type { AvailableTeamSlotsResponse, TeamDetails } from '../../types/team.types';

const { Title, Text } = Typography;

interface PlayerTeamFlowProps {
  matchSessionId: number;
  onJoinSuccess?: () => void;
}

const PlayerTeamFlow: React.FC<PlayerTeamFlowProps> = memo(({ matchSessionId, onJoinSuccess }) => {
  const [loading, setLoading] = useState(true);
  const [availableSlots, setAvailableSlots] = useState<AvailableTeamSlotsResponse | null>(null);
  const [joinModalVisible, setJoinModalVisible] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<TeamDetails | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'paystack' | 'wallet'>('paystack');
  const [joinLoading, setJoinLoading] = useState(false);

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

  const handleConfirmJoin = useCallback(async () => {
    if (!selectedTeam) return;

    setJoinLoading(true);

    try {
      // First join the team slot
      await teamApi.joinSlot({ team_id: selectedTeam.id });

      // If there's a slot fee, process payment
      if (availableSlots && availableSlots.slot_fee > 0) {
        const paymentResponse = await teamApi.processSlotPayment({
          team_id: selectedTeam.id,
          position: 1, // Auto-assign position
          payment_method: paymentMethod,
          redirect_url: window.location.href,
        });

        if (paymentResponse.data.payment_url) {
          // Redirect to payment gateway
          window.location.href = paymentResponse.data.payment_url;
          return;
        }
      }

      message.success('Successfully joined team!');
      setJoinModalVisible(false);
      setSelectedTeam(null);
      onJoinSuccess?.();
      await loadAvailableSlots();
    } catch (error) {
      console.error('Failed to join team:', error);
      message.error('Failed to join team. Please try again.');
    } finally {
      setJoinLoading(false);
    }
  }, [selectedTeam, paymentMethod, availableSlots, onJoinSuccess, loadAvailableSlots]);

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
            {slot_fee > 0 && (
              <Tag color="green">
                <MoneyCollectOutlined /> ₦{slot_fee.toLocaleString()} per slot
              </Tag>
            )}
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
                description={`A slot fee of ₦${slot_fee.toLocaleString()} is required to join a team. Payment can be made via Paystack or your wallet balance.`}
                type="info"
                showIcon
              />
            )}

            <Row gutter={[16, 16]}>
              {teams.map((team) => {
                const playerCount = team.teamPlayers?.length || 0;
                const maxPlayers = 6;
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

      {/* Join Team Modal */}
      <Modal
        title={`Join ${selectedTeam?.name}`}
        open={joinModalVisible}
        onOk={handleConfirmJoin}
        onCancel={() => {
          setJoinModalVisible(false);
          setSelectedTeam(null);
        }}
        confirmLoading={joinLoading}
        okText={slot_fee > 0 ? `Pay ₦${slot_fee.toLocaleString()} & Join` : 'Join Team'}
        width={600}
      >
        {selectedTeam && (
          <div className="space-y-6">
            {/* Team Info */}
            <div className="rounded bg-gray-50 p-4">
              <Title level={5} className="mb-2">
                Team Details
              </Title>
              <div className="space-y-1">
                <div>
                  <strong>Team:</strong> {selectedTeam.name}
                </div>
                <div>
                  <strong>Current Players:</strong> {selectedTeam.teamPlayers?.length || 0} / 6
                </div>
                <div>
                  <strong>Status:</strong>
                  <Tag color={getTeamStatusColor(selectedTeam.status)} className="ml-2">
                    {selectedTeam.status.replace('_', ' ').toUpperCase()}
                  </Tag>
                </div>
                {selectedTeam.captain && (
                  <div>
                    <strong>Captain:</strong> {selectedTeam.captain.name}
                  </div>
                )}
              </div>
            </div>

            {/* Current Team Members */}
            {selectedTeam.teamPlayers && selectedTeam.teamPlayers.length > 0 && (
              <div>
                <Title level={5} className="mb-2">
                  Current Team Members
                </Title>
                <List
                  size="small"
                  dataSource={selectedTeam.teamPlayers}
                  renderItem={(player) => (
                    <List.Item>
                      <List.Item.Meta
                        title={
                          <div className="flex items-center gap-2">
                            <span>{player.player.user.name}</span>
                            {player.player.id === selectedTeam.captain?.id && <Tag color="gold">Captain</Tag>}
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              </div>
            )}

            {/* Payment Method Selection */}
            {slot_fee > 0 && (
              <>
                <Divider />
                <div>
                  <Title level={5} className="mb-3">
                    Payment Method
                  </Title>
                  <Alert
                    message={`Slot Fee: ₦${slot_fee.toLocaleString()}`}
                    description="This fee is required to secure your slot in the team."
                    type="info"
                    className="mb-4"
                  />

                  <Radio.Group value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full">
                    <Space direction="vertical" className="w-full">
                      <Radio value="paystack" className="w-full">
                        <div className="flex items-center gap-2">
                          <CreditCardOutlined className="text-blue-500" />
                          <div>
                            <div className="font-medium">Card Payment (Paystack)</div>
                            <div className="text-xs text-gray-500">Pay securely with your debit/credit card</div>
                          </div>
                        </div>
                      </Radio>
                      <Radio value="wallet" className="w-full">
                        <div className="flex items-center gap-2">
                          <WalletOutlined className="text-green-500" />
                          <div>
                            <div className="font-medium">Wallet Balance</div>
                            <div className="text-xs text-gray-500">Use your wallet balance (if available)</div>
                          </div>
                        </div>
                      </Radio>
                    </Space>
                  </Radio.Group>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>
    </>
  );
});

PlayerTeamFlow.displayName = 'PlayerTeamFlow';

export default PlayerTeamFlow;
