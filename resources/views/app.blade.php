<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        {{-- Inline script to detect and apply theme from localStorage or system preference --}}
        <script>
            (function() {
                // Check for stored theme preference first
                const storedTheme = localStorage.getItem('turfmate-theme');
                let theme = 'system';

                if (storedTheme) {
                    try {
                        const parsed = JSON.parse(storedTheme);
                        theme = parsed.state?.mode || 'system';
                    } catch (e) {
                        // Fall back to system
                    }
                }

                let shouldBeDark = false;

                if (theme === 'dark') {
                    shouldBeDark = true;
                } else if (theme === 'light') {
                    shouldBeDark = false;
                } else {
                    // System preference
                    shouldBeDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                }

                // Apply theme immediately to prevent flash
                const root = document.documentElement;
                if (shouldBeDark) {
                    root.classList.add('dark');
                    root.setAttribute('data-theme', 'dark');
                    root.style.colorScheme = 'dark';
                } else {
                    root.classList.remove('dark');
                    root.setAttribute('data-theme', 'light');
                    root.style.colorScheme = 'light';
                }
            })();
        </script>

        {{-- Inline style to set the HTML background color based on our theme --}}
        <style>
            html {
                background-color: #ffffff;
                transition: background-color 0.3s ease;
            }

            html.dark {
                background-color: #0f172a;
            }
        </style>

        <title inertia>{{ config('app.name', 'Laravel') }}</title>

        <link rel="icon" href="/favicon.ico" sizes="any">
        <link rel="icon" href="/favicon.svg" type="image/svg+xml">
        <link rel="apple-touch-icon" href="/apple-touch-icon.png">

        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />

        @routes
        @viteReactRefresh
        @vite(['resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
        @inertiaHead

        {{-- PWA Manifest --}}
        <link rel="manifest" href="/build/manifest.webmanifest">

        {{-- Service Worker Registration --}}
        <script>
            if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                    navigator.serviceWorker.register('/build/sw.js', {
                        scope: '/',
                        updateViaCache: 'none'
                    }).then((registration) => {
                        console.log('SW registered: ', registration);
                    }).catch((registrationError) => {
                        console.log('SW registration failed: ', registrationError);
                    });
                });
            }
        </script>
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>
