import type { VitePWAOptions } from 'vite-plugin-pwa';

export const pwaConfig: Partial<VitePWAOptions> = {
  registerType: 'autoUpdate',
  srcDir: 'resources/js/sw',
  filename: 'sw.ts',
  includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'logo.svg', 'favicon.svg'],
  manifest: {
    name: 'TurfMate - Sports Facility Management',
    short_name: 'TurfMate',
    description: 'Book sports facilities, manage bookings, and connect with your sports community.',
    theme_color: '#10b981',
    background_color: '#ffffff',
    display: 'standalone',
    orientation: 'portrait',
    scope: '/',
    start_url: '/',
    icons: [
      {
        src: 'logo.svg',
        sizes: '192x192',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
      {
        src: 'logo.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
      },
      {
        src: 'apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
    categories: ['sports', 'lifestyle', 'business'],
    shortcuts: [
      {
        name: 'Dashboard',
        short_name: 'Dashboard',
        description: 'Go to your dashboard',
        url: '/dashboard',
        icons: [{ src: 'logo.svg', sizes: '96x96' }],
      },
      {
        name: 'Book Field',
        short_name: 'Book',
        description: 'Book a sports field',
        url: '/player/bookings/create',
        icons: [{ src: 'logo.svg', sizes: '96x96' }],
      },
      {
        name: 'My Bookings',
        short_name: 'Bookings',
        description: 'View your bookings',
        url: '/player/bookings',
        icons: [{ src: 'logo.svg', sizes: '96x96' }],
      },
    ],
    screenshots: [
      {
        src: '/screenshots/desktop-dashboard.png',
        sizes: '1280x720',
        type: 'image/png',
        form_factor: 'wide',
        label: 'Dashboard view',
      },
      {
        src: '/screenshots/mobile-booking.png',
        sizes: '375x812',
        type: 'image/png',
        form_factor: 'narrow',
        label: 'Mobile booking interface',
      },
    ],
  },
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg,json,vue,txt,woff2}'],
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'google-fonts-cache',
          expiration: {
            maxEntries: 10,
            maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
      {
        urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'gstatic-fonts-cache',
          expiration: {
            maxEntries: 10,
            maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
      {
        urlPattern: /\/api\/.*/i,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'api-cache',
          networkTimeoutSeconds: 10,
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 5 * 60, // 5 minutes
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
    ],
  },
  devOptions: {
    enabled: true,
    type: 'module',
  },
};
