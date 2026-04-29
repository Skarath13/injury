import type {
  BodyMapSelection,
  BodyMapSeverity,
  BodyMapSide,
  BodyMapSlug,
  BodyMapView,
  InjuryCalculatorData
} from '@/types/calculator';

export const BODY_MAP_SEVERITY_LABELS: Record<BodyMapSeverity, string> = {
  1: 'Sore',
  2: 'Painful',
  3: 'Serious',
  4: 'Severe'
};

export const BODY_MAP_CLICKABLE_SLUGS: BodyMapSlug[] = [
  'head',
  'hair',
  'neck',
  'trapezius',
  'deltoids',
  'chest',
  'biceps',
  'triceps',
  'forearm',
  'hands',
  'abs',
  'obliques',
  'upper-back',
  'lower-back',
  'adductors',
  'quadriceps',
  'hamstring',
  'gluteal',
  'knees',
  'tibialis',
  'calves',
  'ankles',
  'feet'
];

export const MIRRORED_BODY_MAP_SLUGS: BodyMapSlug[] = [
  'head',
  'hair',
  'neck',
  'trapezius',
  'deltoids',
  'biceps',
  'triceps',
  'forearm',
  'hands',
  'adductors',
  'quadriceps',
  'hamstring',
  'calves',
  'tibialis',
  'ankles',
  'feet'
];

export const BODY_MAP_LABELS: Record<BodyMapSlug, string> = {
  head: 'Head',
  hair: 'Hair / scalp',
  neck: 'Base of neck / collarbone',
  trapezius: 'Shoulders / upper neck',
  deltoids: 'Shoulder',
  chest: 'Chest / ribs',
  biceps: 'Upper arm',
  triceps: 'Upper arm',
  forearm: 'Forearm',
  hands: 'Hand / wrist',
  abs: 'Stomach / abdomen',
  obliques: 'Side / ribs',
  'upper-back': 'Upper back',
  'lower-back': 'Lower back',
  adductors: 'Inner thigh',
  quadriceps: 'Thigh',
  hamstring: 'Back of thigh',
  gluteal: 'Hip / buttock',
  knees: 'Knee',
  tibialis: 'Lower leg / shin',
  calves: 'Lower leg / calf-shin',
  ankles: 'Ankle',
  feet: 'Foot'
};

type SelectionSeed = {
  slug: BodyMapSlug;
  side: BodyMapSide;
  view: BodyMapView;
};

const MIRRORED_BODY_MAP_SLUG_SET = new Set<BodyMapSlug>(MIRRORED_BODY_MAP_SLUGS);
const BODY_MAP_WHOLE_GROUPS: Partial<Record<BodyMapSlug, BodyMapSlug[]>> = {
  neck: ['neck', 'trapezius'],
  chest: ['chest', 'obliques'],
  biceps: ['biceps', 'triceps'],
  quadriceps: ['quadriceps', 'hamstring', 'adductors'],
  calves: ['calves', 'tibialis']
};
const WHOLE_GROUP_BODY_MAP_SLUGS = new Map<BodyMapSlug, BodyMapSlug>(
  Object.entries(BODY_MAP_WHOLE_GROUPS).flatMap(([canonicalSlug, groupSlugs]) => (
    (groupSlugs || []).map((groupSlug) => [groupSlug, canonicalSlug as BodyMapSlug])
  ))
);

export function normalizeBodyMapSlug(slug: BodyMapSlug): BodyMapSlug {
  return slug;
}

export function canonicalBodyMapSlug(slug: BodyMapSlug): BodyMapSlug {
  const normalizedSlug = normalizeBodyMapSlug(slug);
  return WHOLE_GROUP_BODY_MAP_SLUGS.get(normalizedSlug) || normalizedSlug;
}

export function isMirroredBodyMapSlug(slug: BodyMapSlug): boolean {
  return MIRRORED_BODY_MAP_SLUG_SET.has(canonicalBodyMapSlug(slug));
}

export function oppositeBodyMapSide(side: BodyMapSide): BodyMapSide {
  if (side === 'left') return 'right';
  if (side === 'right') return 'left';
  return side;
}

export function bodyMapKey(selection: Pick<BodyMapSelection, 'slug' | 'side' | 'view'>): string {
  return `${normalizeBodyMapSlug(selection.slug)}:${selection.side}:${selection.view}`;
}

export function bodyMapCanonicalSide(selection: Pick<BodyMapSelection, 'slug' | 'side' | 'view'>): BodyMapSide {
  if (!isMirroredBodyMapSlug(selection.slug) || selection.view !== 'back') return selection.side;
  return oppositeBodyMapSide(selection.side);
}

export function bodyMapSelectionIdentityKey(selection: Pick<BodyMapSelection, 'slug' | 'side' | 'view'>): string {
  const canonicalSlug = canonicalBodyMapSlug(selection.slug);
  return isMirroredBodyMapSlug(canonicalSlug)
    ? `${canonicalSlug}:${bodyMapCanonicalSide({ ...selection, slug: canonicalSlug })}`
    : bodyMapKey({ ...selection, slug: canonicalSlug });
}

export function bodyMapSelectionAppliesToView(
  selection: Pick<BodyMapSelection, 'slug' | 'view'>,
  view: BodyMapView
): boolean {
  return selection.view === view || isMirroredBodyMapSlug(selection.slug);
}

export function bodyMapSelectionViewLabel(selection: Pick<BodyMapSelection, 'slug' | 'view'>): string {
  if (isMirroredBodyMapSlug(selection.slug)) return 'Front + Back';
  return selection.view === 'front' ? 'Front' : 'Back';
}

export function bodyMapHighlightSideForView(
  selection: Pick<BodyMapSelection, 'slug' | 'side' | 'view'>,
  view: BodyMapView
): BodyMapSide {
  if (!isMirroredBodyMapSlug(selection.slug) || selection.view === view) return selection.side;
  return oppositeBodyMapSide(selection.side);
}

export function bodyMapHighlightTargetsForView(
  selection: Pick<BodyMapSelection, 'slug' | 'side' | 'view'>,
  view: BodyMapView
): Array<{ slug: BodyMapSlug; side: BodyMapSide }> {
  const canonicalSlug = canonicalBodyMapSlug(selection.slug);
  const groupSlugs = BODY_MAP_WHOLE_GROUPS[canonicalSlug];

  if (groupSlugs) {
    const side = canonicalSlug === 'neck'
      ? 'both'
      : bodyMapHighlightSideForView({ ...selection, slug: canonicalSlug }, view);
    return groupSlugs.map((slug) => ({ slug, side }));
  }

  return [{
    slug: selection.slug,
    side: bodyMapHighlightSideForView(selection, view)
  }];
}

export function labelBodyMapPart(slug: BodyMapSlug, side: BodyMapSide): string {
  const normalized = canonicalBodyMapSlug(slug);
  const base = BODY_MAP_LABELS[normalized] || normalized;

  if (side === 'left' || side === 'right') {
    return `${side.charAt(0).toUpperCase()}${side.slice(1)} ${base.toLowerCase()}`;
  }

  return base;
}

export function cycleBodyMapSelection(
  currentSelections: BodyMapSelection[],
  seed: SelectionSeed
): BodyMapSelection[] {
  const slug = canonicalBodyMapSlug(seed.slug);
  const side = slug === 'neck' ? 'common' : seed.side;
  const normalizedSeed = {
    ...seed,
    slug,
    side,
    label: labelBodyMapPart(slug, side)
  };
  const key = bodyMapSelectionIdentityKey(normalizedSeed);
  const existing = currentSelections.find((selection) => bodyMapSelectionIdentityKey(selection) === key);

  if (!existing) {
    return [...currentSelections, { ...normalizedSeed, severity: 1 }];
  }

  if (existing.severity >= 4) {
    return currentSelections.filter((selection) => bodyMapSelectionIdentityKey(selection) !== key);
  }

  return currentSelections.map((selection) => (
    bodyMapSelectionIdentityKey(selection) === key
      ? { ...selection, severity: (selection.severity + 1) as BodyMapSeverity }
      : selection
  ));
}

export function removeBodyMapSelection(
  currentSelections: BodyMapSelection[],
  targetSelection: Pick<BodyMapSelection, 'slug' | 'side' | 'view'>
): BodyMapSelection[] {
  const targetKey = bodyMapSelectionIdentityKey(targetSelection);
  return currentSelections.filter((selection) => bodyMapSelectionIdentityKey(selection) !== targetKey);
}

export function highestBodyMapSeverity(selections: BodyMapSelection[] = []): BodyMapSeverity | 0 {
  return selections.reduce<BodyMapSeverity | 0>((highest, selection) => (
    selection.severity > highest ? selection.severity : highest
  ), 0);
}

export function hasBodyMapRegion(selections: BodyMapSelection[] = [], slugs: BodyMapSlug[]): boolean {
  const targetSlugs = new Set(slugs.map(canonicalBodyMapSlug));
  return selections.some((selection) => targetSlugs.has(canonicalBodyMapSlug(selection.slug)));
}

export function hasHeadRegion(selections: BodyMapSelection[] = []): boolean {
  return hasBodyMapRegion(selections, ['head', 'hair']);
}

export function hasSpineRegion(selections: BodyMapSelection[] = []): boolean {
  return hasBodyMapRegion(selections, ['neck', 'trapezius', 'upper-back', 'lower-back']);
}

export function hasBoneOrJointRegion(selections: BodyMapSelection[] = []): boolean {
  return hasBodyMapRegion(selections, [
    'deltoids',
    'chest',
    'hands',
    'knees',
    'ankles',
    'feet',
    'forearm',
    'quadriceps',
    'tibialis',
    'calves'
  ]);
}

function legacyInjuryFromSelection(
  selection: BodyMapSelection,
  injuries: InjuryCalculatorData['injuries']
): string {
  const slug = canonicalBodyMapSlug(selection.slug);
  const hasSpinalFinding = Object.values(injuries.spinalIssues).some(Boolean);

  if (slug === 'head' || slug === 'hair') {
    return injuries.tbi ? 'Concussion / Mild TBI' : 'Soft Tissue Damage';
  }

  if (slug === 'neck' || slug === 'trapezius') return 'Whiplash / Neck Strain';
  if (slug === 'upper-back' || slug === 'lower-back') return hasSpinalFinding ? 'Disc Herniation' : 'Back Strain / Sprain';
  if (slug === 'deltoids') return 'Shoulder Injury';
  if (slug === 'knees') return 'Knee Injury';

  return 'Soft Tissue Damage';
}

export function deriveLegacyInjuryFields(
  injuries: InjuryCalculatorData['injuries']
): Pick<InjuryCalculatorData['injuries'], 'primaryInjury' | 'secondaryInjuries'> {
  const selections = [...(injuries.bodyMap || [])].sort((left, right) => right.severity - left.severity);

  if (selections.length === 0) {
    return {
      primaryInjury: '',
      secondaryInjuries: []
    };
  }

  const [primary, ...secondary] = selections;
  const secondaryInjuries = Array.from(
    new Set(
      secondary
        .map((selection) => legacyInjuryFromSelection(selection, injuries))
        .filter((injury) => injury !== legacyInjuryFromSelection(primary, injuries))
    )
  );

  return {
    primaryInjury: legacyInjuryFromSelection(primary, injuries),
    secondaryInjuries
  };
}

export function bodyMapSummary(selections: BodyMapSelection[] = []): string {
  if (selections.length === 0) return 'Not added yet';

  const sorted = [...selections].sort((left, right) => right.severity - left.severity);
  const first = sorted[0];
  const suffix = sorted.length > 1 ? ` +${sorted.length - 1}` : '';

  return `${first.label} (${BODY_MAP_SEVERITY_LABELS[first.severity]})${suffix}`;
}
