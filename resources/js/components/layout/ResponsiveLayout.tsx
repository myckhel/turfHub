import { useGSAP } from '@gsap/react';
import { Layout as AntLayout } from 'antd';
import { gsap } from 'gsap';
import React, { memo, useEffect, useRef } from 'react';
import { useResponsive } from '../../hooks/useResponsive';
import { useTheme } from '../../hooks/useTheme';
import { useLayoutStore } from '../../stores';
import MobileBettingFloatButton from '../betting/MobileBettingFloatButton';
import DesktopSidebar from './DesktopSidebar';
import LayoutHeader from './LayoutHeader';
import MobileSidebar from './MobileSidebar';

const { Content } = AntLayout;

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

export const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = memo(
  ({
    showBackButton = false,
    showHeader = true,
    headerRightContent,
    safeArea = true,
    backgroundVariant = 'default',
    background,
    onBackPress,
    children,
    className = '',
  }) => {
    const { reducedMotion } = useTheme();
    const { isMobile, isTablet } = useResponsive();
    const { sidebarCollapsed } = useLayoutStore();

    const layoutRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    // Responsive layout logic
    const shouldCollapse = isMobile || isTablet;
    const actuallyCollapsed = shouldCollapse || sidebarCollapsed;
    const useDesktopLayout = !isMobile;
    const useMobileLayout = isMobile;

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
    }, [reducedMotion]);

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
    }, [reducedMotion]);

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
        {useDesktopLayout && <DesktopSidebar collapsed={actuallyCollapsed} />}

        <AntLayout
          className="bg-transparent"
          style={{ marginLeft: useDesktopLayout ? (actuallyCollapsed ? 80 : 280) : 0, background: 'transparent' }}
        >
          {/* Enhanced Header for both desktop and mobile */}
          {showHeader && <LayoutHeader showBackButton={showBackButton} onBackPress={onBackPress} headerRightContent={headerRightContent} />}

          {/* Main Content */}
          <Content
            ref={contentRef}
            className={`turf-content flex-1 bg-transparent transition-all duration-300 ease-out ${showHeader ? '' : ''} ${useMobileLayout ? 'min-h-[calc(100vh-theme(spacing.16))]' : 'min-h-screen'}`}
            style={{ background: 'transparent' }}
          >
            <div className={useDesktopLayout ? 'mx-auto max-w-full' : 'mx-auto max-w-screen-xl'}>{children}</div>
          </Content>

          {/* Mobile Betting Float Button */}
          <MobileBettingFloatButton />
        </AntLayout>
      </AntLayout>
    );
  },
);

export default ResponsiveLayout;
