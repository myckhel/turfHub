import { playerApi } from '@/apis/player';
import RoleBadge from '@/components/features/players/RoleBadge';
import RoleManager from '@/components/features/players/RoleManager';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { useTurfStore } from '@/stores/turf.store';
import { SearchOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons';
import { Head } from '@inertiajs/react';
import { App, Avatar, Card, Col, Empty, Input, Row, Select, Space, Table, Typography } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import { Player, PlayerRole } from '../../../../types/player.types';

const { Title, Text } = Typography;
const { Search } = Input;

const PlayersIndex = () => {
  const { message } = App.useApp();
  const { user } = useAuth();
  const { selectedTurf } = useTurfStore();
  const { isTurfAdmin, isTurfAdministrator } = usePermissions();
  const turfId = selectedTurf?.id;

  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<PlayerRole | 'all'>('all');

  const isAdmin = isTurfAdmin() || isTurfAdministrator();

  // Fetch players
  const fetchPlayers = useCallback(async () => {
    if (!turfId) return;

    setLoading(true);
    try {
      const params = {
        search: searchTerm || undefined,
        role: roleFilter !== 'all' ? roleFilter : undefined,
      };
      const response = await playerApi.getByTurf(turfId, params);

      setPlayers(response.data);
    } catch (error) {
      console.log(error);
      const err = error as { response?: { data?: { message?: string } } };
      message.error(err.response?.data?.message || 'Failed to load players');
    } finally {
      setLoading(false);
    }
  }, [turfId, searchTerm, roleFilter, message]);

  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);

  const handleRoleUpdated = useCallback((updatedPlayer: Player) => {
    setPlayers((prev) => prev.map((p) => (p.id === updatedPlayer.id ? updatedPlayer : p)));
  }, []);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  // Table columns
  const columns = [
    {
      title: 'Player',
      key: 'player',
      render: (_: unknown, record: Player) => (
        <Space>
          <Avatar size="large" src={record.avatar} icon={<UserOutlined />} />
          <div>
            <div className="font-medium">{record.user?.name || 'Unknown'}</div>
            <Text type="secondary" className="text-xs">
              {record.user?.email}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Role',
      key: 'role',
      width: 120,
      render: (_: unknown, record: Player) => <RoleBadge role={record.role} />,
      filters: [
        { text: 'Admin', value: 'admin' },
        { text: 'Manager', value: 'manager' },
        { text: 'Player', value: 'player' },
      ],
      onFilter: (value: boolean | React.Key, record: Player) => record.role === String(value),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => <span className={`capitalize ${status === 'active' ? 'text-green-500' : 'text-gray-400'}`}>{status}</span>,
    },
    {
      title: 'Member',
      dataIndex: 'is_member',
      key: 'is_member',
      width: 100,
      render: (isMember: boolean) => <span className={isMember ? 'text-green-500' : 'text-gray-400'}>{isMember ? 'Yes' : 'No'}</span>,
    },
    {
      title: 'Manage Role',
      key: 'actions',
      width: 180,
      render: (_: unknown, record: Player) =>
        isAdmin && record.user_id !== user?.id ? (
          <RoleManager player={record} onRoleUpdated={handleRoleUpdated} size="small" />
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
  ];

  if (!turfId) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Empty description="No turf selected. Please select a turf first." />
      </div>
    );
  }

  return (
    <>
      <Head title="Players Management" />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <Title level={2} className="mb-2">
            <TeamOutlined className="mr-2" />
            Players Management
          </Title>
          <Text type="secondary">Manage players and their roles in your turf</Text>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={16}>
              <Search
                placeholder="Search by name or email..."
                allowClear
                enterButton={<SearchOutlined />}
                size="large"
                onSearch={handleSearch}
                loading={loading}
              />
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Select
                value={roleFilter}
                onChange={setRoleFilter}
                size="large"
                className="w-full"
                options={[
                  { value: 'all', label: 'All Roles' },
                  { value: 'admin', label: 'Admins' },
                  { value: 'manager', label: 'Managers' },
                  { value: 'player', label: 'Players' },
                ]}
              />
            </Col>
          </Row>
        </Card>

        {/* Players Table */}
        <Card>
          <Table
            columns={columns}
            dataSource={players}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} players`,
            }}
            scroll={{ x: 800 }}
            locale={{
              emptyText: (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No players found" className="py-8">
                  <Text type="secondary">Try adjusting your search or filters</Text>
                </Empty>
              ),
            }}
          />
        </Card>

        {/* Admin Notice */}
        {!isAdmin && (
          <Card className="mt-4 border-yellow-500 bg-yellow-50">
            <Text type="warning">You need admin privileges to manage player roles. Contact your turf admin if you believe this is an error.</Text>
          </Card>
        )}
      </div>
    </>
  );
};

PlayersIndex.displayName = 'PlayersIndex';

export default PlayersIndex;
