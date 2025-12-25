// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || '/api',
  TIMEOUT: 30000,
  WITH_CREDENTIALS: true,
} as const;

// App Configuration
export const APP_CONFIG = {
  NAME: import.meta.env.VITE_APP_NAME || 'TurfHub',
  VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
  ENV: import.meta.env.MODE || 'development',
  DEBUG: import.meta.env.DEV || false,
} as const;

// Payment Configuration
export const PAYMENT_CONFIG = {
  PAYSTACK_PUBLIC_KEY: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || '',
  CURRENCY: 'NGN',
  SUPPORTED_METHODS: ['card', 'bank_transfer', 'wallet'] as const,
} as const;

export default {
  API: API_CONFIG,
  APP: APP_CONFIG,
  PAYMENT: PAYMENT_CONFIG,
};
