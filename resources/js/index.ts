// Layout Components
export { AppLayout } from './components/layout/AppLayout';
export { ResponsiveLayout as default } from './components/layout/ResponsiveLayout';

// Navigation Components
export { default as BottomTabNavigation } from './components/navigation/BottomTabNavigation';
export { default as MobileHeader } from './components/navigation/MobileHeader';

// UI Components
export { default as ThemeToggle } from './components/ui/ThemeToggle';
export { default as TurfButton } from './components/ui/TurfButton';
export { default as TurfCard } from './components/ui/TurfCard';
export { default as TurfSwitcher } from './components/ui/TurfSwitcher';

// Hooks
export { useAuth } from './hooks/useAuth';
export { useFlash } from './hooks/useFlash';
export { useResponsive, useTheme } from './hooks/useTheme';
export { default as useTurf } from './hooks/useTurf';
export { default as useTurfSwitcher } from './hooks/useTurfSwitcher';

// Stores
export { useBreakpoint, useLayoutStore, useMobileMenu, useSidebar } from './stores/layout.store';
export { BRAND_COLORS, getAntdTheme, getThemeColors, useThemeStore } from './stores/theme.store';
export { useBelongingTurfs, useSelectedTurf, useTurfStore } from './stores/turf.store';

// Types
export type { ColorScheme, ThemeMode } from './stores/theme.store';
export type {
  Turf,
  TurfSwitcherActions,
  TurfSwitcherPlacement,
  TurfSwitcherProps,
  TurfSwitcherSize,
  TurfSwitcherState,
  TurfSwitcherVariant,
} from './types/turf.types';
