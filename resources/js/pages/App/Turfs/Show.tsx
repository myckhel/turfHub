import {
  CalendarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CrownOutlined,
  DollarOutlined,
  EditOutlined,
  EnvironmentOutlined,
  LogoutOutlined,
  TeamOutlined,
  UserAddOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { router } from '@inertiajs/react';
import { Avatar, Descriptions, Divider, message, Tabs, Tag, Typography } from 'antd';
import React, { useState } from 'react';

import { turfApi } from '@/apis/turf';
import { MatchSessionList } from '../../../components/MatchSessions';
import { BettingAnalytics } from '../../../components/betting';
import { Button, Card } from '../../../components/ui';
import { BankAccountList, TransactionHistory, WalletOverview } from '../../../components/wallet';
import TurfWalletBalanceDisplay from '../../../components/wallet/TurfWalletBalanceDisplay';
import { useAuth } from '../../../hooks/useAuth';
import { usePermissions } from '../../../hooks/usePermissions';
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
  const { canManageTurfPayments, turfPermissions } = usePermissions();

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const isMember = belongingTurfs.some((t) => t.id === turf.id);
  const isSelected = selectedTurf?.id === turf.id;
  const isOwner = turf.owner_id === user?.id;

  // Authorization checks: components requiring selected turf context
  const isViewingSelectedTurf = selectedTurf?.id === turf.id;
  const canViewTurfWallet = isViewingSelectedTurf && (isOwner || turfPermissions.isOwner || canManageTurfPayments());
  const canManageBetting = isViewingSelectedTurf && isOwner;
  const canCreateMatchSessions = isViewingSelectedTurf && (isOwner || turfPermissions.canManageSessions);

  const handleJoinTurf = async () => {
    if (!user) {
      message.error('Please login to join this turf');
      return;
    }

    setLoading(true);
    try {
      await turfApi.join(turf.id, {
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
    <div className="space-y-4 sm:space-y-6">
      {/* Basic Info */}
      <Card title="Turf Information">
        <Descriptions column={1} labelStyle={{ fontWeight: 'bold' }} size="small">
          <Descriptions.Item label="Name">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm sm:text-base">{turf.name}</span>
              {isOwner && <CrownOutlined className="text-yellow-500" />}
              {isSelected && <CheckCircleOutlined className="text-green-500" />}
            </div>
          </Descriptions.Item>
          <Descriptions.Item label="Location">
            <div className="flex items-center">
              <EnvironmentOutlined className="mr-2" />
              <span className="text-sm sm:text-base">{turf.location}</span>
            </div>
          </Descriptions.Item>
          <Descriptions.Item label="Owner">
            <div className="flex items-center">
              <UserOutlined className="mr-2" />
              <span className="text-sm sm:text-base">{turf.owner?.name || 'Unknown'}</span>
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
              <span className="text-sm sm:text-base">{turf.max_players_per_team} players</span>
            </div>
          </Descriptions.Item>
        </Descriptions>

        {turf.description && (
          <>
            <Divider />
            <div>
              <Text strong className="text-sm sm:text-base">
                Description:
              </Text>
              <Paragraph className="mt-2 text-sm sm:text-base">{turf.description}</Paragraph>
            </div>
          </>
        )}
      </Card>

      {/* Membership Info */}
      {turf.requires_membership && (
        <Card title="Membership Information">
          <Descriptions column={1} size="small">
            <Descriptions.Item label="Membership Required">
              <Tag color="blue">Yes</Tag>
            </Descriptions.Item>
            {turf.membership_fee && (
              <Descriptions.Item label="Membership Fee">
                <div className="flex flex-wrap items-center gap-2">
                  <DollarOutlined />
                  <span className="text-sm sm:text-base">₦{turf.membership_fee}</span>
                  {turf.membership_type && <span className="text-xs text-gray-500 sm:text-sm">({turf.membership_type})</span>}
                </div>
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>
      )}

      {/* Team Slot Fee Information */}
      {turf.team_slot_fee && turf.team_slot_fee > 0 && (
        <Card title="Team Slot Fee">
          <Descriptions column={1}>
            <Descriptions.Item label="Fee per Team Slot">
              <div className="flex items-center">
                <DollarOutlined className="mr-2" />₦{turf.team_slot_fee}
                <span className="ml-2 text-gray-500">per player when joining a team</span>
              </div>
            </Descriptions.Item>
          </Descriptions>
          <div className="mt-3 rounded border border-blue-200 bg-blue-50 p-3">
            <Text className="text-sm text-blue-800">
              <strong>Note:</strong> This fee is charged when you join a team in match sessions that require payment.
            </Text>
          </div>
        </Card>
      )}

      {/* Active Sessions */}
      {turf.active_match_sessions && turf.active_match_sessions.length > 0 && (
        <Card title="Active Match Sessions">
          <div className="space-y-3">
            {turf.active_match_sessions.map((session) => (
              <Card
                key={session.id}
                size="small"
                className="cursor-pointer border-green-200 bg-green-50 transition-all hover:border-green-300 hover:bg-green-100 hover:shadow-md"
                onClick={() => router.visit(route('web.turfs.match-sessions.show', { matchSession: session.id, turf: turf.id }))}
              >
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
    <>
      {turf.players && turf.players.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {turf.players.map((player) => (
            <Card key={player.id} size="small" className="player-card">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar icon={<UserOutlined />} />
                  <div className="ml-2">
                    <Text strong>{player.user.name}</Text>
                  </div>
                </div>
                <div className="flex flex-row items-end space-y-1">
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
    </>
  );

  const renderMatchSessionsTab = () => (
    <div className="space-y-6">
      <MatchSessionList turfId={turf.id} showCreateButton={canCreateMatchSessions} maxHeight={500} />
    </div>
  );

  const renderWalletTab = () => {
    if (!canViewTurfWallet) {
      return (
        <div className="py-12 text-center">
          <Typography.Text type="secondary">
            {!isViewingSelectedTurf
              ? 'You need to select this turf as your current turf to view wallet information.'
              : 'You do not have permission to view wallet information for this turf.'}
          </Typography.Text>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Wallet Overview */}
        <WalletOverview turfId={turf.id} showActions={canViewTurfWallet} compact={false} />

        {/* Bank Accounts for turf wallet withdrawals */}
        {canViewTurfWallet && <BankAccountList turfId={turf.id} showActions={true} compact={false} />}

        {/* Transaction History */}
        <TransactionHistory turfId={turf.id} showFilters={true} compact={false} initialLimit={20} />
      </div>
    );
  };

  const renderBettingTab = () => {
    if (!canManageBetting) {
      return (
        <div className="py-12 text-center">
          <Typography.Text type="secondary">You need to be the owner of this turf and have it selected to view betting analytics.</Typography.Text>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Betting Analytics Overview */}
        <BettingAnalytics turfId={turf.id} />

        {/* Note: Betting markets are now managed directly from individual game matches */}
        <Card variant="outlined" className="py-8 text-center">
          <Typography.Title level={4} className="mb-2">
            Betting Market Management
          </Typography.Title>
          <Typography.Text type="secondary" className="mb-4 block">
            Betting markets are now managed directly from individual game matches.
          </Typography.Text>
          <Typography.Text type="secondary" className="text-sm">
            Go to Match Sessions → View a session → Enable betting on upcoming matches → Manage markets
          </Typography.Text>
        </Card>
      </div>
    );
  };

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-3 py-4 sm:px-4 sm:py-6">
        {/* Header Card */}
        <Card variant="hero" className="mb-4 sm:mb-6">
          <div className="p-4 sm:p-6">
            <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex-1">
                <Title level={1} className="mb-2 text-xl text-white sm:text-2xl lg:text-3xl">
                  {turf.name}
                  {isOwner && <CrownOutlined className="ml-2 text-yellow-400" />}
                </Title>
                <div className="mb-3 flex flex-col space-y-2 text-sm text-black sm:flex-row sm:space-y-0 sm:space-x-4 sm:text-base">
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
              <div className="shrink-0">
                {/* Turf Wallet Balance - Only for admins/owners */}
                {canViewTurfWallet && (
                  <div className="mb-3">
                    <TurfWalletBalanceDisplay turfId={turf.id} turfName={turf.name} showToggle={true} compact={false} />
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
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
                    <Tag color="blue">
                      <CheckCircleOutlined className="mr-1" />
                      Current Turf
                    </Tag>
                  )}
                </div>
              </div>
            </div>

            {turf.description && <Paragraph className="mb-4 text-sm text-gray-200 sm:text-lg">{turf.description}</Paragraph>}

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
              {isOwner ? (
                <Button
                  variant="primary"
                  size="large"
                  icon={<EditOutlined />}
                  onClick={() => router.visit(route('web.turfs.edit', { turf: turf.id }))}
                  className="w-full sm:w-auto"
                >
                  Edit Turf
                </Button>
              ) : (
                <>
                  {isMember ? (
                    <>
                      <Button
                        variant={isSelected ? 'secondary' : 'primary'}
                        size="large"
                        icon={isSelected ? <CloseCircleOutlined /> : <CheckCircleOutlined />}
                        onClick={handleSelectTurf}
                        className="w-full sm:w-auto"
                      >
                        <span className="hidden sm:inline">{isSelected ? 'Deselect Turf' : 'Select as Current'}</span>
                        <span className="sm:hidden">{isSelected ? 'Deselect' : 'Select'}</span>
                      </Button>
                      <Button danger size="large" icon={<LogoutOutlined />} loading={loading} onClick={handleLeaveTurf} className="w-full sm:w-auto">
                        <span className="hidden sm:inline">Leave Turf</span>
                        <span className="sm:hidden">Leave</span>
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="primary"
                      size="large"
                      icon={<UserAddOutlined />}
                      loading={loading}
                      onClick={handleJoinTurf}
                      disabled={!turf.is_active}
                      className="w-full sm:w-auto"
                    >
                      <span className="hidden sm:inline">Join Turf</span>
                      <span className="sm:hidden">Join</span>
                      {turf.requires_membership && turf.membership_fee && <span className="ml-2">(₦{turf.membership_fee})</span>}
                    </Button>
                  )}
                </>
              )}

              <Button variant="secondary" size="large" onClick={() => router.visit(route('web.turfs.index'))} className="w-full sm:w-auto">
                <span className="hidden sm:inline">Back to Turfs</span>
                <span className="sm:hidden">Back</span>
              </Button>
            </div>
          </div>
        </Card>

        {/* Content Tabs */}
        <Card>
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            size="small"
            items={[
              {
                key: 'overview',
                label: 'Overview',
                children: renderOverviewTab(),
              },
              {
                key: 'players',
                label: (
                  <>
                    <span className="hidden sm:inline">Players ({turf.players?.length || 0})</span>
                    <span className="sm:hidden">Players</span>
                  </>
                ),
                children: renderPlayersTab(),
              },
              {
                key: 'match-sessions',
                label: (
                  <>
                    <span className="hidden sm:inline">Match Sessions</span>
                    <span className="sm:hidden">Sessions</span>
                  </>
                ),
                children: renderMatchSessionsTab(),
              },
              ...(isOwner || turfPermissions.isOwner || canManageTurfPayments()
                ? [
                    {
                      key: 'wallet',
                      label: (
                        <>
                          <span className="hidden sm:inline">Wallet</span>
                          <span className="sm:hidden">Wallet</span>
                        </>
                      ),
                      children: renderWalletTab(),
                    },
                  ]
                : []),
              ...(canManageBetting
                ? [
                    {
                      key: 'betting',
                      label: (
                        <>
                          <span className="hidden sm:inline">Betting</span>
                          <span className="sm:hidden">Betting</span>
                        </>
                      ),
                      children: renderBettingTab(),
                    },
                  ]
                : []),
            ]}
          />
        </Card>
      </div>
    </div>
  );
};

export default TurfDetail;
