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

// Theme initialization component
const ThemeInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initializeTheme = useThemeStore((state) => state.initializeTheme);

  useEffect(() => {
    // Initialize theme immediately when app starts
    initializeTheme();
  }, [initializeTheme]);

  return <>{children}</>;
};

// Layout resolver based on route configuration
const getLayout = (routeName: string, page: React.ReactElement) => {
  const config = routeConfigs[routeName];
  const layout = config?.layout || 'guest';

  const wrappedPage = <AppLayout>{page}</AppLayout>;

  switch (layout) {
    case 'auth':
      return (
        <PageTransition>
          <ResponsiveLayout activeTab="home" backgroundVariant="gradient">
            {wrappedPage}
          </ResponsiveLayout>
        </PageTransition>
      );
    case 'dashboard':
      return (
        <PageTransition>
          <ResponsiveLayout activeTab="home" backgroundVariant="gradient">
            {wrappedPage}
          </ResponsiveLayout>
        </PageTransition>
      );
    case 'guest':
    default:
      return <GuestLayout>{wrappedPage}</GuestLayout>;
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
