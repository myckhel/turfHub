import type { Config } from 'tailwindcss';
import tailwindcssAnimate from 'tailwindcss-animate';

const config: Config = {
  content: [
    './resources/**/*.blade.php',
    './resources/**/*.js',
    './resources/**/*.ts',
    './resources/**/*.jsx',
    './resources/**/*.tsx',
    './resources/**/*.vue',
    './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
  ],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        display: ['Manrope', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      colors: {
        // TurfMate Brand Colors
        'turf-green': '#1B5E20',
        'turf-light': '#2E7D32',
        'turf-dark': '#1A5A1A',
        'sky-blue': '#3B8CB7',
        'sky-light': '#5DADE2',
        'sky-dark': '#2874A6',
        'electric-yellow': '#FFEB3B',
        'yellow-light': '#FFF59D',
        'yellow-dark': '#F9A825',
        'deep-slate': '#212121',
        'light-slate': '#424242',
        'medium-gray': '#BDBDBD',
        'light-gray': '#F5F5F5',
      },
      spacing: {
        'touch-sm': '2.25rem', // 36px
        'touch-md': '2.75rem', // 44px - Apple's recommended minimum
        'touch-lg': '3.25rem', // 52px
        'touch-xl': '4rem', // 64px
      },
      borderRadius: {
        ios: '12px',
        'ios-lg': '16px',
        'ios-xl': '24px',
      },
      boxShadow: {
        card: '0 2px 8px rgba(0, 0, 0, 0.06)',
        modal: '0 25px 50px rgba(0, 0, 0, 0.25)',
      },
      animation: {
        'spring-bounce': 'springBounce 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'fade-in-up': 'fadeInUp 0.5s ease-out',
        shimmer: 'shimmer 2s infinite linear',
      },
      keyframes: {
        springBounce: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(0.95)' },
          '100%': { transform: 'scale(1)' },
        },
        fadeInUp: {
          from: {
            opacity: '0',
            transform: 'translateY(20px)',
          },
          to: {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
