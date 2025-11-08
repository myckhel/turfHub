import type { VitePWAOptions } from 'vite-plugin-pwa';

export const pwaConfig: Partial<VitePWAOptions> = {
  registerType: 'autoUpdate',
  srcDir: 'resources/js/sw',
  filename: 'sw.ts',
  strategies: 'injectManifest',
  injectRegister: false, // We'll handle registration manually
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
    categories: ['sports', 'lifestyle', 'business', 'entertainment'],
    shortcuts: [
      {
        name: 'Dashboard',
        short_name: 'Dashboard',
        description: 'Go to your dashboard',
        url: '/app/dashboard',
        icons: [{ src: 'logo.svg', sizes: '96x96' }],
      },
      {
        name: 'Browse Turfs',
        short_name: 'Turfs',
        description: 'Find and join turf sessions',
        url: '/app/turfs',
        icons: [{ src: 'logo.svg', sizes: '96x96' }],
      },
      {
        name: 'Betting Markets',
        short_name: 'Betting',
        description: 'View live betting markets',
        url: '/app/betting',
        icons: [{ src: 'logo.svg', sizes: '96x96' }],
      },
      {
        name: 'My Wallet',
        short_name: 'Wallet',
        description: 'Manage your wallet and payments',
        url: '/app/wallet',
        icons: [{ src: 'logo.svg', sizes: '96x96' }],
      },
      {
        name: 'Betting History',
        short_name: 'Bets',
        description: 'View your betting history',
        url: '/app/betting/history',
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
        urlPattern: /\/api\/betting\/.*/i,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'betting-api-cache',
          networkTimeoutSeconds: 5,
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 2 * 60, // 2 minutes for betting data
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
      {
        urlPattern: /\/api\/turfs\/.*\/betting\/.*/i,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'turf-betting-cache',
          networkTimeoutSeconds: 5,
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 5 * 60, // 5 minutes for turf betting management
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
      {
        urlPattern: /\/api\/wallet\/.*/i,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'wallet-api-cache',
          networkTimeoutSeconds: 8,
          expiration: {
            maxEntries: 30,
            maxAgeSeconds: 1 * 60, // 1 minute for wallet data
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
            maxEntries: 200,
            maxAgeSeconds: 5 * 60, // 5 minutes for general API
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
