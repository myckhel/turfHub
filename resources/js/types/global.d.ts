import type { route as routeFn } from 'ziggy-js';

declare global {
  const route: typeof routeFn;
}

declare module '*.png' {
  const value: string;
  export default value;
}
