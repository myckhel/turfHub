import type { SharedData } from '@/types';
import { AppleOutlined, DownloadOutlined, InfoCircleOutlined, SyncOutlined } from '@ant-design/icons';
import { usePage } from '@inertiajs/react';
import { Button, notification } from 'antd';
import React, { useEffect, useState } from 'react';
import { usePWA } from '../../hooks/usePWA';

// Helper to detect iOS
const isIOS = () => {
  return (
    ['iPad Simulator', 'iPhone Simulator', 'iPod Simulator', 'iPad', 'iPhone', 'iPod'].includes(navigator.platform) ||
    (navigator.userAgent.includes('Mac') && 'ontouchend' in document)
  );
};

export const PWAUpdateNotification: React.FC = () => {
  const { updateAvailable, canInstall, installApp, updateApp, isInstalled } = usePWA();
  const { name } = usePage<SharedData>().props;
  const [api, contextHolder] = notification.useNotification();
  const [hasShownIOSPrompt, setHasShownIOSPrompt] = useState(false);

  useEffect(() => {
    if (updateAvailable) {
      api.info({
        message: 'Update Available',
        description: `A new version of ${name} is available. Update now for the latest features and improvements.`,
        duration: 0,
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
    if (canInstall && !isInstalled) {
      // Check if this is iOS
      const isiOSDevice = isIOS();

      if (isiOSDevice && !hasShownIOSPrompt) {
        // Show iOS-specific install instructions
        setTimeout(() => {
          api.info({
            message: (
              <span>
                <AppleOutlined className="mr-2" />
                Install {name}
              </span>
            ),
            description: (
              <div>
                <p className="mb-2">To install {name} on your iOS device:</p>
                <ol className="ml-4 list-decimal space-y-1 text-sm">
                  <li>
                    Tap the Share button <span className="inline-block">⎋</span>
                  </li>
                  <li>Scroll down and tap "Add to Home Screen"</li>
                  <li>Tap "Add" in the top right corner</li>
                </ol>
              </div>
            ),
            duration: 15,
            placement: 'bottomRight',
            btn: (
              <Button
                type="text"
                size="small"
                icon={<InfoCircleOutlined />}
                onClick={() => {
                  setHasShownIOSPrompt(true);
                  api.destroy('install-notification-ios');
                }}
              >
                Got it
              </Button>
            ),
            key: 'install-notification-ios',
          });
        }, 3000); // Show after 3 seconds
      } else if (!isiOSDevice) {
        // Show standard install prompt for Android/Desktop
        api.info({
          message: `Install ${name}`,
          description: `Install ${name} on your device for a better experience and quick access.`,
          duration: 10,
          placement: 'bottomRight',
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
    }
  }, [canInstall, isInstalled, api, installApp, hasShownIOSPrompt]);

  return <>{contextHolder}</>;
};
