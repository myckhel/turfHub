import { ArrowLeftOutlined, BellOutlined, MenuOutlined, MoonOutlined, SunOutlined } from '@ant-design/icons';
import { useGSAP } from '@gsap/react';
import { router, usePage } from '@inertiajs/react';
import { Avatar, Badge, Button, Dropdown, Typography } from 'antd';
import { gsap } from 'gsap';
import React, { useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useResponsive, useTheme } from '../../hooks/useTheme';

const { Title } = Typography;

interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
}

interface PageProps {
  auth?: {
    user?: User;
  };
  [key: string]: unknown;
}

interface MobileHeaderProps {
  title?: string;
  subtitle?: string;
  showBackButton?: boolean;
  showProfileMenu?: boolean;
  showNotifications?: boolean;
  onBackPress?: () => void;
  rightContent?: React.ReactNode;
  className?: string;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  title = 'TurfMate',
  subtitle,
  showBackButton = false,
  showProfileMenu = true,
  showNotifications = true,
  onBackPress,
  rightContent,
  className = '',
}) => {
  const { setLightMode, setDarkMode, setSystemMode, reducedMotion, isDark } = useTheme();
  const { logout } = useAuth();
  const { isMobile } = useResponsive();
  const { props } = usePage<PageProps>();
  const user = props.auth?.user;

  const headerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const backButtonRef = useRef<HTMLButtonElement>(null);

  // GSAP animations
  useGSAP(() => {
    if (reducedMotion) return;

    // Header entrance animation
    gsap.fromTo(
      headerRef.current,
      { y: -60, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.6,
        ease: 'back.out(1.4)',
        delay: 0.1,
      },
    );

    // Title animation
    if (titleRef.current) {
      gsap.fromTo(
        titleRef.current,
        { scale: 0.8, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          duration: 0.5,
          ease: 'back.out(2)',
          delay: 0.3,
        },
      );
    }
  }, [reducedMotion]);

  const handleBackPress = () => {
    if (!reducedMotion && backButtonRef.current) {
      gsap.to(backButtonRef.current, {
        scale: 0.9,
        duration: 0.1,
        ease: 'power2.out',
        yoyo: true,
        repeat: 1,
      });
    }

    if (onBackPress) {
      onBackPress();
    } else {
      window.history.back();
    }
  };

  const handleNotificationPress = () => {
    router.visit(route('notifications.index'));
  };

  const themeMenuItems = [
    {
      key: 'light',
      label: (
        <div className="flex items-center gap-2">
          <SunOutlined />
          <span>Light Mode</span>
        </div>
      ),
      onClick: setLightMode,
    },
    {
      key: 'dark',
      label: (
        <div className="flex items-center gap-2">
          <MoonOutlined />
          <span>Dark Mode</span>
        </div>
      ),
      onClick: setDarkMode,
    },
    {
      key: 'system',
      label: (
        <div className="flex items-center gap-2">
          <MenuOutlined />
          <span>System</span>
        </div>
      ),
      onClick: setSystemMode,
    },
  ];

  const profileMenuItems = [
    {
      key: 'profile',
      label: 'View Profile',
      onClick: () => router.visit(route('profile.show')),
    },
    {
      key: 'settings',
      label: 'Settings',
      onClick: () => router.visit(route('settings.index')),
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'theme',
      label: 'Theme',
      children: themeMenuItems,
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      label: 'Sign Out',
      onClick: () => logout(),
    },
  ];

  return (
    <div
      ref={headerRef}
      className={`safe-area-top sticky top-0 z-40 border-b border-slate-200/50 bg-white/90 backdrop-blur-xl dark:border-slate-700/50 dark:bg-slate-900/90 ${className} `}
      style={{
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left Section */}
        <div className="flex flex-1 items-center gap-3">
          {showBackButton && (
            <Button
              ref={backButtonRef}
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={handleBackPress}
              className="touch-target spring-bounce text-slate-700 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-turf-green dark:text-slate-300 dark:hover:bg-slate-800"
              aria-label="Go back"
            />
          )}

          <div ref={titleRef} className="min-w-0 flex-1">
            <Title level={isMobile ? 4 : 3} className="!mb-0 truncate !text-slate-900 dark:!text-white" style={{ fontFamily: 'var(--font-display)' }}>
              {title}
            </Title>
            {subtitle && <p className="mt-0.5 truncate text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {rightContent}

          {showNotifications && (
            <Button
              type="text"
              icon={
                <Badge dot>
                  <BellOutlined />
                </Badge>
              }
              onClick={handleNotificationPress}
              className="touch-target spring-bounce text-slate-700 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-turf-green dark:text-slate-300 dark:hover:bg-slate-800"
              aria-label="Notifications"
            />
          )}

          {showProfileMenu && user && (
            <Dropdown menu={{ items: profileMenuItems }} trigger={['click']} placement="bottomRight">
              <Avatar
                src={user.avatar}
                className="spring-bounce cursor-pointer ring-2 ring-transparent transition-all duration-200 hover:ring-turf-green/20"
                style={{
                  backgroundColor: 'var(--color-turf-green)',
                }}
              >
                {user.name?.[0]?.toUpperCase()}
              </Avatar>
            </Dropdown>
          )}

          {/* Theme toggle for non-authenticated users */}
          {!showProfileMenu && (
            <Dropdown menu={{ items: themeMenuItems }} trigger={['click']} placement="bottomRight">
              <Button
                type="text"
                icon={isDark ? <MoonOutlined /> : <SunOutlined />}
                className="touch-target spring-bounce text-slate-700 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-turf-green dark:text-slate-300 dark:hover:bg-slate-800"
                aria-label="Toggle theme"
              />
            </Dropdown>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileHeader;
