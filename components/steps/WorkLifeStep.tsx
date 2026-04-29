'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { FieldErrors, UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { AlertTriangle, Briefcase, DollarSign, Heart, Scale, Shield, User, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { InjuryCalculatorData } from '@/types/calculator';
import InfoIcon from '@/components/InfoIcon';
import { FieldError } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

interface Props {
  register: UseFormRegister<InjuryCalculatorData>;
  watch: UseFormWatch<InjuryCalculatorData>;
  setValue: UseFormSetValue<InjuryCalculatorData>;
  errors: FieldErrors<InjuryCalculatorData>;
}

const yesNoToggleItemClass = cn(
  'h-10 w-full rounded-lg border border-transparent px-3 text-sm font-semibold text-slate-600 shadow-none',
  'transition-[background-color,color,box-shadow,border-color] duration-150',
  'hover:bg-white hover:text-slate-950 focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2',
  'data-[state=on]:border-slate-950 data-[state=on]:bg-slate-950 data-[state=on]:text-white',
  'data-[state=on]:shadow-[0_2px_8px_rgba(15,23,42,0.18)] data-[state=on]:hover:bg-slate-950'
);

function YesNoToggle({
  value,
  onChange,
  ariaLabel
}: {
  value: boolean;
  onChange: (value: boolean) => void;
  ariaLabel: string;
}) {
  return (
    <ToggleGroup
      type="single"
      value={value ? 'yes' : 'no'}
      onValueChange={(nextValue) => {
        if (!nextValue) return;
        onChange(nextValue === 'yes');
      }}
      variant="default"
      spacing={1}
      aria-label={ariaLabel}
      className="grid w-full grid-cols-2 gap-1 rounded-[10px] border border-slate-200 bg-slate-100/80 p-1 shadow-inner sm:w-56"
    >
      <ToggleGroupItem
        value="yes"
        aria-label={`${ariaLabel}: yes`}
        className={yesNoToggleItemClass}
      >
        Yes
      </ToggleGroupItem>
      <ToggleGroupItem
        value="no"
        aria-label={`${ariaLabel}: no`}
        className={yesNoToggleItemClass}
      >
        No
      </ToggleGroupItem>
    </ToggleGroup>
  );
}

function SectionPanel({
  title,
  description,
  icon: Icon,
  iconClassName = 'bg-slate-100 text-slate-700',
  className,
  children
}: {
  title: string;
  description?: string;
  icon: LucideIcon;
  iconClassName?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={cn('rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5', className)}>
      <div className="mb-4 flex items-start gap-3">
        <span className={cn('flex h-9 w-9 flex-none items-center justify-center rounded-lg', iconClassName)}>
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
          {description && (
            <p className="mt-1 text-sm leading-5 text-slate-600">{description}</p>
          )}
        </div>
      </div>
      {children}
    </section>
  );
}

function ToggleQuestion({
  title,
  description,
  icon: Icon,
  value,
  onChange,
  ariaLabel,
  info
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  value: boolean;
  onChange: (value: boolean) => void;
  ariaLabel: string;
  info?: string;
}) {
  return (
    <div className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50/80 p-3 sm:grid-cols-[minmax(0,1fr)_14rem] sm:items-center">
      <div className="flex min-w-0 gap-3">
        <span className="mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-white text-slate-700 shadow-sm">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            {title}
            {info && <InfoIcon content={info} />}
          </div>
          <p className="mt-1 text-sm leading-5 text-slate-600">{description}</p>
        </div>
      </div>
      <YesNoToggle value={value} onChange={onChange} ariaLabel={ariaLabel} />
    </div>
  );
}

export default function WorkLifeStep({ register, watch, setValue, errors }: Props) {
  const missedWorkDays = Number(watch('impact.missedWorkDays') || 0);
  const hasWageLoss = missedWorkDays > 0;
  const emotionalDistress = Boolean(watch('impact.emotionalDistress'));
  const lossOfConsortium = Boolean(watch('impact.lossOfConsortium'));
  const permanentImpairment = Boolean(watch('impact.permanentImpairment'));
  const policyLimitsKnown = Boolean(watch('insurance.policyLimitsKnown'));
  const hasAttorney = Boolean(watch('insurance.hasAttorney'));
  const faultPercentage = Number(watch('accidentDetails.faultPercentage') || 0);
  const [wageLossOpen, setWageLossOpen] = useState(hasWageLoss);

  useEffect(() => {
    if (hasWageLoss) {
      setWageLossOpen(true);
    }
  }, [hasWageLoss]);

  const setBooleanValue = (
    field:
      | 'impact.emotionalDistress'
      | 'impact.lossOfConsortium'
      | 'impact.permanentImpairment'
      | 'insurance.policyLimitsKnown'
      | 'insurance.hasAttorney',
    value: boolean
  ) => {
    setValue(field, value, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true
    });
  };

  const handleWageLossChange = (enabled: boolean) => {
    setWageLossOpen(enabled);
    setValue('impact.missedWorkDays', enabled ? Math.max(missedWorkDays, 1) : 0, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true
    });
  };

  const handlePermanentImpairmentChange = (enabled: boolean) => {
    setBooleanValue('impact.permanentImpairment', enabled);
    if (!enabled) {
      setValue('impact.impairmentRating', undefined, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-950">Work and daily life</h2>
        <p className="max-w-2xl text-sm leading-6 text-slate-600">
          Add the practical details that can sharpen the range. If you are unsure, leave optional items blank and continue.
        </p>
      </div>

      <SectionPanel
        title="Basic profile"
        description="A few personal details help keep the estimate grounded."
        icon={User}
        iconClassName="bg-slate-100 text-slate-700"
      >
        <label className="block">
          <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800">
            Age
            <InfoIcon content="Age can affect recovery assumptions and future care estimates. Use your current age or leave the default if you prefer." />
          </span>
          <Input
            type="number"
            {...register('demographics.age', {
              min: { value: 18, message: 'Must be at least 18' },
              max: { value: 100, message: 'Must be 100 or less' },
              valueAsNumber: true
            })}
            aria-invalid={Boolean(errors.demographics?.age)}
            min="18"
            max="100"
          />
          {errors.demographics?.age && (
            <FieldError className="mt-2">{errors.demographics.age.message}</FieldError>
          )}
        </label>
      </SectionPanel>

      <SectionPanel
        title="Wage loss"
        description="Include missed shifts, reduced hours, or expected future time away from work."
        icon={Briefcase}
        iconClassName="bg-emerald-100 text-emerald-700"
      >
        <div className="space-y-4">
          <ToggleQuestion
            title="Did the injury cause wage loss?"
            description="Choose yes if accident-related treatment or symptoms kept you from working."
            icon={DollarSign}
            value={wageLossOpen}
            onChange={handleWageLossChange}
            ariaLabel="Wage loss"
            info="Lost wages are estimated from missed work days and the income range you choose."
          />

          {wageLossOpen && (
            <div className="grid gap-4 rounded-lg border border-emerald-200 bg-emerald-50/80 p-4 lg:grid-cols-3">
              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800">
                  Work days missed
                  <InfoIcon content="Include partial days and expected future missed days if they are reasonably connected to the accident." />
                </span>
                <Input
                  type="number"
                  {...register('impact.missedWorkDays', {
                    min: { value: 0, message: 'Invalid number' },
                    valueAsNumber: true
                  })}
                  aria-invalid={Boolean(errors.impact?.missedWorkDays)}
                  placeholder="0"
                  min="0"
                />
                {errors.impact?.missedWorkDays && (
                  <FieldError className="mt-2">{errors.impact.missedWorkDays.message}</FieldError>
                )}
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-800">Occupation</span>
                <NativeSelect
                  {...register('demographics.occupation')}
                  className="w-full"
                >
                  <option value="">Select if you know it...</option>
                  <option value="Professional/Office Worker">Professional/Office Worker</option>
                  <option value="Healthcare Worker">Healthcare Worker</option>
                  <option value="Education/Teacher">Education/Teacher</option>
                  <option value="Construction/Manual Labor">Construction/Manual Labor</option>
                  <option value="Transportation/Delivery">Transportation/Delivery</option>
                  <option value="Retail/Service Industry">Retail/Service Industry</option>
                  <option value="Self-Employed/Business Owner">Self-Employed/Business Owner</option>
                  <option value="Retired">Retired</option>
                  <option value="Other">Other</option>
                </NativeSelect>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-800">Income range</span>
                <NativeSelect
                  {...register('demographics.annualIncome')}
                  className="w-full"
                >
                  <option value="">Skip / not sure</option>
                  <option value="20000">Under $25,000</option>
                  <option value="37500">$25,000 - $50,000</option>
                  <option value="62500">$50,000 - $75,000</option>
                  <option value="87500">$75,000 - $100,000</option>
                  <option value="125000">$100,000 - $150,000</option>
                  <option value="175000">$150,000 - $200,000</option>
                  <option value="250000">Over $200,000</option>
                </NativeSelect>
              </label>
            </div>
          )}
        </div>
      </SectionPanel>

      <SectionPanel
        title="Life impact signals"
        description="These items help describe how the injury changed ordinary routines."
        icon={Heart}
        iconClassName="bg-rose-100 text-rose-700"
      >
        <div className="space-y-3">
          <ToggleQuestion
            title="Emotional distress"
            description="Anxiety, sleep disruption, depression, PTSD symptoms, or similar distress."
            icon={Heart}
            value={emotionalDistress}
            onChange={(value) => setBooleanValue('impact.emotionalDistress', value)}
            ariaLabel="Emotional distress"
          />

          <ToggleQuestion
            title="Relationship or household impact"
            description="Loss of household help, changes in family responsibilities, or relationship strain."
            icon={User}
            value={lossOfConsortium}
            onChange={(value) => setBooleanValue('impact.lossOfConsortium', value)}
            ariaLabel="Relationship or household impact"
          />

          <ToggleQuestion
            title="Permanent impairment"
            description="A doctor has described lasting impairment, disability, or permanent limitations."
            icon={AlertTriangle}
            value={permanentImpairment}
            onChange={handlePermanentImpairmentChange}
            ariaLabel="Permanent impairment"
          />

          {permanentImpairment && (
            <label className="block rounded-lg border border-amber-200 bg-amber-50/80 p-4">
              <span className="mb-1 block text-sm font-medium text-slate-700">Impairment rating, if known</span>
              <Input
                type="number"
                {...register('impact.impairmentRating', {
                  min: { value: 0, message: 'Invalid rating' },
                  max: { value: 100, message: 'Invalid rating' },
                  valueAsNumber: true
                })}
                placeholder="e.g., 15"
              />
            </label>
          )}
        </div>
      </SectionPanel>

      <SectionPanel
        title="Claim context"
        description="Fault and prior accidents can shift how an estimate is interpreted."
        icon={AlertTriangle}
        iconClassName="bg-amber-100 text-amber-700"
      >
        <div className="space-y-4">
          <div>
            <label className="mb-3 block text-sm font-semibold text-slate-800">
              Your estimated fault: <span className="text-slate-950">{faultPercentage}%</span>
              <InfoIcon content="California comparative fault can reduce an estimate by the reported fault share." />
            </label>
            <input
              type="range"
              {...register('accidentDetails.faultPercentage', {
                min: 0,
                max: 100,
                valueAsNumber: true
              })}
              min="0"
              max="100"
              step="5"
              className="w-full"
            />
            <div className="mt-2 flex justify-between text-xs text-slate-500">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-800">Prior accidents in the last 5 years</span>
            <NativeSelect
              {...register('accidentDetails.priorAccidents', { valueAsNumber: true })}
              className="w-full"
            >
              <option value="0">None / not sure</option>
              <option value="1">1 accident</option>
              <option value="2">2 accidents</option>
              <option value="3">3 accidents</option>
              <option value="4">4+ accidents</option>
            </NativeSelect>
          </label>
        </div>
      </SectionPanel>

      <SectionPanel
        title="Insurance and attorney details"
        description="Policy limits and attorney fee assumptions affect how the estimate is presented."
        icon={Shield}
        iconClassName="bg-sky-100 text-sky-700"
        className="border-sky-200 bg-sky-50/70"
      >
        <div className="space-y-4">
          <ToggleQuestion
            title="Do you know the policy limit?"
            description="Choose yes if you know the at-fault party's bodily injury limit per person."
            icon={Shield}
            value={policyLimitsKnown}
            onChange={(value) => setBooleanValue('insurance.policyLimitsKnown', value)}
            ariaLabel="Policy limits known"
            info="California minimum liability is low, and known policy limits can cap the estimate."
          />

          {policyLimitsKnown && (
            <label className="block rounded-lg border border-sky-200 bg-white/80 p-4">
              <span className="mb-2 block text-sm font-medium text-slate-700">Policy limit per person</span>
              <NativeSelect
                {...register('insurance.policyLimits', { valueAsNumber: true })}
                className="w-full"
              >
                <option value="">Select policy limits...</option>
                <option value="15000">$15,000 (California minimum)</option>
                <option value="25000">$25,000</option>
                <option value="30000">$30,000</option>
                <option value="50000">$50,000</option>
                <option value="100000">$100,000</option>
                <option value="250000">$250,000</option>
                <option value="500000">$500,000</option>
                <option value="1000000">$1,000,000+</option>
              </NativeSelect>
            </label>
          )}

          <ToggleQuestion
            title="Attorney involved?"
            description="Choose yes if you already have, or expect to hire, an attorney for this claim."
            icon={Scale}
            value={hasAttorney}
            onChange={(value) => setBooleanValue('insurance.hasAttorney', value)}
            ariaLabel="Attorney involved"
            info="Attorney involvement, fees, liens, and costs can affect net recovery."
          />

          {hasAttorney && (
            <label className="block rounded-lg border border-sky-200 bg-white/80 p-4">
              <span className="mb-2 block text-sm font-medium text-slate-700">Contingency fee, if known</span>
              <NativeSelect
                {...register('insurance.attorneyContingency', { valueAsNumber: true })}
                className="w-full"
              >
                <option value="">Use standard estimate</option>
                <option value="25">25%</option>
                <option value="33">33.33%</option>
                <option value="40">40%</option>
                <option value="45">45%</option>
              </NativeSelect>
            </label>
          )}
        </div>
      </SectionPanel>
    </div>
  );
}
