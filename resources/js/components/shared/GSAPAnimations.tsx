import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import React, { useRef } from 'react';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export const PageTransition: React.FC<PageTransitionProps> = ({ children, className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (containerRef.current) {
      // Page entrance animation
      gsap.fromTo(
        containerRef.current,
        {
          opacity: 0,
          y: 30,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: 'power2.out',
        },
      );

      // Animate child elements with stagger
      const childElements = containerRef.current.children;
      if (childElements.length > 0) {
        gsap.fromTo(
          childElements,
          {
            opacity: 0,
            y: 20,
          },
          {
            opacity: 1,
            y: 0,
            duration: 0.4,
            stagger: 0.1,
            delay: 0.2,
            ease: 'power2.out',
          },
        );
      }
    }
  }, []);

  return (
    <div ref={containerRef} className={`page-transition ${className}`}>
      {children}
    </div>
  );
};

// Card hover animation component
interface AnimatedCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({ children, className = '', onClick }) => {
  const cardRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (cardRef.current) {
      const card = cardRef.current;

      const handleMouseEnter = () => {
        gsap.to(card, {
          y: -8,
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
          duration: 0.3,
          ease: 'power2.out',
        });
      };

      const handleMouseLeave = () => {
        gsap.to(card, {
          y: 0,
          boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
          duration: 0.3,
          ease: 'power2.out',
        });
      };

      card.addEventListener('mouseenter', handleMouseEnter);
      card.addEventListener('mouseleave', handleMouseLeave);

      return () => {
        card.removeEventListener('mouseenter', handleMouseEnter);
        card.removeEventListener('mouseleave', handleMouseLeave);
      };
    }
  }, []);

  return (
    <div
      ref={cardRef}
      className={`animated-card cursor-pointer ${className}`}
      onClick={onClick}
      style={{
        boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
      }}
    >
      {children}
    </div>
  );
};

// Loading animation component
interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'medium', color = '#10b981' }) => {
  const spinnerRef = useRef<HTMLDivElement>(null);

  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12',
  };

  useGSAP(() => {
    if (spinnerRef.current) {
      gsap.to(spinnerRef.current, {
        rotation: 360,
        duration: 1,
        repeat: -1,
        ease: 'none',
      });
    }
  }, []);

  return (
    <div className="flex items-center justify-center">
      <div
        ref={spinnerRef}
        className={`${sizeClasses[size]} rounded-full border-2 border-gray-200 border-t-current`}
        style={{ borderTopColor: color }}
      />
    </div>
  );
};

// Stagger list animation
interface StaggerListProps {
  children: React.ReactNode[];
  className?: string;
  delay?: number;
}

export const StaggerList: React.FC<StaggerListProps> = ({ children, className = '', delay = 0.1 }) => {
  const listRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (listRef.current) {
      const items = listRef.current.children;

      gsap.fromTo(
        items,
        {
          opacity: 0,
          y: 30,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          stagger: delay,
          ease: 'power2.out',
        },
      );
    }
  }, [delay]);

  return (
    <div ref={listRef} className={`stagger-list ${className}`}>
      {children}
    </div>
  );
};
