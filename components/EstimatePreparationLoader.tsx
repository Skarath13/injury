'use client';

import { useEffect, useMemo, useState } from 'react';
import { Lock, ShieldCheck } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from '@/components/motion/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { fadeUpItem, premiumEase, staggerContainer } from '@/components/motion/presets';

export const ESTIMATE_PREPARATION_MIN_MS = 2400;

const STAGES = [
  { at: 0, message: 'Checking the required profile details' },
  { at: 650, message: 'Applying California settlement logic' },
  { at: 1250, message: 'Preparing the protected preview' },
  { at: 1900, message: 'Setting up phone verification' }
];

export default function EstimatePreparationLoader() {
  const [elapsed, setElapsed] = useState(0);
  const shouldReduceMotion = Boolean(useReducedMotion());

  useEffect(() => {
    const started = Date.now();
    const interval = window.setInterval(() => {
      setElapsed(Date.now() - started);
    }, 120);

    return () => window.clearInterval(interval);
  }, []);

  const stage = useMemo(() => (
    [...STAGES].reverse().find((candidate) => elapsed >= candidate.at) || STAGES[0]
  ), [elapsed]);

  const progress = Math.min(92, Math.round(14 + (elapsed / ESTIMATE_PREPARATION_MIN_MS) * 78));

  return (
    <motion.div
      className="mx-auto max-w-3xl"
      variants={staggerContainer}
      initial={shouldReduceMotion ? false : 'hidden'}
      animate="visible"
    >
    <Card className="border-emerald-200 bg-card shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck data-icon="inline-start" />
          Preparing secure preview
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <motion.div aria-live="polite" className="flex items-center gap-3 rounded-lg bg-muted/50 p-3" variants={fadeUpItem}>
          <Lock className="size-4 shrink-0 text-primary" />
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={stage.message}
              className="text-sm font-medium"
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
              transition={shouldReduceMotion ? { duration: 0.08 } : { duration: 0.18, ease: premiumEase }}
            >
              {stage.message}
            </motion.p>
          </AnimatePresence>
        </motion.div>

        <Progress value={progress} aria-label="Estimate preparation progress" />

        <motion.div className="grid grid-cols-3 gap-2" variants={fadeUpItem}>
          <Skeleton className="h-24 rounded-lg" />
          <Skeleton className="h-24 rounded-lg" />
          <Skeleton className="h-24 rounded-lg" />
        </motion.div>

        <motion.p className="text-xs text-muted-foreground" variants={fadeUpItem}>
          Exact numbers stay hidden until phone verification succeeds.
        </motion.p>
      </CardContent>
    </Card>
    </motion.div>
  );
}
