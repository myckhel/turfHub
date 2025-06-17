import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate, CacheFirst, NetworkFirst } from 'workbox-strategies';
import { Queue } from 'workbox-background-sync';

declare const self: ServiceWorkerGlobalScope;

// Precache app shell
precacheAndRoute(self.__WB_MANIFEST);

// Clean up old caches
cleanupOutdatedCaches();

// Cache strategies
registerRoute(
  // Cache CSS, JS, and Web Worker imports
  ({ request }) => request.destination === 'script' || 
                   request.destination === 'style' ||
                   request.destination === 'worker',
  new CacheFirst({
    cacheName: 'static-resources',
    plugins: [{
      cacheKeyWillBeUsed: async ({ request }) => {
        // Add version parameter to cache key
        return `${request.url}?v=${new Date().getTime()}`;
      },
    }],
  })
);

// Cache images
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images',
    plugins: [{
      cacheWillUpdate: async ({ response }) => {
        return response.status === 200 ? response : null;
      },
    }],
  })
);

// API routes - network first with cache fallback
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api-cache',
    networkTimeoutSeconds: 3,
    plugins: [{
      cacheWillUpdate: async ({ response }) => {
        return response.status === 200 ? response : null;
      },
    }],
  })
);

// App pages - stale while revalidate
registerRoute(
  ({ request }) => request.mode === 'navigate',
  new StaleWhileRevalidate({
    cacheName: 'pages',
    plugins: [{
      cacheWillUpdate: async ({ response }) => {
        return response.status === 200 ? response : null;
      },
    }],
  })
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
  'POST'
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
  const options = {
    body: data.body,
    icon: '/logo.svg',
    badge: '/logo.svg',
    data: data.data,
    actions: data.actions || [],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action) {
    // Handle action buttons
    clients.openWindow(event.action);
  } else {
    // Handle notification body click
    const urlToOpen = event.notification.data?.url || '/dashboard';
    
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        // Check if window is already open
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Open new window if not found
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
    );
  }
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
    })
  );
});
