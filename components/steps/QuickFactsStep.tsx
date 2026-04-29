'use client';

import { FieldErrors, UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { Calendar, Car, MapPin, ScanFace } from 'lucide-react';
import { BodyMapGender, InjuryCalculatorData } from '@/types/calculator';
import InfoIcon from '@/components/InfoIcon';
import { Field, FieldContent, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import CountyCombobox from '@/components/CountyCombobox';
import { cn } from '@/lib/utils';

interface Props {
  register: UseFormRegister<InjuryCalculatorData>;
  watch: UseFormWatch<InjuryCalculatorData>;
  setValue: UseFormSetValue<InjuryCalculatorData>;
  errors: FieldErrors<InjuryCalculatorData>;
  bodyModel: BodyMapGender;
  onBodyModelChange: (bodyModel: BodyMapGender) => void;
}

const damageOptions: Array<{
  value: InjuryCalculatorData['accidentDetails']['impactSeverity'];
  label: string;
  detail: string;
}> = [
  { value: 'low', label: 'Light', detail: 'Bumper tap or parking-lot speed' },
  { value: 'moderate', label: 'Visible', detail: 'Noticeable body damage' },
  { value: 'severe', label: 'Major', detail: 'Airbags, tow, or crush damage' },
  { value: 'catastrophic', label: 'Extreme', detail: 'Rollover, multiple impacts, severe forces' }
];

export default function QuickFactsStep({
  register,
  watch,
  setValue,
  errors,
  bodyModel,
  onBodyModelChange
}: Props) {
  const today = new Date().toISOString().split('T')[0];
  const selectedDamage = watch('accidentDetails.impactSeverity');
  const selectedCounty = watch('accidentDetails.county');
  const dateRegistration = register('accidentDetails.dateOfAccident', {
    required: 'Date of loss is required'
  });

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-2xl font-semibold tracking-tight text-slate-950">Quick Facts</h2>

      <FieldGroup className="grid gap-4 lg:grid-cols-2">
        <Field data-invalid={Boolean(errors.accidentDetails?.county)}>
          <FieldLabel htmlFor="accident-county">
            <MapPin className="h-4 w-4 text-sky-700" />
            Accident county <span className="text-amber-600">*</span>
            <InfoIcon content="County is used for California-specific routing and disclosure. Attorney delivery is offered only when an active attorney advertiser is configured for that county." />
          </FieldLabel>
          <CountyCombobox
            id="accident-county"
            value={selectedCounty}
            error={errors.accidentDetails?.county?.message}
            onValueChange={(county) => setValue('accidentDetails.county', county, {
              shouldDirty: true,
              shouldValidate: true
            })}
          />
          <input
            type="hidden"
            {...register('accidentDetails.county', { required: 'Choose a county from the list' })}
          />
          <FieldError>{errors.accidentDetails?.county?.message}</FieldError>
        </Field>

        <Field data-invalid={Boolean(errors.accidentDetails?.dateOfAccident)}>
          <FieldLabel htmlFor="accident-date">
            <Calendar className="h-4 w-4 text-sky-700" />
            Date of loss <span className="text-amber-600">*</span>
          </FieldLabel>
          <Input
            id="accident-date"
            type="date"
            {...dateRegistration}
            max={today}
            aria-invalid={Boolean(errors.accidentDetails?.dateOfAccident)}
            className="h-11 text-base"
            onChange={(event) => {
              dateRegistration.onChange(event);
              event.currentTarget.blur();
            }}
            onInput={(event) => {
              if (event.currentTarget.value.length === 10) {
                event.currentTarget.blur();
              }
            }}
          />
          <FieldError>{errors.accidentDetails?.dateOfAccident?.message}</FieldError>
        </Field>
      </FieldGroup>

      <FieldSet>
        <FieldLegend className="flex items-center gap-2">
          <Car className="h-4 w-4 text-amber-600" />
          Vehicle damage <span className="text-amber-600">*</span>
          <InfoIcon content="Vehicle damage is used as an impact-severity signal. It is one factor in an estimate, not a promise about claim value." />
        </FieldLegend>
        <RadioGroup
          value={selectedDamage}
          onValueChange={(value) => setValue('accidentDetails.impactSeverity', value as InjuryCalculatorData['accidentDetails']['impactSeverity'], { shouldDirty: true, shouldValidate: true })}
          className="grid gap-2 sm:grid-cols-2"
        >
          {damageOptions.map((option) => (
            <FieldLabel
              key={option.value}
              className={cn(
                'min-h-20 cursor-pointer rounded-lg border bg-card p-3 transition-colors hover:bg-muted/50',
                'has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5 has-[[data-state=checked]]:shadow-sm has-[[data-state=checked]]:ring-2 has-[[data-state=checked]]:ring-primary/20',
                selectedDamage === option.value && 'border-primary bg-primary/5 shadow-sm ring-2 ring-primary/20'
              )}
            >
              <Field orientation="horizontal">
                <RadioGroupItem
                  value={option.value}
                  aria-invalid={Boolean(errors.accidentDetails?.impactSeverity)}
                  className="mt-0.5 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                />
                <FieldContent>
                  <span className="text-sm font-semibold text-foreground">{option.label}</span>
                  <FieldDescription>{option.detail}</FieldDescription>
                </FieldContent>
              </Field>
            </FieldLabel>
          ))}
        </RadioGroup>
        <input
          type="hidden"
          {...register('accidentDetails.impactSeverity', { required: 'Please select vehicle damage severity' })}
        />
        <FieldError>{errors.accidentDetails?.impactSeverity?.message}</FieldError>
      </FieldSet>

      <FieldSet>
        <FieldLegend className="flex items-center gap-2">
          <ScanFace className="h-4 w-4 text-sky-700" />
          Body model
        </FieldLegend>
        <FieldDescription>Visual preference for the injury map only.</FieldDescription>
        <ToggleGroup
          type="single"
          value={bodyModel}
          onValueChange={(value) => value && onBodyModelChange(value as BodyMapGender)}
          variant="default"
          className="grid w-full grid-cols-2 gap-1 rounded-lg border bg-muted p-1"
        >
          <ToggleGroupItem
            value="male"
            className="h-11 w-full rounded-md border border-transparent bg-transparent text-foreground shadow-none data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-sm"
          >
            Male
          </ToggleGroupItem>
          <ToggleGroupItem
            value="female"
            className="h-11 w-full rounded-md border border-transparent bg-transparent text-foreground shadow-none data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-sm"
          >
            Female
          </ToggleGroupItem>
        </ToggleGroup>
      </FieldSet>

    </div>
  );
}
