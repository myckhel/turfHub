import { Queue } from 'workbox-background-sync';
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies';

declare const self: ServiceWorkerGlobalScope;

// Precache app shell
precacheAndRoute(self.__WB_MANIFEST);

// Clean up old caches
cleanupOutdatedCaches();

// Cache strategies
registerRoute(
  // Cache CSS, JS, and Web Worker imports
  ({ request }) => request.destination === 'script' || request.destination === 'style' || request.destination === 'worker',
  new CacheFirst({
    cacheName: 'static-resources',
    plugins: [
      {
        cacheKeyWillBeUsed: async ({ request }) => {
          // Add version parameter to cache key
          return `${request.url}?v=${new Date().getTime()}`;
        },
      },
    ],
  }),
);

// Cache images
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images',
    plugins: [
      {
        cacheWillUpdate: async ({ response }) => {
          return response.status === 200 ? response : null;
        },
      },
    ],
  }),
);

// API routes - network first with cache fallback
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api-cache',
    networkTimeoutSeconds: 3,
    plugins: [
      {
        cacheWillUpdate: async ({ response }) => {
          return response.status === 200 ? response : null;
        },
      },
    ],
  }),
);

// Betting data - shorter cache for real-time data
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/betting/'),
  new NetworkFirst({
    cacheName: 'betting-cache',
    networkTimeoutSeconds: 2,
    plugins: [
      {
        cacheWillUpdate: async ({ response }) => {
          return response.status === 200 ? response : null;
        },
        cacheKeyWillBeUsed: async ({ request }) => {
          // Add timestamp to prevent stale betting data
          const url = new URL(request.url);
          url.searchParams.set('_cache', Math.floor(Date.now() / 30000).toString()); // 30 second cache groups
          return url.toString();
        },
      },
    ],
  }),
);

// Wallet and user data - balance between freshness and offline access
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/wallet/') || url.pathname.includes('/user/'),
  new NetworkFirst({
    cacheName: 'user-data-cache',
    networkTimeoutSeconds: 3,
    plugins: [
      {
        cacheWillUpdate: async ({ response }) => {
          return response.status === 200 ? response : null;
        },
      },
    ],
  }),
);

// App pages - stale while revalidate
registerRoute(
  ({ request }) => request.mode === 'navigate',
  new StaleWhileRevalidate({
    cacheName: 'pages',
    plugins: [
      {
        cacheWillUpdate: async ({ response }) => {
          return response.status === 200 ? response : null;
        },
      },
    ],
  }),
);

// Background sync for failed API requests
const queue = new Queue('api-queue', {
  onSync: async ({ queue }) => {
    let entry;
    while ((entry = await queue.shiftRequest())) {
      try {
        await fetch(entry.request);
      } catch (error) {
        console.error('Background sync failed:', error);
        await queue.unshiftRequest(entry);
        throw error;
      }
    }
  },
});

// Background sync for betting-related requests
const bettingQueue = new Queue('betting-queue', {
  onSync: async ({ queue }) => {
    let entry;
    while ((entry = await queue.shiftRequest())) {
      try {
        const response = await fetch(entry.request);
        if (response.ok) {
          // Notify user of successful bet placement
          self.registration.showNotification('Bet Placed Successfully', {
            body: 'Your bet has been placed successfully!',
            icon: '/logo.svg',
            badge: '/logo.svg',
            tag: 'bet-success',
            data: { url: '/app/betting/history' },
          });
        }
      } catch (error) {
        console.error('Betting sync failed:', error);
        await queue.unshiftRequest(entry);
        throw error;
      }
    }
  },
});

// Handle betting requests with background sync
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/betting/') && url.pathname.includes('place-bet'),
  async ({ request }) => {
    try {
      const response = await fetch(request.clone());
      return response;
    } catch (error) {
      // Store bet for later sync
      await bettingQueue.pushRequest({ request });

      // Show offline notification
      self.registration.showNotification('Bet Saved for Later', {
        body: "Your bet will be placed when you're back online.",
        icon: '/logo.svg',
        badge: '/logo.svg',
        tag: 'bet-offline',
      });

      throw error;
    }
  },
  'POST',
);

registerRoute(
  ({ url }) => url.pathname.startsWith('/api/') && url.pathname.includes('bookings'),
  async ({ request }) => {
    try {
      const response = await fetch(request.clone());
      return response;
    } catch (error) {
      await queue.pushRequest({ request });
      throw error;
    }
  },
  'POST',
);

// Handle app updates
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Handle push notifications (future feature)
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();

  // Enhanced notification options based on type
  let options = {
    body: data.body,
    icon: '/logo.svg',
    badge: '/logo.svg',
    data: data.data,
    actions: data.actions || [],
    vibrate: [200, 100, 200], // Mobile vibration pattern
    requireInteraction: data.requireInteraction || false,
    renotify: true,
    tag: data.tag || 'default',
  };

  // Betting-specific notifications
  if (data.type === 'bet_result') {
    options = {
      ...options,
      icon: data.result === 'won' ? '/icons/trophy.svg' : '/icons/heart-broken.svg',
      vibrate: data.result === 'won' ? [100, 50, 100, 50, 100] : [200],
      actions: [
        {
          action: 'view_history',
          title: 'View History',
          icon: '/icons/history.svg',
        },
        {
          action: 'place_new_bet',
          title: 'Place New Bet',
          icon: '/icons/money.svg',
        },
      ],
    };
  }

  // Match update notifications
  if (data.type === 'match_update') {
    options = {
      ...options,
      vibrate: [100, 50, 100],
      actions: [
        {
          action: 'view_match',
          title: 'View Match',
          icon: '/icons/football.svg',
        },
        {
          action: 'bet_now',
          title: 'Bet Now',
          icon: '/icons/money.svg',
        },
      ],
    };
  }

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  let urlToOpen = '/app/dashboard';

  if (event.action) {
    // Handle action buttons
    switch (event.action) {
      case 'view_history':
        urlToOpen = '/app/betting/history';
        break;
      case 'place_new_bet':
      case 'bet_now':
        urlToOpen = '/app/betting';
        break;
      case 'view_match':
        urlToOpen = event.notification.data?.matchUrl || '/app/dashboard';
        break;
      default:
        urlToOpen = event.action;
    }
  } else {
    // Handle notification body click
    urlToOpen = event.notification.data?.url || '/app/dashboard';
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if window is already open
      for (const client of clientList) {
        if (client.url.includes(urlToOpen.split('?')[0]) && 'focus' in client) {
          return client.focus();
        }
      }

      // Open new window if not found
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    }),
  );
});

// Send message to client about updates
self.addEventListener('install', () => {
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    clients.claim().then(() => {
      // Send update message to all clients
      return clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'SW_UPDATE_READY' });
        });
      });
    }),
  );
});
