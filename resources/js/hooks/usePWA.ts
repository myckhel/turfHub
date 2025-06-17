import { useEffect } from 'react';
import { usePWAStore } from '../stores/pwa.store';

export const usePWA = () => {
  const {
    isInstallable,
    isInstalled,
    isOnline,
    updateAvailable,
    setInstallable,
    setInstalled,
    setOnlineStatus,
    setUpdateAvailable,
    setInstallPromptEvent,
    setServiceWorkerRegistration,
    installApp,
    updateApp,
    checkForUpdates,
  } = usePWAStore();

  useEffect(() => {
    // Handle online/offline status
    const handleOnline = () => setOnlineStatus(true);
    const handleOffline = () => setOnlineStatus(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Handle install prompt
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setInstallPromptEvent(e);
      setInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Handle app installed
    const handleAppInstalled = () => {
      setInstalled(true);
      setInstallable(false);
      setInstallPromptEvent(null);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    // Check if app is already installed (in standalone mode)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true);
    }

    // Service Worker registration and updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        setServiceWorkerRegistration(registration);

        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setUpdateAvailable(true);
              }
            });
          }
        });
      });

      // Handle service worker messages
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'SW_UPDATE_READY') {
          setUpdateAvailable(true);
        }
      });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [setOnlineStatus, setInstallPromptEvent, setInstallable, setInstalled, setServiceWorkerRegistration, setUpdateAvailable]);

  return {
    isInstallable,
    isInstalled,
    isOnline,
    updateAvailable,
    installApp,
    updateApp,
    checkForUpdates,
    canInstall: isInstallable && !isInstalled,
    canUpdate: updateAvailable,
  };
};
