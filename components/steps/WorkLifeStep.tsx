'use client';

import { useEffect, type ReactNode } from 'react';
import { FieldErrors, UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { AlertTriangle, Briefcase, DollarSign, Gauge, Heart, Scale, User, type LucideIcon } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from '@/components/motion/react';
import { cn } from '@/lib/utils';
import { InjuryCalculatorData } from '@/types/calculator';
import type { WorkLifeBooleanAnswers, WorkLifeBooleanField } from '@/lib/calculatorDraft';
import InfoIcon from '@/components/InfoIcon';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { NativeSelect } from '@/components/ui/native-select';
import { Slider } from '@/components/ui/slider';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { fadeUpItem, premiumEase, reducedMotionFade, softSpring, staggerContainer } from '@/components/motion/presets';

interface Props {
  register: UseFormRegister<InjuryCalculatorData>;
  watch: UseFormWatch<InjuryCalculatorData>;
  setValue: UseFormSetValue<InjuryCalculatorData>;
  errors: FieldErrors<InjuryCalculatorData>;
  booleanAnswers: WorkLifeBooleanAnswers;
  onBooleanAnswerChange: (field: WorkLifeBooleanField, value: boolean) => void;
}

const yesNoToggleItemClass = cn(
  'h-11 w-full rounded-lg border border-transparent px-3 text-sm font-semibold text-muted-foreground shadow-none',
  'transition-[background-color,color,box-shadow,border-color] duration-150',
  'hover:bg-background hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
  'data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground',
  'data-[state=on]:shadow-[0_2px_8px_rgba(15,23,42,0.18)] data-[state=on]:hover:bg-primary'
);

function YesNoToggle({
  value,
  onChange,
  ariaLabel,
  invalid
}: {
  value?: boolean;
  onChange: (value: boolean) => void;
  ariaLabel: string;
  invalid?: boolean;
}) {
  return (
    <ToggleGroup
      type="single"
      value={typeof value === 'boolean' ? (value ? 'yes' : 'no') : ''}
      onValueChange={(nextValue) => {
        if (!nextValue) return;
        onChange(nextValue === 'yes');
      }}
      variant="default"
      spacing={1}
      aria-label={ariaLabel}
      aria-invalid={invalid}
      className="grid w-full grid-cols-2 gap-1 rounded-[10px] border border-slate-200 bg-slate-100/80 p-1 shadow-inner 2xl:w-56"
    >
      <ToggleGroupItem value="yes" aria-label={`${ariaLabel}: yes`} className={yesNoToggleItemClass}>
        Yes
      </ToggleGroupItem>
      <ToggleGroupItem value="no" aria-label={`${ariaLabel}: no`} className={yesNoToggleItemClass}>
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
  const shouldReduceMotion = Boolean(useReducedMotion());

  return (
    <motion.section
      className={cn('rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5', className)}
      variants={fadeUpItem}
      whileHover={shouldReduceMotion ? undefined : { y: -1 }}
      transition={softSpring}
    >
      <div className="mb-4 flex items-start gap-3">
        <span className={cn('flex h-9 w-9 flex-none items-center justify-center rounded-lg', iconClassName)}>
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
          {description && <p className="mt-1 text-sm leading-5 text-slate-600">{description}</p>}
        </div>
      </div>
      {children}
    </motion.section>
  );
}

function ToggleQuestion({
  title,
  description,
  icon: Icon,
  value,
  onChange,
  ariaLabel,
  info,
  invalid,
  errorMessage
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  value?: boolean;
  onChange: (value: boolean) => void;
  ariaLabel: string;
  info?: string;
  invalid?: boolean;
  errorMessage?: string;
}) {
  const shouldReduceMotion = Boolean(useReducedMotion());

  return (
    <div className="flex flex-col gap-2">
      <motion.div
        data-invalid={invalid || undefined}
        className={cn(
          'grid gap-3 rounded-lg border border-slate-200 bg-slate-50/80 p-3 2xl:grid-cols-[minmax(0,1fr)_14rem] 2xl:items-center',
          invalid && 'border-destructive bg-destructive/5'
        )}
        animate={shouldReduceMotion ? undefined : {
          borderColor: invalid
            ? 'rgba(220, 38, 38, 0.45)'
            : value === true
              ? 'rgba(16, 185, 129, 0.42)'
              : 'rgba(226, 232, 240, 1)'
        }}
        whileHover={shouldReduceMotion ? undefined : { y: -1 }}
        transition={{ duration: 0.2, ease: premiumEase }}
      >
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
        <YesNoToggle value={value} onChange={onChange} ariaLabel={ariaLabel} invalid={invalid} />
      </motion.div>
      {errorMessage && <FieldError>{errorMessage}</FieldError>}
    </div>
  );
}

export default function WorkLifeStep({
  register,
  watch,
  setValue,
  errors,
  booleanAnswers,
  onBooleanAnswerChange
}: Props) {
  const legacyMissedWorkDays = Number(watch('impact.missedWorkDays') || 0);
  const watchedHasWageLoss = watch('impact.hasWageLoss') === true;
  const hasWageLoss = watchedHasWageLoss || legacyMissedWorkDays > 0;
  const faultPercentage = Number(watch('accidentDetails.faultPercentage') || 0);
  const shouldReduceMotion = Boolean(useReducedMotion());

  useEffect(() => {
    if (!watchedHasWageLoss && legacyMissedWorkDays > 0) {
      setValue('impact.hasWageLoss', true, {
        shouldDirty: false,
        shouldTouch: false,
        shouldValidate: false
      });
      onBooleanAnswerChange('hasWageLoss', true);
    }
  }, [legacyMissedWorkDays, onBooleanAnswerChange, setValue, watchedHasWageLoss]);

  const setBooleanValue = (
    field:
      | 'impact.hasWageLoss'
      | 'impact.emotionalDistress'
      | 'impact.lossOfConsortium'
      | 'impact.permanentImpairment'
      | 'insurance.hasAttorney',
    value: boolean
  ) => {
    const answerFieldByFormField: Record<typeof field, WorkLifeBooleanField> = {
      'impact.hasWageLoss': 'hasWageLoss',
      'impact.emotionalDistress': 'emotionalDistress',
      'impact.lossOfConsortium': 'lossOfConsortium',
      'impact.permanentImpairment': 'permanentImpairment',
      'insurance.hasAttorney': 'hasAttorney'
    };

    onBooleanAnswerChange(answerFieldByFormField[field], value);
    setValue(field, value, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true
    });
  };

  const handleWageLossChange = (enabled: boolean) => {
    setBooleanValue('impact.hasWageLoss', enabled);
    setValue('impact.missedWorkDays', 0, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: false
    });
  };

  const handlePermanentImpairmentChange = (enabled: boolean) => {
    setBooleanValue('impact.permanentImpairment', enabled);
    setValue('impact.impairmentRating', undefined, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: false
    });
  };

  const handleAttorneyChange = (enabled: boolean) => {
    setBooleanValue('insurance.hasAttorney', enabled);
    setValue('insurance.attorneyContingency', undefined, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: false
    });
  };

  const handleFaultChange = (value: number[]) => {
    const nextFaultPercentage = Math.min(100, Math.max(0, value[0] ?? 0));
    setValue('accidentDetails.faultPercentage', nextFaultPercentage, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true
    });
  };

  return (
    <motion.div
      className="flex flex-col gap-6 lg:grid lg:grid-cols-2 lg:items-start"
      variants={staggerContainer}
      initial={shouldReduceMotion ? false : 'hidden'}
      animate="visible"
    >
      <div className="flex flex-col gap-2 lg:col-span-2">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-950">Work and daily life</h2>
        <p className="max-w-2xl text-sm leading-6 text-slate-600">
          Answer the items that apply. Anything left unanswered is treated as no, except attorney status.
        </p>
      </div>

      <SectionPanel
        title="Wage loss"
        description="Wage loss is estimated from occupation, income range, and the injury/treatment profile."
        icon={Briefcase}
        iconClassName="bg-emerald-100 text-emerald-700"
        className="lg:col-span-2"
      >
        <FieldGroup>
          <ToggleQuestion
            title="Did the injury cause wage loss?"
            description="Choose yes if accident-related treatment or symptoms affected earnings."
            icon={DollarSign}
            value={booleanAnswers.hasWageLoss}
            onChange={handleWageLossChange}
            ariaLabel="Wage loss"
            info="The estimate uses occupation, income range, injury severity, and treatment progression instead of asking for missed days."
          />

          <AnimatePresence initial={false}>
            {hasWageLoss && (
              <motion.div
                key="wage-loss-fields"
                className="grid gap-4 rounded-lg border border-emerald-200 bg-emerald-50/80 p-4 md:grid-cols-2"
                {...reducedMotionFade(shouldReduceMotion)}
                layout
              >
                <Field data-invalid={Boolean(errors.demographics?.occupation)}>
                  <FieldLabel htmlFor="occupation">Occupation</FieldLabel>
                  <NativeSelect
                    id="occupation"
                    {...register('demographics.occupation', {
                      validate: (value) => !hasWageLoss || Boolean(value) || 'Select an occupation'
                    })}
                    aria-invalid={Boolean(errors.demographics?.occupation)}
                    className="w-full"
                  >
                    <option value="">Select occupation...</option>
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
                  <FieldError>{errors.demographics?.occupation?.message}</FieldError>
                </Field>

                <Field data-invalid={Boolean(errors.demographics?.annualIncome)}>
                  <FieldLabel htmlFor="annual-income">Income range</FieldLabel>
                  <NativeSelect
                    id="annual-income"
                    {...register('demographics.annualIncome', {
                      validate: (value) => !hasWageLoss || Number(value) > 0 || 'Select an income range'
                    })}
                    aria-invalid={Boolean(errors.demographics?.annualIncome)}
                    className="w-full"
                  >
                    <option value="">Select income range...</option>
                    <option value="20000">Under $25,000</option>
                    <option value="37500">$25,000 - $50,000</option>
                    <option value="62500">$50,000 - $75,000</option>
                    <option value="87500">$75,000 - $100,000</option>
                    <option value="125000">$100,000 - $150,000</option>
                    <option value="175000">$150,000 - $200,000</option>
                    <option value="250000">Over $200,000</option>
                  </NativeSelect>
                  <FieldError>{errors.demographics?.annualIncome?.message}</FieldError>
                </Field>
              </motion.div>
            )}
          </AnimatePresence>
        </FieldGroup>
      </SectionPanel>

      <SectionPanel
        title="Life impact"
        description="These signals are weighted against the injury and treatment details already selected."
        icon={Heart}
        iconClassName="bg-rose-100 text-rose-700"
      >
        <div className="flex flex-col gap-3">
          <ToggleQuestion
            title="Emotional distress"
            description="Anxiety, sleep disruption, depression, PTSD symptoms, or similar distress."
            icon={Heart}
            value={booleanAnswers.emotionalDistress}
            onChange={(value) => setBooleanValue('impact.emotionalDistress', value)}
            ariaLabel="Emotional distress"
          />

          <ToggleQuestion
            title="Relationship or household impact"
            description="Loss of household help, changes in family responsibilities, or relationship strain."
            icon={User}
            value={booleanAnswers.lossOfConsortium}
            onChange={(value) => setBooleanValue('impact.lossOfConsortium', value)}
            ariaLabel="Relationship or household impact"
          />

          <ToggleQuestion
            title="Permanent impairment"
            description="A doctor has described lasting impairment, disability, or permanent limitations."
            icon={AlertTriangle}
            value={booleanAnswers.permanentImpairment}
            onChange={handlePermanentImpairmentChange}
            ariaLabel="Permanent impairment"
          />
        </div>
      </SectionPanel>

      <SectionPanel
        title="Liability"
        description="California comparative fault can reduce an estimate by the reported fault share."
        icon={Gauge}
        iconClassName="bg-amber-100 text-amber-700"
      >
        <FieldGroup>
          <Field>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <FieldLabel htmlFor="fault-percentage">Your estimated fault</FieldLabel>
                <InfoIcon content="Use your best estimate of your share of fault. A 20% fault share means the estimate is reduced by 20%." />
              </div>
              <motion.span
                key={faultPercentage}
                className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1 text-sm font-semibold text-slate-950"
                initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0.8, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={shouldReduceMotion ? { duration: 0.08 } : softSpring}
              >
                {faultPercentage}%
              </motion.span>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-5">
              <Slider
                id="fault-percentage"
                value={[faultPercentage]}
                min={0}
                max={100}
                step={5}
                onValueChange={handleFaultChange}
                aria-label="Your estimated fault percentage"
                className="py-3 [&_[data-slot=slider-range]]:bg-transparent [&_[data-slot=slider-thumb]]:size-6 [&_[data-slot=slider-thumb]]:border-2 [&_[data-slot=slider-thumb]]:border-background [&_[data-slot=slider-thumb]]:bg-slate-950 [&_[data-slot=slider-track]]:h-3 [&_[data-slot=slider-track]]:bg-gradient-to-r [&_[data-slot=slider-track]]:from-emerald-500 [&_[data-slot=slider-track]]:via-amber-400 [&_[data-slot=slider-track]]:to-red-500"
              />
              <div className="mt-3 grid grid-cols-3 text-xs font-medium text-slate-500">
                <span>0%</span>
                <span className="text-center">50%</span>
                <span className="text-right">100%</span>
              </div>
            </div>
            <FieldDescription>
              Set this to 0% if you do not believe you were at fault.
            </FieldDescription>
          </Field>
        </FieldGroup>
      </SectionPanel>

      <SectionPanel
        title="Attorney"
        description="This only changes net-recovery context in the final explanation."
        icon={Scale}
        iconClassName="bg-sky-100 text-sky-700"
        className="border-sky-200 bg-sky-50/70 lg:col-span-2"
      >
        <ToggleQuestion
          title="Do you have an attorney?"
          description="Answer yes only if an attorney is already involved in this claim."
          icon={Scale}
          value={booleanAnswers.hasAttorney}
          onChange={handleAttorneyChange}
          ariaLabel="Attorney involved"
          info="Attorney involvement, liens, and costs can affect net recovery."
          invalid={Boolean(errors.insurance?.hasAttorney)}
          errorMessage={errors.insurance?.hasAttorney?.message}
        />
      </SectionPanel>
    </motion.div>
  );
}
