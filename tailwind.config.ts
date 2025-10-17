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
        sans: [
          'Fredoka One',
          'Anton',
          'Oswald',
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
        display: ['Fredoka One', 'Anton', 'Bangers', 'Bebas Neue', 'Oswald', 'Russo One', 'Impact', 'Arial Black', 'sans-serif'],
        naija: ['Fredoka One', 'Anton', 'Bangers', 'sans-serif'],
        block: ['Bebas Neue', 'Anton', 'Oswald', 'Impact', 'sans-serif'],
        grunge: ['Russo One', 'Fredoka One', 'Anton', 'sans-serif'],
      },
      colors: {
        // Afro-Grunge Brand Colors - Bold and Vibrant
        'naija-green': '#006B3C', // Nigerian flag green
        'naija-orange': '#FF6B35', // Vibrant African orange
        'naija-red': '#E63946', // Bold red
        'naija-gold': '#FFD700', // African gold
        'naija-purple': '#7209B7', // Royal purple
        'afro-brown': '#8B4513', // Earthy brown
        'grunge-black': '#1A1A1A', // Deep black
        'grunge-charcoal': '#36454F', // Charcoal
        'electric-lime': '#32FF32', // Electric green
        'fire-orange': '#FF4500', // Fire orange
        'sunset-pink': '#FF69B4', // Hot pink
        'royal-blue': '#4169E1', // Royal blue
        'vibrant-yellow': '#FFFF00', // Pure yellow
        'deep-violet': '#9400D3', // Deep violet
        // Legacy colors for backward compatibility
        'turf-green': '#006B3C',
        'turf-light': '#32FF32',
        'turf-dark': '#1A5A1A',
        'sky-blue': '#4169E1',
        'sky-light': '#5DADE2',
        'sky-dark': '#2874A6',
        'electric-yellow': '#FFFF00',
        'yellow-light': '#FFF59D',
        'yellow-dark': '#FFD700',
        'deep-slate': '#1A1A1A',
        'light-slate': '#36454F',
        'medium-gray': '#BDBDBD',
        'light-gray': '#F5F5F5',
      },
      spacing: {
        'touch-sm': '2.25rem', // 36px
        'touch-md': '2.75rem', // 44px - Apple's recommended minimum
        'touch-lg': '3.25rem', // 52px
        'touch-xl': '4rem', // 64px
        'grunge-sm': '1.5rem', // 24px
        'grunge-md': '3rem', // 48px
        'grunge-lg': '4.5rem', // 72px
        'grunge-xl': '6rem', // 96px
      },
      borderRadius: {
        ios: '12px',
        'ios-lg': '16px',
        'ios-xl': '24px',
        grunge: '0px', // Sharp, edgy corners
        'grunge-sm': '2px',
        'grunge-md': '4px',
        'grunge-rough': '8px 2px 8px 2px', // Irregular borders
      },
      boxShadow: {
        card: '0 2px 8px rgba(0, 0, 0, 0.06)',
        modal: '0 25px 50px rgba(0, 0, 0, 0.25)',
        'grunge-heavy': '8px 8px 0px rgba(0, 0, 0, 0.8)',
        'grunge-neon': '0 0 20px rgba(255, 255, 0, 0.5), 0 0 40px rgba(255, 69, 180, 0.3)',
        'afro-glow': '0 0 30px rgba(255, 107, 53, 0.6), 0 0 60px rgba(230, 57, 70, 0.4)',
        electric: '0 0 15px currentColor, 0 0 30px currentColor',
      },
      animation: {
        'spring-bounce': 'springBounce 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'fade-in-up': 'fadeInUp 0.5s ease-out',
        shimmer: 'shimmer 2s infinite linear',
        'grunge-shake': 'grungeShake 0.5s ease-in-out infinite alternate',
        'naija-pulse': 'naijaPulse 2s ease-in-out infinite',
        'afro-bounce': 'afroBounce 1.5s ease-in-out infinite',
        'electric-buzz': 'electricBuzz 0.1s ease-in-out infinite alternate',
        'wild-spin': 'wildSpin 3s linear infinite',
        'color-shift': 'colorShift 4s ease-in-out infinite',
        'text-flicker': 'textFlicker 1.5s ease-in-out infinite',
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
        grungeShake: {
          '0%': { transform: 'translateX(0) rotate(0deg)' },
          '25%': { transform: 'translateX(-2px) rotate(-1deg)' },
          '50%': { transform: 'translateX(2px) rotate(1deg)' },
          '75%': { transform: 'translateX(-1px) rotate(-0.5deg)' },
          '100%': { transform: 'translateX(0) rotate(0deg)' },
        },
        naijaPulse: {
          '0%, 100%': { transform: 'scale(1)', filter: 'brightness(1)' },
          '50%': { transform: 'scale(1.05)', filter: 'brightness(1.2)' },
        },
        afroBounce: {
          '0%, 100%': { transform: 'translateY(0) scale(1)' },
          '25%': { transform: 'translateY(-10px) scale(1.02)' },
          '50%': { transform: 'translateY(-20px) scale(1.05)' },
          '75%': { transform: 'translateY(-10px) scale(1.02)' },
        },
        electricBuzz: {
          '0%': { filter: 'brightness(1) contrast(1)' },
          '100%': { filter: 'brightness(1.3) contrast(1.2)' },
        },
        wildSpin: {
          '0%': { transform: 'rotate(0deg) scale(1)' },
          '25%': { transform: 'rotate(90deg) scale(1.1)' },
          '50%': { transform: 'rotate(180deg) scale(1)' },
          '75%': { transform: 'rotate(270deg) scale(1.1)' },
          '100%': { transform: 'rotate(360deg) scale(1)' },
        },
        colorShift: {
          '0%': { filter: 'hue-rotate(0deg)' },
          '25%': { filter: 'hue-rotate(90deg)' },
          '50%': { filter: 'hue-rotate(180deg)' },
          '75%': { filter: 'hue-rotate(270deg)' },
          '100%': { filter: 'hue-rotate(360deg)' },
        },
        textFlicker: {
          '0%, 100%': { opacity: '1', textShadow: '0 0 5px currentColor' },
          '50%': { opacity: '0.8', textShadow: '0 0 20px currentColor, 0 0 30px currentColor' },
        },
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        grunge: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        wild: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
      backgroundImage: {
        'afro-pattern': `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23FF6B35' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        'grunge-texture': `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cfilter id='noise'%3E%3CfeTurbulence baseFrequency='0.9' numOctaves='1' result='noise'/%3E%3CfeColorMatrix in='noise' type='saturate' values='0'/%3E%3C/filter%3E%3C/defs%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.1'/%3E%3C/svg%3E")`,
        'naija-gradient': 'linear-gradient(135deg, #006B3C 0%, #FF6B35 50%, #FFD700 100%)',
        'electric-gradient': 'linear-gradient(45deg, #32FF32 0%, #FFFF00 25%, #FF69B4 50%, #4169E1 75%, #9400D3 100%)',
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
