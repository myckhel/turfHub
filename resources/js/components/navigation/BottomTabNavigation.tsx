import { CalendarOutlined, HomeOutlined, SettingOutlined, TrophyOutlined, UserOutlined } from '@ant-design/icons';
import { useGSAP } from '@gsap/react';
import { router } from '@inertiajs/react';
import { Badge } from 'antd';
import { gsap } from 'gsap';
import React, { useRef } from 'react';
import { useTheme } from '../../hooks/useTheme';

interface TabItem {
  key: string;
  icon: React.ReactNode;
  label: string;
  route: string;
  badge?: number;
}

interface BottomTabNavigationProps {
  activeTab: string;
  className?: string;
}

const TAB_ITEMS: TabItem[] = [
  {
    key: 'home',
    icon: <HomeOutlined />,
    label: 'Home',
    route: 'dashboard',
  },
  {
    key: 'matches',
    icon: <CalendarOutlined />,
    label: 'Matches',
    route: 'matches.index',
  },
  {
    key: 'leaderboard',
    icon: <TrophyOutlined />,
    label: 'Rankings',
    route: 'leaderboard.index',
  },
  {
    key: 'profile',
    icon: <UserOutlined />,
    label: 'Profile',
    route: 'profile.show',
  },
  {
    key: 'settings',
    icon: <SettingOutlined />,
    label: 'Settings',
    route: 'settings.index',
  },
];

export const BottomTabNavigation: React.FC<BottomTabNavigationProps> = ({ activeTab, className = '' }) => {
  const { reducedMotion } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // GSAP animations for tab interactions
  useGSAP(() => {
    if (reducedMotion) return;

    // Initial entrance animation
    gsap.fromTo(
      containerRef.current,
      { y: 100, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.6,
        ease: 'back.out(1.7)',
        delay: 0.2,
      },
    );

    // Position active tab indicator
    const activeIndex = TAB_ITEMS.findIndex((item) => item.key === activeTab);
    if (activeIndex !== -1 && indicatorRef.current && tabRefs.current[activeIndex]) {
      const activeTabElement = tabRefs.current[activeIndex];
      if (activeTabElement) {
        const tabWidth = activeTabElement.offsetWidth;
        const tabLeft = activeTabElement.offsetLeft;

        gsap.set(indicatorRef.current, {
          width: tabWidth * 0.6,
          x: tabLeft + tabWidth * 0.2,
        });
      }
    }
  }, [activeTab, reducedMotion]);

  const handleTabPress = (item: TabItem, index: number) => {
    if (!reducedMotion && indicatorRef.current && tabRefs.current[index]) {
      const tabElement = tabRefs.current[index];
      if (tabElement) {
        const tabWidth = tabElement.offsetWidth;
        const tabLeft = tabElement.offsetLeft;

        // Animate indicator to new position
        gsap.to(indicatorRef.current, {
          width: tabWidth * 0.6,
          x: tabLeft + tabWidth * 0.2,
          duration: 0.3,
          ease: 'back.out(2)',
        });

        // Spring animation for pressed tab
        gsap.to(tabElement, {
          scale: 0.9,
          duration: 0.1,
          ease: 'power2.out',
          yoyo: true,
          repeat: 1,
        });
      }
    }

    // Navigate using Inertia
    router.visit(route(item.route), {
      preserveState: true,
      preserveScroll: true,
    });
  };

  return (
    <div
      ref={containerRef}
      className={`safe-area-bottom fixed inset-x-0 bottom-0 z-50 border-t border-slate-200/50 bg-white/80 backdrop-blur-xl dark:border-slate-700/50 dark:bg-slate-900/80 ${className}`}
      style={{
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
      }}
    >
      {/* Active tab indicator */}
      <div ref={indicatorRef} className="absolute top-0 h-0.5 rounded-full bg-turf-green" style={{ backgroundColor: 'var(--color-turf-green)' }} />

      <div className="flex items-center justify-between px-4 py-2">
        {TAB_ITEMS.map((item, index) => {
          const isActive = item.key === activeTab;

          return (
            <button
              key={item.key}
              ref={(el) => {
                tabRefs.current[index] = el;
              }}
              onClick={() => handleTabPress(item, index)}
              className={`touch-target spring-bounce flex min-h-[44px] min-w-[44px] flex-col items-center justify-center rounded-xl px-3 py-2 transition-all duration-200 ease-out ${
                isActive
                  ? 'text-turf-green dark:text-turf-light'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
              } focus-visible:ring-2 focus-visible:ring-turf-green focus-visible:ring-offset-2 active:scale-95`}
              style={{
                color: isActive ? 'var(--color-turf-green)' : undefined,
              }}
              aria-label={item.label}
              role="tab"
              aria-selected={isActive}
            >
              <div className={`mb-1 text-xl transition-transform duration-200 ${isActive ? 'scale-110' : 'scale-100'} `}>
                {item.badge ? (
                  <Badge
                    count={item.badge}
                    size="small"
                    style={{
                      backgroundColor: 'var(--color-electric-yellow)',
                      color: 'var(--color-deep-slate)',
                    }}
                  >
                    {item.icon}
                  </Badge>
                ) : (
                  item.icon
                )}
              </div>

              <span
                className={`text-xs leading-none font-medium transition-all duration-200 ${isActive ? 'scale-100 opacity-100' : 'scale-95 opacity-75'} `}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomTabNavigation;
