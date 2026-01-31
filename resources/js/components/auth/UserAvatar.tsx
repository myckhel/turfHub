import { UserOutlined } from '@ant-design/icons';
import { Avatar, Badge } from 'antd';
import React from 'react';
import { useAuth } from '../../hooks/useAuth';

interface UserAvatarProps {
  size?: 'small' | 'default' | 'large' | number;
  showBadge?: boolean;
  onClick?: () => void;
  className?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({ size = 'default', showBadge = false, onClick, className = '' }) => {
  const { user } = useAuth();

  if (!user) {
    return <Avatar size={size} icon={<UserOutlined />} className={className} onClick={onClick} />;
  }

  const avatar = (
    <Avatar size={size} src={user.avatar} className={className} onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      {!user.avatar && user.name ? user.name.charAt(0).toUpperCase() : <UserOutlined />}
    </Avatar>
  );

  if (showBadge && !user.email_verified_at) {
    return (
      <Badge dot color="orange" title="Email not verified">
        {avatar}
      </Badge>
    );
  }

  return avatar;
};
