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
  'app.turfs.create': {
    name: 'turfs.create',
    component: 'App/Turfs/Create',
    roles: ['player', 'manager', 'admin'],
    layout: 'dashboard',
  },
  'app.turfs.edit': {
    name: 'turfs.edit',
    component: 'App/Turfs/Edit',
    roles: ['manager', 'admin'],
    layout: 'dashboard',
  },
  'app.turfs.settings': {
    name: 'turfs.settings',
    component: 'App/Turfs/Settings',
    roles: ['manager', 'admin'],
    permissions: ['manage turf settings'],
    layout: 'dashboard',
  },

  // Match Session routes
  'app.matchsessions.index': {
    name: 'matchsessions.index',
    component: 'App/MatchSessions/Index',
    roles: ['player', 'manager', 'admin'],
    layout: 'dashboard',
  },
  'app.matchsessions.show': {
    name: 'matchsessions.show',
    component: 'App/MatchSessions/Show',
    roles: ['player', 'manager', 'admin'],
    layout: 'dashboard',
  },
  'app.matchsessions.create': {
    name: 'matchsessions.create',
    component: 'App/MatchSessions/Create',
    roles: ['manager', 'admin'],
    layout: 'dashboard',
  },
  'app.matchsessions.edit': {
    name: 'matchsessions.edit',
    component: 'App/MatchSessions/Edit',
    roles: ['manager', 'admin'],
    layout: 'dashboard',
  },
  // Team routes
  'app.teams.index': {
    name: 'teams.index',
    component: 'App/Teams/Index',
    roles: ['player', 'manager', 'admin'],
    layout: 'dashboard',
  },
  'app.teams.show': {
    name: 'teams.show',
    component: 'App/Teams/Show',
    roles: ['player', 'manager', 'admin'],
    layout: 'dashboard',
  },
  'app.teams.create': {
    name: 'teams.create',
    component: 'App/Teams/Create',
    roles: ['manager', 'admin'],
    layout: 'dashboard',
  },
  'app.teams.edit': {
    name: 'teams.edit',
    component: 'App/Teams/Edit',
    roles: ['manager', 'admin'],
    layout: 'dashboard',
  },

  // Game Match routes
  'app.gamematches.show': {
    name: 'gamematches.show',
    component: 'App/GameMatches/Show',
    roles: ['player', 'manager', 'admin'],
    layout: 'dashboard',
  },

  // Wallet routes
  'app.wallet.index': {
    name: 'wallet.index',
    component: 'App/Wallet/Index',
    roles: ['player', 'manager', 'admin'],
    layout: 'dashboard',
  },

  // Betting routes
  'app.betting.index': {
    name: 'betting.index',
    component: 'App/Betting/Index',
    roles: ['player', 'manager', 'admin'],
    layout: 'dashboard',
  },
  'app.betting.history': {
    name: 'betting.history',
    component: 'App/Betting/History',
    roles: ['player', 'manager', 'admin'],
    layout: 'dashboard',
  },
  'app.betting.gamematch': {
    name: 'betting.game-matches.show',
    component: 'App/Betting/GameMatch',
    roles: ['player', 'manager', 'admin'],
    layout: 'dashboard',
  },

  // Turf Betting Management routes
  'app.turfs.bettingmanagement': {
    name: 'turfs.betting.management',
    component: 'App/Turfs/BettingManagement',
    roles: ['manager', 'admin'],
    permissions: ['manage turf betting'],
    layout: 'dashboard',
  },

  // Turf Player routes
  'app.turfs.players.index': {
    name: 'turfs.players.index',
    component: 'App/Turfs/Players/Index',
    roles: ['manager', 'admin'],
    layout: 'dashboard',
  },
};

export const resolveComponent = (name: string) => {
  return resolvePageComponent(`../pages/${name}.tsx`, import.meta.glob('../pages/**/*.tsx'));
};
