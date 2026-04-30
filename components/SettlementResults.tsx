'use client';

import AnimatedNumber from '@/components/motion/AnimatedNumber';
import { motion, useReducedMotion } from '@/components/motion/react';
import { fadeUpItem, staggerContainer } from '@/components/motion/presets';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
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
import { AlertCircle, ArrowLeft, Edit3, Printer } from 'lucide-react';

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

const getNoDeliveryMessage = (leadDeliveryStatus?: string | null) => {
  switch (leadDeliveryStatus) {
    case 'estimate_only_no_delivery':
      return 'Estimate-only view. Results were not sent to an attorney.';
    case 'duplicate_30d_no_charge':
      return 'This is not treated as a new attorney request.';
    case 'outside_california_no_delivery':
    case 'outside_us_no_delivery':
      return 'Attorney delivery is limited to eligible California visitors.';
    case 'unknown_location_no_delivery':
      return 'We could not confirm attorney-delivery eligibility.';
    case 'too_fast_no_delivery':
      return 'Estimate-only view. Phone verification was skipped.';
    case 'own_attorney_no_delivery':
      return 'Results were not sent to an attorney because you indicated you already have or plan to hire one.';
    case 'unmapped_no_attorney_delivery':
      return 'No active attorney advertiser is configured for this county; results were not sent to an attorney.';
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
      className="mx-auto flex max-w-3xl flex-col gap-4"
      variants={staggerContainer}
      initial={shouldReduceMotion ? false : 'hidden'}
      animate="visible"
    >
      <motion.div variants={fadeUpItem}>
        <Card>
          <CardHeader>
            <CardTitle>Insurance Settlement Estimate</CardTitle>
            <CardDescription>Estimated gross settlement range</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2">
              <span className="font-heading text-3xl font-semibold leading-tight tracking-normal text-foreground tabular-nums sm:text-5xl">
                <AnimatedNumber value={results.lowEstimate} format={formatCurrency} delay={0.08} />
              </span>
              <span className="text-2xl font-medium text-muted-foreground sm:text-4xl">-</span>
              <span className="font-heading text-3xl font-semibold leading-tight tracking-normal text-foreground tabular-nums sm:text-5xl">
                <AnimatedNumber value={results.highEstimate} format={formatCurrency} delay={0.16} />
              </span>
            </div>
            <div className="flex flex-col gap-2 rounded-lg border bg-muted/40 p-3">
              <div
                className="h-3 rounded-full bg-gradient-to-r from-emerald-500 via-amber-400 to-red-500 shadow-inner"
                aria-hidden="true"
              />
              <div className="flex items-center justify-between gap-3 text-xs font-medium text-muted-foreground">
                <span>Likely</span>
                <span>Potential</span>
              </div>
            </div>
            <Separator />
            <p className="max-w-2xl text-sm text-muted-foreground">
              This is a gross estimate before attorney fees, medical liens, provider balances, reimbursement claims, and case costs.
            </p>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={fadeUpItem}>
        <Alert>
          <AlertCircle />
          <AlertTitle>
            {hasAttorneyDisclosure ? 'Attorney Advertiser Disclosure' : 'Attorney Delivery Notice'}
          </AlertTitle>
          <AlertDescription>
            {hasAttorneyDisclosure
              ? responsibleAttorney?.disclosure
              : noDeliveryMessage || 'No active attorney advertiser is configured for this county; results were not sent to an attorney.'}
          </AlertDescription>
        </Alert>
      </motion.div>

      <motion.div variants={fadeUpItem}>
        <Card size="sm">
          <CardHeader>
            <CardTitle>Important Disclaimers</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
              <li>Estimate only. Not legal advice.</li>
              <li>Not a guarantee or prediction of a specific outcome.</li>
              <li>Gross amount before fees, liens, medical balances, and costs.</li>
              <li>Deadlines apply. Consult a qualified professional about your situation.</li>
            </ul>
          </CardContent>
          <CardFooter className="flex flex-col items-stretch gap-2 sm:flex-row sm:justify-between">
            <Button type="button" variant="outline" onClick={onBack}>
              <ArrowLeft data-icon="inline-start" />
              Back to Calculator
            </Button>
            <div className="flex flex-col gap-2 sm:flex-row">
              {onEdit && (
                <Button type="button" variant="secondary" onClick={onEdit}>
                  <Edit3 data-icon="inline-start" />
                  Edit
                </Button>
              )}
              <Button type="button" onClick={() => window.print()}>
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
