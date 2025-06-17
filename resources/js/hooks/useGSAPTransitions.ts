import { gsap } from 'gsap';
import { useRef } from 'react';

export const useGSAPTransitions = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Page transition animations
  const pageTransition = {
    enter: (element: HTMLElement, duration = 0.5) => {
      return gsap.fromTo(
        element,
        {
          opacity: 0,
          y: 30,
        },
        {
          opacity: 1,
          y: 0,
          duration,
          ease: 'power2.out',
        },
      );
    },

    exit: (element: HTMLElement, duration = 0.3) => {
      return gsap.to(element, {
        opacity: 0,
        y: -20,
        duration,
        ease: 'power2.in',
      });
    },
  };

  // Modal animations
  const modalTransition = {
    enter: (element: HTMLElement) => {
      gsap.set(element, { scale: 0.8, opacity: 0 });
      return gsap.to(element, {
        scale: 1,
        opacity: 1,
        duration: 0.3,
        ease: 'back.out(1.7)',
      });
    },

    exit: (element: HTMLElement) => {
      return gsap.to(element, {
        scale: 0.8,
        opacity: 0,
        duration: 0.2,
        ease: 'power2.in',
      });
    },
  };

  // Card animations
  const cardAnimation = {
    hover: (element: HTMLElement) => {
      return gsap.to(element, {
        y: -8,
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
        duration: 0.3,
        ease: 'power2.out',
      });
    },

    unhover: (element: HTMLElement) => {
      return gsap.to(element, {
        y: 0,
        boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
        duration: 0.3,
        ease: 'power2.out',
      });
    },
  };

  // Stagger animations for lists
  const staggerAnimation = (elements: HTMLElement[], delay = 0.1) => {
    return gsap.fromTo(
      elements,
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
  };

  // Loading animation
  const loadingAnimation = (element: HTMLElement) => {
    return gsap.to(element, {
      rotation: 360,
      duration: 1,
      repeat: -1,
      ease: 'none',
    });
  };

  // Pulse animation for notifications
  const pulseAnimation = (element: HTMLElement) => {
    return gsap.to(element, {
      scale: 1.05,
      duration: 0.5,
      repeat: -1,
      yoyo: true,
      ease: 'power2.inOut',
    });
  };

  // Slide animations
  const slideAnimation = {
    slideInLeft: (element: HTMLElement) => {
      return gsap.fromTo(element, { x: -100, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5, ease: 'power2.out' });
    },

    slideInRight: (element: HTMLElement) => {
      return gsap.fromTo(element, { x: 100, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5, ease: 'power2.out' });
    },

    slideInUp: (element: HTMLElement) => {
      return gsap.fromTo(element, { y: 100, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out' });
    },
  };

  return {
    containerRef,
    pageTransition,
    modalTransition,
    cardAnimation,
    staggerAnimation,
    loadingAnimation,
    pulseAnimation,
    slideAnimation,
  };
};
