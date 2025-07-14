import { useGSAP } from '@gsap/react';
import { Button as AntButton, ButtonProps as AntButtonProps } from 'antd';
import { gsap } from 'gsap';
import React, { forwardRef, useRef } from 'react';
import { useTheme } from '../../hooks/useTheme';

interface TurfButtonProps extends Omit<AntButtonProps, 'type' | 'size' | 'variant'> {
  /** Button variant following TurfMate design system */
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'danger' | 'success';
  /** Mobile-optimized sizes */
  size?: 'small' | 'medium' | 'large' | 'touch';
  /** Full width for mobile layouts */
  fullWidth?: boolean;
  /** Haptic feedback on press (mobile) */
  haptic?: boolean;
  /** Show loading spinner */
  loading?: boolean;
  /** Gradient background */
  gradient?: boolean;
  /** Icon only button */
  iconOnly?: boolean;
  children?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, TurfButtonProps>(({
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  haptic = true,
  loading = false,
  gradient = false,
  iconOnly = false,
  className = '',
  children,
  onClick,
  ...props
}, ref) => {
  const { reducedMotion } = useTheme();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const internalRef = ref || buttonRef;

  // GSAP animations
  useGSAP(() => {
    if (reducedMotion || !buttonRef.current) return;

    // Hover animation
    const button = buttonRef.current;

    const handleMouseEnter = () => {
      gsap.to(button, {
        scale: 1.05,
        duration: 0.2,
        ease: 'back.out(2)',
      });
    };

    const handleMouseLeave = () => {
      gsap.to(button, {
        scale: 1,
        duration: 0.2,
        ease: 'back.out(2)',
      });
    };

    button.addEventListener('mouseenter', handleMouseEnter);
    button.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      button.removeEventListener('mouseenter', handleMouseEnter);
      button.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [reducedMotion]);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Haptic feedback simulation
    if (haptic && 'navigator' in window && 'vibrate' in navigator) {
      navigator.vibrate(50);
    }

    // Spring animation on press
    if (!reducedMotion && buttonRef.current) {
      gsap.to(buttonRef.current, {
        scale: 0.95,
        duration: 0.1,
        ease: 'power2.out',
        yoyo: true,
        repeat: 1,
      });
    }

    onClick?.(e);
  };

  // Size configurations
  const getSizeStyles = () => {
    const sizeMap = {
      small: {
        height: '32px',
        fontSize: '14px',
        padding: iconOnly ? '0 8px' : '0 12px',
        minWidth: iconOnly ? '32px' : '64px',
      },
      medium: {
        height: '40px',
        fontSize: '16px',
        padding: iconOnly ? '0 12px' : '0 16px',
        minWidth: iconOnly ? '40px' : '80px',
      },
      large: {
        height: '48px',
        fontSize: '18px',
        padding: iconOnly ? '0 16px' : '0 24px',
        minWidth: iconOnly ? '48px' : '120px',
      },
      touch: {
        height: '44px', // Apple's recommended touch target
        fontSize: '16px',
        padding: iconOnly ? '0 14px' : '0 20px',
        minWidth: iconOnly ? '44px' : '100px',
      },
    };

    return sizeMap[size];
  };

  // Variant-specific styles
  const getVariantStyles = () => {
    const variants = {
      primary: `
        ${gradient
          ? 'bg-gradient-to-r from-turf-green to-turf-light hover:from-turf-light hover:to-turf-green'
          : 'bg-turf-green hover:bg-turf-light'
        }
        text-white border-0
        shadow-lg hover:shadow-xl
        active:shadow-md
      `,
      secondary: `
        bg-white dark:bg-slate-800
        text-turf-green dark:text-turf-light
        border-2 border-turf-green dark:border-turf-light
        hover:bg-turf-green hover:text-white
        dark:hover:bg-turf-light dark:hover:text-slate-900
        shadow-sm hover:shadow-md
      `,
      accent: `
        ${gradient
          ? 'bg-gradient-to-r from-sky-blue to-sky-light hover:from-sky-light hover:to-sky-blue'
          : 'bg-sky-blue hover:bg-sky-light'
        }
        text-white border-0
        shadow-lg hover:shadow-xl
        active:shadow-md
      `,
      ghost: `
        bg-transparent
        text-slate-700 dark:text-slate-300
        border border-slate-300 dark:border-slate-600
        hover:bg-slate-100 dark:hover:bg-slate-800
        hover:border-slate-400 dark:hover:border-slate-500
      `,
      danger: `
        bg-red-500 hover:bg-red-600
        text-white border-0
        shadow-lg hover:shadow-xl
        active:shadow-md
      `,
      success: `
        bg-green-500 hover:bg-green-600
        text-white border-0
        shadow-lg hover:shadow-xl
        active:shadow-md
      `,
    };

    return variants[variant];
  };

  const sizeStyles = getSizeStyles();
  const variantStyles = getVariantStyles();

  const combinedClassName = `
    ${variantStyles}
    ${fullWidth ? 'w-full' : ''}
    ${iconOnly ? 'flex items-center justify-center' : ''}
    font-semibold
    rounded-xl
    transition-all duration-200 ease-out
    transform active:scale-95
    focus-visible:ring-2 focus-visible:ring-turf-green focus-visible:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
    touch-target spring-bounce
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <AntButton
      ref={internalRef}
      className={combinedClassName}
      loading={loading}
      onClick={handleClick}
      style={{
        ...sizeStyles,
        fontFamily: 'var(--font-sans)',
      }}
      {...props}
    >
      {children}
    </AntButton>
  );
});

Button.displayName = 'Button';

export default Button;
