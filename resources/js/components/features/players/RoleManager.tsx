import { playerApi } from '@/apis/player';
import { CrownOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons';
import { message, Popconfirm, Select } from 'antd';
import { memo, useState } from 'react';
import { Player, PlayerRole } from '../../../types/player.types';

interface RoleManagerProps {
  player: Player;
  onRoleUpdated?: (player: Player) => void;
  disabled?: boolean;
  size?: 'small' | 'middle' | 'large';
}

const RoleManager = memo(({ player, onRoleUpdated, disabled = false, size = 'middle' }: RoleManagerProps) => {
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<PlayerRole | undefined>();

  const roleOptions = [
    {
      value: 'admin' as PlayerRole,
      label: (
        <span>
          <CrownOutlined className="mr-2 text-yellow-500" />
          Admin
        </span>
      ),
      description: 'Full control over turf settings and players',
    },
    {
      value: 'manager' as PlayerRole,
      label: (
        <span>
          <TeamOutlined className="mr-2 text-blue-500" />
          Manager
        </span>
      ),
      description: 'Can manage match sessions and teams',
    },
    {
      value: 'player' as PlayerRole,
      label: (
        <span>
          <UserOutlined className="mr-2 text-green-500" />
          Player
        </span>
      ),
      description: 'Can join teams and view match sessions',
    },
  ];

  const handleRoleChange = async () => {
    if (!selectedRole || selectedRole === player.role) {
      setSelectedRole(undefined);
      return;
    }

    setLoading(true);
    try {
      const response = await playerApi.updateRole(player.id, { role: selectedRole });
      message.success(`Role updated to ${selectedRole} successfully`);
      onRoleUpdated?.(response);
      setSelectedRole(undefined);
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      message.error(err.response?.data?.message || 'Failed to update role');
      setSelectedRole(undefined);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Popconfirm
      title="Change Player Role"
      description={`Are you sure you want to change this player's role to ${selectedRole}?`}
      open={!!selectedRole && selectedRole !== player.role}
      onConfirm={handleRoleChange}
      onCancel={() => setSelectedRole(undefined)}
      okText="Yes, Change Role"
      cancelText="Cancel"
      okButtonProps={{ loading }}
    >
      <Select
        value={player.role}
        onChange={setSelectedRole}
        options={roleOptions}
        disabled={disabled || loading}
        size={size}
        className="w-full min-w-[140px]"
        placeholder="Select role"
      />
    </Popconfirm>
  );
});

RoleManager.displayName = 'RoleManager';

export default RoleManager;
