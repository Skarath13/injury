import assert from 'node:assert/strict';
import test from 'node:test';
import { NextRequest, NextResponse } from 'next/server';
import { POST as previewPost } from '../app/api/estimate/preview/route';
import { POST as estimateOnlyUnlockPost } from '../app/api/estimate/unlock/estimate-only/route';
import { POST as unlockStartPost } from '../app/api/estimate/unlock/start/route';
import { POST as unlockVerifyPost } from '../app/api/estimate/unlock/verify/route';
import { POST as formStartPost } from '../app/api/estimate/start/route';
import scenariosJson from './fixtures/lead-scenarios.json';
import type { WorkerEnv } from '../lib/cloudflareEnv';
import { getLeadDeliveryQueueItems, getLeadQualification } from '../lib/leadDelivery';
import type { LeadDeliveryQueueItem, LeadQualification } from '../lib/leadDelivery';
import {
  createFormStartToken,
  FORM_START_COOKIE_NAME
} from '../lib/leadGate';
import { calculateSettlement } from '../lib/settlementEngine';
import type {
  BodyMapSelection,
  EstimateOnlyUnlockResponse,
  EstimatePreviewResponse,
  InjuryCalculatorData,
  UnlockStartResponse,
  UnlockVerifyResponse
} from '../types/calculator';

type ScenarioBase = 'soft_tissue' | 'warm_treatment' | 'surgery_hot';
type ScenarioGeo = 'california' | 'outside_california' | 'unknown';
type ScenarioRouting = 'attorney_available' | 'no_attorney';
type ScenarioUnlockMode = 'sms_lead' | 'estimate_only';

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends Array<unknown>
    ? T[K]
    : T[K] extends object
      ? DeepPartial<T[K]>
      : T[K];
};

interface LeadScenario {
  id: string;
  description: string;
  base: ScenarioBase;
  overrides?: DeepPartial<InjuryCalculatorData>;
  geo: ScenarioGeo;
  formStartAgeSeconds?: number;
  routing: ScenarioRouting;
  seedDuplicatePhone?: boolean;
  unlock: {
    mode: ScenarioUnlockMode;
    phone?: string;
    code?: string;
    consent?: boolean;
  };
  expect: {
    preview: {
      unlockMode: ScenarioUnlockMode;
      requiresAttorneyConsent: boolean;
      leadDeliveryStatus: string;
    };
    unlockStartDuplicateWithin30Days?: boolean;
    deliveryStatus: string;
    qualificationStatus: string;
    verificationStatus: string;
    temperature: string;
    queueCount: number;
    reasonsInclude?: string[];
    payload?: {
      maskedPhone?: string;
      encryptedPhoneRefPrefix?: string;
      attorneyId?: string;
      omitsDateOfBirth?: boolean;
    };
  };
}

interface ScenarioState {
  sessionId?: string;
  previewText?: string;
  preview?: EstimatePreviewResponse;
  unlockStart?: UnlockStartResponse;
  unlock?: UnlockVerifyResponse | EstimateOnlyUnlockResponse;
  qualification?: LeadQualification | null;
  queueItems?: LeadDeliveryQueueItem[];
}

const leadScenarios = scenariosJson as LeadScenario[];
const cloudflareContextSymbol = Symbol.for('__cloudflare-request-context__');
const OTP_DEV_CODE = '123456';
const SCENARIO_ATTORNEY_ID = 'scenario-attorney';

function baseCase(overrides: DeepPartial<InjuryCalculatorData> = {}): InjuryCalculatorData {
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
      bodyMap: [
        {
          slug: 'neck',
          side: 'common',
          view: 'front',
          severity: 1,
          label: 'Neck'
        } as BodyMapSelection
      ],
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

  return mergeDeep(data, overrides);
}

const baseProfiles: Record<ScenarioBase, InjuryCalculatorData> = {
  soft_tissue: baseCase(),
  warm_treatment: baseCase({
    injuries: {
      bodyMap: [
        {
          slug: 'knees',
          side: 'left',
          view: 'front',
          severity: 3,
          label: 'Left knee'
        } as BodyMapSelection
      ],
      primaryInjury: 'Knee Injury'
    }
  }),
  surgery_hot: baseCase({
    treatment: {
      surgeryRecommended: true,
      surgeryType: 'moderate'
    }
  })
};

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function mergeDeep<T>(base: T, overrides: DeepPartial<T> | undefined): T {
  if (!overrides) return structuredClone(base);

  const output = structuredClone(base) as Record<string, unknown>;
  for (const [key, value] of Object.entries(overrides as Record<string, unknown>)) {
    if (value === undefined) continue;

    const current = output[key];
    if (isPlainRecord(current) && isPlainRecord(value)) {
      output[key] = mergeDeep(current, value);
      continue;
    }

    output[key] = value;
  }

  return output as T;
}

function scenarioData(scenario: LeadScenario): InjuryCalculatorData {
  return mergeDeep(baseProfiles[scenario.base], scenario.overrides);
}

function routingConfigFor(scenario: LeadScenario, county: string) {
  const attorney = {
    id: SCENARIO_ATTORNEY_ID,
    name: 'Scenario Injury Law',
    barNumber: '123456',
    officeLocation: 'Irvine, CA',
    active: true,
    approvedCounties: [county],
    disclosure: 'Scenario Injury Law is responsible for this attorney advertisement.',
    consentCopyVersion: 'scenario-consent-v1'
  };

  return {
    version: `scenario-routing-${scenario.id}`,
    disclosureCopyVersion: 'scenario-disclosure-v1',
    panelDisclosure: 'Scenario attorney routing fixture.',
    attorneys: scenario.routing === 'attorney_available' ? [attorney] : [],
    countyRoutes: scenario.routing === 'attorney_available'
      ? { [county.toLowerCase()]: SCENARIO_ATTORNEY_ID }
      : {}
  };
}

function envFor(scenario: LeadScenario, data: InjuryCalculatorData): WorkerEnv {
  const routingConfig = routingConfigFor(scenario, data.accidentDetails.county);

  return {
    NODE_ENV: 'test',
    SMS_PROVIDER: 'dev_stub',
    OTP_DEV_CODE,
    LEAD_HASH_SALT: `lead-scenario-hash-${scenario.id}`,
    LEAD_ENCRYPTION_KEY: `lead-scenario-encryption-${scenario.id}`,
    LEAD_ENCRYPTION_KEY_VERSION: `lead-scenario-key-${scenario.id}`,
    TURNSTILE_SECRET_KEY: `lead-scenario-turnstile-${scenario.id}`,
    ATTORNEY_ROUTING: {
      async get() {
        return routingConfig;
      }
    }
  };
}

function setCloudflareEnv(env: WorkerEnv) {
  (globalThis as Record<symbol, { env: WorkerEnv }>)[cloudflareContextSymbol] = { env };
}

function clearCloudflareEnv() {
  delete (globalThis as Record<symbol, { env: WorkerEnv }>)[cloudflareContextSymbol];
}

function installTurnstileFetchStub() {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url === 'https://challenges.cloudflare.com/turnstile/v0/siteverify') {
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return originalFetch(input, init);
  }) as typeof fetch;

  return () => {
    globalThis.fetch = originalFetch;
  };
}

function geoHeaders(geo: ScenarioGeo): Record<string, string> {
  if (geo === 'california') {
    return {
      'x-injury-geo-country': 'US',
      'x-injury-geo-region-code': 'CA',
      'x-injury-geo-region': 'California',
      'x-injury-geo-city': 'Irvine',
      'x-injury-geo-eligibility': 'california'
    };
  }

  if (geo === 'outside_california') {
    return {
      'x-injury-geo-country': 'US',
      'x-injury-geo-region-code': 'NV',
      'x-injury-geo-region': 'Nevada',
      'x-injury-geo-city': 'Las Vegas',
      'x-injury-geo-eligibility': 'outside_california'
    };
  }

  return {};
}

function jsonRequest(path: string, body: unknown, headers: Record<string, string> = {}) {
  return new NextRequest(`http://localhost${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    body: JSON.stringify(body)
  });
}

async function jsonFromResponse<T>(response: NextResponse, scenarioId: string, label: string): Promise<T> {
  const text = await response.text();
  let payload: T;

  try {
    payload = JSON.parse(text) as T;
  } catch (error) {
    throw new Error(`${scenarioId}: ${label} returned non-JSON status ${response.status}: ${text}`, { cause: error });
  }

  assert.equal(response.status, 200, `${scenarioId}: ${label} status ${response.status}: ${text}`);
  return payload;
}

async function preparePreview(
  scenario: LeadScenario,
  data: InjuryCalculatorData,
  env: WorkerEnv,
  state: ScenarioState,
  id = scenario.id
): Promise<EstimatePreviewResponse> {
  const startResponse = await formStartPost();
  const startPayload = await jsonFromResponse<{ ok?: boolean }>(startResponse, id, 'form start');
  assert.equal(startPayload.ok, true, `${id}: form start should return ok`);

  const formStartAgeSeconds = scenario.formStartAgeSeconds ?? 180;
  const formStartToken = await createFormStartToken(env, Date.now() - formStartAgeSeconds * 1000);
  const expectedResult = calculateSettlement(data);
  const response = await previewPost(jsonRequest('/api/estimate/preview', {
    calculatorData: data,
    turnstileToken: 'dev-turnstile-token'
  }, {
    ...geoHeaders(scenario.geo),
    cookie: `${FORM_START_COOKIE_NAME}=${formStartToken}`
  }));
  const previewText = await response.text();
  state.previewText = previewText;

  let preview: EstimatePreviewResponse & { error?: string };
  try {
    preview = JSON.parse(previewText) as EstimatePreviewResponse & { error?: string };
  } catch (error) {
    throw new Error(`${id}: preview returned non-JSON status ${response.status}: ${previewText}`, { cause: error });
  }

  assert.equal(response.status, 200, `${id}: preview status ${response.status}: ${previewText}`);
  assertPreviewOmitsExactValues(id, previewText, preview, expectedResult);
  return preview;
}

function assertPreviewOmitsExactValues(
  scenarioId: string,
  previewText: string,
  preview: EstimatePreviewResponse,
  expectedResult: ReturnType<typeof calculateSettlement>
) {
  assert.equal('lowEstimate' in preview, false, `${scenarioId}: preview must not expose lowEstimate`);
  assert.equal('midEstimate' in preview, false, `${scenarioId}: preview must not expose midEstimate`);
  assert.equal('highEstimate' in preview, false, `${scenarioId}: preview must not expose highEstimate`);

  for (const value of [expectedResult.lowEstimate, expectedResult.midEstimate, expectedResult.highEstimate]) {
    assert.equal(
      previewText.includes(String(value)),
      false,
      `${scenarioId}: preview must not include exact estimate value ${value}`
    );
  }
}

async function startSmsUnlock(
  scenario: LeadScenario,
  sessionId: string,
  state: ScenarioState,
  id = scenario.id
): Promise<UnlockStartResponse> {
  assert.ok(scenario.unlock.phone, `${id}: SMS unlock scenarios require a phone`);
  const response = await unlockStartPost(jsonRequest('/api/estimate/unlock/start', {
    sessionId,
    phone: scenario.unlock.phone,
    consentToAttorneyShare: scenario.unlock.consent,
    phoneContactConsent: scenario.unlock.consent
  }));
  const payload = await jsonFromResponse<UnlockStartResponse>(response, id, 'unlock start');
  state.unlockStart = payload;
  return payload;
}

async function verifySmsUnlock(
  scenario: LeadScenario,
  sessionId: string,
  state: ScenarioState,
  id = scenario.id
): Promise<UnlockVerifyResponse> {
  const response = await unlockVerifyPost(jsonRequest('/api/estimate/unlock/verify', {
    sessionId,
    code: scenario.unlock.code || OTP_DEV_CODE
  }));
  const payload = await jsonFromResponse<UnlockVerifyResponse>(response, id, 'unlock verify');
  state.unlock = payload;
  return payload;
}

async function unlockEstimateOnly(
  scenario: LeadScenario,
  sessionId: string,
  state: ScenarioState
): Promise<EstimateOnlyUnlockResponse> {
  const response = await estimateOnlyUnlockPost(jsonRequest('/api/estimate/unlock/estimate-only', {
    sessionId
  }));
  const payload = await jsonFromResponse<EstimateOnlyUnlockResponse>(response, scenario.id, 'estimate-only unlock');
  state.unlock = payload;
  return payload;
}

async function seedDuplicatePhone(scenario: LeadScenario, data: InjuryCalculatorData, env: WorkerEnv) {
  const seedState: ScenarioState = {};
  const preview = await preparePreview(scenario, data, env, seedState, `${scenario.id}:seed`);

  assert.equal(preview.unlockMode, 'sms_lead', `${scenario.id}: duplicate seed requires an SMS-capable preview`);
  await startSmsUnlock(scenario, preview.sessionId, seedState, `${scenario.id}:seed`);
  const unlocked = await verifySmsUnlock(scenario, preview.sessionId, seedState, `${scenario.id}:seed`);

  assert.equal(unlocked.leadDeliveryStatus, 'ready_for_delivery', `${scenario.id}: duplicate seed should be deliverable`);
}

async function runScenario(scenario: LeadScenario, state: ScenarioState): Promise<ScenarioState> {
  const data = scenarioData(scenario);
  const env = envFor(scenario, data);
  setCloudflareEnv(env);
  const restoreFetch = installTurnstileFetchStub();

  try {
    if (scenario.seedDuplicatePhone) {
      await seedDuplicatePhone(scenario, data, env);
    }

    const preview = await preparePreview(scenario, data, env, state);
    state.preview = preview;
    state.sessionId = preview.sessionId;

    assert.equal(preview.unlockMode, scenario.expect.preview.unlockMode, `${scenario.id}: preview unlock mode`);
    assert.equal(preview.requiresAttorneyConsent, scenario.expect.preview.requiresAttorneyConsent, `${scenario.id}: preview consent flag`);
    assert.equal(preview.leadDeliveryStatus, scenario.expect.preview.leadDeliveryStatus, `${scenario.id}: preview delivery status`);

    if (scenario.unlock.mode === 'sms_lead') {
      const unlockStart = await startSmsUnlock(scenario, preview.sessionId, state);
      if (typeof scenario.expect.unlockStartDuplicateWithin30Days === 'boolean') {
        assert.equal(
          unlockStart.duplicateWithin30Days,
          scenario.expect.unlockStartDuplicateWithin30Days,
          `${scenario.id}: duplicate flag`
        );
      }

      await verifySmsUnlock(scenario, preview.sessionId, state);
    } else {
      await unlockEstimateOnly(scenario, preview.sessionId, state);
    }

    assert.equal(state.unlock?.leadDeliveryStatus, scenario.expect.deliveryStatus, `${scenario.id}: final delivery status`);

    state.qualification = await getLeadQualification(preview.sessionId, env);
    state.queueItems = await getLeadDeliveryQueueItems(preview.sessionId, env);

    assert.ok(state.qualification, `${scenario.id}: expected a lead qualification row`);
    assert.equal(state.qualification?.qualificationStatus, scenario.expect.qualificationStatus, `${scenario.id}: qualification status`);
    assert.equal(state.qualification?.verificationStatus, scenario.expect.verificationStatus, `${scenario.id}: verification status`);
    assert.equal(state.qualification?.temperature, scenario.expect.temperature, `${scenario.id}: lead temperature`);
    assert.equal(state.queueItems.length, scenario.expect.queueCount, `${scenario.id}: delivery queue count`);

    for (const reason of scenario.expect.reasonsInclude || []) {
      assert.ok(
        state.qualification?.reasons.includes(reason),
        `${scenario.id}: expected qualification reason ${reason}, got ${state.qualification?.reasons.join(', ') || 'none'}`
      );
    }

    assertPayloadExpectations(scenario, state);
    return state;
  } finally {
    restoreFetch();
    clearCloudflareEnv();
  }
}

function assertPayloadExpectations(scenario: LeadScenario, state: ScenarioState) {
  const expectedPayload = scenario.expect.payload;
  if (!expectedPayload) return;

  const queuedPayload = state.queueItems?.[0]?.payload;
  assert.ok(queuedPayload, `${scenario.id}: expected queued payload`);

  if (expectedPayload.maskedPhone) {
    assert.equal(queuedPayload.phoneContact.maskedPhone, expectedPayload.maskedPhone, `${scenario.id}: payload masked phone`);
  }

  if (expectedPayload.encryptedPhoneRefPrefix) {
    assert.ok(
      queuedPayload.phoneContact.encryptedPhoneRef?.startsWith(expectedPayload.encryptedPhoneRefPrefix),
      `${scenario.id}: payload encrypted phone ref prefix`
    );
  }

  if (expectedPayload.attorneyId) {
    assert.equal(queuedPayload.recipient.attorneyId, expectedPayload.attorneyId, `${scenario.id}: payload recipient`);
  }

  if (expectedPayload.omitsDateOfBirth) {
    assert.equal(JSON.stringify(queuedPayload).includes('1990-01-01'), false, `${scenario.id}: payload should omit DOB`);
  }
}

function scenarioFailureMessage(scenario: LeadScenario, state: ScenarioState, error: unknown): string {
  const actual = {
    sessionId: state.sessionId,
    preview: state.preview && {
      unlockMode: state.preview.unlockMode,
      requiresAttorneyConsent: state.preview.requiresAttorneyConsent,
      leadDeliveryStatus: state.preview.leadDeliveryStatus,
      responsibleAttorney: state.preview.responsibleAttorney?.id || null
    },
    unlockStart: state.unlockStart && {
      duplicateWithin30Days: state.unlockStart.duplicateWithin30Days,
      provider: state.unlockStart.provider,
      devCode: state.unlockStart.devCode
    },
    unlock: state.unlock && {
      leadDeliveryStatus: state.unlock.leadDeliveryStatus,
      responsibleAttorney: state.unlock.responsibleAttorney?.id || null
    },
    qualification: state.qualification && {
      qualificationStatus: state.qualification.qualificationStatus,
      verificationStatus: state.qualification.verificationStatus,
      temperature: state.qualification.temperature,
      reasons: state.qualification.reasons
    },
    queueCount: state.queueItems?.length,
    firstQueuePayload: state.queueItems?.[0]?.payload && {
      lead: state.queueItems[0].payload.lead,
      recipient: state.queueItems[0].payload.recipient,
      phoneContact: state.queueItems[0].payload.phoneContact,
      eligibility: state.queueItems[0].payload.eligibility
    }
  };
  const cause = error instanceof Error ? error.stack || error.message : String(error);

  return [
    `Lead scenario failed: ${scenario.id}`,
    scenario.description,
    `Expected: ${JSON.stringify(scenario.expect, null, 2)}`,
    `Actual: ${JSON.stringify(actual, null, 2)}`,
    `Cause: ${cause}`
  ].join('\n');
}

test('lead scenario fixture is not empty', () => {
  assert.ok(leadScenarios.length >= 8);
});

test('JSON lead scenarios replay through local route handlers', async (t) => {
  for (const scenario of leadScenarios) {
    await t.test(scenario.id, async () => {
      const state: ScenarioState = {};

      try {
        await runScenario(scenario, state);
      } catch (error) {
        throw new Error(scenarioFailureMessage(scenario, state, error), { cause: error });
      }
    });
  }
});
