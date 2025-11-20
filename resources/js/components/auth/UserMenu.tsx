import { AppleOutlined, DownloadOutlined, LogoutOutlined, MailOutlined, SettingOutlined, UserOutlined } from '@ant-design/icons';
import { router } from '@inertiajs/react';
import { Dropdown, Menu, Space, Typography } from 'antd';
import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { usePWA } from '../../hooks/usePWA';
import { UserAvatar } from './UserAvatar';

// Helper to detect iOS
const isIOS = () => {
  return (
    ['iPad Simulator', 'iPhone Simulator', 'iPod Simulator', 'iPad', 'iPhone', 'iPod'].includes(navigator.platform) ||
    (navigator.userAgent.includes('Mac') && 'ontouchend' in document)
  );
};

const { Text } = Typography;

interface UserMenuProps {
  placement?: 'bottom' | 'bottomLeft' | 'bottomRight' | 'top' | 'topLeft' | 'topRight';
}

export const UserMenu: React.FC<UserMenuProps> = ({ placement = 'bottomRight' }) => {
  const { user, logout } = useAuth();
  const { canInstall, installApp } = usePWA();

  if (!user) {
    return null;
  }

  const handleLogout = () => {
    logout();
    router.post(route('logout'));
  };

  const handleMenuClick = ({ key }: { key: string }) => {
    switch (key) {
      case 'profile':
        router.visit(route('profile.edit'));
        break;
      case 'settings':
        router.visit(route('profile.edit'));
        break;
      case 'verify-email':
        router.visit(route('verification.notice'));
        break;
      case 'install-app':
        installApp();
        break;
      case 'logout':
        handleLogout();
        break;
      default:
        break;
    }
  };

  const menuItems = [
    {
      key: 'user-info',
      label: (
        <div className="px-2 py-1">
          <Text strong className="block">
            {user.name}
          </Text>
          <Text type="secondary" className="text-xs">
            {user.email}
          </Text>
        </div>
      ),
      disabled: true,
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'profile',
      label: 'Profile',
      icon: <UserOutlined />,
    },
    {
      key: 'settings',
      label: 'Settings',
      icon: <SettingOutlined />,
    },
  ];

  // Add PWA install option if installable
  if (canInstall) {
    menuItems.splice(4, 0, {
      key: 'install-app',
      label: 'Install App',
      icon: isIOS() ? <AppleOutlined /> : <DownloadOutlined />,
    });
  }

  // Add email verification option if email is not verified
  if (!user.email_verified_at) {
    menuItems.push({
      key: 'verify-email',
      label: 'Verify Email',
      icon: <MailOutlined />,
    });
  }

  menuItems.push(
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      label: 'Log out',
      icon: <LogoutOutlined />,
    },
  );

  const menu = <Menu items={menuItems} onClick={handleMenuClick} />;

  return (
    <Dropdown dropdownRender={() => menu} placement={placement} trigger={['click']}>
      <Space className="cursor-pointer">
        <UserAvatar showBadge />
        <Text className="hidden md:inline">{user.name}</Text>
      </Space>
    </Dropdown>
  );
};
