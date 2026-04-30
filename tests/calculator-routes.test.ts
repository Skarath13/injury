import assert from 'node:assert/strict';
import test from 'node:test';
import {
  appendCampaignSearchParams,
  calculatorPathForStep,
  campaignSearchParamsFrom,
  firstIncompleteStepForTargetStep,
  firstReachableStep,
  guardCalculatorRoute,
  parseEstimatePath,
  parseEstimateSlug,
  routeStateForSlug,
  routeStateForStep
} from '../lib/calculatorRoutes';
import type { BodyMapSelection, InjuryCalculatorData } from '../types/calculator';

function baseData(overrides: Partial<InjuryCalculatorData> = {}): InjuryCalculatorData {
  const data: InjuryCalculatorData = {
    demographics: {
      age: 35,
      dateOfBirth: '1990-01-01',
      occupation: '',
      annualIncome: ''
    },
    accidentDetails: {
      dateOfAccident: '',
      county: '',
      faultPercentage: 0,
      priorAccidents: 0,
      impactSeverity: ''
    },
    injuries: {
      bodyMap: [],
      primaryInjury: '',
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
      ambulanceTransports: 0,
      emergencyRoomVisits: 0,
      urgentCareVisits: 0,
      hospitalAdmissionDays: 0,
      chiropracticSessions: 0,
      physicalTherapySessions: 0,
      occupationalTherapySessions: 0,
      xrays: 0,
      mris: 0,
      ctScans: 0,
      emgNerveStudies: 0,
      followUpDoctorVisits: 0,
      painManagementVisits: 0,
      orthopedicConsults: 0,
      neurologyConsults: 0,
      mentalHealthSessions: 0,
      tpiInjections: 0,
      facetInjections: 0,
      mbbInjections: 0,
      esiInjections: 0,
      rfaInjections: 0,
      prpInjections: 0,
      surgeryRecommended: false,
      surgeryCompleted: false,
      totalMedicalCosts: 0,
      useEstimatedCosts: true,
      ongoingTreatment: false
    },
    impact: {
      hasWageLoss: false,
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
    demographics: {
      ...data.demographics,
      ...overrides.demographics
    },
    accidentDetails: {
      ...data.accidentDetails,
      ...overrides.accidentDetails
    },
    injuries: {
      ...data.injuries,
      ...overrides.injuries,
      spinalIssues: {
        ...data.injuries.spinalIssues,
        ...overrides.injuries?.spinalIssues
      }
    },
    impact: {
      ...data.impact,
      ...overrides.impact
    },
    insurance: {
      ...data.insurance,
      ...overrides.insurance
    }
  };
}

const neckSelection: BodyMapSelection = {
  slug: 'neck',
  side: 'common',
  view: 'front',
  severity: 1,
  label: 'Neck'
};

test('estimate route helpers parse and build public slugs', () => {
  assert.deepEqual(parseEstimateSlug('quick-facts'), {
    kind: 'step',
    slug: 'quick-facts',
    step: 1
  });
  assert.deepEqual(parseEstimatePath('/estimate/success'), {
    kind: 'success',
    slug: 'success'
  });
  assert.equal(parseEstimateSlug('not-real'), null);
  assert.equal(parseEstimatePath('/about'), null);
  assert.equal(calculatorPathForStep(4), '/estimate/work-life');
});

test('campaign query preservation keeps Google campaign keys only', () => {
  const params = campaignSearchParamsFrom('?utm_source=google&gclid=abc&foo=bar&wbraid=wide');

  assert.deepEqual([...params.entries()], [
    ['utm_source', 'google'],
    ['gclid', 'abc'],
    ['wbraid', 'wide']
  ]);
  assert.equal(
    appendCampaignSearchParams('/estimate/quick-facts', '?utm_campaign=ca&debug=true&gbraid=gb'),
    '/estimate/quick-facts?utm_campaign=ca&gbraid=gb'
  );
});

test('progress guard sends direct later-step visits to the first missing section', () => {
  const emptyProgress = {
    data: baseData(),
    bodyModel: '' as const,
    workLifeBooleanAnswers: {}
  };

  assert.equal(firstIncompleteStepForTargetStep(3, emptyProgress), 1);
  assert.deepEqual(
    guardCalculatorRoute(routeStateForSlug('success'), emptyProgress, {
      hasPreview: false,
      isPreparing: false,
      hasResults: false
    }),
    routeStateForStep(1)
  );

  const quickFactsProgress = {
    data: baseData({
      accidentDetails: {
        dateOfAccident: '2026-01-15',
        county: '',
        faultPercentage: 0,
        priorAccidents: 0,
        impactSeverity: 'moderate'
      }
    }),
    bodyModel: 'male' as const,
    workLifeBooleanAnswers: {}
  };

  assert.equal(firstIncompleteStepForTargetStep(4, quickFactsProgress), 2);
  assert.deepEqual(
    guardCalculatorRoute(routeStateForStep(4), quickFactsProgress, {
      hasPreview: false,
      isPreparing: false,
      hasResults: false
    }),
    routeStateForStep(2)
  );
});

test('progress guard allows unlock and stateful routes only when their state exists', () => {
  const completeProgress = {
    data: baseData({
      accidentDetails: {
        dateOfAccident: '2026-01-15',
        county: 'Orange',
        faultPercentage: 0,
        priorAccidents: 0,
        impactSeverity: 'moderate'
      },
      injuries: {
        bodyMap: [neckSelection],
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
      }
    }),
    bodyModel: 'female' as const,
    workLifeBooleanAnswers: {
      hasAttorney: false
    }
  };

  assert.equal(firstReachableStep(completeProgress), 5);
  assert.deepEqual(
    guardCalculatorRoute(routeStateForStep(5), completeProgress, {
      hasPreview: false,
      isPreparing: false,
      hasResults: false
    }),
    routeStateForStep(5)
  );
  assert.deepEqual(
    guardCalculatorRoute(routeStateForSlug('preview'), completeProgress, {
      hasPreview: false,
      isPreparing: false,
      hasResults: false
    }),
    routeStateForStep(5)
  );
  assert.deepEqual(
    guardCalculatorRoute(routeStateForSlug('preview'), completeProgress, {
      hasPreview: true,
      isPreparing: false,
      hasResults: false
    }),
    routeStateForSlug('preview')
  );
  assert.deepEqual(
    guardCalculatorRoute(routeStateForSlug('success'), completeProgress, {
      hasPreview: false,
      isPreparing: false,
      hasResults: false
    }),
    routeStateForStep(5)
  );
  assert.deepEqual(
    guardCalculatorRoute(routeStateForSlug('success'), completeProgress, {
      hasPreview: false,
      isPreparing: false,
      hasResults: true
    }),
    routeStateForSlug('success')
  );
});

test('progress guard does not block unlock for missing wage loss dropdowns', () => {
  const wageLossProgress = {
    data: baseData({
      demographics: {
        age: 35,
        dateOfBirth: '1990-01-01',
        occupation: '',
        annualIncome: ''
      },
      accidentDetails: {
        dateOfAccident: '2026-01-15',
        county: 'Orange',
        faultPercentage: 0,
        priorAccidents: 0,
        impactSeverity: 'moderate'
      },
      injuries: {
        bodyMap: [neckSelection],
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
      impact: {
        hasWageLoss: true,
        missedWorkDays: 0,
        lossOfConsortium: false,
        emotionalDistress: false,
        dylanVLeggClaim: false,
        permanentImpairment: false
      }
    }),
    bodyModel: 'female' as const,
    workLifeBooleanAnswers: {
      hasAttorney: false
    }
  };

  assert.equal(firstReachableStep(wageLossProgress), 5);
  assert.deepEqual(
    guardCalculatorRoute(routeStateForStep(5), wageLossProgress, {
      hasPreview: false,
      isPreparing: false,
      hasResults: false
    }),
    routeStateForStep(5)
  );
});
