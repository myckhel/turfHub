import { CrownOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons';
import { Tag } from 'antd';
import { memo } from 'react';
import { PlayerRole } from '../../../types/player.types';

interface RoleBadgeProps {
  role?: PlayerRole;
  size?: 'small' | 'default';
}

const RoleBadge = memo(({ role, size = 'default' }: RoleBadgeProps) => {
  if (!role) return null;

  const roleConfig = {
    admin: {
      color: 'gold',
      icon: <CrownOutlined />,
      label: 'Admin',
    },
    manager: {
      color: 'blue',
      icon: <TeamOutlined />,
      label: 'Manager',
    },
    player: {
      color: 'green',
      icon: <UserOutlined />,
      label: 'Player',
    },
  };

  const config = roleConfig[role];

  return (
    <Tag color={config.color} icon={config.icon} className={size === 'small' ? 'text-xs' : ''}>
      {config.label}
    </Tag>
  );
});

RoleBadge.displayName = 'RoleBadge';

export default RoleBadge;
