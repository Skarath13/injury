import assert from 'node:assert/strict';
import test from 'node:test';
import { NextRequest } from 'next/server';
import { POST as previewPost } from '../app/api/estimate/preview/route';
import { POST as unlockStartPost } from '../app/api/estimate/unlock/start/route';
import {
  BODY_MAP_CLICKABLE_SLUGS,
  bodyMapHighlightSideForView,
  bodyMapHighlightTargetsForView,
  bodyMapKey,
  bodyMapSelectionAppliesToView,
  bodyMapSelectionIdentityKey,
  bodyMapSelectionViewLabel,
  cycleBodyMapSelection,
  deriveBodyMapOnlyInjuryFields,
  removeBodyMapSelection
} from '../lib/bodyMapInjuries';
import { bodyBack, bodyFemaleBack, bodyFemaleFront, bodyFront } from '../components/body-highlighter/assets';
import type { BodyPartSlug } from '../components/body-highlighter/types';
import {
  CALIFORNIA_COUNTIES,
  formatCounty,
  rankCaliforniaCountyMatches,
  resolveCaliforniaCountySelection,
  resolveCountyAutocompleteValue
} from '../lib/californiaCounties';
import {
  createDefaultGuidedInjurySignals,
  normalizeGuidedInjuryData
} from '../lib/guidedInjurySignals';
import {
  ageFromDateOfBirth,
  calculatorAgeFromDemographics,
  dateInputValueForDate,
  dateOnlyIsInFuture,
  dateOfBirthIsInAllowedRange
} from '../lib/demographics';
import { attorneyConsentCopyVersion, attorneyDeliveryConsentText } from '../lib/leadConsent';
import {
  buildLeadDeliveryPayload,
  getLeadDeliveryQueueItems,
  getLeadQualification,
  qualifyLeadSession
} from '../lib/leadDelivery';
import {
  createFormStartToken,
  createLeadSession,
  decodeLocalSessionCookie,
  decryptLeadContactForDelivery,
  decryptPhoneE164ForDelivery,
  encodeLocalSessionCookie,
  FORM_START_MIN_SECONDS,
  formStartElapsedSeconds,
  getLeadSession,
  localSessionCookieName,
  startOtpUnlock,
  unlockEstimateOnly,
  verifyOtpUnlock
} from '../lib/leadGate';
import type { CreateLeadSessionInput } from '../lib/leadGate';
import { createDefaultPrivacyChoices, createPrivacyChoiceSnapshot } from '../lib/privacyChoices';
import { calculateSettlement, estimateMedicalCostRange, SETTLEMENT_LOGIC } from '../lib/settlementEngine';
import { BodyMapSelection, InjuryCalculatorData, ResponsibleAttorney } from '../types/calculator';

function baseCase(overrides: Partial<InjuryCalculatorData> = {}): InjuryCalculatorData {
  const data: InjuryCalculatorData = {
    demographics: {
      age: 35,
      dateOfBirth: '1990-01-01',
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
      ambulanceTransports: 0,
      emergencyRoomVisits: 0,
      urgentCareVisits: 1,
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

const testLeadEnv = {
  LEAD_HASH_SALT: 'test-lead-salt',
  LEAD_ENCRYPTION_KEY: 'test-lead-encryption-key',
  OTP_DEV_CODE: '123456',
  NODE_ENV: 'test'
};

const testAttorney: ResponsibleAttorney = {
  id: 'test-attorney',
  name: 'Test Injury Law',
  barNumber: '123456',
  officeLocation: 'Los Angeles, CA',
  disclosure: 'Test Injury Law is responsible for this attorney advertisement.',
  consentCopyVersion: 'test-attorney-consent-v1'
};

function testLeadContact(
  phone: string,
  overrides: Partial<{ firstName: string; lastName: string; email: string; phone: string }> = {}
) {
  return {
    firstName: 'Test',
    lastName: 'Lead',
    email: 'test.lead@example.com',
    phone,
    ...overrides
  };
}

async function createTestLeadSession(
  attorney: ResponsibleAttorney | null = testAttorney,
  overrides: Partial<CreateLeadSessionInput> = {}
) {
  const data = baseCase();
  const result = calculateSettlement(data);

  return createLeadSession({
    county: data.accidentDetails.county,
    logicVersion: result.logicVersion,
    logicHash: result.logicHash,
    routingVersion: 'test-routing-v1',
    turnstileStatus: 'verified',
    input: data,
    result,
    preview: {
      severityBand: result.severityBand,
      caseTier: result.caseTier,
      blurredRangeLabel: '$••,••• - $•••,•••'
    },
    attorney,
    ipHash: 'ip-hash',
    userAgentHash: 'ua-hash',
    privacyChoiceSnapshot: createPrivacyChoiceSnapshot(createDefaultPrivacyChoices('2026-04-29T00:00:00.000Z'), false),
    visitorCountry: 'US',
    visitorRegionCode: 'CA',
    visitorRegion: 'California',
    visitorCity: 'Irvine',
    geoEligibilityStatus: 'california',
    ...overrides
  }, testLeadEnv);
}

async function createTestLeadSessionForData(
  data: InjuryCalculatorData,
  attorney: ResponsibleAttorney | null = testAttorney,
  overrides: Partial<CreateLeadSessionInput> = {}
) {
  const result = calculateSettlement(data);

  return createLeadSession({
    county: data.accidentDetails.county,
    logicVersion: result.logicVersion,
    logicHash: result.logicHash,
    routingVersion: 'test-routing-v1',
    turnstileStatus: 'verified',
    input: data,
    result,
    preview: {
      severityBand: result.severityBand,
      caseTier: result.caseTier,
      blurredRangeLabel: '$••,••• - $•••,•••'
    },
    attorney,
    ipHash: 'ip-hash',
    userAgentHash: 'ua-hash',
    privacyChoiceSnapshot: createPrivacyChoiceSnapshot(createDefaultPrivacyChoices('2026-04-29T00:00:00.000Z'), false),
    visitorCountry: 'US',
    visitorRegionCode: 'CA',
    visitorRegion: 'California',
    visitorCity: 'Irvine',
    geoEligibilityStatus: 'california',
    ...overrides
  }, testLeadEnv);
}

test('form start token distinguishes fast completions from mature sessions', async () => {
  const freshToken = await createFormStartToken(testLeadEnv, Date.now() - 5_000);
  const matureToken = await createFormStartToken(testLeadEnv, Date.now() - ((FORM_START_MIN_SECONDS + 1) * 1000));

  const freshElapsed = await formStartElapsedSeconds(freshToken, testLeadEnv);
  const matureElapsed = await formStartElapsedSeconds(matureToken, testLeadEnv);

  assert.ok(freshElapsed !== null && freshElapsed < FORM_START_MIN_SECONDS);
  assert.ok(matureElapsed !== null && matureElapsed >= FORM_START_MIN_SECONDS);
  assert.equal(await formStartElapsedSeconds('invalid-token', testLeadEnv), null);
});

test('local session cookie stays compact enough for dev fallback unlocks', async () => {
  const session = await createTestLeadSession();
  const encoded = encodeLocalSessionCookie(session);
  const decoded = decodeLocalSessionCookie(encoded);

  assert.ok(`${localSessionCookieName(session.id)}=${encoded}`.length < 3800);
  assert.equal(decoded?.id, session.id);
  assert.equal(decoded?.attorneyJson, session.attorneyJson);
  assert.equal(JSON.parse(decoded?.resultJson || '{}').midEstimate, JSON.parse(session.resultJson).midEstimate);
  assert.equal(decoded?.inputJson, '{}');
  assert.equal(decoded?.previewJson, '{}');
});

test('general-damages model starts with medical specials plus multiplier value', () => {
  const result = calculateSettlement(baseCase());

  assert.equal(result.severityBand, 'low');
  assert.equal(result.caseTier, result.severityBand);
  assert.deepEqual(result.medicalCostRange, { low: 293, mid: 450, high: 900 });
  assert.equal(result.medicalCosts, 450);
  assert.equal(result.specials, 450);
  assert.equal(result.lowEstimate, 362);
  assert.equal(result.midEstimate, 518);
  assert.equal(result.highEstimate, 690);
  assert.ok(result.logicVersion);
  assert.ok(result.logicHash);
});

test('date of birth helper derives valid calculator age without prefilled age', () => {
  const referenceDate = new Date(2026, 3, 29);

  assert.equal(ageFromDateOfBirth('1956-04-29', referenceDate), 70);
  assert.equal(dateOfBirthIsInAllowedRange('1956-04-29', referenceDate), true);
  assert.equal(dateOfBirthIsInAllowedRange('2010-04-29', referenceDate), false);
  assert.equal(calculatorAgeFromDemographics({
    age: 0,
    dateOfBirth: '1956-04-29'
  }, referenceDate), 70);
});

test('date-only helper detects future dates using the local calendar day', () => {
  const referenceDate = new Date(2026, 3, 29, 23, 30);

  assert.equal(dateInputValueForDate(referenceDate), '2026-04-29');
  assert.equal(dateOnlyIsInFuture('2026-04-30', referenceDate), true);
  assert.equal(dateOnlyIsInFuture('2026-04-29', referenceDate), false);
  assert.equal(dateOnlyIsInFuture('2026-04-28', referenceDate), false);
});

test('about 1x general damages means total value is about specials plus specials', () => {
  const result = calculateSettlement(baseCase({
    injuries: {
      ...baseCase().injuries,
      bodyMap: [{
        slug: 'knees',
        side: 'left',
        view: 'front',
        severity: 2,
        label: 'Left knee'
      }],
      primaryInjury: 'Knee Injury'
    }
  }));

  assert.equal(result.medicalCosts, 450);
  assert.ok(result.midEstimate >= 850);
  assert.ok(result.midEstimate <= 900);
});

test('medical cost range adds selected treatment counts by lane', () => {
  const range = estimateMedicalCostRange(baseCase({
    treatment: {
      ...baseCase().treatment,
      physicalTherapySessions: 2,
      mris: 1
    }
  }).treatment);

  assert.deepEqual(range, {
    low: 1625,
    mid: 2500,
    high: 6000
  });
});

test('medical specials low lane floors to 65 percent of midpoint only', () => {
  const range = estimateMedicalCostRange(baseCase({
    treatment: {
      ...baseCase().treatment,
      physicalTherapySessions: 2,
      mris: 1
    }
  }).treatment);

  assert.equal(range.low, Math.round(range.mid * SETTLEMENT_LOGIC.medicalSpecialsLowFloorRatio));
  assert.equal(range.mid, 2500);
  assert.equal(range.high, 6000);
});

test('legacy entered bills are ignored in favor of treatment estimates', () => {
  const estimated = calculateSettlement(baseCase());
  const legacyBillPayload = calculateSettlement(baseCase({
    treatment: {
      ...baseCase().treatment,
      totalMedicalCosts: 999999,
      useEstimatedCosts: false
    }
  }));

  assert.equal(legacyBillPayload.medicalCosts, estimated.medicalCosts);
  assert.deepEqual(legacyBillPayload.medicalCostRange, estimated.medicalCostRange);
  assert.equal(legacyBillPayload.highEstimate, estimated.highEstimate);
});

test('documented treatment adders stay below 1.5x general damages before advanced care', () => {
  const emergencyBaseline = calculateSettlement(baseCase({
    treatment: {
      ...baseCase().treatment,
      emergencyRoomVisits: 1
    }
  }));
  const result = calculateSettlement(baseCase({
    treatment: {
      ...baseCase().treatment,
      physicalTherapySessions: 8
    }
  }));

  const emergencyFactor = emergencyBaseline.factors.find((factor) => factor.factor.includes('Soft-tissue baseline'));
  const treatmentFactor = result.factors.find((factor) => factor.factor.includes('Soft-tissue treatment with adders'));

  assert.ok(emergencyFactor);
  assert.ok(emergencyFactor.weight < 1);
  assert.ok(treatmentFactor);
  assert.ok(treatmentFactor.weight > 1);
  assert.ok(treatmentFactor.weight < 1.5);
  assert.ok(result.highEstimate > calculateSettlement(baseCase()).highEstimate);
});

test('legacy fracture fields are ignored while surgery increases treatment progression', () => {
  const baseline = calculateSettlement(baseCase());
  const legacyFracture = calculateSettlement(baseCase({
    injuries: {
      ...baseCase().injuries,
      fractures: ['Wrist Fracture']
    }
  }));
  const surgery = calculateSettlement(baseCase({
    treatment: {
      ...baseCase().treatment,
      surgeryRecommended: true,
      surgeryType: 'moderate'
    }
  }));

  const surgeryFactor = surgery.factors.find((factor) => factor.factor.includes('Interventional or surgical treatment'));

  assert.equal(legacyFracture.severityBand, baseline.severityBand);
  assert.equal(legacyFracture.highEstimate, baseline.highEstimate);
  assert.ok(!legacyFracture.factors.some((factor) => factor.factor.includes('fracture')));
  assert.ok(surgeryFactor);
  assert.ok(surgeryFactor.weight > 2.4);
  assert.ok(surgery.highEstimate > legacyFracture.highEstimate);
});

test('comparative fault reduces value while policy limits are ignored', () => {
  const uncapped = calculateSettlement(baseCase({
    insurance: {
      policyLimitsKnown: true,
      policyLimits: 400,
      hasAttorney: false
    }
  }));
  const result = calculateSettlement(baseCase({
    accidentDetails: {
      ...baseCase().accidentDetails,
      faultPercentage: 50
    },
    insurance: {
      policyLimitsKnown: true,
      policyLimits: 400,
      hasAttorney: false
    }
  }));

  assert.equal(result.highEstimate, Math.round(uncapped.highEstimate * 0.5));
  assert.ok(result.factors.some((factor) => factor.factor.includes('comparative fault')));
  assert.ok(!result.factors.some((factor) => factor.factor.includes('policy limit')));
});

test('upper estimate calibration reduces only the high-end general-damages portion', () => {
  const result = calculateSettlement(baseCase({
    injuries: {
      ...baseCase().injuries,
      bodyMap: [{
        slug: 'neck',
        side: 'common',
        view: 'front',
        severity: 1,
        label: 'Neck'
      }],
      primaryInjury: 'Whiplash / Neck Strain'
    }
  }));
  const uncalibratedHigh = result.midEstimate * SETTLEMENT_LOGIC.rangeSpreads.low.high;
  const expectedHigh = result.medicalCosts +
    ((uncalibratedHigh - result.medicalCosts) * SETTLEMENT_LOGIC.upperGeneralDamagesCalibrationFactor);

  assert.equal(result.lowEstimate, 536);
  assert.equal(result.midEstimate, 765);
  assert.equal(result.highEstimate, Math.round(expectedHigh));
});

test('estimate-only unlock returns full results without phone hash or OTP state', async () => {
  const session = await createTestLeadSession();
  const unlocked = await unlockEstimateOnly(session.id, testLeadEnv);
  const updated = await getLeadSession(session.id, testLeadEnv);

  assert.equal(unlocked.result.midEstimate, JSON.parse(session.resultJson).midEstimate);
  assert.equal(unlocked.session.leadDeliveryStatus, 'estimate_only_no_delivery');
  assert.equal(updated?.leadDeliveryStatus, 'estimate_only_no_delivery');
  assert.equal(updated?.phoneHash, null);
  assert.equal(updated?.otpStatus, 'not_started');
  assert.equal(updated?.attorneyDeliveryConsent, false);
  assert.equal(updated?.phoneContactConsent, false);
  assert.equal(updated?.emailHash, null);
  assert.equal(updated?.leadContactEncrypted, null);
});

test('attorney delivery start rejects missing consent', async () => {
  const session = await createTestLeadSession();
  const response = await unlockStartPost(new NextRequest('http://localhost/api/estimate/unlock/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: session.id,
      firstName: 'Test',
      lastName: 'Lead',
      email: 'test.lead@example.com',
      phone: '(949) 555-1212'
    })
  }));
  const payload = await response.json() as { error?: string };

  assert.equal(response.status, 400);
  assert.match(payload.error || '', /confirm permission/i);
});

test('attorney delivery start rejects missing lead name or email', async () => {
  const session = await createTestLeadSession();
  const consent = {
    attorneyDeliveryConsent: true,
    phoneContactConsent: true,
    consentCopyVersion: attorneyConsentCopyVersion(testAttorney),
    consentText: attorneyDeliveryConsentText(testAttorney)
  };

  await assert.rejects(
    () => startOtpUnlock(session.id, testLeadContact('(949) 555-1212', { firstName: '' }), consent, testLeadEnv),
    /First name is required/
  );
  await assert.rejects(
    () => startOtpUnlock(session.id, testLeadContact('(949) 555-1212', { email: '' }), consent, testLeadEnv),
    /Email is required/
  );
});

test('attorney delivery start records consent metadata before OTP verification', async () => {
  const session = await createTestLeadSession();
  const consentText = attorneyDeliveryConsentText(testAttorney);
  const otp = await startOtpUnlock(session.id, testLeadContact('(949) 555-1212'), {
    attorneyDeliveryConsent: true,
    phoneContactConsent: true,
    consentCopyVersion: attorneyConsentCopyVersion(testAttorney),
    consentText
  }, testLeadEnv);
  const updated = await getLeadSession(session.id, testLeadEnv);

  assert.equal(otp.provider, 'dev_stub');
  assert.equal(otp.devCode, '123456');
  assert.equal(otp.otpLength, 6);
  assert.equal(updated?.attorneyDeliveryConsent, true);
  assert.equal(updated?.phoneContactConsent, true);
  assert.equal(updated?.consentCopyVersion, testAttorney.consentCopyVersion);
  assert.equal(updated?.attorneyDeliveryConsentText, consentText);
  assert.ok(updated?.attorneyDeliveryConsentAt);
  assert.ok(updated?.phoneContactConsentAt);
  assert.ok(updated?.phoneHash);
  assert.ok(updated?.emailHash);
  assert.equal(updated?.phoneLast4, '1212');
  assert.ok(updated?.phoneE164Encrypted?.startsWith('v1.'));
  assert.equal(await decryptPhoneE164ForDelivery(updated?.phoneE164Encrypted || '', testLeadEnv), '+19495551212');
  assert.ok(updated?.leadContactEncrypted?.startsWith('v1.'));
  assert.equal(updated?.leadContactEncryptionKeyVersion, 'lead-contact-key-v1');
  assert.deepEqual(await decryptLeadContactForDelivery(updated?.leadContactEncrypted || '', testLeadEnv), {
    firstName: 'Test',
    lastName: 'Lead',
    email: 'test.lead@example.com'
  });
  assert.equal(updated?.otpStatus, 'sent');
  assert.equal(updated?.otpProvider, 'dev_stub');
});

test('prior attorney-delivery submission marks repeat phone no-charge before OTP verification', async () => {
  const firstSession = await createTestLeadSession();
  const secondSession = await createTestLeadSession();
  const consentText = attorneyDeliveryConsentText(testAttorney);
  const consent = {
    attorneyDeliveryConsent: true,
    phoneContactConsent: true,
    consentCopyVersion: attorneyConsentCopyVersion(testAttorney),
    consentText
  };

  await startOtpUnlock(firstSession.id, testLeadContact('(949) 555-3434'), consent, testLeadEnv);
  const otp = await startOtpUnlock(secondSession.id, testLeadContact('(949) 555-3434'), consent, testLeadEnv);
  const updated = await getLeadSession(secondSession.id, testLeadEnv);

  assert.equal(otp.duplicateWithin30Days, true);
  assert.equal(otp.provider, 'skipped_duplicate_no_charge');
  assert.equal(otp.providerStatus, 'skipped');
  assert.equal(otp.otpLength, 0);
  assert.equal(otp.devCode, undefined);
  assert.equal(updated?.leadDeliveryStatus, 'duplicate_30d_no_charge');
  assert.equal(updated?.otpStatus, 'not_started');
  assert.equal(updated?.otpProvider, 'skipped_duplicate_no_charge');
  assert.equal(updated?.phoneE164Encrypted, null);
  assert.equal(updated?.leadContactEncrypted, null);
});

test('outside-California session cannot start attorney delivery', async () => {
  const session = await createTestLeadSession(testAttorney, {
    visitorRegionCode: 'NV',
    visitorRegion: 'Nevada',
    visitorCity: 'Las Vegas',
    geoEligibilityStatus: 'outside_california'
  });

  await assert.rejects(
    () => startOtpUnlock(session.id, testLeadContact('(949) 555-4545'), {
      attorneyDeliveryConsent: true,
      phoneContactConsent: true,
      consentCopyVersion: attorneyConsentCopyVersion(testAttorney),
      consentText: attorneyDeliveryConsentText(testAttorney)
    }, testLeadEnv),
    /California/
  );

  const updated = await getLeadSession(session.id, testLeadEnv);
  assert.equal(updated?.leadDeliveryStatus, 'outside_california_no_delivery');
});

test('outside-California verified OTP never becomes a deliverable attorney lead', async () => {
  const session = await createTestLeadSession();
  await startOtpUnlock(session.id, testLeadContact('(949) 555-5656'), {
    attorneyDeliveryConsent: true,
    phoneContactConsent: true,
    consentCopyVersion: attorneyConsentCopyVersion(testAttorney),
    consentText: attorneyDeliveryConsentText(testAttorney)
  }, testLeadEnv);

  const stored = await getLeadSession(session.id, testLeadEnv);
  assert.ok(stored);
  stored.geoEligibilityStatus = 'outside_california';

  const unlocked = await verifyOtpUnlock(session.id, '123456', testLeadEnv);
  assert.equal(unlocked.session.otpStatus, 'verified');
  assert.equal(unlocked.session.leadDeliveryStatus, 'outside_california_no_delivery');
});

test('no-attorney preview can unlock without SMS', async () => {
  const session = await createTestLeadSession(null);
  const unlocked = await unlockEstimateOnly(session.id, testLeadEnv);
  const updated = await getLeadSession(session.id, testLeadEnv);

  assert.equal(unlocked.session.leadDeliveryStatus, 'estimate_only_no_delivery');
  assert.equal(updated?.attorneyId, null);
  assert.equal(updated?.phoneHash, null);
  assert.equal(updated?.otpStatus, 'not_started');
  assert.equal(updated?.emailHash, null);
  assert.equal(updated?.leadContactEncrypted, null);
});

test('lead qualification starts as candidate and estimate-only becomes no-sale', async () => {
  const session = await createTestLeadSession();
  const candidate = await getLeadQualification(session.id, testLeadEnv);

  assert.equal(candidate?.qualificationStatus, 'candidate');
  assert.equal(candidate?.verificationStatus, 'unverified');
  assert.equal(candidate?.temperature, 'not_lead');
  assert.ok(candidate?.reasons.includes('otp_not_started'));

  await unlockEstimateOnly(session.id, testLeadEnv);
  const noSale = await getLeadQualification(session.id, testLeadEnv);
  const queued = await getLeadDeliveryQueueItems(session.id, testLeadEnv);

  assert.equal(noSale?.qualificationStatus, 'no_sale');
  assert.equal(noSale?.temperature, 'not_lead');
  assert.ok(noSale?.reasons.includes('estimate_only_no_delivery'));
  assert.equal(queued.length, 0);
});

test('verified valid lead is queued with readable payload and encrypted phone reference', async () => {
  const session = await createTestLeadSession();
  await startOtpUnlock(session.id, testLeadContact('(949) 555-7777'), {
    attorneyDeliveryConsent: true,
    phoneContactConsent: true,
    consentCopyVersion: attorneyConsentCopyVersion(testAttorney),
    consentText: attorneyDeliveryConsentText(testAttorney)
  }, testLeadEnv);

  const unlocked = await verifyOtpUnlock(session.id, '123456', testLeadEnv);
  const qualification = await getLeadQualification(session.id, testLeadEnv);
  const queued = await getLeadDeliveryQueueItems(session.id, testLeadEnv);

  assert.equal(unlocked.session.leadDeliveryStatus, 'ready_for_delivery');
  assert.equal(qualification?.qualificationStatus, 'valid');
  assert.equal(qualification?.verificationStatus, 'verified');
  assert.equal(qualification?.temperature, 'warm');
  assert.equal(queued.length, 1);
  assert.equal(queued[0].status, 'queued');
  assert.equal(queued[0].payload.schemaVersion, 'lead-delivery-2026-04-30-v1');
  assert.equal(queued[0].payload.phoneContact.maskedPhone, '(***) ***-7777');
  assert.ok(queued[0].payload.phoneContact.encryptedPhoneRef?.startsWith('v1.'));
  assert.equal(queued[0].payload.leadContact.maskedName, 'Stored securely');
  assert.equal(queued[0].payload.leadContact.maskedEmail, 'Stored securely');
  assert.ok(queued[0].payload.leadContact.emailHash);
  assert.ok(queued[0].payload.leadContact.encryptedContactRef?.startsWith('v1.'));
  assert.equal(queued[0].payload.caseSummary.age, 35);
  assert.ok(queued[0].payload.caseSummary.readableSections.some((section) => section.title === 'Case snapshot'));
  assert.equal(JSON.stringify(queued[0].payload).includes('1990-01-01'), false);
});

test('qualification temperature maps cold warm and hot leads', async () => {
  const coldData = baseCase({
    accidentDetails: {
      ...baseCase().accidentDetails,
      dateOfAccident: '2025-01-15',
      impactSeverity: 'low'
    }
  });
  const moderateData = baseCase({
    injuries: {
      ...baseCase().injuries,
      bodyMap: [{
        slug: 'knees',
        side: 'left',
        view: 'front',
        severity: 3,
        label: 'Left knee'
      }],
      primaryInjury: 'Knee Injury'
    }
  });
  const majorImpactData = baseCase({
    accidentDetails: {
      ...baseCase().accidentDetails,
      impactSeverity: 'severe'
    }
  });
  const extremeImpactData = baseCase({
    accidentDetails: {
      ...baseCase().accidentDetails,
      impactSeverity: 'catastrophic'
    }
  });
  const hotData = baseCase({
    treatment: {
      ...baseCase().treatment,
      surgeryRecommended: true,
      surgeryType: 'moderate'
    }
  });
  const coldSession = await createTestLeadSessionForData(coldData);
  const warmSession = await createTestLeadSessionForData(moderateData);
  const majorImpactSession = await createTestLeadSessionForData(majorImpactData);
  const extremeImpactSession = await createTestLeadSessionForData(extremeImpactData);
  const hotSession = await createTestLeadSessionForData(hotData);

  for (const session of [coldSession, warmSession, majorImpactSession, extremeImpactSession, hotSession]) {
    await startOtpUnlock(session.id, testLeadContact('(949) 555-8888'), {
      attorneyDeliveryConsent: true,
      phoneContactConsent: true,
      consentCopyVersion: attorneyConsentCopyVersion(testAttorney),
      consentText: attorneyDeliveryConsentText(testAttorney)
    }, {
      ...testLeadEnv,
      LEAD_HASH_SALT: `${testLeadEnv.LEAD_HASH_SALT}-${session.id}`
    });
    await verifyOtpUnlock(session.id, '123456', {
      ...testLeadEnv,
      LEAD_HASH_SALT: `${testLeadEnv.LEAD_HASH_SALT}-${session.id}`
    });
  }

  assert.equal((await getLeadQualification(coldSession.id, testLeadEnv))?.temperature, 'cold');
  assert.equal((await getLeadQualification(warmSession.id, testLeadEnv))?.temperature, 'warm');
  assert.equal((await getLeadQualification(majorImpactSession.id, testLeadEnv))?.temperature, 'hot');
  assert.equal((await getLeadQualification(extremeImpactSession.id, testLeadEnv))?.temperature, 'hot');
  assert.equal((await getLeadQualification(hotSession.id, testLeadEnv))?.temperature, 'hot');
});

test('duplicate and non-California verified sessions never queue', async () => {
  const firstSession = await createTestLeadSession();
  const secondSession = await createTestLeadSession();
  const consent = {
    attorneyDeliveryConsent: true,
    phoneContactConsent: true,
    consentCopyVersion: attorneyConsentCopyVersion(testAttorney),
    consentText: attorneyDeliveryConsentText(testAttorney)
  };

  await startOtpUnlock(firstSession.id, testLeadContact('(949) 555-9090'), consent, testLeadEnv);
  await startOtpUnlock(secondSession.id, testLeadContact('(949) 555-9090'), consent, testLeadEnv);
  await unlockEstimateOnly(secondSession.id, testLeadEnv);

  const duplicateQualification = await getLeadQualification(secondSession.id, testLeadEnv);
  const duplicateQueue = await getLeadDeliveryQueueItems(secondSession.id, testLeadEnv);

  assert.equal(duplicateQualification?.qualificationStatus, 'no_sale');
  assert.equal(duplicateQualification?.verificationStatus, 'unverified');
  assert.equal(duplicateQualification?.temperature, 'not_lead');
  assert.equal(duplicateQueue.length, 0);

  const outsideSession = await createTestLeadSession(testAttorney, {
    geoEligibilityStatus: 'outside_california',
    visitorRegionCode: 'NV',
    visitorRegion: 'Nevada'
  });
  await assert.rejects(() => startOtpUnlock(outsideSession.id, testLeadContact('(949) 555-9191'), consent, testLeadEnv));

  assert.equal((await getLeadDeliveryQueueItems(outsideSession.id, testLeadEnv)).length, 0);
});

test('payload builder is human-readable and omits exact date of birth', async () => {
  const session = await createTestLeadSession();
  await startOtpUnlock(session.id, testLeadContact('(949) 555-8080'), {
    attorneyDeliveryConsent: true,
    phoneContactConsent: true,
    consentCopyVersion: attorneyConsentCopyVersion(testAttorney),
    consentText: attorneyDeliveryConsentText(testAttorney)
  }, testLeadEnv);
  const verified = await verifyOtpUnlock(session.id, '123456', testLeadEnv);
  const qualification = qualifyLeadSession(verified.session);
  const payload = buildLeadDeliveryPayload(verified.session, qualification, '2026-04-30T00:00:00.000Z');
  const payloadText = JSON.stringify(payload);

  assert.equal(payload.generatedAt, '2026-04-30T00:00:00.000Z');
  assert.equal(payload.caseSummary.accidentCounty, 'Orange');
  assert.equal(payload.caseSummary.age, 35);
  assert.ok(payload.leadContact.encryptedContactRef?.startsWith('v1.'));
  assert.ok(payload.caseSummary.readableSections.length >= 3);
  assert.equal(payloadText.includes('1990-01-01'), false);
  assert.equal(payloadText.includes('test.lead@example.com'), false);
});

test('Twilio Verify start and check use Verify endpoints without returning a dev code', async () => {
  const session = await createTestLeadSession();
  const originalFetch = globalThis.fetch;
  const calls: Array<{ url: string; body: string }> = [];
  const twilioEnv = {
    ...testLeadEnv,
    SMS_PROVIDER: 'twilio_verify',
    TWILIO_ACCOUNT_SID: 'ACtest',
    TWILIO_AUTH_TOKEN: 'auth-token',
    TWILIO_VERIFY_SERVICE_SID: 'VAservice',
    OTP_DEV_CODE: undefined
  };

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const body = init?.body?.toString() || '';
    calls.push({ url, body });

    if (url.endsWith('/Verifications')) {
      return new Response(JSON.stringify({
        sid: 'VEverification',
        status: 'pending',
        channel: 'sms'
      }), { status: 201, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({
      sid: 'VEcheck',
      status: 'approved'
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }) as typeof fetch;

  try {
    const otp = await startOtpUnlock(session.id, testLeadContact('(949) 555-6060'), {
      attorneyDeliveryConsent: true,
      phoneContactConsent: true,
      consentCopyVersion: attorneyConsentCopyVersion(testAttorney),
      consentText: attorneyDeliveryConsentText(testAttorney)
    }, twilioEnv);
    const started = await getLeadSession(session.id, twilioEnv);

    assert.equal(otp.provider, 'twilio_verify');
    assert.equal(otp.providerStatus, 'pending');
    assert.equal(otp.devCode, undefined);
    assert.equal(started?.twilioVerifySid, 'VEverification');
    assert.equal(started?.otpProvider, 'twilio_verify');
    assert.equal(calls[0].url, 'https://verify.twilio.com/v2/Services/VAservice/Verifications');
    assert.match(calls[0].body, /To=%2B19495556060/);
    assert.match(calls[0].body, /Channel=sms/);

    const unlocked = await verifyOtpUnlock(session.id, '111111', twilioEnv);

    assert.equal(unlocked.session.otpStatus, 'verified');
    assert.equal(calls[1].url, 'https://verify.twilio.com/v2/Services/VAservice/VerificationCheck');
    assert.match(calls[1].body, /VerificationSid=VEverification/);
    assert.match(calls[1].body, /Code=111111/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('duplicate phone skips Twilio Verify start to avoid no-sale SMS cost', async () => {
  const firstSession = await createTestLeadSession();
  const secondSession = await createTestLeadSession();
  const consent = {
    attorneyDeliveryConsent: true,
    phoneContactConsent: true,
    consentCopyVersion: attorneyConsentCopyVersion(testAttorney),
    consentText: attorneyDeliveryConsentText(testAttorney)
  };
  const twilioEnv = {
    ...testLeadEnv,
    SMS_PROVIDER: 'twilio_verify',
    TWILIO_ACCOUNT_SID: 'ACtest',
    TWILIO_AUTH_TOKEN: 'auth-token',
    TWILIO_VERIFY_SERVICE_SID: 'VAservice',
    OTP_DEV_CODE: undefined
  };
  const originalFetch = globalThis.fetch;
  const calls: string[] = [];

  await startOtpUnlock(firstSession.id, testLeadContact('(949) 555-6161'), consent, testLeadEnv);
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push(String(input));
    return originalFetch(input, init);
  }) as typeof fetch;

  try {
    const otp = await startOtpUnlock(secondSession.id, testLeadContact('(949) 555-6161'), consent, twilioEnv);

    assert.equal(otp.duplicateWithin30Days, true);
    assert.equal(otp.provider, 'skipped_duplicate_no_charge');
    assert.equal(otp.otpLength, 0);
    assert.deepEqual(calls, []);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('default privacy choices and GPC block marketing pixels', () => {
  const defaultSnapshot = createPrivacyChoiceSnapshot(
    createDefaultPrivacyChoices('2026-04-29T00:00:00.000Z'),
    false
  );
  const gpcSnapshot = createPrivacyChoiceSnapshot({
    version: defaultSnapshot.version,
    analytics: true,
    marketing: true,
    updatedAt: '2026-04-29T00:00:00.000Z'
  }, true);

  assert.equal(defaultSnapshot.effectiveAnalytics, false);
  assert.equal(defaultSnapshot.effectiveMarketing, false);
  assert.equal(gpcSnapshot.effectiveAnalytics, true);
  assert.equal(gpcSnapshot.effectiveMarketing, false);
  assert.equal(gpcSnapshot.gpcHonored, true);
});

test('mobile-first flow can calculate without income when no work loss is entered', () => {
  const result = calculateSettlement(baseCase({
    demographics: {
      age: 35,
      dateOfBirth: '1990-01-01',
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
      hasWageLoss: false,
      missedWorkDays: 0
    }
  }));

  assert.ok(Number.isFinite(result.highEstimate));
  assert.ok(result.highEstimate > 0);
  assert.ok(!result.factors.some((factor) => factor.factor.includes('Lost wage')));
});

test('wage loss is estimated from occupation income treatment and injury severity', () => {
  const injuryInput = {
    ...baseCase().injuries,
    bodyMap: [{
      slug: 'neck',
      side: 'common',
      view: 'front',
      severity: 3,
      label: 'Base of neck / collarbone'
    }] as BodyMapSelection[],
    primaryInjury: 'Whiplash / Neck Strain'
  };
  const result = calculateSettlement(baseCase({
    demographics: {
      ...baseCase().demographics,
      occupation: 'Construction/Manual Labor',
      annualIncome: 62500
    },
    injuries: injuryInput,
    treatment: {
      ...baseCase().treatment,
      physicalTherapySessions: 4
    },
    impact: {
      ...baseCase().impact,
      hasWageLoss: true,
      missedWorkDays: 999
    }
  }));
  const sameWithoutStaleDays = calculateSettlement(baseCase({
    demographics: {
      ...baseCase().demographics,
      occupation: 'Construction/Manual Labor',
      annualIncome: 62500
    },
    injuries: injuryInput,
    treatment: {
      ...baseCase().treatment,
      physicalTherapySessions: 4
    },
    impact: {
      ...baseCase().impact,
      hasWageLoss: true,
      missedWorkDays: 0
    }
  }));

  assert.equal(result.estimatedWorkLossDays, 9);
  assert.equal(result.estimatedWageLoss, 2250);
  assert.equal(result.estimatedWageLoss, sameWithoutStaleDays.estimatedWageLoss);
  assert.equal(result.highEstimate, sameWithoutStaleDays.highEstimate);
  assert.equal(result.specials, result.medicalCosts + 2250);
  assert.ok(result.factors.some((factor) => factor.factor.includes('Estimated wage loss')));
});

test('life impact answers are weighted by injury context and impairment rating is ignored', () => {
  const injuryInput = {
    ...baseCase().injuries,
    bodyMap: [{
      slug: 'neck',
      side: 'common',
      view: 'front',
      severity: 3,
      label: 'Base of neck / collarbone'
    }] as BodyMapSelection[],
    primaryInjury: 'Whiplash / Neck Strain'
  };
  const baseline = calculateSettlement(baseCase({
    injuries: injuryInput,
    treatment: {
      ...baseCase().treatment,
      physicalTherapySessions: 4
    }
  }));
  const lifeImpact = calculateSettlement(baseCase({
    injuries: injuryInput,
    treatment: {
      ...baseCase().treatment,
      physicalTherapySessions: 4
    },
    impact: {
      ...baseCase().impact,
      emotionalDistress: true,
      lossOfConsortium: true,
      permanentImpairment: true,
      impairmentRating: 99
    }
  }));
  const differentLegacyRating = calculateSettlement(baseCase({
    injuries: injuryInput,
    treatment: {
      ...baseCase().treatment,
      physicalTherapySessions: 4
    },
    impact: {
      ...baseCase().impact,
      emotionalDistress: true,
      lossOfConsortium: true,
      permanentImpairment: true,
      impairmentRating: 1
    }
  }));

  assert.ok(lifeImpact.highEstimate > baseline.highEstimate);
  assert.equal(lifeImpact.highEstimate, differentLegacyRating.highEstimate);
  assert.ok(lifeImpact.factors.some((factor) => factor.factor.includes('Emotional distress weighted')));
  assert.ok(lifeImpact.factors.some((factor) => factor.factor.includes('Relationship or household impact weighted')));
  assert.ok(lifeImpact.factors.some((factor) => factor.factor.includes('Permanent impairment weighted')));
});

test('preview endpoint does not return exact estimate values before OTP unlock', async () => {
  const calculatorData = baseCase({
    injuries: {
      ...baseCase().injuries,
      bodyMap: [{
        slug: 'neck',
        side: 'common',
        view: 'front',
        severity: 1,
        label: 'Base of neck / collarbone'
      }],
      primaryInjury: ''
    }
  });
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

test('preview endpoint allows missing occupation and income when wage loss is no', async () => {
  const calculatorData = baseCase({
    demographics: {
      age: 0,
      dateOfBirth: '1990-01-01',
      occupation: '',
      annualIncome: ''
    },
    impact: {
      ...baseCase().impact,
      hasWageLoss: false
    },
    injuries: {
      ...baseCase().injuries,
      bodyMap: [{
        slug: 'neck',
        side: 'common',
        view: 'front',
        severity: 1,
        label: 'Base of neck / collarbone'
      }],
      primaryInjury: ''
    }
  });
  const request = new NextRequest('http://localhost/api/estimate/preview', {
    method: 'POST',
    body: JSON.stringify({
      calculatorData,
      turnstileToken: 'dev-turnstile-token'
    })
  });

  const response = await previewPost(request);

  assert.equal(response.status, 200);
});

test('preview endpoint requires occupation and income when wage loss is yes', async () => {
  const calculatorData = baseCase({
    demographics: {
      age: 0,
      dateOfBirth: '1990-01-01',
      occupation: '',
      annualIncome: ''
    },
    impact: {
      ...baseCase().impact,
      hasWageLoss: true
    },
    injuries: {
      ...baseCase().injuries,
      bodyMap: [{
        slug: 'neck',
        side: 'common',
        view: 'front',
        severity: 1,
        label: 'Base of neck / collarbone'
      }],
      primaryInjury: ''
    }
  });
  const request = new NextRequest('http://localhost/api/estimate/preview', {
    method: 'POST',
    body: JSON.stringify({
      calculatorData,
      turnstileToken: 'dev-turnstile-token'
    })
  });

  const response = await previewPost(request);
  const payload = await response.json();

  assert.equal(response.status, 400);
  assert.equal(payload.error, 'Please complete occupation and income details for wage loss.');
});

test('preview endpoint rejects future date of loss', async () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const calculatorData = baseCase({
    accidentDetails: {
      ...baseCase().accidentDetails,
      dateOfAccident: dateInputValueForDate(tomorrow)
    },
    injuries: {
      ...baseCase().injuries,
      bodyMap: [{
        slug: 'neck',
        side: 'common',
        view: 'front',
        severity: 1,
        label: 'Base of neck / collarbone'
      }],
      primaryInjury: ''
    }
  });
  const request = new NextRequest('http://localhost/api/estimate/preview', {
    method: 'POST',
    body: JSON.stringify({
      calculatorData,
      turnstileToken: 'dev-turnstile-token'
    })
  });

  const response = await previewPost(request);
  const payload = await response.json();

  assert.equal(response.status, 400);
  assert.equal(payload.error, 'Date of Loss cannot be in the future.');
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

test('county venue config classifies every California county', () => {
  const configuredCounties = SETTLEMENT_LOGIC.countyVenue.counties as Record<string, string>;
  const missingCounties = CALIFORNIA_COUNTIES.filter((county) => !configuredCounties[county]);

  assert.deepEqual(missingCounties, []);
});

test('county venue tendency applies heavier general-damages modifier', () => {
  const neutral = calculateSettlement(baseCase({
    accidentDetails: {
      ...baseCase().accidentDetails,
      county: 'Orange'
    }
  }));
  const liberal = calculateSettlement(baseCase({
    accidentDetails: {
      ...baseCase().accidentDetails,
      county: 'Alameda'
    }
  }));
  const conservative = calculateSettlement(baseCase({
    accidentDetails: {
      ...baseCase().accidentDetails,
      county: 'Shasta'
    }
  }));

  assert.equal(neutral.highEstimate, calculateSettlement(baseCase()).highEstimate);
  assert.ok(liberal.highEstimate > neutral.highEstimate);
  assert.ok(conservative.highEstimate < neutral.highEstimate);
  const liberalFactor = liberal.factors.find((factor) => factor.factor.includes('Alameda County venue tendency'));
  const conservativeFactor = conservative.factors.find((factor) => factor.factor.includes('Shasta County venue tendency'));

  assert.ok(liberalFactor);
  assert.equal(liberalFactor.impact, 'positive');
  assert.ok(Math.abs(liberalFactor.weight - 0.1) < 0.001);
  assert.ok(conservativeFactor);
  assert.equal(conservativeFactor.impact, 'negative');
  assert.ok(Math.abs(conservativeFactor.weight + 0.1) < 0.001);
});

test('mock scenarios span low through severe severity bands', () => {
  const area = (slug: BodyMapSelection['slug'], severity: BodyMapSelection['severity'], label: string): BodyMapSelection => ({
    slug,
    side: 'common',
    view: 'front',
    severity,
    label
  });
  const scenarios = [
    calculateSettlement(baseCase()),
    calculateSettlement(baseCase({
      injuries: {
        ...baseCase().injuries,
        bodyMap: [area('knees', 3, 'Knee')],
        primaryInjury: 'Knee Injury'
      }
    })),
    calculateSettlement(baseCase({
      injuries: {
        ...baseCase().injuries,
        bodyMap: [area('neck', 4, 'Neck')],
        primaryInjury: 'Whiplash / Neck Strain'
      }
    })),
    calculateSettlement(baseCase({
      injuries: {
        ...baseCase().injuries,
        bodyMap: [area('neck', 4, 'Neck')],
        primaryInjury: 'Whiplash / Neck Strain'
      },
      treatment: {
        ...baseCase().treatment,
        physicalTherapySessions: 16
      }
    })),
    calculateSettlement(baseCase({
      accidentDetails: {
        ...baseCase().accidentDetails,
        county: 'San Francisco',
        impactSeverity: 'catastrophic'
      },
      injuries: {
        ...baseCase().injuries,
        bodyMap: [
          area('head', 4, 'Head'),
          area('neck', 4, 'Neck'),
          area('chest', 3, 'Chest')
        ],
        primaryInjury: 'Soft Tissue Damage'
      },
      treatment: {
        ...baseCase().treatment,
        surgeryCompleted: true,
        surgeryType: 'major'
      }
    }))
  ];

  assert.deepEqual(scenarios.map((scenario) => scenario.severityBand), [
    'low',
    'moderate',
    'elevated',
    'high',
    'severe'
  ]);
  assert.ok(scenarios.every((scenario, index) => index === 0 || scenario.highEstimate > scenarios[index - 1].highEstimate));
});

test('midpoint anchored ranges keep calibration scenarios in target zones', () => {
  const area = (
    slug: BodyMapSelection['slug'],
    severity: BodyMapSelection['severity'],
    label: string,
    view: BodyMapSelection['view'] = 'front'
  ): BodyMapSelection => ({
    slug,
    side: 'common',
    view,
    severity,
    label
  });
  const minor = calculateSettlement(baseCase({
    accidentDetails: {
      ...baseCase().accidentDetails,
      county: 'Orange',
      impactSeverity: 'low'
    },
    injuries: {
      ...baseCase().injuries,
      bodyMap: [area('neck', 1, 'Neck')],
      primaryInjury: 'Whiplash / Neck Strain'
    }
  }));
  const moderate = calculateSettlement(baseCase({
    accidentDetails: {
      ...baseCase().accidentDetails,
      county: 'Alameda',
      impactSeverity: 'moderate'
    },
    injuries: {
      ...baseCase().injuries,
      bodyMap: [area('neck', 3, 'Neck')],
      primaryInjury: 'Whiplash / Neck Strain'
    },
    treatment: {
      ...baseCase().treatment,
      physicalTherapySessions: 8,
      mris: 1
    }
  }));
  const severeNoSurgery = calculateSettlement(baseCase({
    accidentDetails: {
      ...baseCase().accidentDetails,
      county: 'Los Angeles',
      impactSeverity: 'severe'
    },
    injuries: {
      ...baseCase().injuries,
      bodyMap: [
        area('neck', 4, 'Neck'),
        area('lower-back', 4, 'Lower back', 'back'),
        area('chest', 3, 'Chest')
      ],
      primaryInjury: 'Soft Tissue Damage'
    },
    treatment: {
      ...baseCase().treatment,
      emergencyRoomVisits: 1,
      physicalTherapySessions: 16,
      mris: 2,
      orthopedicConsults: 1,
      painManagementVisits: 2,
      esiInjections: 2
    }
  }));

  assert.deepEqual([minor.lowEstimate, minor.midEstimate, minor.highEstimate], [1575, 1853, 2388]);
  assert.ok(moderate.highEstimate >= 22000);
  assert.ok(moderate.highEstimate <= 23000);
  assert.deepEqual(
    [severeNoSurgery.lowEstimate, severeNoSurgery.midEstimate, severeNoSurgery.highEstimate],
    [75576, 96323, 98501]
  );
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
  const severityResults = ([1, 2, 3, 4] as const).map((severity) => calculateSettlement(baseCase({
    injuries: {
      ...baseCase().injuries,
      bodyMap: [
        {
          slug: 'neck',
          side: 'common',
          view: 'front',
          severity,
          label: 'Neck'
        }
      ],
      primaryInjury: 'Whiplash / Neck Strain'
    }
  })));
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

  assert.equal(result.severityBand, 'elevated');
  assert.ok(result.highEstimate > calculateSettlement(baseCase()).highEstimate);
  assert.ok(severityResults[1].highEstimate > severityResults[0].highEstimate);
  assert.ok(severityResults[2].highEstimate > severityResults[1].highEstimate);
  assert.ok(severityResults[3].highEstimate > severityResults[2].highEstimate);
  assert.ok(!result.factors.some((factor) => factor.factor.includes('fracture')));
  assert.ok(!result.factors.some((factor) => factor.factor.includes('Traumatic brain')));
});

test('imaging lifts treatment progression without case-tier picking', () => {
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

  assert.equal(bodyOnly.caseTier, bodyOnly.severityBand);
  assert.equal(withImaging.caseTier, withImaging.severityBand);
  assert.ok(withImaging.highEstimate > bodyOnly.highEstimate);
  assert.ok(withImaging.factors.some((factor) => factor.factor.includes('Soft-tissue treatment with adders')));
});

test('body-map general-damages multiplier is capped by config', () => {
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
  assert.ok(bodyFactor.weight <= SETTLEMENT_LOGIC.bodyMapSeverity.maxGeneralDamagesMultiplier);
  assert.ok(bodyFactor.weight > 2.8);
});

test('body-map selections derive primary injury without guided cards', () => {
  const derived = deriveBodyMapOnlyInjuryFields({
    ...baseCase().injuries,
    bodyMap: [{
      slug: 'lower-back',
      side: 'common',
      view: 'back',
      severity: 1,
      label: 'Lower back'
    }],
    primaryInjury: ''
  });

  assert.equal(derived.primaryInjury, 'Back Strain / Sprain');
  assert.deepEqual(derived.preExistingConditions, []);
  assert.deepEqual(derived.fractures, []);
  assert.equal(derived.tbi, false);
  assert.equal(derived.tbiSeverity, undefined);
});

test('guided injury signals and stale objective fields are ignored during normalization', () => {
  const guided = createDefaultGuidedInjurySignals();
  guided.head = {
    status: 'confirmed_tbi',
    certainty: 'provider_confirmed',
    severity: 'severe'
  };
  guided.spine = {
    status: 'spinal_cord_warning',
    certainty: 'provider_confirmed'
  };
  guided.fracture = {
    status: 'confirmed',
    certainty: 'provider_confirmed',
    areas: ['arm_wrist_hand']
  };
  guided.visibleOrInternal = { status: 'both' };
  guided.preExisting = { sameAreaStatus: 'yes_active_treatment_or_prior_claim' };

  const normalized = normalizeGuidedInjuryData(baseCase({
    injuries: {
      ...baseCase().injuries,
      guidedSignals: guided,
      bodyMap: [{
        slug: 'head',
        side: 'common',
        view: 'front',
        severity: 4,
        label: 'Head'
      }],
      primaryInjury: 'Concussion / Mild TBI',
      secondaryInjuries: ['Scarring / Disfigurement'],
      preExistingConditions: ['Prior same-area treatment or claim'],
      fractures: ['Wrist Fracture'],
      tbi: true,
      tbiSeverity: 'severe',
      spinalIssues: {
        herniation: true,
        nerveRootCompression: true,
        radiculopathy: true,
        myelopathy: true,
        preExistingDegeneration: true
      }
    }
  }));
  const result = calculateSettlement(normalized);

  assert.equal(normalized.injuries.primaryInjury, 'Soft Tissue Damage');
  assert.deepEqual(normalized.injuries.secondaryInjuries, []);
  assert.deepEqual(normalized.injuries.preExistingConditions, []);
  assert.deepEqual(normalized.injuries.fractures, []);
  assert.equal(normalized.injuries.tbi, false);
  assert.equal(normalized.injuries.tbiSeverity, undefined);
  assert.deepEqual(normalized.injuries.spinalIssues, {
    herniation: false,
    nerveRootCompression: false,
    radiculopathy: false,
    myelopathy: false,
    preExistingDegeneration: false
  });
  assert.ok(!result.factors.some((factor) => factor.factor.includes('Traumatic brain')));
  assert.ok(!result.factors.some((factor) => factor.factor.includes('fracture')));
  assert.ok(!result.factors.some((factor) => factor.factor.includes('spinal finding')));
  assert.ok(!result.factors.some((factor) => factor.factor.includes('pre-existing')));
});

test('impact severity and derived age still affect estimates while missed work days are ignored', () => {
  const guided = createDefaultGuidedInjurySignals();
  guided.head = {
    status: 'confirmed_tbi',
    certainty: 'provider_confirmed',
    severity: 'severe'
  };

  const injuryInput = {
    ...baseCase().injuries,
    guidedSignals: guided,
    bodyMap: [{
      slug: 'neck',
      side: 'common',
      view: 'front',
      severity: 3,
      label: 'Base of neck / collarbone'
    }] as BodyMapSelection[],
    primaryInjury: ''
  };
  const baseline = calculateSettlement(baseCase({ injuries: injuryInput }));
  const severeImpact = calculateSettlement(baseCase({
    injuries: injuryInput,
    accidentDetails: {
      ...baseCase().accidentDetails,
      impactSeverity: 'severe'
    }
  }));
  const olderClient = calculateSettlement(baseCase({
    injuries: injuryInput,
    demographics: {
      ...baseCase().demographics,
      age: 0,
      dateOfBirth: '1950-01-01'
    }
  }));
  const missedWork = calculateSettlement(baseCase({
    injuries: injuryInput,
    impact: {
      ...baseCase().impact,
      missedWorkDays: 10
    }
  }));

  assert.ok(severeImpact.highEstimate > baseline.highEstimate);
  assert.ok(severeImpact.factors.some((factor) => factor.factor.includes('Severe impact severity')));
  assert.ok(olderClient.highEstimate > baseline.highEstimate);
  assert.ok(olderClient.factors.some((factor) => factor.factor.includes('Advanced age')));
  assert.equal(missedWork.highEstimate, baseline.highEstimate);
  assert.ok(!missedWork.factors.some((factor) => factor.factor.includes('Lost wage')));
  assert.ok(!baseline.factors.some((factor) => factor.factor.includes('Traumatic brain')));
});
