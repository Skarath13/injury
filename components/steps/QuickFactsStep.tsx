'use client';

import { useCallback, useEffect, useRef } from 'react';
import { FieldErrors, UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import Image from 'next/image';
import { Calendar, Car, ScanFace } from 'lucide-react';
import { BodyMapGender, InjuryCalculatorData } from '@/types/calculator';
import InfoIcon from '@/components/InfoIcon';
import { Field, FieldContent, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';

interface Props {
  register: UseFormRegister<InjuryCalculatorData>;
  watch: UseFormWatch<InjuryCalculatorData>;
  setValue: UseFormSetValue<InjuryCalculatorData>;
  errors: FieldErrors<InjuryCalculatorData>;
  bodyModel: BodyMapGender | '';
  onBodyModelChange: (bodyModel: BodyMapGender) => void;
}

type VehicleDamageValue = Exclude<InjuryCalculatorData['accidentDetails']['impactSeverity'], ''>;

const damageOptions: Array<{
  value: VehicleDamageValue;
  label: string;
  detail: string;
  imageSrc: string;
}> = [
  { value: 'low', label: 'Minor', detail: 'Light tap or other low-speed', imageSrc: '/vehicle-damage/light.png' },
  { value: 'moderate', label: 'Moderate', detail: 'Noticeable damage', imageSrc: '/vehicle-damage/visible.png' },
  { value: 'severe', label: 'Major', detail: 'Tow, airbags, or crush damage', imageSrc: '/vehicle-damage/major.png' },
  { value: 'catastrophic', label: 'Extreme', detail: 'Severe structural damage', imageSrc: '/vehicle-damage/extreme.png' }
];

const damageToneClass: Record<VehicleDamageValue, string> = {
  low: 'has-[:checked]:border-yellow-400 has-[:checked]:bg-yellow-400 has-[:checked]:text-yellow-950',
  moderate: 'has-[:checked]:border-orange-500 has-[:checked]:bg-orange-500 has-[:checked]:text-white',
  severe: 'has-[:checked]:border-red-600 has-[:checked]:bg-red-600 has-[:checked]:text-white',
  catastrophic: 'has-[:checked]:border-red-900 has-[:checked]:bg-red-900 has-[:checked]:text-white'
};

const damageToggleItemClass = cn(
  'group/damage flex h-auto min-h-20 w-full shrink-0 cursor-pointer touch-manipulation items-stretch justify-start whitespace-normal rounded-lg border border-transparent px-3 py-3 text-left text-sm font-medium text-muted-foreground shadow-none outline-none',
  'transition-[background-color,color,box-shadow,border-color] duration-150',
  'hover:bg-background hover:text-foreground has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-2',
  'has-[:checked]:shadow-[0_2px_8px_rgba(15,23,42,0.16)] has-[:checked]:[&_.damage-detail]:text-current has-[:checked]:[&_.damage-detail]:opacity-85 has-[:checked]:[&_.damage-image-slot]:border-white/55 has-[:checked]:[&_.damage-image-slot]:bg-white/70'
);

const bodyModelToggleItemClass = cn(
  'h-11 w-full rounded-lg border border-transparent px-3 text-sm font-medium text-muted-foreground shadow-none',
  'transition-[background-color,color,box-shadow,border-color] duration-150',
  'hover:bg-background hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
  'data-[state=on]:border-slate-950 data-[state=on]:bg-slate-950 data-[state=on]:text-white',
  'data-[state=on]:shadow-[0_2px_8px_rgba(15,23,42,0.18)] data-[state=on]:hover:bg-slate-950'
);

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
  const damageGroupRef = useRef<HTMLDivElement | null>(null);
  const dateRegistration = register('accidentDetails.dateOfAccident', {
    required: 'Date of Loss is required'
  });
  const impactSeverityRegistration = register('accidentDetails.impactSeverity', {
    required: 'Please select vehicle damage severity'
  });
  const commitDamageSelection = useCallback((value: VehicleDamageValue, input: HTMLInputElement) => {
    input.checked = true;
    input.focus({ preventScroll: true });
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    setValue('accidentDetails.impactSeverity', value, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true
    });
  }, [setValue]);

  useEffect(() => {
    const group = damageGroupRef.current;
    if (!group) return;

    const handleDamageClick = (event: MouseEvent) => {
      const target = event.target instanceof HTMLElement ? event.target : null;
      const label = target?.closest<HTMLLabelElement>('label[data-damage-value]');
      if (!label || !group.contains(label)) return;

      const input = label.querySelector<HTMLInputElement>('input[type="radio"]');
      const value = label.dataset.damageValue as VehicleDamageValue | undefined;
      if (!input || !value) return;

      event.preventDefault();
      commitDamageSelection(value, input);
    };

    group.addEventListener('click', handleDamageClick);
    return () => group.removeEventListener('click', handleDamageClick);
  }, [commitDamageSelection]);

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-2xl font-semibold tracking-tight text-slate-950">Quick Facts</h2>

      <FieldGroup className="max-w-full">
        <Field
          data-invalid={Boolean(errors.accidentDetails?.dateOfAccident)}
          className="w-full min-w-0 sm:max-w-sm"
        >
          <FieldLabel htmlFor="accident-date">
            <Calendar className="h-4 w-4 text-sky-700" />
            Date of Loss <span className="text-amber-600">*</span>
          </FieldLabel>
          <Input
            id="accident-date"
            type="date"
            {...dateRegistration}
            max={today}
            aria-invalid={Boolean(errors.accidentDetails?.dateOfAccident)}
            className="h-11 max-w-full min-w-0 text-base"
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
        <div
          ref={damageGroupRef}
          role="radiogroup"
          aria-label="Vehicle damage"
          className="grid w-full grid-cols-1 gap-1 rounded-xl border border-slate-200 bg-slate-100/80 p-1 shadow-inner"
        >
          {damageOptions.map((option) => {
            const inputId = `vehicle-damage-${option.value}`;

            return (
              <label
                key={option.value}
                data-damage-value={option.value}
                className={cn(damageToggleItemClass, damageToneClass[option.value])}
              >
                <input
                  id={inputId}
                  type="radio"
                  value={option.value}
                  defaultChecked={selectedDamage === option.value}
                  className="sr-only"
                  aria-label={`${option.label}: ${option.detail}`}
                  aria-invalid={Boolean(errors.accidentDetails?.impactSeverity)}
                  {...impactSeverityRegistration}
                />
                <span className="flex min-w-0 flex-1 items-center justify-between gap-3">
                  <span className="flex min-w-0 flex-col gap-1">
                    <span className="text-sm font-semibold leading-tight">{option.label}</span>
                    <span className="damage-detail text-xs leading-snug text-muted-foreground group-has-[:checked]/damage:text-current group-has-[:checked]/damage:opacity-85">
                      {option.detail}
                    </span>
                  </span>
                  <span aria-hidden="true" className="damage-image-slot size-20 shrink-0 overflow-hidden rounded-md border border-current/20 bg-white/55 shadow-inner">
                    <Image
                      src={option.imageSrc}
                      alt=""
                      width={80}
                      height={80}
                      sizes="80px"
                      className="h-full w-full object-cover"
                      draggable={false}
                    />
                  </span>
                </span>
              </label>
            );
          })}
        </div>
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
          spacing={1}
          aria-label="Choose body map model"
          className="grid w-full grid-cols-2 gap-1 rounded-[10px] border border-slate-200 bg-slate-100/80 p-1 shadow-inner"
        >
          <ToggleGroupItem
            value="male"
            onClick={() => onBodyModelChange('male')}
            aria-label="Use male body map model"
            className={bodyModelToggleItemClass}
          >
            Male
          </ToggleGroupItem>
          <ToggleGroupItem
            value="female"
            onClick={() => onBodyModelChange('female')}
            aria-label="Use female body map model"
            className={bodyModelToggleItemClass}
          >
            Female
          </ToggleGroupItem>
        </ToggleGroup>
      </FieldSet>

    </div>
  );
}
