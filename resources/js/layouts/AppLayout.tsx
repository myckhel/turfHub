import { App as AntApp, ConfigProvider } from 'antd';
import React from 'react';
import { FlashMessages } from '../components/shared/FlashMessages';
import { PWAUpdateNotification } from '../components/shared/PWAUpdateNotification';
import { useFlash } from '../hooks/useFlash';
import { useResponsive } from '../hooks/useResponsive';
import { useLayoutStore } from '../stores/layout.store';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { theme } = useLayoutStore();
  const { isMobile } = useResponsive();

  // Initialize flash messages
  useFlash();

  const antdTheme = {
    token: {
      colorPrimary: '#10b981', // emerald-500
      colorSuccess: '#10b981',
      colorWarning: '#f59e0b',
      colorError: '#ef4444',
      colorInfo: '#3b82f6',
      borderRadius: 8,
      fontFamily: 'Inter, system-ui, sans-serif',
      // Mobile-first responsive tokens
      fontSize: isMobile ? 14 : 16,
      controlHeight: isMobile ? 36 : 40,
    },
    algorithm: theme === 'dark' ? undefined : undefined, // Add dark theme algorithm when needed
  };

  return (
    <ConfigProvider theme={antdTheme}>
      <AntApp>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          {children}

          {/* Global components */}
          <FlashMessages />
          <PWAUpdateNotification />
        </div>
      </AntApp>
    </ConfigProvider>
  );
};
