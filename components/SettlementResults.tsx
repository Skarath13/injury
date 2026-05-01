'use client';

import AnimatedNumber from '@/components/motion/AnimatedNumber';
import { motion, useReducedMotion } from '@/components/motion/react';
import { fadeUpItem, staggerContainer } from '@/components/motion/presets';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ResponsibleAttorney, SettlementResult } from '@/types/calculator';
import { AlertCircle, ArrowLeft, Edit3, Printer, ShieldCheck } from 'lucide-react';

interface Props {
  results: SettlementResult;
  medicalCosts: number;
  hasAttorney: boolean;
  responsibleAttorney?: ResponsibleAttorney | null;
  leadDeliveryStatus?: string | null;
  onBack: () => void;
  onEdit?: () => void;
}

const formatCurrency = (amount: number) => (
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
);

const estimateOnlyNoDeliveryCopy =
  'Your calculator result was not sold, shared, or sent to any law firm, attorney, or third-party lead buyer.';
const estimateOnlyNoDeliveryCopyLower =
  estimateOnlyNoDeliveryCopy.charAt(0).toLowerCase() + estimateOnlyNoDeliveryCopy.slice(1);

const getNoDeliveryMessage = (leadDeliveryStatus?: string | null) => {
  switch (leadDeliveryStatus) {
    case 'estimate_only_no_delivery':
      return `Estimate-only result. ${estimateOnlyNoDeliveryCopy}`;
    case 'duplicate_30d_no_charge':
      return `Estimate-only result for this session. ${estimateOnlyNoDeliveryCopy}`;
    case 'outside_california_no_delivery':
    case 'outside_us_no_delivery':
      return `Estimate-only result is available for this session. ${estimateOnlyNoDeliveryCopy}`;
    case 'unknown_location_no_delivery':
      return `Estimate-only result is available for this session. ${estimateOnlyNoDeliveryCopy}`;
    case 'too_fast_no_delivery':
      return `Estimate-only result is available for this session. ${estimateOnlyNoDeliveryCopy}`;
    case 'own_attorney_no_delivery':
      return `Estimate-only result. You indicated an attorney is already involved or planned, so ${estimateOnlyNoDeliveryCopyLower}`;
    case 'unmapped_no_attorney_delivery':
      return `Estimate-only result. No law firm or attorney sponsor is currently configured for this county. ${estimateOnlyNoDeliveryCopy}`;
    default:
      return null;
  }
};

export default function SettlementResults({
  results,
  responsibleAttorney,
  leadDeliveryStatus,
  onBack,
  onEdit,
}: Props) {
  const shouldReduceMotion = Boolean(useReducedMotion());
  const noDeliveryMessage = getNoDeliveryMessage(leadDeliveryStatus);
  const hasAttorneyDisclosure = Boolean(responsibleAttorney && !noDeliveryMessage);

  return (
    <motion.div
      className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-1 sm:gap-5"
      variants={staggerContainer}
      initial={shouldReduceMotion ? false : 'hidden'}
      animate="visible"
    >
      <motion.div variants={fadeUpItem}>
        <Card className="rounded-[8px] border-border/70 shadow-[0_18px_60px_rgba(15,23,42,0.08)] ring-sky-200/80">
          <CardHeader className="gap-3 px-5 pt-5 sm:grid-cols-[1fr_auto] sm:px-7 sm:pt-7">
            <div className="space-y-2">
              <CardTitle className="text-xl font-semibold leading-tight sm:text-2xl">
                Educational Settlement Estimate
              </CardTitle>
              <CardDescription className="max-w-2xl text-base leading-7 text-muted-foreground">
                Estimated gross range based on the details you entered.
              </CardDescription>
            </div>
            <div className="w-fit rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase text-emerald-800">
              Estimate only
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-6 px-5 pb-5 sm:gap-7 sm:px-7 sm:pb-7">
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-baseline sm:gap-x-4 sm:gap-y-2">
              <span className="font-heading text-4xl font-semibold leading-none tracking-normal text-foreground tabular-nums sm:text-6xl">
                <AnimatedNumber value={results.lowEstimate} format={formatCurrency} delay={0.08} />
              </span>
              <span className="hidden text-4xl font-medium leading-none text-muted-foreground sm:inline">-</span>
              <span className="text-sm font-semibold uppercase text-muted-foreground sm:hidden">to</span>
              <span className="font-heading text-4xl font-semibold leading-none tracking-normal text-foreground tabular-nums sm:text-6xl">
                <AnimatedNumber value={results.highEstimate} format={formatCurrency} delay={0.16} />
              </span>
            </div>
            <div className="flex flex-col gap-3 rounded-[8px] border border-border/80 bg-white p-4 shadow-inner sm:p-5">
              <div
                className="h-3 rounded-full bg-gradient-to-r from-emerald-500 via-amber-400 to-red-500 shadow-inner"
                aria-hidden="true"
              />
              <div className="flex items-center justify-between gap-3 text-xs font-semibold uppercase text-muted-foreground">
                <span>Lower estimate</span>
                <span>Higher estimate</span>
              </div>
            </div>
            <Separator />
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
              This is a gross educational estimate before attorney fees, medical liens, provider balances,
              reimbursement claims, and case costs.
            </p>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={fadeUpItem}>
        <Card className="rounded-[8px] border-border/70 shadow-[0_12px_36px_rgba(15,23,42,0.06)]">
          <CardContent className="grid gap-4 px-5 py-5 sm:grid-cols-[auto_1fr] sm:px-7">
            <div className="flex size-10 items-center justify-center rounded-[8px] bg-sky-50 text-sky-700">
              {hasAttorneyDisclosure ? <AlertCircle className="size-5" /> : <ShieldCheck className="size-5" />}
            </div>
            <div className="space-y-2">
              <h2 className="font-heading text-lg font-semibold leading-snug text-foreground">
                {hasAttorneyDisclosure ? 'Attorney Sponsor Disclosure' : 'Estimate-Only Status'}
              </h2>
              <p className="max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
                {hasAttorneyDisclosure
                  ? responsibleAttorney?.disclosure
                  : noDeliveryMessage || `Estimate-only result. ${estimateOnlyNoDeliveryCopy}`}
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={fadeUpItem}>
        <Card className="rounded-[8px] border-border/70 shadow-[0_12px_36px_rgba(15,23,42,0.06)]">
          <CardHeader className="px-5 pt-5 sm:px-7">
            <CardTitle className="text-lg font-semibold">Before You Use This Estimate</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5 sm:px-7">
            <ul className="grid gap-3 text-sm leading-6 text-muted-foreground sm:grid-cols-2 sm:gap-x-8 sm:text-base sm:leading-7">
              <li className="flex gap-3">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-foreground/70" aria-hidden="true" />
                <span>Educational estimate only; not legal, medical, financial, or insurance advice.</span>
              </li>
              <li className="flex gap-3">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-foreground/70" aria-hidden="true" />
                <span>Not a guarantee, settlement offer, or prediction of a specific outcome.</span>
              </li>
              <li className="flex gap-3">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-foreground/70" aria-hidden="true" />
                <span>No attorney-client relationship is created by viewing this result.</span>
              </li>
              <li className="flex gap-3">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-foreground/70" aria-hidden="true" />
                <span>California deadlines may apply; speak with a qualified professional about your situation.</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter className="flex flex-col items-stretch gap-3 rounded-b-[8px] border-t bg-muted/30 px-5 py-4 sm:flex-row sm:justify-between sm:px-7">
            <Button type="button" variant="outline" className="h-10 rounded-[8px]" onClick={onBack}>
              <ArrowLeft data-icon="inline-start" />
              Back to Calculator
            </Button>
            <div className="flex flex-col gap-2 sm:flex-row">
              {onEdit && (
                <Button type="button" variant="secondary" className="h-10 rounded-[8px]" onClick={onEdit}>
                  <Edit3 data-icon="inline-start" />
                  Edit
                </Button>
              )}
              <Button type="button" className="h-10 rounded-[8px]" onClick={() => window.print()}>
                <Printer data-icon="inline-start" />
                Print
              </Button>
            </div>
          </CardFooter>
        </Card>
      </motion.div>
    </motion.div>
  );
}
