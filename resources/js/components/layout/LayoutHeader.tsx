import { ArrowLeftOutlined, BellOutlined, LogoutOutlined, MenuOutlined, SettingOutlined, UserOutlined } from '@ant-design/icons';
import { Link } from '@inertiajs/react';
import { Avatar, Badge, Button, Dropdown, Layout, MenuProps } from 'antd';
import { memo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useResponsive } from '../../hooks/useResponsive';
import { useLayoutStore } from '../../stores';
import ThemeToggle from '../shared/ThemeToggle';
import TurfSwitcher from '../Turf/TurfSwitcher';

const { Header } = Layout;

interface LayoutHeaderProps {
  showBackButton?: boolean;
  onBackPress?: () => void;
  headerRightContent?: React.ReactNode;
}

export const LayoutHeader = memo<LayoutHeaderProps>(({ showBackButton = false, onBackPress, headerRightContent }) => {
  const { isMobile } = useResponsive();
  const { user, logout } = useAuth();
  const { toggleSidebar, setMobileMenuOpen } = useLayoutStore();

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: <Link href={route('dashboard')}>Profile</Link>,
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: <Link href={route('dashboard')}>Settings</Link>,
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: logout,
    },
  ];

  return (
    <Header
      className="turf-header fixed top-0 z-50 flex w-full items-center justify-between shadow-lg backdrop-blur-md transition-all duration-300"
      style={{
        background: 'var(--color-turf-green)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        paddingLeft: '16px',
        paddingRight: '16px',
      }}
    >
      {/* Left side - Menu trigger and navigation */}
      <div className="flex items-center space-x-4">
        <Button
          type="text"
          icon={<MenuOutlined />}
          onClick={isMobile ? () => setMobileMenuOpen(true) : toggleSidebar}
          className="flex items-center justify-center text-white hover:bg-white/10"
        />

        {/* Back button for mobile */}
        {isMobile && showBackButton && (
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={onBackPress}
            className="flex items-center justify-center text-white hover:bg-white/10"
          />
        )}

        {/* TurfSwitcher */}
        <div className="flex items-center space-x-4">
          <TurfSwitcher size={isMobile ? 'small' : 'middle'} placement="bottomLeft" />
        </div>
      </div>

      {/* Right side - Actions and user menu */}
      <div className="flex items-center space-x-2 md:space-x-4">
        {/* Theme toggle */}
        <ThemeToggle size={isMobile ? 'small' : 'medium'} />

        {/* Header right content */}
        {headerRightContent}

        {/* Notifications */}
        <Button
          type="text"
          className="text-white hover:bg-white/10"
          icon={
            <Badge count={0} size="small">
              <BellOutlined className="text-white" />
            </Badge>
          }
        />

        {/* User dropdown */}
        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" arrow>
          <div className="flex cursor-pointer items-center space-x-2 rounded-lg px-2 py-1 transition-colors hover:bg-white/10">
            <Avatar size={isMobile ? 'small' : 'default'} src={user?.avatar} icon={<UserOutlined />} />
            {!isMobile && <span className="text-sm font-medium text-white">{user?.name}</span>}
          </div>
        </Dropdown>
      </div>
    </Header>
  );
});

LayoutHeader.displayName = 'LayoutHeader';

export default LayoutHeader;
