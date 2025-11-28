import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { pwaConfig } from './resources/js/sw/workbox.config';

export default defineConfig({
  plugins: [
    laravel({
      input: ['resources/css/app.css', 'resources/js/app.tsx'],
      ssr: 'resources/js/ssr.tsx',
      refresh: true,
    }),
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler', { target: '19' }]],
      },
    }),
    tailwindcss(),
    VitePWA(pwaConfig),
  ],
  esbuild: {
    jsx: 'automatic',
  },
  define: {
    // Make Laravel environment variables available to Vite
    'import.meta.env.VITE_API_URL': JSON.stringify(process.env.APP_URL || 'http://localhost:8000'),
    'import.meta.env.VITE_APP_ENV': JSON.stringify(process.env.APP_ENV || 'local'),
  },
  resolve: {
    alias: {
      'ziggy-js': resolve(__dirname, 'vendor/tightenco/ziggy'),
      '@': resolve(__dirname, 'resources/js'),
      '@components': resolve(__dirname, 'resources/js/components'),
      '@layouts': resolve(__dirname, 'resources/js/layouts'),
      '@pages': resolve(__dirname, 'resources/js/pages'),
      '@stores': resolve(__dirname, 'resources/js/stores'),
      '@hooks': resolve(__dirname, 'resources/js/hooks'),
      '@utils': resolve(__dirname, 'resources/js/utils'),
      '@types': resolve(__dirname, 'resources/js/types'),
    },
  },
});
