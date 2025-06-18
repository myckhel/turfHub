import { App as AntApp, ConfigProvider, theme as antdTheme } from 'antd';
import React from 'react';
import { FlashMessages } from '../components/shared/FlashMessages';
import { PWAUpdateNotification } from '../components/shared/PWAUpdateNotification';
import { useFlash } from '../hooks/useFlash';
import { useResponsive, useTheme } from '../hooks/useTheme';
import { getAntdTheme } from '../stores/theme.store';

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
          className={`safe-area-inset min-h-screen items-center justify-center bg-white text-slate-900 transition-colors duration-300 ease-out dark:bg-slate-900 dark:text-white ${isMobile ? 'mobile-layout' : 'desktop-layout'} `}
        >
          {children}

          {/* Global components */}
          <FlashMessages />
          <PWAUpdateNotification />
        </div>
      </AntApp>
    </ConfigProvider>
  );
};
