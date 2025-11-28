import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';

export interface RouteConfig {
  roles?: string[];
  layout?: 'guest' | 'auth' | 'dashboard';
}

// Route configurations with role-based access
export const routeConfigs: Record<string, RouteConfig> = {
  // Public routes
  welcome: { layout: 'guest' },
  about: { layout: 'guest' },
  pricing: { layout: 'guest' },
  contact: { layout: 'guest' },

  // Auth routes
  login: { layout: 'auth' },
  register: { layout: 'auth' },
  'forgot-password': { layout: 'auth' },
  'reset-password': { layout: 'auth' },
  'verify-email': { layout: 'auth' },
  'confirm-password': { layout: 'auth' },

  // Dashboard routes
  'app.dashboard': {
    roles: ['player', 'manager', 'admin'],
    layout: 'dashboard',
  },

  // Turf routes
  'app.turfs.index': {
    roles: ['player', 'manager', 'admin'],
    layout: 'dashboard',
  },
  'app.turfs.show': {
    roles: ['player', 'manager', 'admin'],
    layout: 'dashboard',
  },
  'app.turfs.create': {
    roles: ['player', 'manager', 'admin'],
    layout: 'dashboard',
  },
  'app.turfs.edit': {
    roles: ['manager', 'admin'],
    layout: 'dashboard',
  },
  'app.turfs.settings': {
    roles: ['manager', 'admin'],
    layout: 'dashboard',
  },

  // Match Session routes
  'app.matchsessions.index': {
    roles: ['player', 'manager', 'admin'],
    layout: 'dashboard',
  },
  'app.matchsessions.show': {
    roles: ['player', 'manager', 'admin'],
    layout: 'dashboard',
  },
  'app.matchsessions.create': {
    roles: ['manager', 'admin'],
    layout: 'dashboard',
  },
  'app.matchsessions.edit': {
    roles: ['manager', 'admin'],
    layout: 'dashboard',
  },
  // Team routes
  'app.teams.index': {
    roles: ['player', 'manager', 'admin'],
    layout: 'dashboard',
  },
  'app.teams.show': {
    roles: ['player', 'manager', 'admin'],
    layout: 'dashboard',
  },
  'app.teams.create': {
    roles: ['manager', 'admin'],
    layout: 'dashboard',
  },
  'app.teams.edit': {
    roles: ['manager', 'admin'],
    layout: 'dashboard',
  },

  // Game Match routes
  'app.gamematches.show': {
    roles: ['player', 'manager', 'admin'],
    layout: 'dashboard',
  },

  // Wallet routes
  'app.wallet.index': {
    roles: ['player', 'manager', 'admin'],
    layout: 'dashboard',
  },

  // Betting routes
  'app.betting.index': {
    roles: ['player', 'manager', 'admin'],
    layout: 'dashboard',
  },
  'app.betting.history': {
    roles: ['player', 'manager', 'admin'],
    layout: 'dashboard',
  },
  'app.betting.gamematch': {
    roles: ['player', 'manager', 'admin'],
    layout: 'dashboard',
  },

  // Turf Betting Management routes
  'app.turfs.bettingmanagement': {
    roles: ['manager', 'admin'],
    layout: 'dashboard',
  },

  'app.turfs.bettingfixtures': {
    roles: ['manager', 'admin'],
    layout: 'dashboard',
  },

  // Turf Player routes
  'app.turfs.players.index': {
    roles: ['manager', 'admin'],
    layout: 'dashboard',
  },

  // Tournament routes (standalone)
  'app.tournaments.index': {
    roles: ['player', 'manager', 'admin'],
    layout: 'dashboard',
  },
  'app.tournaments.show': {
    roles: ['player', 'manager', 'admin'],
    layout: 'dashboard',
  },
  'app.tournaments.edit': {
    roles: ['manager', 'admin'],
    layout: 'dashboard',
  },

  // Tournament routes (nested under turfs)
  'app.turfs.tournaments.index': {
    roles: ['player', 'manager', 'admin'],
    layout: 'dashboard',
  },
  'app.turfs.tournaments.create': {
    roles: ['manager', 'admin'],
    layout: 'dashboard',
  },
  'app.turfs.tournaments.show': {
    roles: ['player', 'manager', 'admin'],
    layout: 'dashboard',
  },
  'app.turfs.tournaments.edit': {
    roles: ['manager', 'admin'],
    layout: 'dashboard',
  },

  // Stage routes (nested under tournaments)
  'app.turfs.tournaments.stages.create': {
    roles: ['manager', 'admin'],
    layout: 'dashboard',
  },
  'app.turfs.tournaments.stages.show': {
    roles: ['player', 'manager', 'admin'],
    layout: 'dashboard',
  },
  'app.turfs.tournaments.stages.edit': {
    roles: ['manager', 'admin'],
    layout: 'dashboard',
  },
};

export const resolveComponent = (name: string) => {
  return resolvePageComponent(`../pages/${name}.tsx`, import.meta.glob('../pages/**/*.tsx'));
};
