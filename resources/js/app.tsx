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
  // Remove any existing font links
  const existingLinks = document.querySelectorAll('link[href*="googleapis.com/css"]');
  existingLinks.forEach((link) => link.remove());

  // Add primary font link
  const fontLink = document.createElement('link');
  fontLink.rel = 'stylesheet';
  fontLink.href =
    'https://fonts.googleapis.com/css2?family=Fredoka+One:wght@400&family=Anton:wght@400&family=Bangers:wght@400&family=Bebas+Neue:wght@400&family=Oswald:wght@300;400;500;600;700&family=Russo+One:wght@400&display=swap';
  fontLink.onload = () => {
    console.log('Afro-grunge fonts loaded successfully');
    // Force font application
    document.body.style.fontFamily = '"Fredoka One", "Anton", "Oswald", "Inter", sans-serif';
  };
  document.head.appendChild(fontLink);

  // Add preload hints for faster loading
  const fonts = ['Fredoka+One:wght@400', 'Anton:wght@400', 'Oswald:wght@400'];

  fonts.forEach((font) => {
    const preloadLink = document.createElement('link');
    preloadLink.rel = 'preload';
    preloadLink.as = 'style';
    preloadLink.href = `https://fonts.googleapis.com/css2?family=${font}&display=swap`;
    document.head.appendChild(preloadLink);
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
