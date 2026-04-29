import assert from 'node:assert/strict';
import test from 'node:test';
import { NextRequest } from 'next/server';
import { POST as previewPost } from '../app/api/estimate/preview/route';
import {
  BODY_MAP_CLICKABLE_SLUGS,
  bodyMapHighlightSideForView,
  bodyMapHighlightTargetsForView,
  bodyMapKey,
  bodyMapSelectionAppliesToView,
  bodyMapSelectionIdentityKey,
  bodyMapSelectionViewLabel,
  cycleBodyMapSelection,
  removeBodyMapSelection
} from '../lib/bodyMapInjuries';
import { bodyBack, bodyFemaleBack, bodyFemaleFront, bodyFront } from '../components/body-highlighter/assets';
import type { BodyPartSlug } from '../components/body-highlighter/types';
import {
  formatCounty,
  rankCaliforniaCountyMatches,
  resolveCaliforniaCountySelection,
  resolveCountyAutocompleteValue
} from '../lib/californiaCounties';
import { calculateSettlement } from '../lib/settlementEngine';
import { BodyMapSelection, InjuryCalculatorData } from '../types/calculator';

function baseCase(overrides: Partial<InjuryCalculatorData> = {}): InjuryCalculatorData {
  const data: InjuryCalculatorData = {
    demographics: {
      age: 35,
      occupation: 'Professional/Office Worker',
      annualIncome: 62500
    },
    accidentDetails: {
      dateOfAccident: '2026-01-15',
      county: 'Orange',
      faultPercentage: 0,
      priorAccidents: 0,
      impactSeverity: 'moderate'
    },
    injuries: {
      bodyMap: [],
      primaryInjury: 'Whiplash / Neck Strain',
      secondaryInjuries: [],
      preExistingConditions: [],
      fractures: [],
      tbi: false,
      spinalIssues: {
        herniation: false,
        nerveRootCompression: false,
        radiculopathy: false,
        myelopathy: false,
        preExistingDegeneration: false
      }
    },
    treatment: {
      emergencyRoomVisits: 0,
      urgentCareVisits: 0,
      chiropracticSessions: 0,
      physicalTherapySessions: 0,
      xrays: 0,
      mris: 0,
      ctScans: 0,
      painManagementVisits: 0,
      orthopedicConsults: 0,
      tpiInjections: 0,
      facetInjections: 0,
      mbbInjections: 0,
      esiInjections: 0,
      rfaInjections: 0,
      prpInjections: 0,
      surgeryRecommended: false,
      surgeryCompleted: false,
      totalMedicalCosts: 10000,
      useEstimatedCosts: false,
      ongoingTreatment: false
    },
    impact: {
      missedWorkDays: 0,
      lossOfConsortium: false,
      emotionalDistress: false,
      dylanVLeggClaim: false,
      permanentImpairment: false
    },
    insurance: {
      policyLimitsKnown: false,
      hasAttorney: false
    }
  };

  return {
    ...data,
    ...overrides,
    demographics: { ...data.demographics, ...overrides.demographics },
    accidentDetails: { ...data.accidentDetails, ...overrides.accidentDetails },
    injuries: {
      ...data.injuries,
      ...overrides.injuries,
      spinalIssues: {
        ...data.injuries.spinalIssues,
        ...overrides.injuries?.spinalIssues
      }
    },
    treatment: { ...data.treatment, ...overrides.treatment },
    impact: { ...data.impact, ...overrides.impact },
    insurance: { ...data.insurance, ...overrides.insurance }
  };
}

test('soft tissue baseline uses the 1x specials tier', () => {
  const result = calculateSettlement(baseCase());

  assert.equal(result.caseTier, 'soft_tissue');
  assert.equal(result.specials, 10000);
  assert.equal(result.highEstimate, 10000);
  assert.ok(result.logicVersion);
  assert.ok(result.logicHash);
});

test('documented treatment adders move soft tissue to 1.5x', () => {
  const result = calculateSettlement(baseCase({
    treatment: {
      ...baseCase().treatment,
      physicalTherapySessions: 8
    }
  }));

  assert.equal(result.caseTier, 'soft_tissue_with_adders');
  assert.ok(result.highEstimate > 10000);
});

test('fractures and surgery escalate to configured higher tiers', () => {
  const fracture = calculateSettlement(baseCase({
    injuries: {
      ...baseCase().injuries,
      fractures: ['Wrist Fracture']
    }
  }));
  const surgery = calculateSettlement(baseCase({
    treatment: {
      ...baseCase().treatment,
      totalMedicalCosts: 75000,
      surgeryRecommended: true,
      surgeryType: 'moderate'
    }
  }));

  assert.equal(fracture.caseTier, 'hard_tissue_or_light_fracture');
  assert.equal(surgery.caseTier, 'serious_or_surgical');
  assert.ok(surgery.highEstimate > fracture.highEstimate);
});

test('comparative fault and policy caps reduce the high estimate', () => {
  const result = calculateSettlement(baseCase({
    accidentDetails: {
      ...baseCase().accidentDetails,
      faultPercentage: 50
    },
    insurance: {
      policyLimitsKnown: true,
      policyLimits: 4000,
      hasAttorney: false
    }
  }));

  assert.equal(result.highEstimate, 4000);
  assert.ok(result.factors.some((factor) => factor.factor.includes('comparative fault')));
  assert.ok(result.factors.some((factor) => factor.factor.includes('policy limit')));
});

test('mobile-first flow can calculate without income when no work loss is entered', () => {
  const result = calculateSettlement(baseCase({
    demographics: {
      age: 35,
      occupation: '',
      annualIncome: ''
    },
    treatment: {
      ...baseCase().treatment,
      totalMedicalCosts: 0,
      useEstimatedCosts: true,
      urgentCareVisits: 1,
      physicalTherapySessions: 4
    },
    impact: {
      ...baseCase().impact,
      missedWorkDays: 0
    }
  }));

  assert.ok(Number.isFinite(result.highEstimate));
  assert.ok(result.highEstimate > 0);
  assert.ok(!result.factors.some((factor) => factor.factor.includes('Lost wage')));
});

test('preview endpoint does not return exact estimate values before OTP unlock', async () => {
  const calculatorData = baseCase();
  const expectedResult = calculateSettlement(calculatorData);
  const request = new NextRequest('http://localhost/api/estimate/preview', {
    method: 'POST',
    body: JSON.stringify({
      calculatorData,
      turnstileToken: 'dev-turnstile-token'
    })
  });

  const response = await previewPost(request);
  const text = await response.text();

  assert.equal(response.status, 200);
  assert.ok(!text.includes(String(expectedResult.lowEstimate)));
  assert.ok(!text.includes(String(expectedResult.midEstimate)));
  assert.ok(!text.includes(String(expectedResult.highEstimate)));
  const payload = JSON.parse(text);

  assert.ok(payload.sessionId);
  assert.equal(payload.responsibleAttorney, null);
  assert.equal(payload.requiresAttorneyConsent, false);
  assert.ok(text.includes('$••,••• - $•••,•••'));
});

test('county lookup only resolves exact California county selections', () => {
  assert.equal(resolveCaliforniaCountySelection('Orange'), 'Orange');
  assert.equal(resolveCaliforniaCountySelection('Orange County'), 'Orange');
  assert.equal(resolveCaliforniaCountySelection('  Los   Angeles county  '), 'Los Angeles');
  assert.equal(formatCounty('Orange'), 'Orange County');
  assert.equal(resolveCaliforniaCountySelection('Orange-ish'), null);
});

test('county autocomplete auto-commits exact and single-match entries', () => {
  assert.equal(resolveCountyAutocompleteValue('Orange'), 'Orange');
  assert.equal(resolveCountyAutocompleteValue('Orange County'), 'Orange');
  assert.equal(resolveCountyAutocompleteValue('  orange   county  '), 'Orange');
  assert.equal(resolveCountyAutocompleteValue('Oran'), 'Orange');
  assert.equal(resolveCountyAutocompleteValue('Ora'), null);
  assert.equal(resolveCountyAutocompleteValue('San'), null);
  assert.equal(resolveCountyAutocompleteValue('Not A County'), null);
});

test('county filtering ranks starts-with matches before contains matches', () => {
  const sanMatches = rankCaliforniaCountyMatches('San');
  const losMatches = rankCaliforniaCountyMatches('Los');
  const orangeMatches = rankCaliforniaCountyMatches('Ora');

  assert.equal(losMatches[0], 'Los Angeles');
  assert.equal(orangeMatches[0], 'Orange');
  assert.ok(sanMatches.length >= 5);
  assert.ok(sanMatches.slice(0, 5).every((county) => county.toLowerCase().startsWith('san')));
  assert.deepEqual(rankCaliforniaCountyMatches('O'), []);
});

test('body-map selection keys ignore visual body model', () => {
  const baseSelection = {
    slug: 'neck',
    side: 'common',
    view: 'front'
  } as const;

  assert.equal(bodyMapKey(baseSelection), 'neck:common:front');
  assert.equal(
    bodyMapKey({ ...baseSelection, gender: 'female' } as never),
    bodyMapKey({ ...baseSelection, gender: 'male' } as never)
  );
});

test('whole body-map groups canonicalize and highlight related fragments', () => {
  let neckSelections = cycleBodyMapSelection([], {
    slug: 'trapezius',
    side: 'left',
    view: 'front'
  } as const);
  neckSelections = cycleBodyMapSelection(neckSelections, {
    slug: 'neck',
    side: 'right',
    view: 'front'
  } as const);

  assert.equal(neckSelections.length, 1);
  assert.equal(neckSelections[0].slug, 'neck');
  assert.equal(neckSelections[0].side, 'common');
  assert.equal(neckSelections[0].severity, 2);
  assert.equal(neckSelections[0].label, 'Base of neck / collarbone');
  assert.deepEqual(bodyMapHighlightTargetsForView(neckSelections[0], 'front'), [
    { slug: 'neck', side: 'both' },
    { slug: 'trapezius', side: 'both' }
  ]);
});

test('major limb groups keep lay labels and mirrored side behavior', () => {
  let lowerLegSelections = cycleBodyMapSelection([], {
    slug: 'tibialis',
    side: 'left',
    view: 'front'
  } as const);
  lowerLegSelections = cycleBodyMapSelection(lowerLegSelections, {
    slug: 'calves',
    side: 'right',
    view: 'back'
  } as const);

  assert.equal(lowerLegSelections.length, 1);
  assert.equal(lowerLegSelections[0].slug, 'calves');
  assert.equal(lowerLegSelections[0].label, 'Left lower leg / calf-shin');
  assert.equal(lowerLegSelections[0].severity, 2);
  assert.deepEqual(bodyMapHighlightTargetsForView(lowerLegSelections[0], 'front'), [
    { slug: 'calves', side: 'left' },
    { slug: 'tibialis', side: 'left' }
  ]);
  assert.deepEqual(bodyMapHighlightTargetsForView(lowerLegSelections[0], 'back'), [
    { slug: 'calves', side: 'right' },
    { slug: 'tibialis', side: 'right' }
  ]);

  const upperArmSelections = cycleBodyMapSelection([], {
    slug: 'triceps',
    side: 'right',
    view: 'back'
  } as const);
  assert.equal(upperArmSelections[0].slug, 'biceps');
  assert.equal(upperArmSelections[0].label, 'Right upper arm');

  const thighSelections = cycleBodyMapSelection([], {
    slug: 'hamstring',
    side: 'left',
    view: 'back'
  } as const);
  assert.equal(thighSelections[0].slug, 'quadriceps');
  assert.equal(thighSelections[0].label, 'Left thigh');
});

test('mirrored body-map regions cycle once across front and back', () => {
  const frontHand = {
    slug: 'hands',
    side: 'left',
    view: 'front'
  } as const;
  const backHand = {
    slug: 'hands',
    side: 'right',
    view: 'back'
  } as const;

  let selections = cycleBodyMapSelection([], frontHand);
  selections = cycleBodyMapSelection(selections, backHand);

  assert.equal(selections.length, 1);
  assert.equal(selections[0].view, 'front');
  assert.equal(selections[0].severity, 2);
  assert.equal(bodyMapSelectionViewLabel(selections[0]), 'Front + Back');
  assert.equal(bodyMapSelectionAppliesToView(selections[0], 'front'), true);
  assert.equal(bodyMapSelectionAppliesToView(selections[0], 'back'), true);
  assert.equal(bodyMapHighlightSideForView(selections[0], 'front'), 'left');
  assert.equal(bodyMapHighlightSideForView(selections[0], 'back'), 'right');
});

test('mirrored opposite-view same visual side creates a separate side selection', () => {
  let selections = cycleBodyMapSelection([], {
    slug: 'hands',
    side: 'left',
    view: 'front'
  } as const);
  selections = cycleBodyMapSelection(selections, {
    slug: 'hands',
    side: 'left',
    view: 'back'
  } as const);

  assert.equal(selections.length, 2);
  assert.equal(bodyMapHighlightSideForView(selections[0], 'back'), 'right');
  assert.equal(bodyMapHighlightSideForView(selections[1], 'front'), 'right');
});

test('removing a mirrored region clears the shared selection', () => {
  const selection = cycleBodyMapSelection([], {
    slug: 'feet',
    side: 'right',
    view: 'back'
  } as const);

  assert.equal(selection.length, 1);
  assert.deepEqual(removeBodyMapSelection(selection, {
    slug: 'feet',
    side: 'left',
    view: 'front'
  } as const), []);
});

test('view-specific body-map regions remain separate', () => {
  let selections = cycleBodyMapSelection([], {
    slug: 'upper-back',
    side: 'right',
    view: 'front'
  } as const);
  selections = cycleBodyMapSelection(selections, {
    slug: 'upper-back',
    side: 'right',
    view: 'back'
  } as const);

  assert.equal(selections.length, 2);
  assert.equal(bodyMapSelectionViewLabel(selections[0]), 'Front');
  assert.equal(bodyMapSelectionViewLabel(selections[1]), 'Back');
  assert.equal(bodyMapSelectionAppliesToView(selections[0], 'front'), true);
  assert.equal(bodyMapSelectionAppliesToView(selections[0], 'back'), false);
});

test('all body-map asset slugs are interactive', () => {
  const assets = [bodyFront, bodyBack, bodyFemaleFront, bodyFemaleBack] as const;

  for (const asset of assets) {
    for (const part of asset) {
      assert.ok(BODY_MAP_CLICKABLE_SLUGS.includes(part.slug), `${part.slug} should be tappable`);
    }
  }
});

test('hair selects as hair and scalp, not a decorative head layer', () => {
  const [selection] = cycleBodyMapSelection([], {
    slug: 'hair',
    side: 'common',
    view: 'front'
  } as const);

  assert.equal(selection.slug, 'hair');
  assert.equal(selection.label, 'Hair / scalp');
  assert.equal(bodyMapSelectionAppliesToView(selection, 'back'), true);
  assert.deepEqual(bodyMapHighlightTargetsForView(selection, 'back'), [
    { slug: 'hair', side: 'common' }
  ]);
});

test('every body-map layer is covered by its selected highlight group', () => {
  const assets = [
    ['front', bodyFront],
    ['back', bodyBack],
    ['front', bodyFemaleFront],
    ['back', bodyFemaleBack]
  ] as const;

  for (const [view, asset] of assets) {
    for (const part of asset) {
      const side = part.path.common?.length ? 'common' : 'left';
      const [selection] = cycleBodyMapSelection([], {
        slug: part.slug,
        side,
        view
      });
      const highlightedSlugs = new Set(
        bodyMapHighlightTargetsForView(selection, view).map((target) => target.slug)
      );

      assert.ok(
        highlightedSlugs.has(part.slug),
        `${view} ${part.slug} should be colored by its selected group`
      );
    }
  }
});

test('selectable body-map groups can color every layer in each model', () => {
  const assets = [
    ['male front', 'front', bodyFront],
    ['male back', 'back', bodyBack],
    ['female front', 'front', bodyFemaleFront],
    ['female back', 'back', bodyFemaleBack]
  ] as const;

  for (const [label, view, asset] of assets) {
    let selections: BodyMapSelection[] = [];
    const selectedKeys = new Set<string>();

    for (const part of asset) {
      const sides = [
        part.path.common?.length ? 'common' : null,
        part.path.left?.length ? 'left' : null,
        part.path.right?.length ? 'right' : null
      ].filter(Boolean) as Array<'common' | 'left' | 'right'>;

      for (const side of sides) {
        const key = bodyMapSelectionIdentityKey({ slug: part.slug, side, view });
        if (selectedKeys.has(key)) continue;
        selectedKeys.add(key);
        selections = cycleBodyMapSelection(selections, { slug: part.slug, side, view });
      }
    }

    const highlighted = new Set<string>();
    for (const selection of selections) {
      if (!bodyMapSelectionAppliesToView(selection, view)) continue;
      for (const target of bodyMapHighlightTargetsForView(selection, view)) {
        if (target.side === 'both') {
          highlighted.add(`${target.slug}:common`);
          highlighted.add(`${target.slug}:left`);
          highlighted.add(`${target.slug}:right`);
        } else {
          highlighted.add(`${target.slug}:${target.side}`);
        }
      }
    }

    for (const part of asset) {
      const sides = [
        part.path.common?.length ? 'common' : null,
        part.path.left?.length ? 'left' : null,
        part.path.right?.length ? 'right' : null
      ].filter(Boolean) as Array<'common' | 'left' | 'right'>;

      for (const side of sides) {
        assert.ok(
          highlighted.has(`${part.slug}:${side}`),
          `${label} ${part.slug}:${side} should have a selected highlight target`
        );
      }
    }
  }
});

test('body-map assets expose required clickable injury slugs', () => {
  const frontRequiredSlugs: BodyPartSlug[] = [
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
    'adductors',
    'quadriceps',
    'knees',
    'tibialis',
    'calves',
    'ankles',
    'feet'
  ];
  const backRequiredSlugs: BodyPartSlug[] = [
    'head',
    'hair',
    'neck',
    'trapezius',
    'deltoids',
    'triceps',
    'forearm',
    'hands',
    'upper-back',
    'lower-back',
    'adductors',
    'hamstring',
    'gluteal',
    'calves',
    'ankles',
    'feet'
  ];
  const assets = [
    ['male front', bodyFront, frontRequiredSlugs],
    ['male back', bodyBack, backRequiredSlugs],
    ['female front', bodyFemaleFront, frontRequiredSlugs],
    ['female back', bodyFemaleBack, backRequiredSlugs]
  ] as const;

  for (const [label, asset, requiredSlugs] of assets) {
    const slugs = new Set(asset.map((part) => part.slug));
    for (const slug of requiredSlugs) {
      assert.ok(slugs.has(slug), `${label} is missing ${slug}`);
    }
  }
});

test('female back ankle geometry stays aligned to the female model', () => {
  const ankles = bodyFemaleBack.find((part) => part.slug === 'ankles');
  assert.ok(ankles);

  const firstMoveX = (path: string): number => {
    const match = path.match(/^[mM]\s*([\d.-]+)/);
    assert.ok(match, `Expected path to start with a move command: ${path}`);
    return Number(match[1]);
  };

  const leftMoveXs = (ankles.path.left || []).map(firstMoveX);
  const rightMoveXs = (ankles.path.right || []).map(firstMoveX);

  assert.ok(Math.min(...leftMoveXs) > 1070, 'female back left ankle should not use old male-back x coordinates');
  assert.ok(Math.min(...rightMoveXs) > 1160, 'female back right ankle should align with the female right foot');
});

test('body-map severity changes value without inferring objective injuries', () => {
  const result = calculateSettlement(baseCase({
    injuries: {
      ...baseCase().injuries,
      bodyMap: [
        {
          slug: 'neck',
          side: 'common',
          view: 'front',
          severity: 4,
          label: 'Neck'
        }
      ],
      primaryInjury: 'Whiplash / Neck Strain'
    }
  }));

  assert.equal(result.caseTier, 'soft_tissue_with_adders');
  assert.ok(result.highEstimate > 10000);
  assert.ok(!result.factors.some((factor) => factor.factor.includes('fracture')));
  assert.ok(!result.factors.some((factor) => factor.factor.includes('Traumatic brain')));
});

test('body-map serious area needs explicit context before hard-tissue tier', () => {
  const bodyOnly = calculateSettlement(baseCase({
    injuries: {
      ...baseCase().injuries,
      bodyMap: [
        {
          slug: 'lower-back',
          side: 'common',
          view: 'back',
          severity: 4,
          label: 'Lower back'
        }
      ],
      primaryInjury: 'Back Strain / Sprain'
    }
  }));
  const withImaging = calculateSettlement(baseCase({
    injuries: bodyOnly.caseTier ? {
      ...baseCase().injuries,
      bodyMap: [
        {
          slug: 'lower-back',
          side: 'common',
          view: 'back',
          severity: 4,
          label: 'Lower back'
        }
      ],
      primaryInjury: 'Back Strain / Sprain'
    } : baseCase().injuries,
    treatment: {
      ...baseCase().treatment,
      mris: 1
    }
  }));

  assert.equal(bodyOnly.caseTier, 'soft_tissue_with_adders');
  assert.equal(withImaging.caseTier, 'hard_tissue_or_light_fracture');
});

test('body-map adders are capped by config', () => {
  const result = calculateSettlement(baseCase({
    injuries: {
      ...baseCase().injuries,
      bodyMap: [
        'head',
        'neck',
        'chest',
        'abs',
        'upper-back',
        'lower-back'
      ].map((slug) => ({
        slug: slug as 'head',
        side: 'common' as const,
        view: 'front' as const,
        severity: 4 as const,
        label: slug
      })),
      primaryInjury: 'Soft Tissue Damage'
    }
  }));

  const bodyFactor = result.factors.find((factor) => factor.factor.includes('selected pain area'));

  assert.ok(bodyFactor);
  assert.ok(result.highEstimate <= 10000 * 1.5 + 18000);
});
