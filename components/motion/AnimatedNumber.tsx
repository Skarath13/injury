'use client';

import { useEffect, useRef, useState } from 'react';
import { animate, useMotionValue, useReducedMotion } from '@/components/motion/react';
import { premiumEase } from '@/components/motion/presets';

interface AnimatedNumberProps {
  value: number;
  format?: (value: number) => string;
  from?: number;
  duration?: number;
  delay?: number;
  className?: string;
}

const defaultFormat = (value: number) => Math.round(value).toLocaleString();

export default function AnimatedNumber({
  value,
  format = defaultFormat,
  from = 0,
  duration = 0.72,
  delay = 0,
  className
}: AnimatedNumberProps) {
  const shouldReduceMotion = Boolean(useReducedMotion());
  const motionValue = useMotionValue(shouldReduceMotion ? value : from);
  const [displayValue, setDisplayValue] = useState(() => format(shouldReduceMotion ? value : from));
  const formatRef = useRef(format);

  useEffect(() => {
    formatRef.current = format;
    setDisplayValue(format(motionValue.get()));
  }, [format, motionValue]);

  useEffect(() => (
    motionValue.on('change', (latest) => {
      setDisplayValue(formatRef.current(latest));
    })
  ), [motionValue]);

  useEffect(() => {
    if (shouldReduceMotion) {
      motionValue.set(value);
      setDisplayValue(formatRef.current(value));
      return;
    }

    const controls = animate(motionValue, value, {
      duration,
      delay,
      ease: premiumEase
    });

    return () => controls.stop();
  }, [delay, duration, motionValue, shouldReduceMotion, value]);

  return <span className={className}>{displayValue}</span>;
}
