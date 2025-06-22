import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';

export interface RouteConfig {
  name: string;
  component: string;
  roles?: string[];
  permissions?: string[];
  layout?: 'guest' | 'auth' | 'dashboard';
}

// Route configurations with role-based access
export const routeConfigs: Record<string, RouteConfig> = {
  // Public routes
  welcome: { name: 'welcome', component: 'Public/Welcome', layout: 'guest' },
  about: { name: 'about', component: 'Public/About', layout: 'guest' },
  pricing: { name: 'pricing', component: 'Public/Pricing', layout: 'guest' },
  contact: { name: 'contact', component: 'Public/Contact', layout: 'guest' },

  // Auth routes
  login: { name: 'login', component: 'Auth/Login', layout: 'auth' },
  register: { name: 'register', component: 'Auth/Register', layout: 'auth' },
  'forgot-password': { name: 'forgot-password', component: 'Auth/ForgotPassword', layout: 'auth' },
  'reset-password': { name: 'reset-password', component: 'Auth/ResetPassword', layout: 'auth' },
  'verify-email': { name: 'verify-email', component: 'Auth/VerifyEmail', layout: 'auth' },
  'confirm-password': { name: 'confirm-password', component: 'Auth/ConfirmPassword', layout: 'auth' },

  // Dashboard routes
  'app.dashboard': {
    name: 'dashboard',
    component: 'App/Dashboard',
    roles: ['player', 'manager', 'admin'],
    layout: 'dashboard',
  },

  // Turf routes
  'app.turfs.index': {
    name: 'turfs.index',
    component: 'App/Turfs/Index',
    roles: ['player', 'manager', 'admin'],
    layout: 'dashboard',
  },
  'app.turfs.show': {
    name: 'turfs.show',
    component: 'App/Turfs/Show',
    roles: ['player', 'manager', 'admin'],
    layout: 'dashboard',
  },

  // Player routes
  'player.bookings': {
    name: 'player.bookings',
    component: 'Player/Bookings/Index',
    roles: ['player'],
    layout: 'dashboard',
  },
  'player.bookings.create': {
    name: 'player.bookings.create',
    component: 'Player/Bookings/Create',
    roles: ['player'],
    layout: 'dashboard',
  },
  'player.matches': {
    name: 'player.matches',
    component: 'Player/Matches/Index',
    roles: ['player'],
    layout: 'dashboard',
  },

  // Manager routes
  'manager.fields': {
    name: 'manager.fields',
    component: 'Manager/Fields/Index',
    roles: ['manager', 'admin'],
    layout: 'dashboard',
  },
  'manager.bookings': {
    name: 'manager.bookings',
    component: 'Manager/Bookings/Index',
    roles: ['manager', 'admin'],
    layout: 'dashboard',
  },
  'manager.reports': {
    name: 'manager.reports',
    component: 'Manager/Reports/Index',
    roles: ['manager', 'admin'],
    layout: 'dashboard',
  },

  // Admin routes
  'admin.users': {
    name: 'admin.users',
    component: 'Admin/Users/Index',
    roles: ['admin'],
    layout: 'dashboard',
  },
  'admin.settings': {
    name: 'admin.settings',
    component: 'Admin/Settings/Index',
    roles: ['admin'],
    layout: 'dashboard',
  },

  // Profile routes
  'profile.edit': {
    name: 'profile.edit',
    component: 'App/Profile/Edit',
    roles: ['player', 'manager', 'admin'],
    layout: 'dashboard',
  },
  settings: {
    name: 'settings',
    component: 'App/Settings/Index',
    roles: ['player', 'manager', 'admin'],
    layout: 'dashboard',
  },
};

export const resolveComponent = (name: string) => {
  return resolvePageComponent(`../pages/${name}.tsx`, import.meta.glob('../pages/**/*.tsx'));
};
