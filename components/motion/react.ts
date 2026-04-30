if (typeof window === 'undefined') {
  const serverStorage = globalThis.localStorage as Storage | undefined;

  if (serverStorage && typeof serverStorage.getItem !== 'function') {
    const storageShim: Storage = {
      get length() {
        return 0;
      },
      clear() {},
      getItem() {
        return null;
      },
      key() {
        return null;
      },
      removeItem() {},
      setItem() {}
    };

    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: storageShim
    });
  }
}

export {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useReducedMotion
} from 'motion/react';

export type { Transition, Variants } from 'motion/react';
