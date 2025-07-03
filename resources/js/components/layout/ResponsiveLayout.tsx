import {
  AppstoreOutlined,
  ArrowLeftOutlined,
  BellOutlined,
  CalendarOutlined,
  DashboardOutlined,
  LogoutOutlined,
  MenuOutlined,
  SettingOutlined,
  TeamOutlined,
  TrophyOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useGSAP } from '@gsap/react';
import { Link } from '@inertiajs/react';
import { Layout as AntLayout, Avatar, Badge, Button, Drawer, Dropdown, Menu } from 'antd';
import { gsap } from 'gsap';
import React, { useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { usePermissions } from '../../hooks/usePermissions';
import { useResponsive } from '../../hooks/useResponsive';
import { useTheme } from '../../hooks/useTheme';
import { useLayoutStore } from '../../stores';
import { useTurfStore } from '../../stores/turf.store';
import ThemeToggle from '../ui/ThemeToggle';
import TurfSwitcher from '../ui/TurfSwitcher';

const { Content, Header, Sider } = AntLayout;

interface ResponsiveLayoutProps {
  /** Current active tab for navigation */
  activeTab?: string;
  /** Page title for header */
  title?: string;
  /** Page subtitle for header */
  subtitle?: string;
  /** Show back button in header */
  showBackButton?: boolean;
  /** Show header */
  showHeader?: boolean;
  /** Custom header content */
  headerContent?: React.ReactNode;
  /** Custom right content for header */
  headerRightContent?: React.ReactNode;
  /** Content padding */
  contentPadding?: boolean;
  /** Safe area handling */
  safeArea?: boolean;
  /** Page background variant */
  backgroundVariant?: 'default' | 'gradient' | 'pattern';
  /** Custom background */
  background?: string;
  /** Back button handler */
  onBackPress?: () => void;
  /** Children content */
  children: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
}

export const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  activeTab = 'home',
  showBackButton = false,
  showHeader = true,
  headerContent,
  headerRightContent,
  contentPadding = true,
  safeArea = true,
  backgroundVariant = 'default',
  background,
  onBackPress,
  children,
  className = '',
}) => {
  const { reducedMotion } = useTheme();
  const { isMobile, isTablet } = useResponsive();
  const { user, logout } = useAuth();
  const { isTurfPlayer, isTurfManager, isTurfAdmin } = usePermissions();
  const { selectedTurf } = useTurfStore();
  const { sidebarCollapsed, mobileMenuOpen, toggleSidebar, setMobileMenuOpen } = useLayoutStore();

  const layoutRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Responsive layout logic
  const shouldCollapse = isMobile || isTablet;
  const actuallyCollapsed = shouldCollapse || sidebarCollapsed;
  const useDesktopLayout = !isMobile;
  const useMobileLayout = isMobile;

  // Mobile sidebar as drawer
  const MobileSidebar = () => (
    <Drawer
      title={
        <Link href={route('dashboard')} className="flex items-center space-x-2">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg shadow-lg"
            style={{ background: 'linear-gradient(135deg, var(--color-turf-green), var(--color-turf-light))' }}
          >
            <span className="text-sm font-bold text-white">TH</span>
          </div>
          <span className="turf-brand-text text-lg font-bold">TurfMate</span>
        </Link>
      }
      placement="left"
      open={mobileMenuOpen}
      onClose={() => setMobileMenuOpen(false)}
      width={280}
      className="turf-mobile-sidebar"
      headerStyle={{ borderBottom: '1px solid var(--color-medium-gray)' }}
    >
      <Menu mode="inline" items={getMenuItems()} className="turf-sidebar-menu border-r-0" onClick={() => setMobileMenuOpen(false)} />
    </Drawer>
  );

  // Menu items based on role
  const getMenuItems = () => {
    const items = [
      {
        key: 'dashboard',
        icon: <DashboardOutlined />,
        label: <Link href={route('dashboard')}>Dashboard</Link>,
      },
      {
        key: 'turfs',
        icon: <AppstoreOutlined />,
        label: <Link href={route('web.turfs.index')}>Browse Turfs</Link>,
      },
    ];

    // Add match sessions if there's a selected turf
    if (selectedTurf) {
      items.push({
        key: 'match-sessions',
        icon: <TeamOutlined />,
        label: <Link href={route('web.turfs.match-sessions.index', { turf: selectedTurf.id })}>Match Sessions</Link>,
      });
    }

    if (isTurfPlayer()) {
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

    if (isTurfManager() || isTurfAdmin()) {
      items.push(
        {
          key: 'fields',
          icon: <SettingOutlined />,
          label: <Link href={route('dashboard')}>Fields</Link>,
        },
        {
          key: 'all-bookings',
          icon: <CalendarOutlined />,
          label: <Link href={route('dashboard')}>All Bookings</Link>,
        },
        {
          key: 'reports',
          icon: <TrophyOutlined />,
          label: <Link href={route('dashboard')}>Reports</Link>,
        },
      );
    }

    if (isTurfAdmin()) {
      items.push(
        {
          key: 'users',
          icon: <UserOutlined />,
          label: <Link href={route('dashboard')}>Users</Link>,
        },
        {
          key: 'settings',
          icon: <SettingOutlined />,
          label: <Link href={route('dashboard')}>Settings</Link>,
        },
      );
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

  // GSAP page transition animations
  useGSAP(() => {
    if (reducedMotion) return;

    const tl = gsap.timeline();

    // Layout entrance animation
    tl.fromTo(layoutRef.current, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'power2.out' });

    // Content slide-in animation
    if (contentRef.current) {
      tl.fromTo(
        contentRef.current,
        { x: 20, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.5,
          ease: 'back.out(1.7)',
        },
        '-=0.2',
      );
    }

    return () => {
      tl.kill();
    };
  }, [reducedMotion, activeTab]);

  // Page transition effect when activeTab changes
  useEffect(() => {
    if (reducedMotion || !contentRef.current) return;

    const content = contentRef.current;

    gsap.fromTo(
      content,
      { scale: 0.98, opacity: 0.8 },
      {
        scale: 1,
        opacity: 1,
        duration: 0.3,
        ease: 'back.out(2)',
      },
    );
  }, [activeTab, reducedMotion]);

  // Background styles
  const getBackgroundStyles = () => {
    if (background) return { background };

    const baseStyles = 'min-h-screen transition-colors duration-300';
    const backgrounds = {
      default: `${baseStyles} turf-layout-bg`,
      gradient: `${baseStyles} turf-layout-gradient`,
      pattern: `${baseStyles} turf-layout-pattern`,
    };

    return backgrounds[backgroundVariant];
  };

  return (
    <AntLayout
      ref={layoutRef}
      className={`${getBackgroundStyles()} ${safeArea ? 'safe-area-inset-top safe-area-inset-bottom' : ''} ${className}`}
      style={background ? { background, minHeight: '100vh' } : { minHeight: '100vh' }}
    >
      {/* Mobile Sidebar Drawer */}
      {useMobileLayout && <MobileSidebar />}

      {/* Desktop Sidebar */}
      {useDesktopLayout && (
        <Sider
          trigger={null}
          collapsible
          collapsed={actuallyCollapsed}
          breakpoint="lg"
          collapsedWidth={80}
          className="turf-sidebar fixed top-16 left-0 z-40 h-[calc(100vh-4rem)] transition-transform duration-300"
          width={280}
        >
          {/* Logo */}
          <div className="flex h-16 items-center justify-center border-b" style={{ borderColor: 'var(--color-medium-gray)' }}>
            <Link href={route('dashboard')} className="flex items-center space-x-2 transition-transform hover:scale-105">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg shadow-lg"
                style={{ background: 'linear-gradient(135deg, var(--color-turf-green), var(--color-turf-light))' }}
              >
                <span className="text-sm font-bold text-white">TH</span>
              </div>
              {!actuallyCollapsed && <span className="turf-brand-text text-lg font-bold">TurfMate</span>}
            </Link>
          </div>

          {/* Navigation Menu */}
          <Menu mode="inline" items={getMenuItems()} className="turf-sidebar-menu border-r-0" style={{ height: 'calc(100vh - 128px)' }} />
        </Sider>
      )}

      <AntLayout>
        {/* Enhanced Header for both desktop and mobile */}
        {showHeader && (
          <Header className="turf-header fixed top-0 z-50 flex w-full items-center justify-between border-b px-4 shadow-sm backdrop-blur-md">
            {/* Left side - Menu trigger and navigation */}
            <div className="flex items-center space-x-4">
              {useMobileLayout ? (
                <Button
                  type="text"
                  icon={<MenuOutlined />}
                  onClick={() => setMobileMenuOpen(true)}
                  className="turf-header-btn flex items-center justify-center"
                />
              ) : (
                <Button type="text" icon={<MenuOutlined />} onClick={toggleSidebar} className="turf-header-btn flex items-center justify-center" />
              )}

              {/* Back button for mobile */}
              {useMobileLayout && showBackButton && (
                <Button type="text" icon={<ArrowLeftOutlined />} onClick={onBackPress} className="turf-header-btn flex items-center justify-center" />
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
                className="turf-header-btn"
                icon={
                  <Badge count={0} size="small">
                    <BellOutlined />
                  </Badge>
                }
              />

              {/* User dropdown */}
              <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" arrow>
                <div className="turf-user-dropdown flex cursor-pointer items-center space-x-2 rounded-lg px-2 py-1">
                  <Avatar size={isMobile ? 'small' : 'default'} src={user?.avatar} icon={<UserOutlined />} />
                  {!isMobile && <span className="turf-brand-text text-sm font-medium">{user?.name}</span>}
                </div>
              </Dropdown>
            </div>
          </Header>
        )}

        {/* Custom Header Content */}
        {headerContent && <div className="turf-header-content sticky top-16 z-30 backdrop-blur-xl">{headerContent}</div>}

        {/* Main Content */}
        <Content
          ref={contentRef}
          className={`turf-content flex-1 ${showHeader ? 'pt-16' : ''} ${useDesktopLayout && !actuallyCollapsed ? 'ml-[280px]' : useDesktopLayout && actuallyCollapsed ? 'ml-[80px]' : ''} ${useMobileLayout ? 'min-h-[calc(100vh-theme(spacing.16))]' : 'min-h-screen'} transition-all duration-300 ease-out`}
        >
          <div className={useDesktopLayout ? 'mx-auto max-w-full' : 'mx-auto max-w-screen-xl'}>{children}</div>
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

export default ResponsiveLayout;
