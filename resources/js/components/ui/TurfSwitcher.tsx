import { EnvironmentOutlined, SwapOutlined, CheckOutlined } from '@ant-design/icons';
import { useGSAP } from '@gsap/react';
import { Button, Dropdown, Space, Typography, Tooltip } from 'antd';
import { gsap } from 'gsap';
import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { useTurfStore } from '../../stores/turf.store';
import { BRAND_COLORS } from '../../stores/theme.store';
import type { Turf } from '../../types/turf.types';

const { Text } = Typography;

interface TurfSwitcherProps {
  placement?: 'bottom' | 'bottomLeft' | 'bottomRight' | 'top' | 'topLeft' | 'topRight';
  size?: 'small' | 'middle' | 'large';
  showIcon?: boolean;
  showLocation?: boolean;
  maxDisplayLength?: number;
  variant?: 'default' | 'compact' | 'detailed';
  className?: string;
  onTurfChange?: (turf: Turf | null) => void;
}

const TurfSwitcher: React.FC<TurfSwitcherProps> = ({
  placement = 'bottomRight',
  size = 'middle',
  showIcon = true,
  showLocation = true,
  maxDisplayLength = 25,
  variant = 'default',
  className = '',
  onTurfChange,
}) => {
  const { user } = useAuth();
  const { reducedMotion, isDark } = useTheme();
  const {
    selectedTurf,
    belongingTurfs,
    isLoading,
    setSelectedTurf,
    fetchBelongingTurfs,
    autoSelectFirstTurf,
  } = useTurfStore();

  const switcherRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Memoized theme colors for better performance
  const themeColors = useMemo(() => {
    const primary = BRAND_COLORS.turfGreen;
    const accent = isDark ? BRAND_COLORS.lightSky : BRAND_COLORS.skyBlue;
    const success = BRAND_COLORS.success;

    return {
      primary,
      accent,
      success,
      indicator: success,
      hover: isDark ? 'rgba(93, 173, 226, 0.1)' : 'rgba(27, 94, 32, 0.1)',
      activeHover: isDark ? 'rgba(93, 173, 226, 0.2)' : 'rgba(27, 94, 32, 0.2)',
    };
  }, [isDark]);

  // Optimized turf fetching with proper dependency management
  useEffect(() => {
    if (user?.id && !isLoading && belongingTurfs.length === 0) {
      fetchBelongingTurfs(user.id);
    }
  }, [user?.id, isLoading, belongingTurfs.length, fetchBelongingTurfs]);

  // Auto-select first turf if none selected
  useEffect(() => {
    if (belongingTurfs.length > 0 && !selectedTurf) {
      autoSelectFirstTurf();
    }
  }, [belongingTurfs, selectedTurf, autoSelectFirstTurf]);

  // Enhanced GSAP animations with performance optimizations
  useGSAP(() => {
    if (reducedMotion || !switcherRef.current) return;

    // Enhanced entrance animation with stagger effect
    const tl = gsap.timeline();

    tl.fromTo(
      switcherRef.current,
      {
        opacity: 0,
        scale: 0.9,
        y: -10,
      },
      {
        opacity: 1,
        scale: 1,
        y: 0,
        duration: 0.4,
        ease: 'back.out(1.7)',
        delay: 0.1,
      }
    );

    // Subtle breathing animation for the selected indicator
    if (selectedTurf) {
      gsap.to(switcherRef.current, {
        boxShadow: `0 0 0 2px ${themeColors.primary}20`,
        duration: 2,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
      });
    }

    return () => {
      tl.kill();
    };
  }, [selectedTurf, reducedMotion, themeColors.primary]);

  // Optimized turf selection handler
  const handleTurfSelect = useCallback((turf: Turf) => {
    if (!reducedMotion && switcherRef.current) {
      // Enhanced selection animation
      const tl = gsap.timeline();

      tl.to(switcherRef.current, {
        scale: 0.96,
        duration: 0.1,
        ease: 'power2.out',
      })
      .to(switcherRef.current, {
        scale: 1.02,
        duration: 0.15,
        ease: 'back.out(2)',
      })
      .to(switcherRef.current, {
        scale: 1,
        duration: 0.1,
        ease: 'power2.out',
      });
    }

    setSelectedTurf(turf);
    onTurfChange?.(turf);
  }, [reducedMotion, setSelectedTurf, onTurfChange]);

  // Utility function to truncate text
  const truncateText = useCallback((text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return `${text.substring(0, maxLength - 3)}...`;
  }, []);

  // Enhanced menu items with better theming and accessibility
  const menuItems = useMemo(() => {
    if (!belongingTurfs?.length) return [];

    return belongingTurfs.map((turf) => {
      const isSelected = selectedTurf?.id === turf.id;

      return {
        key: turf.id.toString(),
        label: (
          <div
            className={`
              turf-switcher-item
              flex items-center justify-between min-w-[240px] px-3 py-2.5
              rounded-lg transition-all duration-200 ease-out
              ${isSelected ? 'bg-turf-green/10 dark:bg-turf-green/20' : ''}
              hover:bg-slate-100 dark:hover:bg-slate-700
              focus:outline-none focus-visible:ring-2 focus-visible:ring-turf-green
            `}
            role="menuitem"
            tabIndex={0}
            aria-selected={isSelected}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Text
                  strong={isSelected}
                  className={`
                    text-sm leading-tight transition-colors duration-200
                    ${isSelected
                      ? 'text-turf-green dark:text-turf-light'
                      : 'text-slate-900 dark:text-white'
                    }
                  `}
                  style={{ marginBottom: 0 }}
                >
                  {truncateText(turf.name, maxDisplayLength)}
                </Text>
                {isSelected && (
                  <CheckOutlined
                    className="text-turf-green dark:text-turf-light text-xs"
                    aria-label="Currently selected"
                  />
                )}
              </div>

              {showLocation && turf.location && variant !== 'compact' && (
                <div className="flex items-center gap-1 mt-1">
                  <EnvironmentOutlined className="text-xs text-slate-500 dark:text-slate-400" />
                  <Text
                    type="secondary"
                    className="text-xs leading-tight text-slate-600 dark:text-slate-400"
                    style={{ marginBottom: 0 }}
                  >
                    {truncateText(turf.location, maxDisplayLength + 10)}
                  </Text>
                </div>
              )}
            </div>

            {/* Status indicators */}
            <div className="flex items-center gap-1 ml-2">
              {turf.requires_membership && (
                <Tooltip title="Membership Required">
                  <div className="w-2 h-2 rounded-full bg-yellow-500 dark:bg-yellow-400" />
                </Tooltip>
              )}
              {!turf.is_active && (
                <Tooltip title="Inactive Turf">
                  <div className="w-2 h-2 rounded-full bg-red-500 dark:bg-red-400" />
                </Tooltip>
              )}
              {isSelected && (
                <div
                  className="turf-switcher-selected-indicator ml-1 w-2 h-2 rounded-full bg-turf-green dark:bg-turf-light"
                  style={{
                    boxShadow: `0 0 4px ${themeColors.indicator}`,
                  }}
                />
              )}
            </div>
          </div>
        ),
        onClick: () => handleTurfSelect(turf),
        disabled: !turf.is_active,
      };
    });
  }, [
    belongingTurfs,
    selectedTurf,
    showLocation,
    variant,
    maxDisplayLength,
    truncateText,
    handleTurfSelect,
    themeColors.indicator
  ]);

  // Don't render if no user or no turfs
  if (!user || belongingTurfs.length === 0) {
    return null;
  }

  // Compact variant for limited space
  if (variant === 'compact') {
    return (
      <div ref={switcherRef} className={className}>
        <Dropdown
          menu={{ items: menuItems }}
          trigger={['click']}
          placement={placement}
          disabled={isLoading || belongingTurfs.length <= 1}
          arrow
          dropdownRender={(menu) => (
            <div
              ref={dropdownRef}
              className="turf-switcher-dropdown compact-dropdown"
              style={{
                background: isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(12px)',
                border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
              }}
            >
              {menu}
            </div>
          )}
        >
          <Button
            type="text"
            size={size}
            loading={isLoading}
            className={`
              turf-switcher-button compact-button touch-target
              flex items-center justify-center w-10 h-10
              rounded-full transition-all duration-300 ease-out
              ${isDark
                ? 'text-slate-300 hover:bg-slate-800 hover:text-turf-light'
                : 'text-slate-700 hover:bg-slate-100 hover:text-turf-green'
              }
              focus-visible:ring-2 focus-visible:ring-turf-green focus-visible:ring-offset-2
              ${belongingTurfs.length <= 1 ? 'opacity-50 cursor-not-allowed' : 'spring-bounce'}
            `}
            disabled={belongingTurfs.length <= 1}
            aria-label={`Switch turf. Currently: ${selectedTurf?.name || 'None selected'}`}
          >
            <SwapOutlined className="text-lg" />
          </Button>
        </Dropdown>
      </div>
    );
  }

  // Default and detailed variants
  return (
    <div ref={switcherRef} className={className}>
      <Dropdown
        menu={{ items: menuItems }}
        trigger={['click']}
        placement={placement}
        disabled={isLoading || belongingTurfs.length <= 1}
        arrow
        dropdownRender={(menu) => (
          <div
            ref={dropdownRef}
            className="turf-switcher-dropdown"
            style={{
              background: isDark
                ? 'rgba(30, 41, 59, 0.95)'
                : 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(16px)',
              border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
              boxShadow: isDark
                ? '0 20px 40px rgba(0, 0, 0, 0.4), 0 8px 16px rgba(0, 0, 0, 0.2)'
                : '0 20px 40px rgba(0, 0, 0, 0.15), 0 8px 16px rgba(0, 0, 0, 0.1)',
            }}
          >
            {belongingTurfs.length > 1 && (
              <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-700">
                <Text
                  type="secondary"
                  className="text-xs font-medium uppercase tracking-wide"
                >
                  Switch Turf ({belongingTurfs.length})
                </Text>
              </div>
            )}
            {menu}
          </div>
        )}
      >
        <Tooltip
          title={
            belongingTurfs.length <= 1
              ? "You only belong to one turf"
              : `Switch between ${belongingTurfs.length} turfs`
          }
          placement="top"
        >
          <Button
            type="text"
            size={size}
            loading={isLoading}
            className={`
              turf-switcher-button touch-target spring-bounce
              flex items-center gap-3 px-4 py-2 rounded-xl
              transition-all duration-300 ease-out
              ${isDark
                ? 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-900'
              }
              focus-visible:ring-2 focus-visible:ring-turf-green focus-visible:ring-offset-2
              ${belongingTurfs.length <= 1 ? 'opacity-60 cursor-not-allowed' : ''}
              backdrop-blur-sm
            `}
            style={{
              border: 'none',
              boxShadow: selectedTurf
                ? `0 0 0 1px ${themeColors.primary}40, 0 4px 12px rgba(0, 0, 0, 0.1)`
                : '0 2px 8px rgba(0, 0, 0, 0.05)',
              background: isDark
                ? 'rgba(30, 41, 59, 0.4)'
                : 'rgba(255, 255, 255, 0.7)',
            }}
            disabled={belongingTurfs.length <= 1}
            aria-label={`Current turf: ${selectedTurf?.name || 'None'}. Click to switch.`}
          >
            <Space size={8} align="center">
              {showIcon && belongingTurfs.length > 1 && (
                <SwapOutlined
                  className={`
                    text-base transition-colors duration-200
                    ${selectedTurf ? 'text-turf-green dark:text-turf-light' : ''}
                  `}
                />
              )}

              <div className="flex flex-col items-start min-w-0">
                <Text
                  strong
                  className={`
                    text-sm leading-tight transition-colors duration-200 min-w-0
                    ${isDark ? 'text-white' : 'text-slate-900'}
                  `}
                  style={{ marginBottom: 0 }}
                >
                  {selectedTurf?.name || 'Select Turf'}
                </Text>

                {selectedTurf?.location && showLocation && variant === 'detailed' && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <EnvironmentOutlined className="text-xs text-slate-500 dark:text-slate-400" />
                    <Text
                      type="secondary"
                      className="text-xs leading-tight text-slate-600 dark:text-slate-400 truncate"
                      style={{ marginBottom: 0, maxWidth: '180px' }}
                    >
                      {selectedTurf.location}
                    </Text>
                  </div>
                )}
              </div>

              {/* Status indicator for selected turf */}
              {selectedTurf && (
                <div className="flex items-center gap-1">
                  {selectedTurf.requires_membership && (
                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                  )}
                  <div
                    className="w-2 h-2 rounded-full bg-turf-green dark:bg-turf-light"
                    style={{
                      boxShadow: `0 0 6px ${themeColors.success}60`,
                    }}
                  />
                </div>
              )}
            </Space>
          </Button>
        </Tooltip>
      </Dropdown>
    </div>
  );
};

export default TurfSwitcher;
