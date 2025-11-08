import { useEffect, useState } from 'react';

interface MobileOptimizationOptions {
  enableVibration?: boolean;
  optimizeTouch?: boolean;
  preventZoom?: boolean;
  useNativeScrolling?: boolean;
}

interface MobileOptimizationState {
  isMobile: boolean;
  isTablet: boolean;
  isTouch: boolean;
  screenHeight: number;
  screenWidth: number;
  orientation: 'portrait' | 'landscape';
  isStandalone: boolean;
  supportsVibration: boolean;
  devicePixelRatio: number;
  safeAreaInsets: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

export const useMobileOptimization = (options: MobileOptimizationOptions = {}) => {
  const { enableVibration = true, optimizeTouch = true, preventZoom = true, useNativeScrolling = true } = options;

  const [state, setState] = useState<MobileOptimizationState>(() => {
    if (typeof window === 'undefined') {
      return {
        isMobile: false,
        isTablet: false,
        isTouch: false,
        screenHeight: 0,
        screenWidth: 0,
        orientation: 'portrait',
        isStandalone: false,
        supportsVibration: false,
        devicePixelRatio: 1,
        safeAreaInsets: { top: 0, bottom: 0, left: 0, right: 0 },
      };
    }

    const userAgent = navigator.userAgent.toLowerCase();
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    const isTablet = /ipad|tablet|kindle|silk|playbook/i.test(userAgent);
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    return {
      isMobile,
      isTablet,
      isTouch,
      screenHeight: window.innerHeight,
      screenWidth: window.innerWidth,
      orientation: window.innerHeight > window.innerWidth ? 'portrait' : 'landscape',
      isStandalone: window.matchMedia('(display-mode: standalone)').matches,
      supportsVibration: 'vibrate' in navigator,
      devicePixelRatio: window.devicePixelRatio || 1,
      safeAreaInsets: getSafeAreaInsets(),
    };
  });

  // Get safe area insets for mobile devices (especially iOS)
  function getSafeAreaInsets() {
    if (typeof window === 'undefined') {
      return { top: 0, bottom: 0, left: 0, right: 0 };
    }

    const style = getComputedStyle(document.documentElement);

    return {
      top: parseInt(style.getPropertyValue('--sat') || '0', 10),
      bottom: parseInt(style.getPropertyValue('--sab') || '0', 10),
      left: parseInt(style.getPropertyValue('--sal') || '0', 10),
      right: parseInt(style.getPropertyValue('--sar') || '0', 10),
    };
  }

  // Update state on resize and orientation change
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateState = () => {
      setState((prevState) => ({
        ...prevState,
        screenHeight: window.innerHeight,
        screenWidth: window.innerWidth,
        orientation: window.innerHeight > window.innerWidth ? 'portrait' : 'landscape',
        safeAreaInsets: getSafeAreaInsets(),
      }));
    };

    window.addEventListener('resize', updateState);
    window.addEventListener('orientationchange', updateState);

    return () => {
      window.removeEventListener('resize', updateState);
      window.removeEventListener('orientationchange', updateState);
    };
  }, []);

  // Prevent zoom on mobile if requested
  useEffect(() => {
    if (!preventZoom || !state.isMobile) return;

    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
    }

    // Prevent double-tap zoom
    let lastTouchEnd = 0;
    const preventDoubleTapZoom = (event: TouchEvent) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        event.preventDefault();
      }
      lastTouchEnd = now;
    };

    document.addEventListener('touchend', preventDoubleTapZoom, { passive: false });

    return () => {
      document.removeEventListener('touchend', preventDoubleTapZoom);
    };
  }, [preventZoom, state.isMobile]);

  // Optimize touch interactions
  useEffect(() => {
    if (!optimizeTouch || !state.isTouch) return;

    // Add touch-action CSS for better scrolling
    document.body.style.touchAction = useNativeScrolling ? 'manipulation' : 'pan-x pan-y';

    return () => {
      document.body.style.touchAction = '';
    };
  }, [optimizeTouch, useNativeScrolling, state.isTouch]);

  // Utility functions
  const vibrate = (pattern: number | number[] = 200) => {
    if (enableVibration && state.supportsVibration && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  };

  const getOptimalFontSize = (baseFontSize: number = 16) => {
    if (state.isMobile) {
      // Prevent zoom on iOS by using 16px minimum
      return Math.max(baseFontSize, 16);
    }
    return baseFontSize;
  };

  const getOptimalTouchTarget = (baseSize: number = 44) => {
    if (state.isTouch) {
      // Apple and Android guidelines recommend 44px minimum
      return Math.max(baseSize, 44);
    }
    return baseSize;
  };

  const isPortrait = state.orientation === 'portrait';
  const isLandscape = state.orientation === 'landscape';

  const getViewportHeight = () => {
    // Use visual viewport for mobile to account for virtual keyboard
    if (state.isMobile && 'visualViewport' in window) {
      return window.visualViewport?.height || window.innerHeight;
    }
    return window.innerHeight;
  };

  const getDynamicViewportHeight = () => {
    // Use CSS custom properties for dynamic viewport height
    if (state.isMobile) {
      return 'calc(var(--vh, 1vh) * 100)';
    }
    return '100vh';
  };

  const addHapticFeedback = (type: 'light' | 'medium' | 'heavy' = 'light') => {
    if (!state.isMobile) return;

    // iOS haptic feedback
    if ('HapticFeedback' in window) {
      const intensity = { light: 1, medium: 2, heavy: 3 }[type];
      (window as unknown as { HapticFeedback: { vibrate: (intensity: number) => void } }).HapticFeedback.vibrate(intensity);
      return;
    }

    // Fallback to vibration API
    const patterns = {
      light: [50],
      medium: [100],
      heavy: [200],
    };
    vibrate(patterns[type]);
  };

  return {
    ...state,
    isPortrait,
    isLandscape,
    vibrate,
    getOptimalFontSize,
    getOptimalTouchTarget,
    getViewportHeight,
    getDynamicViewportHeight,
    addHapticFeedback,

    // CSS classes for conditional styling
    mobileClasses: {
      container: state.isMobile ? 'mobile-container' : 'desktop-container',
      touchOptimized: state.isTouch ? 'touch-optimized' : '',
      standalone: state.isStandalone ? 'standalone-app' : '',
      orientation: state.orientation,
      safeArea: state.isMobile ? 'safe-area-padding' : '',
    },

    // Responsive breakpoints
    breakpoints: {
      isMobile: state.screenWidth < 768,
      isTablet: state.screenWidth >= 768 && state.screenWidth < 1024,
      isDesktop: state.screenWidth >= 1024,
      isSmallMobile: state.screenWidth < 380,
      isLargeMobile: state.screenWidth >= 380 && state.screenWidth < 768,
    },
  };
};

// CSS-in-JS helper for mobile-optimized styles
export const getMobileOptimizedStyles = (isMobile: boolean, isTouch: boolean) => ({
  // Button styles
  button: {
    minHeight: isTouch ? '44px' : '32px',
    fontSize: isMobile ? '16px' : '14px',
    padding: isMobile ? '12px 20px' : '8px 16px',
    borderRadius: isMobile ? '8px' : '6px',
  },

  // Input styles
  input: {
    minHeight: isTouch ? '44px' : '32px',
    fontSize: isMobile ? '16px' : '14px', // Prevent zoom on iOS
    padding: isMobile ? '12px 16px' : '8px 12px',
  },

  // Card styles
  card: {
    borderRadius: isMobile ? '12px' : '8px',
    padding: isMobile ? '16px' : '12px',
    margin: isMobile ? '8px' : '4px',
  },

  // Modal styles
  modal: {
    borderRadius: isMobile ? '16px 16px 0 0' : '8px',
    maxHeight: isMobile ? '90vh' : '80vh',
  },
});
