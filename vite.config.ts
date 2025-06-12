import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            ssr: 'resources/js/ssr.tsx',
            refresh: true,
        }),
        react(),
        tailwindcss(),
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
        },
    },
});
