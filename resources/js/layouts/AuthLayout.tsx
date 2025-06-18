import {
  BellOutlined,
  CalendarOutlined,
  DashboardOutlined,
  LogoutOutlined,
  MenuOutlined,
  SettingOutlined,
  TrophyOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Link } from '@inertiajs/react';
import { Avatar, Badge, Button, Dropdown, Layout, Menu } from 'antd';
import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { usePermissions } from '../hooks/usePermissions';
import { useResponsive } from '../hooks/useResponsive';
import { useLayoutStore } from '../stores';

const { Header, Sider, Content } = Layout;

interface AuthLayoutProps {
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const { canAccessDashboard, isPlayer, isManager, isAdmin } = usePermissions();
  const { sidebarCollapsed, mobileMenuOpen, toggleSidebar, setMobileMenuOpen } = useLayoutStore();
  const { isMobile, isTablet } = useResponsive();

  // if (!canAccessDashboard()) {
  //   return <div>Access Denied</div>;
  // }

  // Mobile menu overlay
  const shouldCollapse = isMobile || isTablet;
  const actuallyCollapsed = shouldCollapse || sidebarCollapsed;

  // Menu items based on role
  const getMenuItems = () => {
    const items = [
      {
        key: 'dashboard',
        icon: <DashboardOutlined />,
        label: <Link href={route('dashboard')}>Dashboard</Link>,
      },
    ];

    if (isPlayer()) {
      items.push(
        {
          key: 'bookings',
          icon: <CalendarOutlined />,
          label: <Link href={route('dashboard')}>My Bookings</Link>,
        },
        {
          key: 'matches',
          icon: <TrophyOutlined />,
          label: <Link href={route('dashboard')}>My Matches</Link>,
        },
      );
    }

    if (isManager() || isAdmin()) {
      items.push({
        key: 'management',
        icon: <SettingOutlined />,
        label: 'Management',
        children: [
          {
            key: 'fields',
            label: <Link href={route('dashboard')}>Fields</Link>,
          },
          {
            key: 'all-bookings',
            label: <Link href={route('dashboard')}>All Bookings</Link>,
          },
          {
            key: 'reports',
            label: <Link href={route('dashboard')}>Reports</Link>,
          },
        ],
      });
    }

    if (isAdmin()) {
      items.push({
        key: 'admin',
        icon: <SettingOutlined />,
        label: 'Admin',
        children: [
          {
            key: 'users',
            label: <Link href={route('dashboard')}>Users</Link>,
          },
          {
            key: 'settings',
            label: <Link href={route('dashboard')}>Settings</Link>,
          },
        ],
      });
    }

    return items;
  };

  const userMenuItems = [
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
    { type: 'divider' as const },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: logout,
    },
  ];

  return (
    <Layout className="min-h-screen">
      {/* Sidebar */}
      <Sider
        trigger={null}
        collapsible
        collapsed={actuallyCollapsed}
        breakpoint="lg"
        collapsedWidth={isMobile ? 0 : 80}
        className={` ${isMobile ? 'fixed inset-y-0 left-0 z-50' : ''} ${isMobile && !mobileMenuOpen ? '-translate-x-full' : ''} bg-white transition-transform duration-300 dark:bg-gray-800`}
        width={280}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-center border-b border-gray-200 dark:border-gray-700">
          <Link href={route('dashboard')} className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500">
              <span className="text-sm font-bold text-white">TH</span>
            </div>
            {!actuallyCollapsed && <span className="text-lg font-bold text-gray-900 dark:text-white">TurfMate</span>}
          </Link>
        </div>

        {/* Navigation Menu */}
        <Menu mode="inline" items={getMenuItems()} className="border-r-0 bg-transparent" style={{ height: 'calc(100vh - 64px)' }} />
      </Sider>

      {/* Mobile overlay */}
      {isMobile && mobileMenuOpen && <div className="bg-opacity-50 fixed inset-0 z-40 bg-black" onClick={() => setMobileMenuOpen(false)} />}

      <Layout className={`${!isMobile && !actuallyCollapsed ? '' : ''}`}>
        {/* Header */}
        <Header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 dark:border-gray-700 dark:bg-gray-800">
          {/* Left side - Menu trigger */}
          <div className="flex items-center space-x-4">
            <Button
              type="text"
              icon={<MenuOutlined />}
              onClick={isMobile ? () => setMobileMenuOpen(!mobileMenuOpen) : toggleSidebar}
              className="flex items-center justify-center"
            />
          </div>

          {/* Right side - User menu */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <Button
              type="text"
              icon={
                <Badge count={0} size="small">
                  <BellOutlined />
                </Badge>
              }
            />

            {/* User dropdown */}
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" arrow>
              <div className="flex cursor-pointer items-center space-x-2 rounded-lg px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700">
                <Avatar size="small" src={user?.avatar} icon={<UserOutlined />} />
                {!isMobile && <span className="text-sm font-medium text-gray-900 dark:text-white">{user?.name}</span>}
              </div>
            </Dropdown>
          </div>
        </Header>

        {/* Main Content */}
        <Content className="min-h-screen bg-gray-50 dark:bg-gray-900">{children}</Content>
      </Layout>
    </Layout>
  );
};
