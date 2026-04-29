'use client';

import { useEffect, type ReactNode } from 'react';
import { FieldErrors, UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { AlertTriangle, Briefcase, DollarSign, Gauge, Heart, Scale, User, type LucideIcon } from 'lucide-react';
import { dateInputValueForAge, dateOfBirthIsInAllowedRange } from '@/lib/demographics';
import { cn } from '@/lib/utils';
import { InjuryCalculatorData } from '@/types/calculator';
import InfoIcon from '@/components/InfoIcon';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { Slider } from '@/components/ui/slider';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

interface Props {
  register: UseFormRegister<InjuryCalculatorData>;
  watch: UseFormWatch<InjuryCalculatorData>;
  setValue: UseFormSetValue<InjuryCalculatorData>;
  errors: FieldErrors<InjuryCalculatorData>;
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
  return (
    <section className={cn('rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5', className)}>
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
  const legacyMissedWorkDays = Number(watch('impact.missedWorkDays') || 0);
  const watchedHasWageLoss = Boolean(watch('impact.hasWageLoss'));
  const hasWageLoss = watchedHasWageLoss || legacyMissedWorkDays > 0;
  const emotionalDistress = Boolean(watch('impact.emotionalDistress'));
  const lossOfConsortium = Boolean(watch('impact.lossOfConsortium'));
  const permanentImpairment = Boolean(watch('impact.permanentImpairment'));
  const hasAttorney = Boolean(watch('insurance.hasAttorney'));
  const faultPercentage = Number(watch('accidentDetails.faultPercentage') || 0);
  const dateInputMin = dateInputValueForAge(100);
  const dateInputMax = dateInputValueForAge(18);

  useEffect(() => {
    if (!watchedHasWageLoss && legacyMissedWorkDays > 0) {
      setValue('impact.hasWageLoss', true, {
        shouldDirty: false,
        shouldTouch: false,
        shouldValidate: false
      });
    }
  }, [legacyMissedWorkDays, setValue, watchedHasWageLoss]);

  const setBooleanValue = (
    field:
      | 'impact.hasWageLoss'
      | 'impact.emotionalDistress'
      | 'impact.lossOfConsortium'
      | 'impact.permanentImpairment'
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
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-950">Work and daily life</h2>
        <p className="max-w-2xl text-sm leading-6 text-slate-600">
          Add the practical details that can sharpen the range. If something does not apply, choose no and continue.
        </p>
      </div>

      <SectionPanel
        title="Basic profile"
        description="Date of birth keeps the estimate grounded without asking for a prefilled age."
        icon={User}
        iconClassName="bg-slate-100 text-slate-700"
      >
        <FieldGroup>
          <Field data-invalid={Boolean(errors.demographics?.dateOfBirth)}>
            <FieldLabel htmlFor="date-of-birth">
              Date of birth
              <InfoIcon content="Age can affect recovery assumptions and future care estimates." />
            </FieldLabel>
            <Input
              id="date-of-birth"
              type="date"
              min={dateInputMin}
              max={dateInputMax}
              {...register('demographics.dateOfBirth', {
                required: 'Date of birth is required',
                validate: (value) => (
                  dateOfBirthIsInAllowedRange(value) ||
                  'Enter a date of birth for someone age 18 to 100'
                )
              })}
              aria-invalid={Boolean(errors.demographics?.dateOfBirth)}
              className="h-11"
            />
            <FieldError>{errors.demographics?.dateOfBirth?.message}</FieldError>
          </Field>
        </FieldGroup>
      </SectionPanel>

      <SectionPanel
        title="Wage loss"
        description="Wage loss is estimated from occupation, income range, and the injury/treatment profile."
        icon={Briefcase}
        iconClassName="bg-emerald-100 text-emerald-700"
      >
        <FieldGroup>
          <ToggleQuestion
            title="Did the injury cause wage loss?"
            description="Choose yes if accident-related treatment or symptoms affected earnings."
            icon={DollarSign}
            value={hasWageLoss}
            onChange={handleWageLossChange}
            ariaLabel="Wage loss"
            info="The estimate uses occupation, income range, injury severity, and treatment progression instead of asking for missed days."
          />

          {hasWageLoss && (
            <div className="grid gap-4 rounded-lg border border-emerald-200 bg-emerald-50/80 p-4 md:grid-cols-2">
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
            </div>
          )}
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
              <span className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1 text-sm font-semibold text-slate-950">
                {faultPercentage}%
              </span>
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
                className="py-3 [&_[data-slot=slider-thumb]]:size-5 [&_[data-slot=slider-thumb]]:border-2 [&_[data-slot=slider-track]]:h-2"
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
        description="This only changes attorney-fee context in the final explanation."
        icon={Scale}
        iconClassName="bg-sky-100 text-sky-700"
        className="border-sky-200 bg-sky-50/70"
      >
        <ToggleQuestion
          title="Do you have an attorney?"
          description="Answer yes only if an attorney is already involved in this claim."
          icon={Scale}
          value={hasAttorney}
          onChange={handleAttorneyChange}
          ariaLabel="Attorney involved"
          info="Attorney involvement, liens, and costs can affect net recovery."
        />
      </SectionPanel>
    </div>
  );
}
