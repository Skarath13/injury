'use client';

import { FieldErrors, UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { AlertTriangle, Briefcase, DollarSign, Heart, Scale, Shield, User } from 'lucide-react';
import { InjuryCalculatorData } from '@/types/calculator';
import InfoIcon from '@/components/InfoIcon';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldContent, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';

interface Props {
  register: UseFormRegister<InjuryCalculatorData>;
  watch: UseFormWatch<InjuryCalculatorData>;
  setValue: UseFormSetValue<InjuryCalculatorData>;
  errors: FieldErrors<InjuryCalculatorData>;
}

export default function WorkLifeStep({ register, watch, setValue, errors }: Props) {
  const missedWorkDays = Number(watch('impact.missedWorkDays') || 0);
  const permanentImpairment = watch('impact.permanentImpairment');
  const policyLimitsKnown = watch('insurance.policyLimitsKnown');
  const hasAttorney = watch('insurance.hasAttorney');
  const faultPercentage = Number(watch('accidentDetails.faultPercentage') || 0);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-950">Work and daily life</h2>
        <p className="max-w-2xl text-sm leading-6 text-slate-600">
          Add the practical details that can sharpen the range. If you are unsure, leave optional items blank and continue.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <label className="block rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800">
            <User className="h-4 w-4 text-slate-500" />
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

        <label className="block rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800">
            <Briefcase className="h-4 w-4 text-emerald-700" />
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
      </div>

      {missedWorkDays > 0 && (
        <div className="grid gap-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 lg:grid-cols-2">
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
            <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800">
              <DollarSign className="h-4 w-4 text-emerald-700" />
              Income range for lost wages
            </span>
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

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-slate-900">Life impact signals</h3>
        <div className="space-y-3">
          <Field orientation="horizontal" className="rounded-lg bg-slate-50 p-3">
            <Checkbox
              id="emotionalDistress"
              checked={watch('impact.emotionalDistress')}
              onCheckedChange={(checked) => setValue('impact.emotionalDistress', checked === true, { shouldDirty: true })}
            />
            <FieldLabel htmlFor="emotionalDistress" className="text-sm leading-6 text-slate-700">
              <Heart className="mr-1 inline h-4 w-4 text-emerald-700" />
              Significant anxiety, sleep disruption, depression, or PTSD symptoms
            </FieldLabel>
          </Field>

          <Field orientation="horizontal" className="rounded-lg bg-slate-50 p-3">
            <Checkbox
              id="lossOfConsortium"
              checked={watch('impact.lossOfConsortium')}
              onCheckedChange={(checked) => setValue('impact.lossOfConsortium', checked === true, { shouldDirty: true })}
            />
            <FieldLabel htmlFor="lossOfConsortium" className="text-sm leading-6 text-slate-700">Relationship or household impact from the injury</FieldLabel>
          </Field>

          <Field orientation="horizontal" className="rounded-lg bg-slate-50 p-3">
            <Checkbox
              id="permanentImpairment"
              checked={permanentImpairment}
              onCheckedChange={(checked) => setValue('impact.permanentImpairment', checked === true, { shouldDirty: true, shouldValidate: true })}
            />
            <FieldLabel htmlFor="permanentImpairment" className="text-sm leading-6 text-slate-700">
              <AlertTriangle className="mr-1 inline h-4 w-4 text-amber-600" />
              A doctor has described permanent impairment or disability
            </FieldLabel>
          </Field>

          {permanentImpairment && (
            <label className="ml-7 block">
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
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-slate-900">Claim context</h3>
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
      </section>

      <section className="rounded-lg border border-sky-200 bg-sky-50 p-4">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
          <Shield className="h-4 w-4 text-sky-700" />
          Insurance and attorney details
        </h3>
        <div className="space-y-4">
          <Field orientation="horizontal">
            <Checkbox
              id="policyLimitsKnown"
              checked={policyLimitsKnown}
              onCheckedChange={(checked) => setValue('insurance.policyLimitsKnown', checked === true, { shouldDirty: true })}
            />
            <FieldLabel htmlFor="policyLimitsKnown" className="text-sm leading-6 text-slate-700">I know the at-fault party's policy limit</FieldLabel>
          </Field>

          {policyLimitsKnown && (
            <label className="block">
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

          <Field orientation="horizontal">
            <Checkbox
              id="hasAttorney"
              checked={hasAttorney}
              onCheckedChange={(checked) => setValue('insurance.hasAttorney', checked === true, { shouldDirty: true })}
            />
            <FieldLabel htmlFor="hasAttorney" className="text-sm leading-6 text-slate-700">
              <Scale className="mr-1 inline h-4 w-4 text-sky-700" />
              I already have, or expect to hire, an attorney for this claim
            </FieldLabel>
          </Field>

          {hasAttorney && (
            <label className="block">
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
      </section>
    </div>
  );
}
