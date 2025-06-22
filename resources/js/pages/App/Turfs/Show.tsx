import {
  CalendarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CrownOutlined,
  DollarOutlined,
  EnvironmentOutlined,
  LogoutOutlined,
  TeamOutlined,
  UserAddOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { router } from '@inertiajs/react';
import { Avatar, Button, Card, Descriptions, Divider, message, Space, Tabs, Tag, Typography } from 'antd';
import React, { useState } from 'react';

import { turfApi } from '@/apis/turf';
import { TurfCard } from '../../../components/ui/TurfCard';
import { useAuth } from '../../../hooks/useAuth';
import { useTurfStore } from '../../../stores/turf.store';
import type { Turf } from '../../../types/turf.types';

const { Title, Text, Paragraph } = Typography;

interface TurfDetailProps {
  turf: Turf & {
    players?: Array<{
      id: number;
      user: {
        id: number;
        name: string;
        email: string;
      };
      is_member: boolean;
      status: string;
    }>;
    active_match_sessions?: Array<{
      id: number;
      name: string;
      session_date: string;
      time_slot: string;
      status: string;
    }>;
  };
}

const TurfDetail: React.FC<TurfDetailProps> = ({ turf }) => {
  const { user } = useAuth();
  const { selectedTurf, setSelectedTurf, belongingTurfs, fetchBelongingTurfs } = useTurfStore();

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const isMember = belongingTurfs.some((t) => t.id === turf.id);
  const isSelected = selectedTurf?.id === turf.id;
  const isOwner = turf.owner_id === user?.id;

  const handleJoinTurf = async () => {
    if (!user) {
      message.error('Please login to join this turf');
      return;
    }

    setLoading(true);
    try {
      const response = await turfApi.join(turf.id, {
        is_member: turf.requires_membership,
      });

      message.success(`Successfully joined ${turf.name}!`);

      // Refresh belonging turfs
      await fetchBelongingTurfs(user.id);

      // Set as selected turf and reload page to show updated data
      setSelectedTurf(turf);
      router.reload();
    } catch (error) {
      console.error('Join turf failed:', error);
      message.error(error instanceof Error ? error.message : 'Failed to join turf');
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveTurf = async () => {
    if (!user) return;

    setLoading(true);
    try {
      await turfApi.leave(turf.id);

      message.success(`Successfully left ${turf.name}`);

      // Refresh belonging turfs
      await fetchBelongingTurfs(user.id);

      // If this was the selected turf, unselect it
      if (isSelected) {
        setSelectedTurf(null);
      }

      // Reload page to show updated data
      router.reload();
    } catch (error) {
      console.error('Leave turf failed:', error);
      message.error(error instanceof Error ? error.message : 'Failed to leave turf');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTurf = () => {
    if (isSelected) {
      setSelectedTurf(null);
      message.info(`Deselected ${turf.name}`);
    } else {
      setSelectedTurf(turf);
      message.success(`Selected ${turf.name} as your current turf`);
    }
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Basic Info */}
      <Card title="Turf Information">
        <Descriptions column={1} labelStyle={{ fontWeight: 'bold' }}>
          <Descriptions.Item label="Name">
            <div className="flex items-center">
              {turf.name}
              {isOwner && <CrownOutlined className="ml-2 text-yellow-500" />}
              {isSelected && <CheckCircleOutlined className="ml-2 text-green-500" />}
            </div>
          </Descriptions.Item>
          <Descriptions.Item label="Location">
            <div className="flex items-center">
              <EnvironmentOutlined className="mr-2" />
              {turf.location}
            </div>
          </Descriptions.Item>
          <Descriptions.Item label="Owner">
            <div className="flex items-center">
              <UserOutlined className="mr-2" />
              {turf.owner?.name || 'Unknown'}
            </div>
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            {turf.is_active ? (
              <Tag color="green" icon={<CheckCircleOutlined />}>
                Active
              </Tag>
            ) : (
              <Tag color="red" icon={<CloseCircleOutlined />}>
                Inactive
              </Tag>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="Max Players per Team">
            <div className="flex items-center">
              <TeamOutlined className="mr-2" />
              {turf.max_players_per_team} players
            </div>
          </Descriptions.Item>
        </Descriptions>

        {turf.description && (
          <>
            <Divider />
            <div>
              <Text strong>Description:</Text>
              <Paragraph className="mt-2">{turf.description}</Paragraph>
            </div>
          </>
        )}
      </Card>

      {/* Membership Info */}
      {turf.requires_membership && (
        <Card title="Membership Information">
          <Descriptions column={1}>
            <Descriptions.Item label="Membership Required">
              <Tag color="blue">Yes</Tag>
            </Descriptions.Item>
            {turf.membership_fee && (
              <Descriptions.Item label="Membership Fee">
                <div className="flex items-center">
                  <DollarOutlined className="mr-2" />₦{turf.membership_fee}
                  {turf.membership_type && <span className="ml-2 text-gray-500">({turf.membership_type})</span>}
                </div>
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>
      )}

      {/* Active Sessions */}
      {turf.active_match_sessions && turf.active_match_sessions.length > 0 && (
        <Card title="Active Match Sessions">
          <div className="space-y-3">
            {turf.active_match_sessions.map((session) => (
              <Card key={session.id} size="small" className="border-green-200 bg-green-50">
                <div className="flex items-center justify-between">
                  <div>
                    <Text strong>{session.name}</Text>
                    <br />
                    <Text type="secondary">
                      <CalendarOutlined className="mr-1" />
                      {new Date(session.session_date).toLocaleDateString()} - {session.time_slot}
                    </Text>
                  </div>
                  <Tag color="green">{session.status}</Tag>
                </div>
              </Card>
            ))}
          </div>
        </Card>
      )}
    </div>
  );

  const renderPlayersTab = () => (
    <Card title={`Players (${turf.players?.length || 0})`}>
      {turf.players && turf.players.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {turf.players.map((player) => (
            <Card key={player.id} size="small" className="player-card">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar icon={<UserOutlined />} />
                  <div>
                    <Text strong>{player.user.name}</Text>
                    <br />
                    <Text type="secondary" className="text-sm">
                      {player.user.email}
                    </Text>
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-1">
                  {player.is_member && <Tag color="gold">Member</Tag>}
                  <Tag color={player.status === 'active' ? 'green' : 'default'}>{player.status}</Tag>
                  {player.user.id === user?.id && <Tag color="blue">You</Tag>}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="py-8 text-center">
          <UserOutlined className="mb-4 text-4xl text-gray-400" />
          <Text type="secondary">No players have joined this turf yet</Text>
        </div>
      )}
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-green-900">
      <div className="container mx-auto px-4 py-6">
        {/* Header Card */}
        <TurfCard variant="hero" className="mb-6">
          <div className="p-6">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <Title level={1} className="mb-2 text-white">
                  {turf.name}
                  {isOwner && <CrownOutlined className="ml-3 text-yellow-400" />}
                </Title>
                <div className="flex items-center space-x-4 text-gray-300">
                  <div className="flex items-center">
                    <EnvironmentOutlined className="mr-2" />
                    {turf.location}
                  </div>
                  <div className="flex items-center">
                    <UserOutlined className="mr-2" />
                    Owner: {turf.owner?.name || 'Unknown'}
                  </div>
                </div>
              </div>
              <div className="text-right">
                {turf.is_active ? (
                  <Tag color="green" className="mb-2">
                    <CheckCircleOutlined className="mr-1" />
                    Active
                  </Tag>
                ) : (
                  <Tag color="red" className="mb-2">
                    <CloseCircleOutlined className="mr-1" />
                    Inactive
                  </Tag>
                )}
                {isSelected && (
                  <div>
                    <Tag color="blue">
                      <CheckCircleOutlined className="mr-1" />
                      Current Turf
                    </Tag>
                  </div>
                )}
              </div>
            </div>

            {turf.description && <Paragraph className="mb-4 text-lg text-gray-200">{turf.description}</Paragraph>}

            {/* Action Buttons */}
            <Space wrap>
              {!isOwner && (
                <>
                  {isMember ? (
                    <>
                      <Button
                        type={isSelected ? 'default' : 'primary'}
                        size="large"
                        icon={isSelected ? <CloseCircleOutlined /> : <CheckCircleOutlined />}
                        onClick={handleSelectTurf}
                      >
                        {isSelected ? 'Deselect Turf' : 'Select as Current'}
                      </Button>
                      <Button danger size="large" icon={<LogoutOutlined />} loading={loading} onClick={handleLeaveTurf}>
                        Leave Turf
                      </Button>
                    </>
                  ) : (
                    <Button
                      type="primary"
                      size="large"
                      icon={<UserAddOutlined />}
                      loading={loading}
                      onClick={handleJoinTurf}
                      disabled={!turf.is_active}
                    >
                      Join Turf
                      {turf.requires_membership && turf.membership_fee && <span className="ml-2">(₦{turf.membership_fee})</span>}
                    </Button>
                  )}
                </>
              )}

              <Button size="large" onClick={() => router.visit(route('web.turfs.index'))}>
                Back to Turfs
              </Button>
            </Space>
          </div>
        </TurfCard>

        {/* Content Tabs */}
        <Card>
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              {
                key: 'overview',
                label: 'Overview',
                children: renderOverviewTab(),
              },
              {
                key: 'players',
                label: `Players (${turf.players?.length || 0})`,
                children: renderPlayersTab(),
              },
            ]}
          />
        </Card>
      </div>
    </div>
  );
};

export default TurfDetail;
