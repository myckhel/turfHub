import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface PWAState {
  isInstallable: boolean;
  isInstalled: boolean;
  isOnline: boolean;
  updateAvailable: boolean;
  installPromptEvent: BeforeInstallPromptEvent | null;
  lastUpdateCheck: Date | null;
  cacheStatus: 'checking' | 'downloading' | 'updateready' | 'idle';
  serviceWorkerRegistration: ServiceWorkerRegistration | null;
}

interface PWAActions {
  setInstallable: (installable: boolean) => void;
  setInstalled: (installed: boolean) => void;
  setOnlineStatus: (online: boolean) => void;
  setUpdateAvailable: (available: boolean) => void;
  setInstallPromptEvent: (event: BeforeInstallPromptEvent | null) => void;
  setLastUpdateCheck: (date: Date) => void;
  setCacheStatus: (status: PWAState['cacheStatus']) => void;
  setServiceWorkerRegistration: (registration: ServiceWorkerRegistration | null) => void;
  installApp: () => Promise<void>;
  updateApp: () => Promise<void>;
  checkForUpdates: () => Promise<void>;
}

// Extend WindowEventMap to include beforeinstallprompt
declare global {
  interface BeforeInstallPromptEvent extends Event {
    prompt(): Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
  }

  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

export const usePWAStore = create<PWAState & PWAActions>()(
  devtools(
    persist(
      (set, get) => ({
        // State
        isInstallable: false,
        isInstalled: false,
        isOnline: navigator.onLine,
        updateAvailable: false,
        installPromptEvent: null,
        lastUpdateCheck: null,
        cacheStatus: 'idle',
        serviceWorkerRegistration: null,

        // Actions
        setInstallable: (installable) => set({ isInstallable: installable }, false, 'pwa/setInstallable'),

        setInstalled: (installed) => set({ isInstalled: installed }, false, 'pwa/setInstalled'),

        setOnlineStatus: (online) => set({ isOnline: online }, false, 'pwa/setOnlineStatus'),

        setUpdateAvailable: (available) => set({ updateAvailable: available }, false, 'pwa/setUpdateAvailable'),

        setInstallPromptEvent: (event) => set({ installPromptEvent: event }, false, 'pwa/setInstallPromptEvent'),

        setLastUpdateCheck: (date) => set({ lastUpdateCheck: date }, false, 'pwa/setLastUpdateCheck'),

        setCacheStatus: (status) => set({ cacheStatus: status }, false, 'pwa/setCacheStatus'),

        setServiceWorkerRegistration: (registration) => set({ serviceWorkerRegistration: registration }, false, 'pwa/setServiceWorkerRegistration'),

        installApp: async () => {
          const { installPromptEvent } = get();
          if (!installPromptEvent) {
            console.log('No install prompt event available');
            return;
          }

          try {
            console.log('📲 Showing install prompt');
            await installPromptEvent.prompt();
            const choiceResult = await installPromptEvent.userChoice;

            console.log('User choice:', choiceResult.outcome);
            if (choiceResult.outcome === 'accepted') {
              set({ isInstalled: true, installPromptEvent: null, isInstallable: false });
            }
          } catch (error) {
            console.error('Error installing app:', error);
          }
        },

        updateApp: async () => {
          const { serviceWorkerRegistration } = get();
          if (!serviceWorkerRegistration || !serviceWorkerRegistration.waiting) return;

          try {
            serviceWorkerRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
            set({ updateAvailable: false });
            window.location.reload();
          } catch (error) {
            console.error('Error updating app:', error);
          }
        },

        checkForUpdates: async () => {
          const { serviceWorkerRegistration } = get();
          if (!serviceWorkerRegistration) return;

          try {
            set({ cacheStatus: 'checking' });
            await serviceWorkerRegistration.update();
            set({ lastUpdateCheck: new Date(), cacheStatus: 'idle' });
          } catch (error) {
            console.error('Error checking for updates:', error);
            set({ cacheStatus: 'idle' });
          }
        },
      }),
      {
        name: 'turfhub-pwa',
        partialize: (state) => ({
          isInstalled: state.isInstalled,
          lastUpdateCheck: state.lastUpdateCheck,
        }),
      },
    ),
    { name: 'PWAStore' },
  ),
);
