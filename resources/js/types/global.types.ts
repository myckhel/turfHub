// Global types for the application
export * from './wallet.types';

export interface User {
  id: number;
  name: string;
  email: string;
  email_verified_at?: string;
  roles: string[];
  permissions: string[];
  avatar?: string;
  created_at: string;
  updated_at: string;
}

export interface PageProps {
  auth?: {
    user: User | null;
  };
  flash?: {
    success?: string;
    error?: string;
    warning?: string;
    info?: string;
    message?: string;
  };
  errors?: Record<string, string>;
  [key: string]: unknown;
}

// Inertia page component type
export interface InertiaPageComponent {
  layout?: (page: React.ReactElement) => React.ReactElement;
}

// Response types
export interface ApiResponse<T = unknown> {
  data: T;
  message?: string;
  status: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  links: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
  meta: {
    current_page: number;
    from: number;
    last_page: number;
    path: string;
    per_page: number;
    to: number;
    total: number;
  };
}

// Form types
export interface FormData {
  [key: string]: unknown;
}

export interface ValidationErrors {
  [field: string]: string[];
}

// Layout types
export type LayoutType = 'guest' | 'auth' | 'dashboard';

export interface LayoutConfig {
  type: LayoutType;
  requiresAuth?: boolean;
  roles?: string[];
  permissions?: string[];
}
