import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface LayoutState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  sidebarCollapsed: boolean;
  mobileMenuOpen: boolean;
  currentBreakpoint: 'mobile' | 'tablet' | 'desktop';
  headerHeight: number;
  sidebarWidth: number;
  // Remove theme from layout store - now handled by theme store
}

interface LayoutActions {
  setBreakpoint: (breakpoint: 'mobile' | 'tablet' | 'desktop') => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleMobileMenu: () => void;
  setMobileMenuOpen: (open: boolean) => void;
  setHeaderHeight: (height: number) => void;
  setSidebarWidth: (width: number) => void;
  initializeResponsive: () => void;
}

// Breakpoint configuration
const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  desktop: 1280,
} as const;

export const useLayoutStore = create<LayoutState & LayoutActions>()(
  devtools(
    persist(
      (set, get) => ({
        // State
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        sidebarCollapsed: false,
        mobileMenuOpen: false,
        currentBreakpoint: 'desktop',
        headerHeight: 64,
        sidebarWidth: 280,

        // Actions
        setBreakpoint: (breakpoint) => {
          set(
            {
              currentBreakpoint: breakpoint,
              isMobile: breakpoint === 'mobile',
              isTablet: breakpoint === 'tablet',
              isDesktop: breakpoint === 'desktop',
              // Auto-close mobile menu when switching to larger screens
              mobileMenuOpen: breakpoint === 'mobile' ? get().mobileMenuOpen : false,
              // Auto-collapse sidebar on mobile/tablet
              sidebarCollapsed: breakpoint !== 'desktop' ? true : get().sidebarCollapsed,
            },
            false,
            'layout/setBreakpoint',
          );
        },

        toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }), false, 'layout/toggleSidebar'),

        setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }, false, 'layout/setSidebarCollapsed'),

        toggleMobileMenu: () => set((state) => ({ mobileMenuOpen: !state.mobileMenuOpen }), false, 'layout/toggleMobileMenu'),

        setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }, false, 'layout/setMobileMenuOpen'),

        setHeaderHeight: (height) => set({ headerHeight: height }, false, 'layout/setHeaderHeight'),

        setSidebarWidth: (width) => set({ sidebarWidth: width }, false, 'layout/setSidebarWidth'),

        initializeResponsive: () => {
          if (typeof window === 'undefined') return;

          const updateBreakpoint = () => {
            const width = window.innerWidth;
            let breakpoint: 'mobile' | 'tablet' | 'desktop' = 'desktop';

            if (width < BREAKPOINTS.mobile) {
              breakpoint = 'mobile';
            } else if (width < BREAKPOINTS.tablet) {
              breakpoint = 'tablet';
            } else {
              breakpoint = 'desktop';
            }

            // Only update if breakpoint changed
            if (breakpoint !== get().currentBreakpoint) {
              get().setBreakpoint(breakpoint);
            }
          };

          // Initial check
          updateBreakpoint();

          // Listen for resize events
          const handleResize = () => {
            updateBreakpoint();
          };

          window.addEventListener('resize', handleResize);

          // Cleanup function
          return () => {
            window.removeEventListener('resize', handleResize);
          };
        },
      }),
      {
        name: 'turfmate-layout',
        partialize: (state) => ({
          sidebarCollapsed: state.sidebarCollapsed,
          headerHeight: state.headerHeight,
          sidebarWidth: state.sidebarWidth,
        }),
      },
    ),
    { name: 'LayoutStore' },
  ),
);

// Utility hooks for easier consumption
export const useBreakpoint = () => {
  const { currentBreakpoint, isMobile, isTablet, isDesktop } = useLayoutStore();

  return {
    current: currentBreakpoint,
    isMobile,
    isTablet,
    isDesktop,
    isSmallScreen: isMobile,
    isMediumScreen: isTablet,
    isLargeScreen: isDesktop,
  };
};

export const useSidebar = () => {
  const { sidebarCollapsed, sidebarWidth, toggleSidebar, setSidebarCollapsed, setSidebarWidth } = useLayoutStore();

  return {
    collapsed: sidebarCollapsed,
    width: sidebarWidth,
    toggle: toggleSidebar,
    setCollapsed: setSidebarCollapsed,
    setWidth: setSidebarWidth,
  };
};

export const useMobileMenu = () => {
  const { mobileMenuOpen, toggleMobileMenu, setMobileMenuOpen } = useLayoutStore();

  return {
    open: mobileMenuOpen,
    toggle: toggleMobileMenu,
    setOpen: setMobileMenuOpen,
  };
};
