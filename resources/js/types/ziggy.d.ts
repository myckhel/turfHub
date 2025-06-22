// Global route function types
declare global {
  function route(name: string, params?: Record<string, string | number>): string;

  interface Window {
    route: (name: string, params?: Record<string, string | number>) => string;
  }
}

export {};
