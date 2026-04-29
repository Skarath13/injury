'use client';

import { useEffect, useMemo } from 'react';
import { FieldErrors, UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { AlertCircle, Bone, Brain, RotateCcw, X } from 'lucide-react';
import { BodyHighlighter, BodyPartHighlight } from '@/components/body-highlighter';
import { INTENSITY_COLORS } from '@/components/body-highlighter/constants';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet
} from '@/components/ui/field';
import { NativeSelect } from '@/components/ui/native-select';
import {
  BODY_MAP_CLICKABLE_SLUGS,
  BODY_MAP_SEVERITY_LABELS,
  bodyMapHighlightTargetsForView,
  bodyMapSelectionAppliesToView,
  bodyMapSummary,
  cycleBodyMapSelection,
  deriveLegacyInjuryFields,
  hasBodyMapRegion,
  hasBoneOrJointRegion,
  hasHeadRegion,
  hasSpineRegion,
  highestBodyMapSeverity,
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
  COMMON_FRACTURES,
  PRE_EXISTING_CONDITIONS,
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

const SPINAL_FIELD_OPTIONS = [
  { path: 'injuries.spinalIssues.herniation', key: 'herniation', label: 'Disc herniation' },
  { path: 'injuries.spinalIssues.nerveRootCompression', key: 'nerveRootCompression', label: 'Nerve root compression' },
  { path: 'injuries.spinalIssues.radiculopathy', key: 'radiculopathy', label: 'Radiating nerve pain' },
  { path: 'injuries.spinalIssues.myelopathy', key: 'myelopathy', label: 'Spinal cord compression' },
  { path: 'injuries.spinalIssues.preExistingDegeneration', key: 'preExistingDegeneration', label: 'Aggravated degeneration' }
] as const;

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
  const hasTBI = watch('injuries.tbi');
  const tbiSeverity = watch('injuries.tbiSeverity');
  const selectedFractures = watch('injuries.fractures') || [];
  const secondaryInjuries = watch('injuries.secondaryInjuries') || [];
  const spinal = watch('injuries.spinalIssues');
  const highestSeverity = highestBodyMapSeverity(bodyMap);
  const selectedSummary = bodyMapSummary(bodyMap);

  const hasHeadSelection = hasHeadRegion(bodyMap) || hasTBI;
  const hasSpineSelection = hasSpineRegion(bodyMap) || Object.values(spinal).some(Boolean);
  const hasBoneSelection = hasBoneOrJointRegion(bodyMap) || selectedFractures.length > 0 || highestSeverity >= 3;
  const hasTorsoSelection = hasBodyMapRegion(bodyMap, ['chest', 'abs', 'obliques']) || secondaryInjuries.includes('Internal Injuries');

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
    const derived = deriveLegacyInjuryFields(injuries);
    if (derived.primaryInjury !== injuries.primaryInjury) {
      setValue('injuries.primaryInjury', derived.primaryInjury, { shouldDirty: true, shouldValidate: true });
    }
    const explicitSecondary = injuries.secondaryInjuries.filter((injury) => (
      injury === 'Internal Injuries' || injury === 'Scarring / Disfigurement'
    ));
    const desiredSecondary = Array.from(new Set([...derived.secondaryInjuries, ...explicitSecondary]));
    if (JSON.stringify(desiredSecondary) !== JSON.stringify(injuries.secondaryInjuries)) {
      setValue('injuries.secondaryInjuries', desiredSecondary, { shouldDirty: true });
    }
  }, [
    bodyMap,
    injuries.primaryInjury,
    injuries.secondaryInjuries,
    injuries.tbi,
    injuries.spinalIssues.herniation,
    injuries.spinalIssues.nerveRootCompression,
    injuries.spinalIssues.radiculopathy,
    injuries.spinalIssues.myelopathy,
    setValue
  ]);

  const updateBodyMap = (nextBodyMap: BodyMapSelection[]) => {
    setValue('injuries.bodyMap', nextBodyMap, { shouldDirty: true, shouldValidate: true });
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

  const setCheckbox = (name: Parameters<typeof setValue>[0], checked: boolean) => {
    setValue(name, checked as never, { shouldDirty: true, shouldValidate: true });
  };

  const toggleArrayValue = (
    name: 'injuries.fractures' | 'injuries.preExistingConditions' | 'injuries.secondaryInjuries',
    value: string,
    checked: boolean
  ) => {
    const current = watch(name) as string[] | undefined;
    const next = checked
      ? Array.from(new Set([...(current || []), value]))
      : (current || []).filter((item) => item !== value);
    setValue(name, next, { shouldDirty: true, shouldValidate: true });
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

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
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

            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-2 text-sm">
                <p className="text-sm font-medium text-foreground">Legend</p>
                <div className="grid grid-cols-2 gap-2">
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

              {errors.injuries?.primaryInjury && (
                <FieldError>{errors.injuries.primaryInjury.message}</FieldError>
              )}

              {bodyMap.length > 0 && (
                <Button type="button" variant="outline" onClick={() => updateBodyMap([])}>
                  <RotateCcw data-icon="inline-start" />
                  Clear map
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {(hasHeadSelection || hasSpineSelection || hasBoneSelection || hasTorsoSelection) && (
        <FieldSet>
          <FieldLegend>Follow-up signals</FieldLegend>
          <FieldGroup>
            {hasHeadSelection && (
              <Card>
                <CardHeader className="pb-0">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Brain data-icon="inline-start" />
                    Head symptoms
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <Field orientation="horizontal">
                    <Checkbox
                      id="tbi"
                      checked={hasTBI}
                      onCheckedChange={(checked) => setValue('injuries.tbi', checked === true, { shouldDirty: true, shouldValidate: true })}
                    />
                    <FieldContent>
                      <FieldLabel htmlFor="tbi">Possible concussion or TBI diagnosis</FieldLabel>
                      <FieldDescription>Use this only if a provider discussed concussion, brain injury, or similar symptoms.</FieldDescription>
                    </FieldContent>
                  </Field>

                  {hasTBI && (
                    <Field>
                      <FieldLabel htmlFor="tbiSeverity">TBI severity</FieldLabel>
                      <NativeSelect
                        id="tbiSeverity"
                        className="w-full"
                        value={tbiSeverity || ''}
                        onChange={(event) => setValue('injuries.tbiSeverity', event.target.value as InjuryCalculatorData['injuries']['tbiSeverity'], { shouldDirty: true })}
                      >
                        <option value="">Not sure</option>
                        <option value="mild">Mild / concussion</option>
                        <option value="moderate">Moderate</option>
                        <option value="severe">Severe</option>
                      </NativeSelect>
                    </Field>
                  )}
                </CardContent>
              </Card>
            )}

            {hasSpineSelection && (
              <Card>
                <CardHeader className="pb-0">
                  <CardTitle className="text-base">Neck or back findings</CardTitle>
                  <CardDescription>Only select objective findings you were told about.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-2">
                  {SPINAL_FIELD_OPTIONS.map(({ path, key, label }) => (
                    <Field key={path} orientation="horizontal" className="rounded-lg border p-3">
                      <Checkbox
                        id={path}
                        checked={Boolean(spinal[key])}
                        onCheckedChange={(checked) => setCheckbox(path, checked === true)}
                      />
                      <FieldLabel htmlFor={path}>{label}</FieldLabel>
                    </Field>
                  ))}
                </CardContent>
              </Card>
            )}

            {hasBoneSelection && (
              <Card>
                <CardHeader className="pb-0">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Bone data-icon="inline-start" />
                    Possible fracture diagnosis
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-2">
                  {COMMON_FRACTURES.map((fracture) => (
                    <Field key={fracture} orientation="horizontal" className="rounded-lg border p-3">
                      <Checkbox
                        id={`fracture-${fracture}`}
                        checked={selectedFractures.includes(fracture)}
                        onCheckedChange={(checked) => toggleArrayValue('injuries.fractures', fracture, checked === true)}
                      />
                      <FieldLabel htmlFor={`fracture-${fracture}`}>{fracture}</FieldLabel>
                    </Field>
                  ))}
                </CardContent>
              </Card>
            )}

            {(hasTorsoSelection || highestSeverity >= 3) && (
              <Card>
                <CardHeader className="pb-0">
                  <CardTitle className="text-base">Other visible or internal signs</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-2">
                  {['Internal Injuries', 'Scarring / Disfigurement'].map((injury) => (
                    <Field key={injury} orientation="horizontal" className="rounded-lg border p-3">
                      <Checkbox
                        id={`secondary-${injury}`}
                        checked={secondaryInjuries.includes(injury)}
                        onCheckedChange={(checked) => toggleArrayValue('injuries.secondaryInjuries', injury, checked === true)}
                      />
                      <FieldLabel htmlFor={`secondary-${injury}`}>{injury}</FieldLabel>
                    </Field>
                  ))}
                </CardContent>
              </Card>
            )}
          </FieldGroup>
        </FieldSet>
      )}

      <details className="rounded-lg border bg-muted/30 p-4">
        <summary className="cursor-pointer text-sm font-medium">Pre-existing same-area conditions</summary>
        <FieldGroup className="mt-4 grid gap-3 sm:grid-cols-2">
          {PRE_EXISTING_CONDITIONS.map((condition) => (
            <Field key={condition} orientation="horizontal" className="rounded-lg border bg-card p-3">
              <Checkbox
                id={`condition-${condition}`}
                checked={(watch('injuries.preExistingConditions') || []).includes(condition)}
                onCheckedChange={(checked) => toggleArrayValue('injuries.preExistingConditions', condition, checked === true)}
              />
              <FieldLabel htmlFor={`condition-${condition}`}>{condition}</FieldLabel>
            </Field>
          ))}
        </FieldGroup>
      </details>

      <div className="flex items-start gap-2 rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
        <AlertCircle className="mt-0.5 size-4 shrink-0" />
        <p>Body taps can affect the estimate, but fractures, surgery, TBI, and spinal findings only count when selected above.</p>
      </div>
    </div>
  );
}
