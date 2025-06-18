import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { AppLayout } from './components/layout/AppLayout';
import ResponsiveLayout from './components/layout/ResponsiveLayout';
import { PageTransition } from './components/shared/GSAPAnimations';
import ThemeToggle from './components/ui/ThemeToggle';
import { GuestLayout } from './layouts/GuestLayout';
import { resolveComponent, routeConfigs } from './utils/route-resolver';

const appName = import.meta.env.VITE_APP_NAME || 'TurfMate';

// Initialize PWA
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}

// Layout resolver based on route configuration
const getLayout = (routeName: string, page: React.ReactElement) => {
  const config = routeConfigs[routeName];
  const layout = config?.layout || 'guest';

  const wrappedPage = <AppLayout>{page}</AppLayout>;

  switch (layout) {
    case 'auth':
      return (
        <PageTransition>
          <ResponsiveLayout
            activeTab="home"
            title="Welcome back!"
            subtitle="Ready to play?"
            headerRightContent={<ThemeToggle size="small" />}
            backgroundVariant="gradient"
          >
            {wrappedPage}
          </ResponsiveLayout>
        </PageTransition>
      );
    case 'dashboard':
      return (
        <PageTransition>
          <ResponsiveLayout
            activeTab="home"
            title="Welcome back!"
            subtitle="Ready to play?"
            headerRightContent={<ThemeToggle size="small" />}
            backgroundVariant="gradient"
          >
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

    // Check route access permissions
    const config = routeConfigs[routeName];
    if (config?.roles || config?.permissions) {
      // const { user } = useAuthStore.getState();
      // if (!user) {
      //   // Redirect to login if not authenticated
      //   window.location.href = route('login');
      //   return page;
      // }
      // Check role access
      // if (config.roles && !config.roles.some((role) => user.roles?.includes(role))) {
      //   // Redirect to unauthorized page or dashboard
      //   // window.location.href = route('dashboard');
      //   return page;
      // }
      // // Check permission access
      // if (config.permissions && !config.permissions.some((permission) => user.permissions?.includes(permission))) {
      //   // window.location.href = route('dashboard');
      //   return page;
      // }
    }

    // Add layout to page component
    const PageComponent = page.default;
    if (PageComponent && typeof PageComponent === 'function') {
      page.default.layout = (pageElement: React.ReactElement) => getLayout(routeName, pageElement);
    }

    return page;
  },

  setup({ el, App, props }) {
    const root = createRoot(el);
    root.render(<App {...props} />);
  },

  progress: {
    color: '#10b981',
    showSpinner: true,
  },
});
