import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { AppLayout } from './components/layout/AppLayout';
import { GuestLayout } from './components/layout/GuestLayout';
import ResponsiveLayout from './components/layout/ResponsiveLayout';
import { PageTransition } from './components/shared/GSAPAnimations';
import { useThemeStore } from './stores/theme.store';
import { resolveComponent, routeConfigs } from './utils/route-resolver';

const appName = import.meta.env.VITE_APP_NAME || 'TurfMate';

// Preload Afro-grunge fonts for better performance
const preloadFonts = () => {
  const fonts = [
    'https://fonts.googleapis.com/css2?family=Fredoka+One:wght@400&display=swap',
    'https://fonts.googleapis.com/css2?family=Anton:wght@400&display=swap',
    'https://fonts.googleapis.com/css2?family=Bangers:wght@400&display=swap',
    'https://fonts.googleapis.com/css2?family=Bebas+Neue:wght@400&display=swap',
    'https://fonts.googleapis.com/css2?family=Oswald:wght@300;400;500;600;700&display=swap',
    'https://fonts.googleapis.com/css2?family=Russo+One:wght@400&display=swap',
  ];

  fonts.forEach((font) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'style';
    link.href = font;
    document.head.appendChild(link);
  });
};

// Theme initialization component with Afro-grunge setup
const ThemeInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initializeTheme = useThemeStore((state) => state.initializeTheme);

  useEffect(() => {
    // Initialize theme immediately when app starts
    initializeTheme();

    // Preload Afro-grunge fonts for better performance
    preloadFonts();

    // Add Afro-grunge body classes
    document.body.classList.add('afro-grunge-app');

    // Set up dynamic viewport height for mobile devices
    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    setVH();
    window.addEventListener('resize', setVH);

    return () => {
      window.removeEventListener('resize', setVH);
    };
  }, [initializeTheme]);

  return <>{children}</>;
};

// Layout resolver based on route configuration with Afro-grunge theming
const getLayout = (routeName: string, page: React.ReactElement) => {
  const config = routeConfigs[routeName];
  const layout = config?.layout || 'guest';

  const wrappedPage = <AppLayout>{page}</AppLayout>;

  switch (layout) {
    case 'auth':
      return (
        <PageTransition>
          <ResponsiveLayout activeTab="home" backgroundVariant="pattern">
            {wrappedPage}
          </ResponsiveLayout>
        </PageTransition>
      );
    case 'dashboard':
      return (
        <PageTransition>
          <ResponsiveLayout activeTab="home" backgroundVariant="pattern">
            {wrappedPage}
          </ResponsiveLayout>
        </PageTransition>
      );
    case 'guest':
    default:
      return (
        <div className="afro-grunge-guest-layout">
          <GuestLayout>{wrappedPage}</GuestLayout>
        </div>
      );
  }
};

createInertiaApp({
  title: (title) => `${title} - ${appName}`,

  resolve: async (name) => {
    const page = await resolveComponent(name);
    const routeName = name.toLowerCase().replace(/\//g, '.');

    // Add layout to page component
    const pageModule = page as { default: React.ComponentType & { layout?: (page: React.ReactElement) => React.ReactElement } };
    const PageComponent = pageModule.default;
    if (PageComponent && typeof PageComponent === 'function') {
      pageModule.default.layout = (pageElement: React.ReactElement) => getLayout(routeName, pageElement);
    }

    return page;
  },

  setup({ el, App, props }) {
    const root = createRoot(el);
    root.render(
      <ThemeInitializer>
        <App {...props} />
      </ThemeInitializer>,
    );
  },

  progress: {
    color: '#10b981',
    showSpinner: true,
  },
});
