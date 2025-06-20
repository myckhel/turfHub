import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// TurfMate Brand Colors
export const BRAND_COLORS = {
  // Primary Brand Colors
  turfGreen: '#1B5E20',
  skyBlue: '#3B8CB7',
  electricYellow: '#FFEB3B',
  deepSlate: '#212121',

  // Extended Palette
  lightTurf: '#2E7D32',
  darkTurf: '#1A5A1A',
  lightSky: '#5DADE2',
  darkSky: '#2874A6',
  lightYellow: '#FFF59D',
  darkYellow: '#F9A825',

  // Semantic Colors
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3',

  // Neutral Colors
  white: '#FFFFFF',
  lightGray: '#F5F5F5',
  mediumGray: '#BDBDBD',
  darkGray: '#424242',
  black: '#000000',
} as const;

export type ThemeMode = 'light' | 'dark' | 'system';
export type ColorScheme = 'light' | 'dark';

interface ThemeState {
  mode: ThemeMode;
  colorScheme: ColorScheme;
  isSystemDark: boolean;
  accentColor: keyof typeof BRAND_COLORS;
  reducedMotion: boolean;
  highContrast: boolean;
}

interface ThemeActions {
  setMode: (mode: ThemeMode) => void;
  setColorScheme: (scheme: ColorScheme) => void;
  setSystemDark: (isDark: boolean) => void;
  setAccentColor: (color: keyof typeof BRAND_COLORS) => void;
  toggleReducedMotion: () => void;
  toggleHighContrast: () => void;
  initializeTheme: () => void;
}

export const useThemeStore = create<ThemeState & ThemeActions>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial State
        mode: 'system',
        colorScheme: typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
        isSystemDark: typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches,
        accentColor: 'turfGreen',
        reducedMotion: false,
        highContrast: false,

        // Actions
        setMode: (mode) => {
          const { isSystemDark } = get();
          const colorScheme = mode === 'system' ? (isSystemDark ? 'dark' : 'light') : (mode as ColorScheme);

          set({ mode, colorScheme }, false, 'theme/setMode');

          // Update document class and data attributes
          if (typeof document !== 'undefined') {
            const root = document.documentElement;
            root.classList.toggle('dark', colorScheme === 'dark');
            root.setAttribute('data-theme', colorScheme);

            // Ensure CSS custom properties are updated
            if (colorScheme === 'dark') {
              root.style.colorScheme = 'dark';
            } else {
              root.style.colorScheme = 'light';
            }
          }
        },

        setColorScheme: (colorScheme) => {
          set({ colorScheme }, false, 'theme/setColorScheme');

          if (typeof document !== 'undefined') {
            const root = document.documentElement;
            root.classList.toggle('dark', colorScheme === 'dark');
            root.setAttribute('data-theme', colorScheme);

            // Ensure CSS custom properties are updated
            if (colorScheme === 'dark') {
              root.style.colorScheme = 'dark';
            } else {
              root.style.colorScheme = 'light';
            }
          }
        },

        setSystemDark: (isSystemDark) => {
          const { mode } = get();
          set({ isSystemDark }, false, 'theme/setSystemDark');

          // Update color scheme if in system mode
          if (mode === 'system') {
            get().setColorScheme(isSystemDark ? 'dark' : 'light');
          }
        },

        setAccentColor: (accentColor) => {
          set({ accentColor }, false, 'theme/setAccentColor');

          if (typeof document !== 'undefined') {
            document.documentElement.setAttribute('data-accent', accentColor);
          }
        },

        toggleReducedMotion: () => {
          const reducedMotion = !get().reducedMotion;
          set({ reducedMotion }, false, 'theme/toggleReducedMotion');

          if (typeof document !== 'undefined') {
            document.documentElement.classList.toggle('reduce-motion', reducedMotion);
          }
        },

        toggleHighContrast: () => {
          const highContrast = !get().highContrast;
          set({ highContrast }, false, 'theme/toggleHighContrast');

          if (typeof document !== 'undefined') {
            document.documentElement.classList.toggle('high-contrast', highContrast);
          }
        },

        initializeTheme: () => {
          if (typeof window === 'undefined') return;

          const { mode, accentColor, reducedMotion, highContrast } = get();

          // Detect system dark mode preference
          const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
          get().setSystemDark(mediaQuery.matches);

          // Listen for system theme changes
          mediaQuery.addEventListener('change', (e) => {
            get().setSystemDark(e.matches);
          });

          // Detect reduced motion preference
          const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
          if (prefersReducedMotion.matches && !reducedMotion) {
            get().toggleReducedMotion();
          }

          // Initialize theme - this will trigger DOM updates
          get().setMode(mode);
          get().setAccentColor(accentColor);

          // Apply accessibility preferences immediately
          if (typeof document !== 'undefined') {
            const root = document.documentElement;
            root.classList.toggle('reduce-motion', reducedMotion);
            root.classList.toggle('high-contrast', highContrast);

            // Ensure proper initial color scheme is set
            const { colorScheme } = get();
            root.classList.toggle('dark', colorScheme === 'dark');
            root.setAttribute('data-theme', colorScheme);
            root.style.colorScheme = colorScheme;
          }
        },
      }),
      {
        name: 'turfmate-theme',
        partialize: (state) => ({
          mode: state.mode,
          accentColor: state.accentColor,
          reducedMotion: state.reducedMotion,
          highContrast: state.highContrast,
        }),
        onRehydrateStorage: () => (state) => {
          // Apply theme immediately after rehydration
          if (state && typeof document !== 'undefined') {
            const root = document.documentElement;
            root.classList.toggle('dark', state.colorScheme === 'dark');
            root.setAttribute('data-theme', state.colorScheme);
            root.style.colorScheme = state.colorScheme;
          }
        },
      },
    ),
    { name: 'ThemeStore' },
  ),
);

// Utility functions for theme consumption
export const getThemeColors = (colorScheme: ColorScheme) => {
  const colors = BRAND_COLORS;

  return {
    primary: colors.turfGreen,
    primaryLight: colors.lightTurf,
    primaryDark: colors.darkTurf,

    accent: colors.skyBlue,
    accentLight: colors.lightSky,
    accentDark: colors.darkSky,

    highlight: colors.electricYellow,
    highlightLight: colors.lightYellow,
    highlightDark: colors.darkYellow,

    background: colorScheme === 'dark' ? colors.deepSlate : colors.white,
    surface: colorScheme === 'dark' ? colors.darkGray : colors.lightGray,
    onBackground: colorScheme === 'dark' ? colors.white : colors.deepSlate,
    onSurface: colorScheme === 'dark' ? colors.lightGray : colors.darkGray,

    success: colors.success,
    warning: colors.warning,
    error: colors.error,
    info: colors.info,

    border: colorScheme === 'dark' ? colors.mediumGray : colors.lightGray,
    divider: colorScheme === 'dark' ? colors.darkGray : colors.mediumGray,

    // Additional colors for consistent access
    white: colors.white,
    lightGray: colors.lightGray,
    mediumGray: colors.mediumGray,
    darkGray: colors.darkGray,
    black: colors.black,
  };
};

export const getAntdTheme = (colorScheme: ColorScheme, accentColor: keyof typeof BRAND_COLORS) => {
  const colors = getThemeColors(colorScheme);
  const isDark = colorScheme === 'dark';

  return {
    token: {
      // Color tokens
      colorPrimary: BRAND_COLORS[accentColor] || colors.primary,
      colorSuccess: colors.success,
      colorWarning: colors.warning,
      colorError: colors.error,
      colorInfo: colors.info,

      // Background tokens
      colorBgBase: colors.background,
      colorBgContainer: colors.surface,
      colorBgElevated: isDark ? colors.darkGray : colors.white,
      colorBgLayout: colors.background,
      colorBgSpotlight: isDark ? colors.mediumGray : colors.lightGray,

      // Text tokens
      colorText: colors.onBackground,
      colorTextSecondary: colors.onSurface,
      colorTextTertiary: isDark ? colors.mediumGray : colors.darkGray,
      colorTextQuaternary: isDark ? colors.darkGray : colors.mediumGray,

      // Border tokens
      colorBorder: colors.border,
      colorBorderSecondary: colors.divider,

      // Typography
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      fontSize: 16,
      fontSizeHeading1: 32,
      fontSizeHeading2: 24,
      fontSizeHeading3: 20,
      fontSizeHeading4: 18,
      fontSizeHeading5: 16,
      fontSizeLG: 18,
      fontSizeSM: 14,
      fontSizeXL: 20,

      // Layout tokens
      borderRadius: 12,
      borderRadiusLG: 16,
      borderRadiusSM: 8,
      borderRadiusXS: 4,

      // Control tokens (mobile-optimized)
      controlHeight: 44, // Touch-friendly height
      controlHeightLG: 52,
      controlHeightSM: 36,
      controlHeightXS: 28,

      // Spacing
      padding: 16,
      paddingLG: 24,
      paddingSM: 12,
      paddingXL: 32,
      paddingXS: 8,
      paddingXXS: 4,

      margin: 16,
      marginLG: 24,
      marginSM: 12,
      marginXL: 32,
      marginXS: 8,
      marginXXS: 4,

      // Motion tokens
      motionDurationFast: '0.1s',
      motionDurationMid: '0.2s',
      motionDurationSlow: '0.3s',
      motionEaseInOut: 'cubic-bezier(0.645, 0.045, 0.355, 1)',
      motionEaseInOutCirc: 'cubic-bezier(0.78, 0.14, 0.15, 0.86)',
      motionEaseOut: 'cubic-bezier(0.215, 0.61, 0.355, 1)',
      motionEaseOutBack: 'cubic-bezier(0.12, 0.4, 0.29, 1.46)',
      motionEaseOutCirc: 'cubic-bezier(0.08, 0.82, 0.17, 1)',
      motionEaseOutQuint: 'cubic-bezier(0.23, 1, 0.32, 1)',

      // Z-index
      zIndexBase: 0,
      zIndexPopupBase: 1000,
    },
    algorithm: isDark ? undefined : undefined, // Will be set properly with antd theme algorithm
  };
};
