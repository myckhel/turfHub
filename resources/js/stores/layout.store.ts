import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface LayoutState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  sidebarCollapsed: boolean;
  mobileMenuOpen: boolean;
  currentBreakpoint: 'mobile' | 'tablet' | 'desktop';
  headerHeight: number;
  sidebarWidth: number;
  theme: 'light' | 'dark' | 'system';
}

interface LayoutActions {
  setBreakpoint: (breakpoint: 'mobile' | 'tablet' | 'desktop') => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleMobileMenu: () => void;
  setMobileMenuOpen: (open: boolean) => void;
  setHeaderHeight: (height: number) => void;
  setSidebarWidth: (width: number) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

export const useLayoutStore = create<LayoutState & LayoutActions>()(
  devtools(
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
      theme: 'system',

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
          'layout/setBreakpoint'
        );
      },

      toggleSidebar: () =>
        set(
          (state) => ({ sidebarCollapsed: !state.sidebarCollapsed }),
          false,
          'layout/toggleSidebar'
        ),

      setSidebarCollapsed: (collapsed) =>
        set({ sidebarCollapsed: collapsed }, false, 'layout/setSidebarCollapsed'),

      toggleMobileMenu: () =>
        set(
          (state) => ({ mobileMenuOpen: !state.mobileMenuOpen }),
          false,
          'layout/toggleMobileMenu'
        ),

      setMobileMenuOpen: (open) =>
        set({ mobileMenuOpen: open }, false, 'layout/setMobileMenuOpen'),

      setHeaderHeight: (height) =>
        set({ headerHeight: height }, false, 'layout/setHeaderHeight'),

      setSidebarWidth: (width) =>
        set({ sidebarWidth: width }, false, 'layout/setSidebarWidth'),

      setTheme: (theme) =>
        set({ theme }, false, 'layout/setTheme'),
    }),
    { name: 'LayoutStore' }
  )
);
