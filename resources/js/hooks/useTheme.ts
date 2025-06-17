import { useEffect } from 'react';
import { useLayoutStore } from '../stores/layout.store';
import { useThemeStore } from '../stores/theme.store';

/**
 * Hook for managing theme initialization and system preference detection
 */
export const useTheme = () => {
  const {
    mode,
    colorScheme,
    accentColor,
    reducedMotion,
    highContrast,
    setMode,
    setAccentColor,
    toggleReducedMotion,
    toggleHighContrast,
    initializeTheme,
  } = useThemeStore();

  // Initialize theme on mount
  useEffect(() => {
    initializeTheme();
  }, [initializeTheme]);

  return {
    // Current state
    mode,
    colorScheme,
    accentColor,
    reducedMotion,
    highContrast,
    isDark: colorScheme === 'dark',

    // Actions
    setMode,
    setAccentColor,
    toggleReducedMotion,
    toggleHighContrast,

    // Convenience methods
    setLightMode: () => setMode('light'),
    setDarkMode: () => setMode('dark'),
    setSystemMode: () => setMode('system'),
  };
};

/**
 * Hook for responsive design utilities
 */
export const useResponsive = () => {
  const { isMobile, isTablet, isDesktop, currentBreakpoint, initializeResponsive } = useLayoutStore();

  // Initialize responsive detection on mount
  useEffect(() => {
    const cleanup = initializeResponsive();
    return cleanup;
  }, [initializeResponsive]);

  return {
    isMobile,
    isTablet,
    isDesktop,
    currentBreakpoint,

    // Convenience breakpoint checks
    isSmallScreen: isMobile,
    isMediumScreen: isTablet,
    isLargeScreen: isDesktop,

    // CSS class helpers
    mobileClass: isMobile ? 'mobile' : '',
    tabletClass: isTablet ? 'tablet' : '',
    desktopClass: isDesktop ? 'desktop' : '',
    breakpointClass: `breakpoint-${currentBreakpoint}`,

    // Media query helpers
    isTouchDevice: isMobile || isTablet,
    isLandscape: typeof window !== 'undefined' ? window.innerWidth > window.innerHeight : false,
    isPortrait: typeof window !== 'undefined' ? window.innerHeight > window.innerWidth : false,
  };
};
