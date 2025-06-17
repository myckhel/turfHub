import { useGSAP } from '@gsap/react';
import { Card as AntCard, CardProps as AntCardProps } from 'antd';
import { gsap } from 'gsap';
import React, { forwardRef, useRef } from 'react';
import { useTheme } from '../../hooks/useTheme';

interface TurfCardProps extends Omit<AntCardProps, 'className' | 'variant'> {
  /** Card variant for different use cases */
  variant?: 'default' | 'elevated' | 'outlined' | 'glass' | 'hero';
  /** Mobile-first interaction modes */
  interactive?: boolean;
  /** Spring animation on press */
  springOnPress?: boolean;
  /** Show shimmer loading effect */
  shimmer?: boolean;
  /** Custom gradient background */
  gradient?: 'turf' | 'sky' | 'sunset' | 'none';
  /** Safe area padding for mobile */
  safeArea?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Press handler for mobile interactions */
  onPress?: () => void;
  children?: React.ReactNode;
}

export const TurfCard = forwardRef<HTMLDivElement, TurfCardProps>(({
  variant = 'default',
  interactive = false,
  springOnPress = true,
  shimmer = false,
  gradient = 'none',
  safeArea = false,
  className = '',
  onPress,
  children,
  ...props
}, ref) => {
  const { reducedMotion } = useTheme();
  const cardRef = useRef<HTMLDivElement>(null);
  const internalRef = ref || cardRef;

  // GSAP animations
  useGSAP(() => {
    if (reducedMotion || !cardRef.current) return;

    // Entrance animation
    gsap.fromTo(
      cardRef.current,
      { 
        opacity: 0, 
        y: 20,
        scale: 0.95
      },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.4,
        ease: 'back.out(1.7)',
        scrollTrigger: {
          trigger: cardRef.current,
          start: 'top 85%',
          toggleActions: 'play none none reverse',
        },
      }
    );
  }, [reducedMotion]);

  const handlePress = () => {
    if (springOnPress && !reducedMotion && cardRef.current) {
      gsap.to(cardRef.current, {
        scale: 0.98,
        duration: 0.1,
        ease: 'power2.out',
        yoyo: true,
        repeat: 1,
      });
    }
    
    onPress?.();
  };

  // Variant-specific styles
  const getVariantStyles = () => {
    const baseStyles = `
      transition-all duration-300 ease-out
      ${safeArea ? 'safe-area-inset' : ''}
      ${interactive ? 'cursor-pointer touch-target' : ''}
      ${springOnPress ? 'spring-bounce' : ''}
    `;

    switch (variant) {
      case 'elevated':
        return `
          ${baseStyles}
          shadow-lg hover:shadow-xl
          bg-white dark:bg-slate-800
          border-0
          transform hover:scale-[1.02]
        `;
      
      case 'outlined':
        return `
          ${baseStyles}
          border-2 border-slate-200 dark:border-slate-700
          bg-transparent
          hover:border-turf-green dark:hover:border-turf-light
          hover:bg-slate-50 dark:hover:bg-slate-800/50
        `;
      
      case 'glass':
        return `
          ${baseStyles}
          glass-effect
          border border-white/20 dark:border-slate-700/30
          backdrop-blur-xl
        `;
      
      case 'hero':
        return `
          ${baseStyles}
          bg-gradient-to-br from-turf-green to-turf-dark
          text-white
          border-0
          shadow-2xl
          transform hover:scale-[1.02]
        `;
      
      default:
        return `
          ${baseStyles}
          bg-white dark:bg-slate-800
          border border-slate-200 dark:border-slate-700
          hover:border-slate-300 dark:hover:border-slate-600
          shadow-sm hover:shadow-md
        `;
    }
  };

  // Gradient background styles
  const getGradientStyles = () => {
    if (gradient === 'none') return '';
    
    const gradients = {
      turf: 'bg-gradient-to-br from-turf-green via-turf-light to-turf-dark',
      sky: 'bg-gradient-to-br from-sky-blue via-sky-light to-sky-dark',
      sunset: 'bg-gradient-to-br from-electric-yellow via-yellow-light to-yellow-dark',
    };

    return gradients[gradient] || '';
  };

  // Shimmer effect styles
  const shimmerStyles = shimmer ? `
    relative overflow-hidden
    before:absolute before:inset-0
    before:bg-gradient-to-r before:from-transparent 
    before:via-white/20 before:to-transparent
    before:translate-x-[-100%] before:animate-shimmer
  ` : '';

  const combinedClassName = `
    ${getVariantStyles()}
    ${getGradientStyles()}
    ${shimmerStyles}
    ${className}
  `.trim();

  return (
    <AntCard
      ref={internalRef}
      className={combinedClassName}
      onClick={interactive ? handlePress : undefined}
      styles={{
        body: {
          padding: variant === 'hero' ? '24px' : '16px',
        },
      }}
      {...props}
    >
      {children}
    </AntCard>
  );
});

TurfCard.displayName = 'TurfCard';

export default TurfCard;
