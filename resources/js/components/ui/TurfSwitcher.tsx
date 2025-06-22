import { SwapOutlined } from '@ant-design/icons';
import { useGSAP } from '@gsap/react';
import { Button, Dropdown, Space, Typography } from 'antd';
import { gsap } from 'gsap';
import React, { useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { useTurfStore } from '../../stores/turf.store';
import type { Turf } from '../../types/turf.types';

const { Text } = Typography;

interface TurfSwitcherProps {
  placement?: 'bottom' | 'bottomLeft' | 'bottomRight' | 'top' | 'topLeft' | 'topRight';
  size?: 'small' | 'middle' | 'large';
  showIcon?: boolean;
  className?: string;
}

const TurfSwitcher: React.FC<TurfSwitcherProps> = ({
  placement = 'bottomRight',
  size = 'middle',
  showIcon = true,
  className = '',
}) => {
  const { user } = useAuth();
  const { reducedMotion } = useTheme();
  const {
    selectedTurf,
    belongingTurfs,
    isLoading,
    setSelectedTurf,
    fetchBelongingTurfs,
    autoSelectFirstTurf,
  } = useTurfStore();

  const switcherRef = useRef<HTMLDivElement>(null);

  // Fetch belonging turfs when component mounts and user is available
  useEffect(() => {
    if (user?.id && !isLoading) {
      fetchBelongingTurfs(user.id);
    }
  }, [user?.id]);

  // Auto-select first turf if none selected
  useEffect(() => {
    if (belongingTurfs.length > 0 && !selectedTurf) {
      autoSelectFirstTurf();
    }
  }, [belongingTurfs, selectedTurf, autoSelectFirstTurf]);

  // GSAP animations
  useGSAP(() => {
    if (reducedMotion) return;

    // Entrance animation
    if (switcherRef.current) {
      gsap.fromTo(
        switcherRef.current,
        { opacity: 0, scale: 0.9 },
        {
          opacity: 1,
          scale: 1,
          duration: 0.3,
          ease: 'back.out(1.7)',
          delay: 0.1,
        }
      );
    }
  }, [selectedTurf, reducedMotion]);

  // Don't render if no turfs or still loading initial data
  if (!user || belongingTurfs.length === 0) {
    return null;
  }

  const handleTurfSelect = (turf: Turf) => {
    if (!reducedMotion && switcherRef.current) {
      // Small scale animation on selection
      gsap.to(switcherRef.current, {
        scale: 0.95,
        duration: 0.1,
        ease: 'power2.out',
        yoyo: true,
        repeat: 1,
      });
    }

    setSelectedTurf(turf);
  };

  const menuItems = belongingTurfs?.map((turf) => ({
    key: turf.id.toString(),
    label: (
      <div className="turf-switcher-item flex items-center justify-between min-w-[200px] px-2 py-1">
        <div className="flex-1">
          <Text strong>{turf.name}</Text>
          {turf.location && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {turf.location}
            </div>
          )}
        </div>
        {selectedTurf?.id === turf.id && (
          <div className="turf-switcher-selected-indicator ml-2 h-2 w-2 rounded-full" />
        )}
      </div>
    ),
    onClick: () => handleTurfSelect(turf),
  }));

  return (
    <div ref={switcherRef} className={className}>
      <Dropdown
        menu={{ items: menuItems }}
        trigger={['click']}
        placement={placement}
        disabled={isLoading || belongingTurfs.length <= 1}
        dropdownRender={(menu) => (
          <div className="turf-switcher-dropdown">
            {menu}
          </div>
        )}
      >
        <Button
          type="text"
          size={size}
          loading={isLoading}
          className="turf-switcher-button touch-target spring-bounce flex items-center gap-2 px-3 py-1 text-slate-700 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-turf-green dark:text-slate-300 dark:hover:bg-slate-800"
          style={{
            border: 'none',
            boxShadow: 'none',
          }}
        >
          <Space size={4}>
            {showIcon && belongingTurfs.length > 1 && (
              <SwapOutlined className="text-turf-green" />
            )}
            <div className="flex flex-col items-start">
              <Text
                strong
                className="text-sm leading-tight text-slate-900 dark:text-white"
                style={{ marginBottom: 0 }}
              >
                {selectedTurf?.name || 'Select Turf'}
              </Text>
              {selectedTurf?.location && (
                <Text
                  type="secondary"
                  className="text-xs leading-tight"
                  style={{ marginBottom: 0 }}
                >
                  {selectedTurf.location}
                </Text>
              )}
            </div>
          </Space>
        </Button>
      </Dropdown>
    </div>
  );
};

export default TurfSwitcher;
