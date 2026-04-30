import type { Transition, Variants } from 'motion/react';

export const premiumEase: [number, number, number, number] = [0.22, 1, 0.36, 1];
export const quickEase: [number, number, number, number] = [0.16, 1, 0.3, 1];

export const softSpring: Transition = {
  type: 'spring',
  stiffness: 420,
  damping: 34,
  mass: 0.8
};

export const gentleSpring: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 30,
  mass: 0.9
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      delayChildren: 0.04,
      staggerChildren: 0.055
    }
  }
};

export const fadeUpItem: Variants = {
  hidden: {
    opacity: 0,
    y: 12
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.32,
      ease: premiumEase
    }
  },
  exit: {
    opacity: 0,
    y: 6,
    transition: {
      duration: 0.18,
      ease: 'easeOut'
    }
  }
};

export function reducedMotionFade(shouldReduceMotion: boolean) {
  return shouldReduceMotion
    ? {
        initial: { opacity: 1 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.08 }
      }
    : {
        initial: { opacity: 0, y: 12 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: 6 },
        transition: { duration: 0.28, ease: premiumEase }
      };
}
