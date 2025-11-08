// Re-export all stores for easy importing
export { useAuthStore, type User } from './auth.store';
export { useBettingSelectors, useBettingStore } from './betting.store';
export { useFlashStore, type FlashMessage } from './flash.store';
export { useLayoutStore } from './layout.store';
export { useOfflineBettingStore } from './offlineBetting.store';
export { usePWAStore } from './pwa.store';
export { useTeamStore } from './team.store';
export { useBelongingTurfs, useSelectedTurf, useTurfStore, useTurfSwitcher } from './turf.store';

// Import hooks for the combined hook
import { useAuthStore } from './auth.store';
import { useBettingStore } from './betting.store';
import { useFlashStore } from './flash.store';
import { useLayoutStore } from './layout.store';
import { useOfflineBettingStore } from './offlineBetting.store';
import { usePWAStore } from './pwa.store';
import { useTeamStore } from './team.store';
import { useTurfStore } from './turf.store';

// Combined hook for multiple stores (if needed)
export const useAppStores = () => ({
  auth: useAuthStore(),
  flash: useFlashStore(),
  layout: useLayoutStore(),
  offlineBetting: useOfflineBettingStore(),
  pwa: usePWAStore(),
  team: useTeamStore(),
  turf: useTurfStore(),
  betting: useBettingStore(),
});
