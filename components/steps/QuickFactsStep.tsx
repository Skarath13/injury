'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FieldErrors, UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import Image from 'next/image';
import { Calendar, Car, ChevronLeft, ChevronRight, ScanFace } from 'lucide-react';
import { BodyMapGender, InjuryCalculatorData } from '@/types/calculator';
import InfoIcon from '@/components/InfoIcon';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet } from '@/components/ui/field';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';
import { dateInputValueForDate, dateOnlyIsInFuture, dateOnlyIsValid, parseDateOnly } from '@/lib/demographics';

interface Props {
  register: UseFormRegister<InjuryCalculatorData>;
  watch: UseFormWatch<InjuryCalculatorData>;
  setValue: UseFormSetValue<InjuryCalculatorData>;
  errors: FieldErrors<InjuryCalculatorData>;
  bodyModel: BodyMapGender | '';
  bodyModelError?: string | null;
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
  { value: 'severe', label: 'Major', detail: 'Airbags or major crush', imageSrc: '/vehicle-damage/major.png' },
  { value: 'catastrophic', label: 'Extreme', detail: 'Severe structural damage', imageSrc: '/vehicle-damage/extreme.png' }
];

const damageToggleItemClass = cn(
  'group/damage relative flex min-h-24 cursor-pointer overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm outline-none transition-[background-color,border-color,box-shadow,transform] duration-150',
  'hover:bg-muted/40 has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50',
  'has-[:focus-visible]:border-ring'
);

const bodyModelToggleItemClass = cn(
  'h-11 w-full rounded-lg border border-transparent px-3 text-sm font-medium text-muted-foreground shadow-none',
  'transition-[background-color,color,box-shadow,border-color] duration-150',
  'hover:bg-background hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
  'data-[state=on]:border-slate-950 data-[state=on]:bg-slate-950 data-[state=on]:text-white',
  'data-[state=on]:shadow-[0_2px_8px_rgba(15,23,42,0.18)] data-[state=on]:hover:bg-slate-950'
);

const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function monthStartFromDateValue(value: string) {
  const parsed = parseDateOnly(value);
  if (!parsed) return new Date();

  return new Date(parsed.year, parsed.month - 1, 1);
}

function shiftMonth(month: Date, offset: number) {
  return new Date(month.getFullYear(), month.getMonth() + offset, 1);
}

function monthKey(month: Date) {
  return month.getFullYear() * 12 + month.getMonth();
}

function formatCalendarDate(year: number, monthIndex: number, day: number) {
  return dateInputValueForDate(new Date(year, monthIndex, day));
}

function formatDateForDisplay(value: string) {
  const parsed = parseDateOnly(value);
  if (!parsed) return '';

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date(parsed.year, parsed.month - 1, parsed.day));
}

export default function QuickFactsStep({
  register,
  watch,
  setValue,
  errors,
  bodyModel,
  bodyModelError,
  onBodyModelChange
}: Props) {
  const today = dateInputValueForDate();
  const selectedDate = watch('accidentDetails.dateOfAccident') || '';
  const selectedDamage = watch('accidentDetails.impactSeverity');
  const calendarButtonRef = useRef<HTMLButtonElement | null>(null);
  const calendarPopoverRef = useRef<HTMLDivElement | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => monthStartFromDateValue(today));
  const dateRegistration = register('accidentDetails.dateOfAccident', {
    required: 'Date of Loss is required',
    validate: (value) => {
      if (!dateOnlyIsValid(value)) return 'Enter a valid Date of Loss';
      return !dateOnlyIsInFuture(value) || 'Date of Loss cannot be in the future';
    }
  });
  const impactSeverityRegistration = register('accidentDetails.impactSeverity', {
    required: 'Please select vehicle damage severity'
  });
  const currentMonth = useMemo(() => monthStartFromDateValue(today), [today]);
  const monthLabel = useMemo(() => (
    new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(visibleMonth)
  ), [visibleMonth]);
  const calendarDays = useMemo(() => {
    const year = visibleMonth.getFullYear();
    const monthIndex = visibleMonth.getMonth();
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const firstWeekday = new Date(year, monthIndex, 1).getDay();
    const cells: Array<{
      key: string;
      dateValue: string | null;
      day: number | null;
      disabled: boolean;
      selected: boolean;
      today: boolean;
    }> = [];

    for (let index = 0; index < firstWeekday; index += 1) {
      cells.push({
        key: `empty-start-${index}`,
        dateValue: null,
        day: null,
        disabled: true,
        selected: false,
        today: false
      });
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const dateValue = formatCalendarDate(year, monthIndex, day);
      cells.push({
        key: dateValue,
        dateValue,
        day,
        disabled: dateValue > today,
        selected: dateValue === selectedDate,
        today: dateValue === today
      });
    }

    while (cells.length % 7 !== 0) {
      cells.push({
        key: `empty-end-${cells.length}`,
        dateValue: null,
        day: null,
        disabled: true,
        selected: false,
        today: false
      });
    }

    return cells;
  }, [selectedDate, today, visibleMonth]);
  const canGoNextMonth = monthKey(visibleMonth) < monthKey(currentMonth);
  const selectedDateLabel = dateOnlyIsValid(selectedDate) ? formatDateForDisplay(selectedDate) : '';
  const commitDateSelection = useCallback((value: string) => {
    if (dateOnlyIsInFuture(value)) return;

    setValue('accidentDetails.dateOfAccident', value, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true
    });
    setCalendarOpen(false);
    window.requestAnimationFrame(() => calendarButtonRef.current?.focus({ preventScroll: true }));
  }, [setValue]);
  const commitDamageSelection = useCallback((value: VehicleDamageValue) => {
    setValue('accidentDetails.impactSeverity', value, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true
    });
  }, [setValue]);

  useEffect(() => {
    if (dateOnlyIsInFuture(selectedDate)) {
      setValue('accidentDetails.dateOfAccident', '', {
        shouldDirty: true,
        shouldTouch: false,
        shouldValidate: false
      });
      return;
    }

    if (!dateOnlyIsValid(selectedDate) || dateOnlyIsInFuture(selectedDate)) return;

    setVisibleMonth(monthStartFromDateValue(selectedDate));
  }, [selectedDate, setValue]);

  useEffect(() => {
    if (!calendarOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target instanceof Node ? event.target : null;
      if (
        target &&
        (calendarPopoverRef.current?.contains(target) || calendarButtonRef.current?.contains(target))
      ) {
        return;
      }

      setCalendarOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setCalendarOpen(false);
        calendarButtonRef.current?.focus({ preventScroll: true });
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [calendarOpen]);

  return (
    <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[20rem_minmax(0,1fr)] lg:items-start">
      <h2 className="text-2xl font-semibold tracking-tight text-slate-950 lg:col-span-2">Quick Facts</h2>

      <FieldGroup className="max-w-full lg:col-start-1 lg:row-start-2">
        <Field
          data-invalid={Boolean(errors.accidentDetails?.dateOfAccident)}
          className="w-full max-w-[19rem] min-w-0 sm:max-w-sm lg:max-w-none"
        >
          <FieldLabel htmlFor="accident-date-picker">
            <Calendar className="h-4 w-4 text-sky-700" />
            Date of Loss <span className="text-amber-600">*</span>
          </FieldLabel>
          <input
            id="accident-date"
            type="hidden"
            {...dateRegistration}
          />
          <FieldDescription className="hidden lg:block">
            Use the accident date or your closest estimate.
          </FieldDescription>
          <div className="relative">
            <button
              id="accident-date-picker"
              ref={calendarButtonRef}
              type="button"
              aria-label={selectedDateLabel ? `Date of Loss, ${selectedDateLabel}` : 'Date of Loss'}
              aria-haspopup="dialog"
              aria-expanded={calendarOpen}
              aria-controls="date-of-loss-calendar"
              aria-invalid={Boolean(errors.accidentDetails?.dateOfAccident)}
              onClick={() => setCalendarOpen((open) => !open)}
              className={cn(
                'flex h-11 w-full max-w-full min-w-0 items-center justify-between gap-3 rounded-lg border border-input bg-white px-3 py-2 text-left text-base outline-none transition-colors lg:h-[3.25rem]',
                'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
                errors.accidentDetails?.dateOfAccident && 'border-destructive ring-3 ring-destructive/20'
              )}
            >
              <span className={selectedDateLabel ? 'text-slate-950' : 'text-muted-foreground'}>
                {selectedDateLabel || 'Select date'}
              </span>
              <Calendar className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
            </button>

            {calendarOpen && (
              <div
                id="date-of-loss-calendar"
                ref={calendarPopoverRef}
                role="dialog"
                aria-label="Choose Date of Loss"
                className="absolute left-0 z-30 mt-2 w-[min(20rem,calc(100vw-3rem))] rounded-lg border border-slate-200 bg-white p-3 shadow-xl"
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    aria-label="Previous month"
                    onClick={() => setVisibleMonth((month) => shiftMonth(month, -1))}
                    className="flex size-9 items-center justify-center rounded-md border border-slate-200 text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <div className="text-sm font-semibold text-slate-900">{monthLabel}</div>
                  <button
                    type="button"
                    aria-label="Next month"
                    onClick={() => setVisibleMonth((month) => shiftMonth(month, 1))}
                    disabled={!canGoNextMonth}
                    className="flex size-9 items-center justify-center rounded-md border border-slate-200 text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white"
                  >
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase text-slate-500">
                  {weekdayLabels.map((label) => (
                    <span key={label} className="py-1">{label}</span>
                  ))}
                </div>
                <div className="mt-1 grid grid-cols-7 gap-1">
                  {calendarDays.map((day) => (
                    day.dateValue ? (
                      <button
                        key={day.key}
                        type="button"
                        onClick={() => commitDateSelection(day.dateValue as string)}
                        disabled={day.disabled}
                        aria-label={`${day.today ? 'Today, ' : ''}${formatDateForDisplay(day.dateValue)}`}
                        aria-pressed={day.selected}
                        className={cn(
                          'flex aspect-square min-h-9 items-center justify-center rounded-md text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                          day.selected
                            ? 'bg-sky-700 text-white hover:bg-sky-700'
                            : 'text-slate-800 hover:bg-slate-100',
                          day.today && !day.selected && 'ring-1 ring-sky-300',
                          day.disabled && 'cursor-not-allowed text-slate-300 hover:bg-transparent'
                        )}
                      >
                        {day.day}
                      </button>
                    ) : (
                      <span key={day.key} aria-hidden="true" className="aspect-square min-h-9" />
                    )
                  ))}
                </div>
              </div>
            )}
          </div>
          <FieldError>{errors.accidentDetails?.dateOfAccident?.message}</FieldError>
        </Field>
      </FieldGroup>

      <FieldSet className="lg:col-span-2 lg:row-start-3">
        <FieldLegend className="flex items-center gap-2">
          <Car className="h-4 w-4 text-amber-600" />
          Vehicle damage <span className="text-amber-600">*</span>
          <InfoIcon content="Vehicle damage is used as an impact-severity signal. It is one factor in an estimate, not a promise about claim value." />
        </FieldLegend>
        <input
          type="hidden"
          value={selectedDamage || ''}
          {...impactSeverityRegistration}
        />
        <RadioGroup
          value={selectedDamage}
          onValueChange={(value) => commitDamageSelection(value as VehicleDamageValue)}
          aria-label="Vehicle damage"
          aria-invalid={Boolean(errors.accidentDetails?.impactSeverity)}
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
        >
          {damageOptions.map((option) => {
            const inputId = `vehicle-damage-${option.value}`;
            const selected = selectedDamage === option.value;

            return (
              <label
                key={option.value}
                htmlFor={inputId}
                className={cn(
                  damageToggleItemClass,
                  'lg:min-h-[14rem] lg:flex-col',
                  selected && 'border-primary bg-primary/5 shadow-md'
                )}
              >
                <span aria-hidden="true" className="relative h-full w-24 shrink-0 overflow-hidden bg-muted sm:w-28 lg:h-32 lg:w-full lg:shrink">
                  <Image
                    src={option.imageSrc}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 25vw, (min-width: 640px) 112px, 96px"
                    className="h-full w-full object-cover"
                    draggable={false}
                  />
                </span>
                <span className="flex min-w-0 flex-1 flex-col justify-center gap-1.5 p-3 pr-11 lg:justify-start lg:pr-10">
                  <span className="text-sm font-semibold leading-tight">{option.label}</span>
                  <span className="damage-detail text-xs leading-snug text-muted-foreground">
                    {option.detail}
                  </span>
                </span>
                <RadioGroupItem
                  id={inputId}
                  value={option.value}
                  className={cn(
                    'absolute right-3 top-3 bg-background',
                    selected && 'border-primary bg-primary text-primary-foreground'
                  )}
                  aria-label={`${option.label}: ${option.detail}`}
                  aria-invalid={Boolean(errors.accidentDetails?.impactSeverity)}
                />
              </label>
            );
          })}
        </RadioGroup>
        <FieldError>{errors.accidentDetails?.impactSeverity?.message}</FieldError>
      </FieldSet>

      <FieldSet data-invalid={Boolean(bodyModelError)} className="lg:col-start-2 lg:row-start-2">
        <FieldLegend className="flex items-center gap-2">
          <ScanFace className="h-4 w-4 text-sky-700" />
          Body model <span className="text-amber-600">*</span>
        </FieldLegend>
        <FieldDescription>Visual preference for the injury map only.</FieldDescription>
        <ToggleGroup
          type="single"
          value={bodyModel}
          onValueChange={(value) => value && onBodyModelChange(value as BodyMapGender)}
          variant="default"
          spacing={1}
          aria-label="Choose body map model"
          aria-invalid={Boolean(bodyModelError)}
          className={cn(
            'grid w-full grid-cols-2 gap-1 rounded-[10px] border border-slate-200 bg-slate-100/80 p-1 shadow-inner lg:mt-2.5',
            bodyModelError && 'border-destructive ring-3 ring-destructive/20'
          )}
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
        <FieldError>{bodyModelError}</FieldError>
      </FieldSet>

    </div>
  );
}
