import { useEffect } from 'react';
import { useLayoutStore } from '../stores/layout.store';

export const useResponsive = () => {
  const { isMobile, isTablet, isDesktop, currentBreakpoint, setBreakpoint } = useLayoutStore();

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;

      if (width < 768) {
        setBreakpoint('mobile');
      } else if (width < 1024) {
        setBreakpoint('tablet');
      } else {
        setBreakpoint('desktop');
      }
    };

    // Set initial breakpoint
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, [setBreakpoint]);

  return {
    isMobile,
    isTablet,
    isDesktop,
    currentBreakpoint,
    // Utility functions
    isSmallScreen: isMobile,
    isMediumScreen: isTablet,
    isLargeScreen: isDesktop,
    // Responsive values
    breakpoints: {
      mobile: 767,
      tablet: 1023,
      desktop: 1024,
    },
  };
};
