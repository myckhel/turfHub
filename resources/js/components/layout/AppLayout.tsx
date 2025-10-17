import { App as AntApp, ConfigProvider, theme as antdTheme } from 'antd';
import React from 'react';
import { useFlash } from '../../hooks/useFlash';
import { useResponsive, useTheme } from '../../hooks/useTheme';
import { getAntdTheme } from '../../stores/theme.store';
import { FlashMessages } from '../shared/FlashMessages';
import { PWAUpdateNotification } from '../shared/PWAUpdateNotification';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { colorScheme, accentColor, isDark } = useTheme();
  const { isMobile } = useResponsive();

  // Initialize flash messages
  useFlash();

  // Get the theme configuration
  const themeConfig = getAntdTheme(colorScheme, accentColor);

  // Apply dark algorithm if needed
  const finalThemeConfig = {
    ...themeConfig,
    algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
  };

  // Add mobile-specific token overrides
  if (isMobile) {
    finalThemeConfig.token = {
      ...finalThemeConfig.token,
      // Mobile-optimized tokens
      controlHeight: 44, // Touch-friendly
      controlHeightLG: 52,
      controlHeightSM: 36,
      fontSize: 16, // Prevent zoom on iOS
      fontSizeLG: 18,
      fontSizeSM: 14,
      paddingLG: 20,
      padding: 16,
      paddingSM: 12,
      marginLG: 20,
      margin: 16,
      marginSM: 12,
      borderRadius: 12,
      borderRadiusLG: 16,
      borderRadiusSM: 8,
    };
  }

  return (
    <ConfigProvider theme={finalThemeConfig}>
      <AntApp>
        <div
          className={`safe-area-inset afro-pattern-bg dark:grunge-bg min-h-screen text-grunge-black transition-all duration-500 ease-out dark:text-electric-lime ${isMobile ? 'mobile-layout' : 'desktop-layout'} relative overflow-hidden`}
        >
          {/* Afro-grunge background effects */}
          <div className="pointer-events-none fixed inset-0">
            <div className="animate-afro-bounce absolute top-0 left-0 h-32 w-32 rounded-full bg-naija-orange opacity-20"></div>
            <div className="animate-naija-pulse absolute top-1/4 right-0 h-24 w-24 rounded-full bg-naija-gold opacity-30"></div>
            <div className="animate-wild-spin absolute bottom-0 left-1/4 h-40 w-40 rounded-full bg-electric-lime opacity-15"></div>
            <div className="animate-grunge-shake absolute right-1/4 bottom-1/4 h-20 w-20 rounded-full bg-sunset-pink opacity-25"></div>
          </div>

          {/* Main content */}
          <div className="relative z-10">{children}</div>

          {/* Global components */}
          <FlashMessages />
          <PWAUpdateNotification />

          {/* Decorative grunge elements */}
          <div className="pointer-events-none fixed right-4 bottom-4 opacity-50">
            <div className="animate-electric-buzz h-8 w-8 rotate-45 transform border-4 border-naija-green"></div>
          </div>
          <div className="pointer-events-none fixed top-4 left-4 opacity-30">
            <div className="animate-color-shift h-6 w-6 rotate-12 transform bg-fire-orange"></div>
          </div>
        </div>
      </AntApp>
    </ConfigProvider>
  );
};
