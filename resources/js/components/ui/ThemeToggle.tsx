import { useGSAP } from '@gsap/react';
import { MoonOutlined, SunOutlined } from '@ant-design/icons';
import { gsap } from 'gsap';
import React, { useRef } from 'react';
import { useTheme } from '../../hooks/useTheme';

interface ThemeToggleProps {
  /** Size of the toggle button */
  size?: 'small' | 'medium' | 'large';
  /** Show theme label */
  showLabel?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  size = 'medium',
  showLabel = false,
  className = '',
}) => {
  const { isDark, setLightMode, setDarkMode, reducedMotion } = useTheme();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);

  // GSAP animations
  useGSAP(() => {
    if (reducedMotion || !iconRef.current) return;

    // Icon rotation animation on theme change
    gsap.to(iconRef.current, {
      rotation: isDark ? 180 : 0,
      duration: 0.5,
      ease: 'back.out(2)',
    });
  }, [isDark, reducedMotion]);

  const handleToggle = () => {
    if (!reducedMotion && toggleRef.current) {
      // Spring animation on press
      gsap.to(toggleRef.current, {
        scale: 0.9,
        duration: 0.1,
        ease: 'power2.out',
        yoyo: true,
        repeat: 1,
      });
    }

    // Toggle theme
    if (isDark) {
      setLightMode();
    } else {
      setDarkMode();
    }
  };

  // Size configurations
  const getSizeConfig = () => {
    const sizes = {
      small: {
        buttonSize: 'w-8 h-8',
        iconSize: 'text-sm',
        fontSize: 'text-xs',
      },
      medium: {
        buttonSize: 'w-10 h-10',
        iconSize: 'text-base',
        fontSize: 'text-sm',
      },
      large: {
        buttonSize: 'w-12 h-12',
        iconSize: 'text-lg',
        fontSize: 'text-base',
      },
    };

    return sizes[size];
  };

  const sizeConfig = getSizeConfig();

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        ref={toggleRef}
        onClick={handleToggle}
        className={`
          ${sizeConfig.buttonSize}
          rounded-full
          bg-slate-200 dark:bg-slate-700
          hover:bg-slate-300 dark:hover:bg-slate-600
          text-slate-700 dark:text-slate-300
          flex items-center justify-center
          transition-all duration-300 ease-out
          focus-visible:ring-2 focus-visible:ring-turf-green focus-visible:ring-offset-2
          spring-bounce touch-target
          relative overflow-hidden
        `}
        aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      >
        {/* Background gradient animation */}
        <div
          className={`
            absolute inset-0 rounded-full opacity-0 transition-opacity duration-300
            ${isDark 
              ? 'bg-gradient-to-br from-blue-500 to-purple-600' 
              : 'bg-gradient-to-br from-yellow-400 to-orange-500'
            }
            ${isDark ? 'opacity-20' : 'opacity-20'}
          `}
        />
        
        {/* Icon container */}
        <div
          ref={iconRef}
          className={`
            ${sizeConfig.iconSize}
            relative z-10
            transition-colors duration-300
          `}
        >
          {isDark ? (
            <MoonOutlined className="text-blue-400" />
          ) : (
            <SunOutlined className="text-yellow-500" />
          )}
        </div>
      </button>

      {showLabel && (
        <span 
          className={`
            ${sizeConfig.fontSize}
            font-medium
            text-slate-700 dark:text-slate-300
            transition-colors duration-300
          `}
        >
          {isDark ? 'Dark' : 'Light'}
        </span>
      )}
    </div>
  );
};

export default ThemeToggle;
