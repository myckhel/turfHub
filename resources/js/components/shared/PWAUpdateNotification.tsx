import { DownloadOutlined, SyncOutlined } from '@ant-design/icons';
import { Button, notification } from 'antd';
import React, { useEffect } from 'react';
import { usePWA } from '../../hooks/usePWA';

export const PWAUpdateNotification: React.FC = () => {
  const { updateAvailable, canInstall, installApp, updateApp } = usePWA();
  const [api, contextHolder] = notification.useNotification();

  useEffect(() => {
    if (updateAvailable) {
      api.info({
        message: 'Update Available',
        description: 'A new version of TurfMate is available. Update now for the latest features and improvements.',
        duration: 0, // Don't auto-close
        btn: (
          <div className="flex space-x-2">
            <Button type="text" size="small" onClick={() => api.destroy()}>
              Later
            </Button>
            <Button
              type="primary"
              size="small"
              icon={<SyncOutlined />}
              onClick={() => {
                updateApp();
                api.destroy();
              }}
            >
              Update Now
            </Button>
          </div>
        ),
        key: 'update-notification',
      });
    }
  }, [updateAvailable, api, updateApp]);

  useEffect(() => {
    if (canInstall) {
      api.info({
        message: 'Install TurfMate',
        description: 'Install TurfMate on your device for a better experience and quick access.',
        duration: 10,
        btn: (
          <div className="flex space-x-2">
            <Button type="text" size="small" onClick={() => api.destroy('install-notification')}>
              Not Now
            </Button>
            <Button
              type="primary"
              size="small"
              icon={<DownloadOutlined />}
              onClick={() => {
                installApp();
                api.destroy('install-notification');
              }}
            >
              Install
            </Button>
          </div>
        ),
        key: 'install-notification',
      });
    }
  }, [canInstall, api, installApp]);

  return <>{contextHolder}</>;
};
