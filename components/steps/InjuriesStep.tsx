'use client';

import { useCallback, useEffect, useMemo } from 'react';
import { FieldErrors, UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { RotateCcw, X } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from '@/components/motion/react';
import { BodyHighlighter, BodyPartHighlight } from '@/components/body-highlighter';
import { INTENSITY_COLORS } from '@/components/body-highlighter/constants';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FieldError } from '@/components/ui/field';
import {
  BODY_MAP_CLICKABLE_SLUGS,
  BODY_MAP_SEVERITY_LABELS,
  bodyMapHighlightTargetsForView,
  bodyMapSelectionAppliesToView,
  bodyMapSummary,
  cycleBodyMapSelection,
  deriveBodyMapOnlyInjuryFields,
  normalizeBodyMapSlug,
  removeBodyMapSelection
} from '@/lib/bodyMapInjuries';
import {
  BodyMapGender,
  BodyMapSelection,
  BodyMapSeverity,
  BodyMapSide,
  BodyMapSlug,
  BodyMapView,
  InjuryCalculatorData
} from '@/types/calculator';
import { cn } from '@/lib/utils';
import { fadeUpItem, premiumEase, softSpring, staggerContainer } from '@/components/motion/presets';

interface Props {
  register: UseFormRegister<InjuryCalculatorData>;
  watch: UseFormWatch<InjuryCalculatorData>;
  setValue: UseFormSetValue<InjuryCalculatorData>;
  errors: FieldErrors<InjuryCalculatorData>;
  bodyModel: BodyMapGender;
}

const SEVERITY_BADGE_CLASS: Record<BodyMapSeverity, string> = {
  1: 'border-yellow-200 bg-yellow-50 text-yellow-950',
  2: 'border-orange-200 bg-orange-50 text-orange-950',
  3: 'border-red-200 bg-red-50 text-red-950',
  4: 'border-red-950 bg-red-950 text-white'
};

function SelectionBadge({ selection, onRemove }: {
  selection: BodyMapSelection;
  onRemove: () => void;
}) {
  const shouldReduceMotion = Boolean(useReducedMotion());

  return (
    <motion.div
      className="flex min-h-11 items-center justify-between gap-2 rounded-lg border bg-card px-3 py-2"
      initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.98 }}
      transition={shouldReduceMotion ? { duration: 0.08 } : { duration: 0.22, ease: premiumEase }}
      whileHover={shouldReduceMotion ? undefined : { y: -1 }}
    >
      <p className="min-w-0 flex-1 truncate text-sm font-medium">{selection.label}</p>
      <Badge variant="outline" className={cn('shrink-0', SEVERITY_BADGE_CLASS[selection.severity])}>
        {BODY_MAP_SEVERITY_LABELS[selection.severity]}
      </Badge>
      <Button type="button" variant="ghost" size="icon-sm" onClick={onRemove} aria-label={`Remove ${selection.label}`}>
        <X data-icon="inline-start" />
      </Button>
    </motion.div>
  );
}

export default function InjuriesStep({ register, watch, setValue, errors, bodyModel }: Props) {
  const shouldReduceMotion = Boolean(useReducedMotion());
  const injuries = watch('injuries');
  const bodyMap = injuries.bodyMap || [];
  const selectedSummary = bodyMapSummary(bodyMap);

  const preserveScrollPosition = useCallback(() => {
    if (typeof window === 'undefined') return;

    const scrollY = window.scrollY;
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: scrollY, behavior: 'auto' });
      window.requestAnimationFrame(() => {
        window.scrollTo({ top: scrollY, behavior: 'auto' });
      });
    });
  }, []);

  const highlightedPartsByView = useMemo<Record<BodyMapView, BodyPartHighlight[]>>(() => ({
    front: bodyMap
      .filter((selection) => bodyMapSelectionAppliesToView(selection, 'front'))
      .flatMap((selection) => bodyMapHighlightTargetsForView(selection, 'front').map((target) => ({
        slug: target.slug,
        side: target.side === 'both' ? undefined : target.side,
        intensity: selection.severity,
        label: `${selection.label}\n${BODY_MAP_SEVERITY_LABELS[selection.severity]}`
      }))),
    back: bodyMap
      .filter((selection) => bodyMapSelectionAppliesToView(selection, 'back'))
      .flatMap((selection) => bodyMapHighlightTargetsForView(selection, 'back').map((target) => ({
        slug: target.slug,
        side: target.side === 'both' ? undefined : target.side,
        intensity: selection.severity,
        label: `${selection.label}\n${BODY_MAP_SEVERITY_LABELS[selection.severity]}`
      })))
  }), [bodyMap]);

  useEffect(() => {
    const derived = deriveBodyMapOnlyInjuryFields(injuries);
    if (derived.primaryInjury !== injuries.primaryInjury) {
      setValue('injuries.primaryInjury', derived.primaryInjury, { shouldDirty: true, shouldValidate: true });
    }
    if (JSON.stringify(derived.secondaryInjuries) !== JSON.stringify(injuries.secondaryInjuries || [])) {
      setValue('injuries.secondaryInjuries', derived.secondaryInjuries, { shouldDirty: true });
    }
    if (JSON.stringify(derived.fractures) !== JSON.stringify(injuries.fractures || [])) {
      setValue('injuries.fractures', derived.fractures, { shouldDirty: true });
    }
    if (JSON.stringify(derived.preExistingConditions) !== JSON.stringify(injuries.preExistingConditions || [])) {
      setValue('injuries.preExistingConditions', derived.preExistingConditions, { shouldDirty: true });
    }
    if (derived.tbi !== injuries.tbi) {
      setValue('injuries.tbi', derived.tbi, { shouldDirty: true });
    }
    if (derived.tbiSeverity !== injuries.tbiSeverity) {
      setValue('injuries.tbiSeverity', derived.tbiSeverity, { shouldDirty: true });
    }
    if (JSON.stringify(derived.spinalIssues) !== JSON.stringify(injuries.spinalIssues)) {
      setValue('injuries.spinalIssues', derived.spinalIssues, { shouldDirty: true });
    }
  }, [injuries, setValue]);

  const updateBodyMap = (nextBodyMap: BodyMapSelection[]) => {
    preserveScrollPosition();
    setValue('injuries.bodyMap', nextBodyMap, { shouldDirty: true, shouldValidate: true });
    const derived = deriveBodyMapOnlyInjuryFields({
      ...injuries,
      bodyMap: nextBodyMap
    });
    setValue('injuries.primaryInjury', derived.primaryInjury, { shouldDirty: true, shouldValidate: true });
    preserveScrollPosition();
  };

  const handleBodyPartClick = (view: BodyMapView) => (part: BodyPartHighlight) => {
    const slug = normalizeBodyMapSlug(part.slug as BodyMapSlug);
    if (!BODY_MAP_CLICKABLE_SLUGS.includes(slug)) return;
    const side = (slug === 'neck' || slug === 'trapezius')
      ? 'common'
      : (part.side || 'common') as BodyMapSide;

    updateBodyMap(cycleBodyMapSelection(bodyMap, {
      slug,
      side,
      view
    }));
  };

  const removeSelection = (selection: BodyMapSelection) => {
    updateBodyMap(removeBodyMapSelection(bodyMap, selection));
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-semibold tracking-tight">Where are you hurt?</h2>
        <p className="text-sm text-muted-foreground">Tap an area again to increase severity.</p>
      </div>

      <input
        type="hidden"
        {...register('injuries.primaryInjury', { required: 'Tap at least one injury area' })}
      />

      <Card>
        <CardContent className="flex flex-col gap-4 p-3 sm:p-6">
          <p className="sr-only">Body map. {selectedSummary}</p>

          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2 text-sm">
              <p className="text-sm font-medium text-foreground">Body Map Legend</p>
              <motion.div
                className="grid grid-cols-2 gap-2 sm:grid-cols-4"
                variants={staggerContainer}
                initial={shouldReduceMotion ? false : 'hidden'}
                animate="visible"
              >
                {([1, 2, 3, 4] as BodyMapSeverity[]).map((severity) => (
                  <motion.div key={severity} className="flex min-h-11 items-center gap-2 rounded-lg border bg-card px-3 py-2" variants={fadeUpItem}>
                    <motion.span
                      className="size-4 rounded-full ring-1 ring-foreground/10"
                      style={{ backgroundColor: INTENSITY_COLORS[severity] }}
                      animate={shouldReduceMotion ? undefined : { scale: [1, 1.08, 1] }}
                      transition={{ duration: 0.35, delay: severity * 0.04, ease: premiumEase }}
                    />
                    <span className="font-medium">{BODY_MAP_SEVERITY_LABELS[severity]}</span>
                  </motion.div>
                ))}
              </motion.div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {(['front', 'back'] as BodyMapView[]).map((view) => (
                <section key={view} className="flex flex-col items-center" aria-label={`${view === 'front' ? 'Front' : 'Back'} body map`}>
                  <h3 className="sr-only">{view === 'front' ? 'Front' : 'Back'}</h3>
                  <div
                    className="relative mx-auto flex h-[652px] w-full max-w-[400px] items-center justify-center overflow-hidden rounded-lg bg-muted/40 p-0 sm:h-[714px] sm:max-w-[442px] lg:h-[756px] xl:h-[630px] xl:max-w-[378px] 2xl:h-[714px] 2xl:max-w-[442px]"
                    data-testid={`body-map-stage-${view}`}
                  >
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute left-3 top-3 z-10 text-base font-semibold leading-none text-black"
                    >
                      {view === 'front' ? 'R' : 'L'}
                    </span>
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute right-3 top-3 z-10 text-base font-semibold leading-none text-black"
                    >
                      {view === 'front' ? 'L' : 'R'}
                    </span>
                    <BodyHighlighter
                      view={view}
                      gender={bodyModel}
                      data={highlightedPartsByView[view]}
                      scale={1.1}
                      width="100%"
                      height="100%"
                      className="max-h-full"
                      hitAreaStrokeWidth={4}
                      preserveAspectRatio="xMidYMid meet"
                      interactive
                      onBodyPartClick={handleBodyPartClick(view)}
                    />
                  </div>
                </section>
              ))}
            </div>

            <div className="flex flex-col gap-2 [overflow-anchor:none]">
              <p className="text-sm font-medium text-foreground">Injury list</p>
              <div className="min-h-[72px] rounded-lg [overflow-anchor:none]">
                <AnimatePresence initial={false} mode="wait">
                  {bodyMap.length === 0 ? (
                  <motion.div
                    key="empty-injury-list"
                    className="min-h-[72px] rounded-lg border border-dashed p-4 text-sm text-muted-foreground"
                    initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={shouldReduceMotion ? { duration: 0.08 } : { duration: 0.2, ease: premiumEase }}
                  >
                    No injury area selected yet.
                  </motion.div>
                  ) : (
                    <motion.div
                      key="injury-selections"
                      className="flex max-h-[220px] flex-col gap-2 overflow-y-auto pr-1 [overflow-anchor:none]"
                      initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <AnimatePresence initial={false}>
                        {bodyMap.map((selection) => (
                          <SelectionBadge
                            key={`${selection.slug}-${selection.side}-${selection.view}`}
                            selection={selection}
                            onRemove={() => removeSelection(selection)}
                          />
                        ))}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {bodyMap.length === 0 && errors.injuries?.primaryInjury && (
              <FieldError>{errors.injuries.primaryInjury.message}</FieldError>
            )}

            <div className="min-h-10 [overflow-anchor:none]">
              <AnimatePresence initial={false}>
                {bodyMap.length > 0 && (
                  <motion.div
                    initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={shouldReduceMotion ? { duration: 0.08 } : softSpring}
                  >
                    <Button type="button" variant="outline" onClick={() => updateBodyMap([])}>
                      <RotateCcw data-icon="inline-start" />
                      Clear map
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
