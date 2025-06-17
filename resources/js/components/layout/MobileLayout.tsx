import { useGSAP } from '@gsap/react';
import { Layout as AntLayout } from 'antd';
import { gsap } from 'gsap';
import React, { useEffect, useRef } from 'react';
import { useResponsive, useTheme } from '../../hooks/useTheme';
import BottomTabNavigation from '../navigation/BottomTabNavigation';
import MobileHeader from '../navigation/MobileHeader';

const { Content } = AntLayout;

interface MobileLayoutProps {
  /** Current active tab for navigation */
  activeTab?: string;
  /** Page title for header */
  title?: string;
  /** Page subtitle for header */
  subtitle?: string;
  /** Show back button in header */
  showBackButton?: boolean;
  /** Show bottom navigation */
  showBottomNav?: boolean;
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

export const MobileLayout: React.FC<MobileLayoutProps> = ({
  activeTab = 'home',
  title,
  subtitle,
  showBackButton = false,
  showBottomNav = true,
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
  const { isDark, reducedMotion } = useTheme();
  const { isMobile } = useResponsive();
  const layoutRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

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

    const backgrounds = {
      default: isDark ? 'bg-slate-900' : 'bg-white',
      gradient: isDark ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' : 'bg-gradient-to-br from-white via-slate-50 to-white',
      pattern: isDark
        ? 'bg-slate-900 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.05)_1px,transparent_0)]'
        : 'bg-white bg-[radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.05)_1px,transparent_0)]',
    };

    return backgrounds[backgroundVariant];
  };

  return (
    <AntLayout ref={layoutRef} className={`min-h-screen ${getBackgroundStyles()} ${safeArea ? 'safe-area-inset' : ''} ${className} `}>
      {/* Mobile Header */}
      {showHeader && (
        <MobileHeader title={title} subtitle={subtitle} showBackButton={showBackButton} onBackPress={onBackPress} rightContent={headerRightContent} />
      )}

      {/* Custom Header Content */}
      {headerContent && <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl dark:bg-slate-900/90">{headerContent}</div>}

      {/* Main Content */}
      <Content
        ref={contentRef}
        className={`flex-1 ${contentPadding ? 'px-4 py-6' : ''} ${showBottomNav ? 'pb-20' : 'pb-6'} ${isMobile ? 'min-h-screen' : ''} transition-all duration-300 ease-out`}
      >
        <div className="mx-auto max-w-screen-xl">{children}</div>
      </Content>

      {/* Bottom Navigation */}
      {showBottomNav && isMobile && <BottomTabNavigation activeTab={activeTab} />}
    </AntLayout>
  );
};

export default MobileLayout;
