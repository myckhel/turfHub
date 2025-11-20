import { useEffect } from 'react';
import { usePWAStore } from '../stores/pwa.store';

// Helper to detect iOS
const isIOS = () => {
  return (
    ['iPad Simulator', 'iPhone Simulator', 'iPod Simulator', 'iPad', 'iPhone', 'iPod'].includes(navigator.platform) ||
    (navigator.userAgent.includes('Mac') && 'ontouchend' in document)
  );
};

// Helper to check if running as installed PWA
const isInStandaloneMode = () => {
  return (
    window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone || document.referrer.includes('android-app://')
  );
};

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
      console.log('🎯 beforeinstallprompt event fired');
      e.preventDefault();
      setInstallPromptEvent(e);
      setInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Handle app installed
    const handleAppInstalled = () => {
      console.log('✅ App installed successfully');
      setInstalled(true);
      setInstallable(false);
      setInstallPromptEvent(null);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    // Check if app is already installed
    const installed = isInStandaloneMode();
    if (installed) {
      console.log('📱 App is running in standalone mode');
      setInstalled(true);
    } else {
      // For iOS, show install instructions if not installed and not in standalone
      if (isIOS() && !installed) {
        console.log('🍎 iOS device detected - install prompt available');
        setInstallable(true);
      }
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
