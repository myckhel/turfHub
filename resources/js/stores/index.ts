// Re-export all stores for easy importing
export { useAuthStore, type User } from './auth.store';
export { useFlashStore, type FlashMessage } from './flash.store';
export { useLayoutStore } from './layout.store';
export { usePWAStore } from './pwa.store';

// Import hooks for the combined hook
import { useAuthStore } from './auth.store';
import { useFlashStore } from './flash.store';
import { useLayoutStore } from './layout.store';
import { usePWAStore } from './pwa.store';

// Combined hook for multiple stores (if needed)
export const useAppStores = () => ({
  auth: useAuthStore(),
  flash: useFlashStore(),
  layout: useLayoutStore(),
  pwa: usePWAStore(),
});
