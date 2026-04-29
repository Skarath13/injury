'use client';

import { useEffect, useMemo, useState } from 'react';
import { Lock, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';

export const ESTIMATE_PREPARATION_MIN_MS = 2400;

const STAGES = [
  { at: 0, message: 'Checking the required profile details' },
  { at: 650, message: 'Applying California settlement logic' },
  { at: 1250, message: 'Preparing the protected preview' },
  { at: 1900, message: 'Setting up phone verification' }
];

export default function EstimatePreparationLoader() {
  const [elapsed, setElapsed] = useState(0);

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
    <Card className="mx-auto max-w-3xl border-emerald-200 bg-card shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck data-icon="inline-start" />
          Preparing secure preview
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div aria-live="polite" className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
          <Lock className="size-4 shrink-0 text-primary" />
          <p className="text-sm font-medium">{stage.message}</p>
        </div>

        <Progress value={progress} aria-label="Estimate preparation progress" />

        <div className="grid grid-cols-3 gap-2">
          <Skeleton className="h-24 rounded-lg" />
          <Skeleton className="h-24 rounded-lg" />
          <Skeleton className="h-24 rounded-lg" />
        </div>

        <p className="text-xs text-muted-foreground">
          Exact numbers stay hidden until phone verification succeeds.
        </p>
      </CardContent>
    </Card>
  );
}
