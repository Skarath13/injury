'use client';

import { useEffect, useMemo } from 'react';
import { FieldErrors, UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { RotateCcw, X } from 'lucide-react';
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
  return (
    <div className="flex min-h-11 items-center justify-between gap-2 rounded-lg border bg-card px-3 py-2">
      <p className="min-w-0 flex-1 truncate text-sm font-medium">{selection.label}</p>
      <Badge variant="outline" className={cn('shrink-0', SEVERITY_BADGE_CLASS[selection.severity])}>
        {BODY_MAP_SEVERITY_LABELS[selection.severity]}
      </Badge>
      <Button type="button" variant="ghost" size="icon-sm" onClick={onRemove} aria-label={`Remove ${selection.label}`}>
        <X data-icon="inline-start" />
      </Button>
    </div>
  );
}

export default function InjuriesStep({ register, watch, setValue, errors, bodyModel }: Props) {
  const injuries = watch('injuries');
  const bodyMap = injuries.bodyMap || [];
  const selectedSummary = bodyMapSummary(bodyMap);

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
    setValue('injuries.bodyMap', nextBodyMap, { shouldDirty: true, shouldValidate: true });
    const derived = deriveBodyMapOnlyInjuryFields({
      ...injuries,
      bodyMap: nextBodyMap
    });
    setValue('injuries.primaryInjury', derived.primaryInjury, { shouldDirty: true, shouldValidate: true });
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
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {([1, 2, 3, 4] as BodyMapSeverity[]).map((severity) => (
                  <div key={severity} className="flex min-h-11 items-center gap-2 rounded-lg border bg-card px-3 py-2">
                    <span
                      className="size-4 rounded-full ring-1 ring-foreground/10"
                      style={{ backgroundColor: INTENSITY_COLORS[severity] }}
                    />
                    <span className="font-medium">{BODY_MAP_SEVERITY_LABELS[severity]}</span>
                  </div>
                ))}
              </div>
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

            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-foreground">Injury list</p>
              {bodyMap.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {bodyMap.map((selection) => (
                    <SelectionBadge
                      key={`${selection.slug}-${selection.side}-${selection.view}`}
                      selection={selection}
                      onRemove={() => removeSelection(selection)}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  No injury area selected yet.
                </div>
              )}
            </div>

            {bodyMap.length === 0 && errors.injuries?.primaryInjury && (
              <FieldError>{errors.injuries.primaryInjury.message}</FieldError>
            )}

            {bodyMap.length > 0 && (
              <Button type="button" variant="outline" onClick={() => updateBodyMap([])}>
                <RotateCcw data-icon="inline-start" />
                Clear map
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
