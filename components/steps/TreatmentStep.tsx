'use client';

import { useCallback, useEffect, useRef, useState, type ChangeEvent, type ComponentType } from 'react';
import { FieldErrors, UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { AnimatePresence, motion, useReducedMotion } from '@/components/motion/react';
import {
  Activity,
  Calculator,
  CheckCircle2,
  Hospital,
  Minus,
  Plus,
  Scan,
  Scissors,
  Stethoscope,
  Syringe
} from 'lucide-react';
import settlementLogicConfig from '@/config/settlement-logic.v1.json';
import { cn } from '@/lib/utils';
import { InjuryCalculatorData } from '@/types/calculator';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { Separator } from '@/components/ui/separator';
import { fadeUpItem, reducedMotionFade, staggerContainer } from '@/components/motion/presets';

interface Props {
  register: UseFormRegister<InjuryCalculatorData>;
  watch: UseFormWatch<InjuryCalculatorData>;
  setValue: UseFormSetValue<InjuryCalculatorData>;
  errors: FieldErrors<InjuryCalculatorData>;
}

type CostRange = {
  low: number;
  mid: number;
  high: number;
};

type NumericTreatmentField =
  | 'ambulanceTransports'
  | 'emergencyRoomVisits'
  | 'urgentCareVisits'
  | 'hospitalAdmissionDays'
  | 'chiropracticSessions'
  | 'physicalTherapySessions'
  | 'occupationalTherapySessions'
  | 'xrays'
  | 'mris'
  | 'ctScans'
  | 'emgNerveStudies'
  | 'followUpDoctorVisits'
  | 'painManagementVisits'
  | 'orthopedicConsults'
  | 'neurologyConsults'
  | 'mentalHealthSessions'
  | 'tpiInjections'
  | 'facetInjections'
  | 'mbbInjections'
  | 'esiInjections'
  | 'rfaInjections'
  | 'prpInjections';

type RangeKey = keyof typeof settlementLogicConfig.treatmentCostRanges;

interface TreatmentItem {
  key: NumericTreatmentField;
  rangeKey: RangeKey;
  label: string;
  description: string;
  max?: number;
}

interface TreatmentTone {
  itemClassName: string;
  triggerClassName: string;
  iconClassName: string;
  titleClassName: string;
}

interface TreatmentSection {
  value: string;
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  tone: TreatmentTone;
  items: TreatmentItem[];
}

const COST_RANGES = settlementLogicConfig.treatmentCostRanges;

const SURGERY_TONE: TreatmentTone = {
  itemClassName: 'border-amber-100 bg-amber-50/25',
  triggerClassName: 'hover:bg-amber-50/60',
  iconClassName: 'bg-amber-100 text-amber-700',
  titleClassName: 'text-amber-950'
};

const accordionRowTriggerClassName = 'min-h-16 rounded-none px-4 py-4 hover:no-underline active:bg-background/40';

const TREATMENT_SECTIONS: TreatmentSection[] = [
  {
    value: 'emergency',
    title: 'Emergency care',
    description: 'Transport, ER, urgent care, and hospital days.',
    icon: Hospital,
    tone: {
      itemClassName: 'border-red-100 bg-red-50/25',
      triggerClassName: 'hover:bg-red-50/60',
      iconClassName: 'bg-red-100 text-red-700',
      titleClassName: 'text-red-950'
    },
    items: [
      {
        key: 'ambulanceTransports',
        rangeKey: 'ambulanceTransports',
        label: 'Ambulance transports',
        description: 'Emergency medical transport after the crash.',
        max: 10
      },
      {
        key: 'emergencyRoomVisits',
        rangeKey: 'emergencyRoomVisits',
        label: 'Emergency room visits',
        description: 'Hospital emergency department visits.',
        max: 20
      },
      {
        key: 'urgentCareVisits',
        rangeKey: 'urgentCareVisits',
        label: 'Urgent care visits',
        description: 'Urgent care or walk-in clinic visits.',
        max: 20
      },
      {
        key: 'hospitalAdmissionDays',
        rangeKey: 'hospitalAdmissionDays',
        label: 'Hospital admission days',
        description: 'Overnight inpatient days related to the accident.',
        max: 60
      }
    ]
  },
  {
    value: 'therapy',
    title: 'Therapy and rehab',
    description: 'Chiropractic, physical therapy, and occupational therapy.',
    icon: Activity,
    tone: {
      itemClassName: 'border-emerald-100 bg-emerald-50/25',
      triggerClassName: 'hover:bg-emerald-50/60',
      iconClassName: 'bg-emerald-100 text-emerald-700',
      titleClassName: 'text-emerald-950'
    },
    items: [
      {
        key: 'chiropracticSessions',
        rangeKey: 'chiropracticSessions',
        label: 'Chiropractic sessions',
        description: 'Adjustment or chiropractic rehab visits.',
        max: 120
      },
      {
        key: 'physicalTherapySessions',
        rangeKey: 'physicalTherapySessions',
        label: 'Physical therapy sessions',
        description: 'PT visits, exercises, manual therapy, or modalities.',
        max: 120
      },
      {
        key: 'occupationalTherapySessions',
        rangeKey: 'occupationalTherapySessions',
        label: 'Occupational therapy sessions',
        description: 'Hand, wrist, shoulder, or function-focused therapy.',
        max: 120
      }
    ]
  },
  {
    value: 'imaging',
    title: 'Imaging and diagnostics',
    description: 'X-rays, MRI, CT, and nerve testing.',
    icon: Scan,
    tone: {
      itemClassName: 'border-sky-100 bg-sky-50/25',
      triggerClassName: 'hover:bg-sky-50/60',
      iconClassName: 'bg-sky-100 text-sky-700',
      titleClassName: 'text-sky-950'
    },
    items: [
      {
        key: 'xrays',
        rangeKey: 'xrays',
        label: 'X-rays',
        description: 'Any accident-related X-ray study.',
        max: 30
      },
      {
        key: 'mris',
        rangeKey: 'mris',
        label: 'MRIs',
        description: 'MRI studies for spine, brain, joints, or soft tissue.',
        max: 20
      },
      {
        key: 'ctScans',
        rangeKey: 'ctScans',
        label: 'CT scans',
        description: 'CT imaging for head, spine, chest, abdomen, or pelvis.',
        max: 20
      },
      {
        key: 'emgNerveStudies',
        rangeKey: 'emgNerveStudies',
        label: 'EMG / nerve studies',
        description: 'Electrodiagnostic testing for nerve symptoms.',
        max: 10
      }
    ]
  },
  {
    value: 'specialists',
    title: 'Doctors and specialists',
    description: 'Follow-ups, orthopedic, pain, neuro, and mental health care.',
    icon: Stethoscope,
    tone: {
      itemClassName: 'border-indigo-100 bg-indigo-50/25',
      triggerClassName: 'hover:bg-indigo-50/60',
      iconClassName: 'bg-indigo-100 text-indigo-700',
      titleClassName: 'text-indigo-950'
    },
    items: [
      {
        key: 'followUpDoctorVisits',
        rangeKey: 'followUpDoctorVisits',
        label: 'Follow-up doctor visits',
        description: 'Primary care or general follow-up visits.',
        max: 60
      },
      {
        key: 'orthopedicConsults',
        rangeKey: 'orthopedicConsults',
        label: 'Orthopedic consults',
        description: 'Orthopedic or spine specialist appointments.',
        max: 30
      },
      {
        key: 'painManagementVisits',
        rangeKey: 'painManagementVisits',
        label: 'Pain management visits',
        description: 'Pain specialist consultations or follow-ups.',
        max: 30
      },
      {
        key: 'neurologyConsults',
        rangeKey: 'neurologyConsults',
        label: 'Neurology consults',
        description: 'Neurology visits for concussion, nerve, or headache symptoms.',
        max: 30
      },
      {
        key: 'mentalHealthSessions',
        rangeKey: 'mentalHealthSessions',
        label: 'Mental health sessions',
        description: 'Therapy or counseling for accident-related distress.',
        max: 80
      }
    ]
  },
  {
    value: 'injections',
    title: 'Injections and procedures',
    description: 'Pain procedures often used for spine and joint injuries.',
    icon: Syringe,
    tone: {
      itemClassName: 'border-violet-100 bg-violet-50/25',
      triggerClassName: 'hover:bg-violet-50/60',
      iconClassName: 'bg-violet-100 text-violet-700',
      titleClassName: 'text-violet-950'
    },
    items: [
      {
        key: 'tpiInjections',
        rangeKey: 'tpiInjections',
        label: 'Trigger point injections',
        description: 'TPI procedures for muscle pain or spasm.',
        max: 20
      },
      {
        key: 'facetInjections',
        rangeKey: 'facetInjections',
        label: 'Facet joint injections',
        description: 'Facet injections for neck or back pain generators.',
        max: 20
      },
      {
        key: 'mbbInjections',
        rangeKey: 'mbbInjections',
        label: 'Medial branch blocks',
        description: 'Diagnostic blocks before possible ablation.',
        max: 20
      },
      {
        key: 'esiInjections',
        rangeKey: 'esiInjections',
        label: 'Epidural steroid injections',
        description: 'ESI procedures for radiating pain or disc findings.',
        max: 20
      },
      {
        key: 'rfaInjections',
        rangeKey: 'rfaInjections',
        label: 'Radiofrequency ablation',
        description: 'RFA procedures after successful diagnostic blocks.',
        max: 12
      },
      {
        key: 'prpInjections',
        rangeKey: 'prpInjections',
        label: 'PRP injections',
        description: 'Platelet rich plasma injections for soft tissue or joints.',
        max: 12
      }
    ]
  }
];

function formatCurrency(value: number) {
  return `$${Math.round(value).toLocaleString()}`;
}

function formatRange(range: CostRange) {
  if (range.low === 0 && range.high === 0) return '$0';
  return `${formatCurrency(range.low)} - ${formatCurrency(range.high)}`;
}

function addRanges(left: CostRange, right: CostRange): CostRange {
  return {
    low: left.low + right.low,
    mid: left.mid + right.mid,
    high: left.high + right.high
  };
}

function multiplyRange(range: CostRange, count: number): CostRange {
  return {
    low: range.low * count,
    mid: range.mid * count,
    high: range.high * count
  };
}

function emptyRange(): CostRange {
  return { low: 0, mid: 0, high: 0 };
}

function NumberInput({
  item,
  value,
  onChange
}: {
  item: TreatmentItem;
  value: number;
  onChange: (value: number) => void;
}) {
  const max = item.max ?? 999;
  const itemRange = COST_RANGES[item.rangeKey];

  const updateValue = (nextValue: number) => {
    onChange(Math.min(max, Math.max(0, nextValue)));
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    updateValue(Number.parseInt(event.target.value, 10) || 0);
  };

  return (
    <Field className="border-t border-border/70 bg-transparent py-3 first:border-t-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <FieldContent>
          <FieldLabel className="text-sm font-semibold text-foreground">{item.label}</FieldLabel>
          <FieldDescription className="text-xs">
            {item.description} {formatRange(itemRange)} each.
          </FieldDescription>
        </FieldContent>

        <div className="flex shrink-0 items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon-lg"
            className="size-11 rounded-full"
            onClick={() => updateValue(value - 1)}
            disabled={value <= 0}
            aria-label={`Decrease ${item.label}`}
          >
            <Minus />
          </Button>

          <Input
            type="number"
            inputMode="numeric"
            min={0}
            max={max}
            value={value}
            onChange={handleInputChange}
            className="h-11 w-20 text-center text-base font-semibold tabular-nums"
            aria-label={item.label}
          />

          <Button
            type="button"
            variant="outline"
            size="icon-lg"
            className="size-11 rounded-full"
            onClick={() => updateValue(value + 1)}
            disabled={value >= max}
            aria-label={`Increase ${item.label}`}
          >
            <Plus />
          </Button>
        </div>
      </div>
    </Field>
  );
}

function SectionSummary({ count, range, reserveRange = false }: { count: number; range: CostRange; reserveRange?: boolean }) {
  const hasSelection = count > 0;
  const showRangeSlot = hasSelection || reserveRange;

  return (
    <div
      className={cn(
        'grid w-full shrink-0 content-start justify-items-start gap-1 text-left sm:w-40 sm:justify-items-end sm:text-right',
        showRangeSlot ? 'min-h-[3.25rem]' : 'min-h-5'
      )}
    >
      <span
        className={cn(
          'inline-flex h-5 w-[6.25rem] items-center justify-center rounded-full px-2 py-0.5 text-xs font-medium tabular-nums whitespace-nowrap',
          hasSelection
            ? 'bg-primary text-primary-foreground'
            : 'bg-secondary text-secondary-foreground'
        )}
      >
        {hasSelection ? `${count} selected` : 'Not added'}
      </span>
      {showRangeSlot && (
        <span
          aria-hidden={!hasSelection}
          className={cn(
            'block h-4 w-40 overflow-hidden text-ellipsis whitespace-nowrap text-xs font-medium text-muted-foreground tabular-nums',
            !hasSelection && 'invisible'
          )}
        >
          {hasSelection ? formatRange(range) : '$0'}
        </span>
      )}
    </div>
  );
}

export default function TreatmentStep({ register, watch, setValue }: Props) {
  const shouldReduceMotion = Boolean(useReducedMotion());
  const treatmentCategoryRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const openTreatmentCategoriesRef = useRef<string[]>([]);
  const [openTreatmentCategories, setOpenTreatmentCategories] = useState<string[]>([]);
  const treatment = watch('treatment');
  const surgeryRecommended = Boolean(treatment.surgeryRecommended);
  const surgeryCompleted = Boolean(treatment.surgeryCompleted);
  const ongoingTreatment = Boolean(treatment.ongoingTreatment);

  useEffect(() => {
    setValue('treatment.useEstimatedCosts', true, { shouldDirty: false, shouldValidate: false });
    setValue('treatment.totalMedicalCosts', 0, { shouldDirty: false, shouldValidate: false });
  }, [setValue]);

  const getValue = (key: NumericTreatmentField) => Number(treatment[key] || 0);
  const updateTreatmentCount = (key: NumericTreatmentField, value: number) => {
    setValue(`treatment.${key}`, value, { shouldDirty: true, shouldValidate: true });
  };

  const anchorTreatmentCategory = useCallback((category: string) => {
    if (typeof window === 'undefined') return;

    const scrollToCategory = () => {
      const categoryNode = treatmentCategoryRefs.current[category];
      if (!categoryNode) return;

      const top = categoryNode.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: Math.max(0, top),
        behavior: shouldReduceMotion ? 'auto' : 'smooth'
      });
    };

    window.requestAnimationFrame(() => {
      scrollToCategory();
      window.requestAnimationFrame(scrollToCategory);
    });
  }, [shouldReduceMotion]);

  const handleTreatmentAccordionChange = useCallback((nextCategories: string[]) => {
    const newlyOpenedCategory = nextCategories.find(
      (category) => !openTreatmentCategoriesRef.current.includes(category)
    );

    openTreatmentCategoriesRef.current = nextCategories;
    setOpenTreatmentCategories(nextCategories);

    if (newlyOpenedCategory) {
      anchorTreatmentCategory(newlyOpenedCategory);
    }
  }, [anchorTreatmentCategory]);

  const rangeForItems = (items: TreatmentItem[]) => items.reduce((total, item) => {
    const value = getValue(item.key);
    return addRanges(total, multiplyRange(COST_RANGES[item.rangeKey], value));
  }, emptyRange());

  const countForItems = (items: TreatmentItem[]) => items.reduce((total, item) => total + getValue(item.key), 0);

  const surgeryRange = surgeryRecommended || surgeryCompleted
    ? treatment.surgeryType === 'minor'
      ? COST_RANGES.surgeryMinor
      : treatment.surgeryType === 'moderate'
        ? COST_RANGES.surgeryModerate
        : treatment.surgeryType === 'major'
          ? COST_RANGES.surgeryMajor
          : emptyRange()
    : emptyRange();
  const surgeryCount = Number(surgeryRecommended || surgeryCompleted || ongoingTreatment);
  const totalRange = TREATMENT_SECTIONS
    .map((section) => rangeForItems(section.items))
    .reduce(addRanges, surgeryRange);
  const totalCount = TREATMENT_SECTIONS
    .map((section) => countForItems(section.items))
    .reduce((total, count) => total + count, surgeryCount);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">Treatment</h2>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          Select the care you have received. The estimate uses reasonable treatment ranges instead of raw bills.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
        <Card className="lg:min-w-0">
          <CardHeader>
            <CardTitle>Care categories</CardTitle>
            <CardDescription>Open each section that applies and add counts with the steppers.</CardDescription>
          </CardHeader>
          <CardContent>
            <motion.div
              variants={staggerContainer}
              initial={shouldReduceMotion ? false : 'hidden'}
              animate="visible"
            >
              <Accordion
                type="multiple"
                value={openTreatmentCategories}
                onValueChange={handleTreatmentAccordionChange}
                className="rounded-lg border"
              >
                {TREATMENT_SECTIONS.map((section) => {
                  const Icon = section.icon;
                  const sectionCount = countForItems(section.items);
                  const sectionRange = rangeForItems(section.items);

                  return (
                    <AccordionItem
                      key={section.value}
                      ref={(node) => {
                        treatmentCategoryRefs.current[section.value] = node;
                      }}
                      value={section.value}
                      className={cn('border-b last:border-b-0', section.tone.itemClassName)}
                    >
                      <motion.div variants={fadeUpItem}>
                        <AccordionTrigger className={cn(accordionRowTriggerClassName, section.tone.triggerClassName)}>
                          <div className="flex w-full min-w-0 flex-col gap-3 pr-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="flex min-w-0 items-start gap-3 text-left sm:flex-1">
                              <span className={cn('mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full', section.tone.iconClassName)}>
                                <Icon className="size-4" />
                              </span>
                              <span className="min-w-0">
                                <span className={cn('block text-sm font-semibold', section.tone.titleClassName)}>{section.title}</span>
                                <span className="mt-1 block text-xs leading-5 text-muted-foreground">{section.description}</span>
                              </span>
                            </div>
                            <SectionSummary
                              count={sectionCount}
                              range={sectionRange}
                              reserveRange={openTreatmentCategories.includes(section.value)}
                            />
                          </div>
                        </AccordionTrigger>
                      </motion.div>
                      <AccordionContent className="px-4 pb-4">
                        <FieldGroup>
                          {section.items.map((item) => (
                            <NumberInput
                              key={item.key}
                              item={item}
                              value={getValue(item.key)}
                              onChange={(value) => updateTreatmentCount(item.key, value)}
                            />
                          ))}
                        </FieldGroup>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}

                <AccordionItem
                  ref={(node) => {
                    treatmentCategoryRefs.current.surgery = node;
                  }}
                  value="surgery"
                  className={cn('last:border-b-0', SURGERY_TONE.itemClassName)}
                >
                  <AccordionTrigger className={cn(accordionRowTriggerClassName, SURGERY_TONE.triggerClassName)}>
                    <div className="flex w-full min-w-0 flex-col gap-3 pr-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex min-w-0 items-start gap-3 text-left sm:flex-1">
                        <span className={cn('mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full', SURGERY_TONE.iconClassName)}>
                          <Scissors className="size-4" />
                        </span>
                        <span className="min-w-0">
                          <span className={cn('block text-sm font-semibold', SURGERY_TONE.titleClassName)}>Surgery and future care</span>
                          <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                            Recommended or completed procedures and ongoing treatment.
                          </span>
                        </span>
                      </div>
                      <SectionSummary
                        count={surgeryCount}
                        range={surgeryRange}
                        reserveRange={openTreatmentCategories.includes('surgery')}
                      />
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <FieldGroup>
                      <Field orientation="horizontal" className="rounded-lg border bg-background p-3">
                        <Checkbox
                          id="surgeryRecommended"
                          checked={surgeryRecommended}
                          onCheckedChange={(checked) => {
                            const nextValue = checked === true;
                            setValue('treatment.surgeryRecommended', nextValue, { shouldDirty: true });
                            if (!nextValue) {
                              setValue('treatment.surgeryCompleted', false, { shouldDirty: true });
                              setValue('treatment.surgeryType', undefined, { shouldDirty: true });
                            }
                          }}
                        />
                        <FieldContent>
                          <FieldLabel htmlFor="surgeryRecommended">Surgery recommended by a doctor</FieldLabel>
                          <FieldDescription>Use this when a provider has discussed or recommended surgery.</FieldDescription>
                        </FieldContent>
                      </Field>

                      <AnimatePresence initial={false}>
                        {surgeryRecommended && (
                          <motion.div
                            key="surgery-details"
                            className="flex flex-col gap-4 rounded-lg border bg-muted/30 p-3"
                            {...reducedMotionFade(shouldReduceMotion)}
                            layout
                          >
                            <Field orientation="horizontal">
                              <Checkbox
                                id="surgeryCompleted"
                                checked={surgeryCompleted}
                                onCheckedChange={(checked) => setValue('treatment.surgeryCompleted', checked === true, { shouldDirty: true })}
                              />
                              <FieldContent>
                                <FieldLabel htmlFor="surgeryCompleted">Surgery completed</FieldLabel>
                                <FieldDescription>Select this if the accident-related surgery already happened.</FieldDescription>
                              </FieldContent>
                            </Field>

                            <Separator />

                            <Field>
                              <FieldLabel>Surgery type</FieldLabel>
                              <NativeSelect {...register('treatment.surgeryType')} className="min-h-11">
                                <option value="">Select surgery type...</option>
                                <option value="minor">Minor surgery: arthroscopy or smaller procedure ($20k - $75k)</option>
                                <option value="moderate">Moderate surgery: disc or joint repair ($45k - $140k)</option>
                                <option value="major">Major surgery: fusion or replacement ($90k - $250k)</option>
                              </NativeSelect>
                              <FieldDescription>Choose the closest category; the estimate still uses a broad range.</FieldDescription>
                            </Field>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <Field orientation="horizontal" className={cn('rounded-lg border bg-background p-3', ongoingTreatment && 'bg-muted/40')}>
                        <Checkbox
                          id="ongoingTreatment"
                          checked={ongoingTreatment}
                          onCheckedChange={(checked) => setValue('treatment.ongoingTreatment', checked === true, { shouldDirty: true })}
                        />
                        <FieldContent>
                          <FieldLabel htmlFor="ongoingTreatment">Still receiving treatment or future care is planned</FieldLabel>
                          <FieldDescription>Use this when care is ongoing, even if future costs are not known yet.</FieldDescription>
                        </FieldContent>
                      </Field>
                    </FieldGroup>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </motion.div>
          </CardContent>
        </Card>

        <Card className="lg:sticky lg:top-4">
          <CardHeader className="gap-3 sm:grid-cols-[1fr_auto] lg:grid-cols-1">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted">
                <Calculator className="size-5 text-muted-foreground" />
              </span>
              <div className="min-w-0">
                <CardTitle>Estimated medical specials</CardTitle>
                <CardDescription>
                  {totalCount > 0 ? `${totalCount} treatment item${totalCount === 1 ? '' : 's'} selected` : 'Nothing selected yet'}
                </CardDescription>
              </div>
            </div>
            <div className="rounded-lg border bg-muted/40 px-3 py-2 text-left sm:text-right lg:text-left">
              <p className="text-xs font-medium text-muted-foreground">Reasonable value range</p>
              <p className="text-base font-semibold text-foreground">{formatRange(totalRange)}</p>
            </div>
          </CardHeader>
          <CardContent>
            <Alert>
              <CheckCircle2 data-icon="inline-start" />
              <AlertDescription>
                No medical bills are entered here. Insurers often negotiate or reduce charges, so this calculator estimates low, mid, and high medical specials from treatment counts.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
