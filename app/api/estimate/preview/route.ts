import { NextRequest, NextResponse } from 'next/server';
import { getCountyRouting } from '@/lib/attorneyRouting';
import { isCaliforniaCounty, normalizeCounty } from '@/lib/californiaCounties';
import { getWorkerEnv, isProductionRuntime, type WorkerEnv } from '@/lib/cloudflareEnv';
import { calculatorAgeFromDemographics, dateOnlyIsInFuture, dateOnlyIsValid } from '@/lib/demographics';
import { normalizeGuidedInjuryData } from '@/lib/guidedInjurySignals';
import { PrivacyChoiceSnapshot } from '@/lib/privacyChoices';
import { calculateSettlement } from '@/lib/settlementEngine';
import { applyWageLossDefaults } from '@/lib/wageLossDefaults';
import { EstimatePreviewResponse, InjuryCalculatorData } from '@/types/calculator';

export const runtime = 'edge';

type LeadGateModule = typeof import('@/lib/leadGate');
type CreateLeadSessionInput = Parameters<LeadGateModule['createLeadSession']>[0];

const LEAD_INFRASTRUCTURE_UNAVAILABLE_STATUS = 'lead_infrastructure_unavailable_no_delivery';
const AUDIT_HASH_UNAVAILABLE = 'unavailable';
const FORM_START_MIN_SECONDS = 120;

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function clientIp(request: NextRequest): string {
  return request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';
}

function userAgent(request: NextRequest): string {
  return request.headers.get('user-agent') || 'unknown';
}

function requestGeo(request: NextRequest) {
  const country = request.headers.get('x-injury-geo-country') ||
    request.headers.get('cf-ipcountry') ||
    request.headers.get('x-vercel-ip-country') ||
    null;
  const regionCode = request.headers.get('x-injury-geo-region-code') ||
    request.headers.get('cf-region-code') ||
    request.headers.get('x-vercel-ip-country-region') ||
    null;
  const region = request.headers.get('x-injury-geo-region') ||
    request.headers.get('cf-region') ||
    null;
  const city = request.headers.get('x-injury-geo-city') ||
    request.headers.get('cf-ipcity') ||
    request.headers.get('x-vercel-ip-city') ||
    null;
  const geoEligibilityStatus = request.headers.get('x-injury-geo-eligibility') ||
    deriveGeoEligibility(country, regionCode, region);

  return {
    country,
    regionCode,
    region,
    city,
    geoEligibilityStatus
  };
}

function deriveGeoEligibility(country: string | null, regionCode: string | null, region: string | null): string {
  const normalizedCountry = (country || '').trim().toUpperCase();
  const normalizedRegionCode = (regionCode || '').trim().toUpperCase();
  const normalizedRegion = (region || '').trim().toLowerCase();

  if (normalizedCountry === 'US' && (normalizedRegionCode === 'CA' || normalizedRegion === 'california')) {
    return 'california';
  }

  if (normalizedCountry === 'US') return 'outside_california';
  if (normalizedCountry) return 'outside_us';
  return 'unknown';
}

function noDeliveryStatusForGeoEligibility(geoEligibilityStatus: string): string | null {
  if (geoEligibilityStatus === 'california') return null;
  if (geoEligibilityStatus === 'outside_california') return 'outside_california_no_delivery';
  if (geoEligibilityStatus === 'outside_us') return 'outside_us_no_delivery';
  return 'unknown_location_no_delivery';
}

function estimateOnlyReason(data: InjuryCalculatorData, attorneyAvailable: boolean, geoEligibilityStatus: string, elapsedSeconds: number | null) {
  if (data.insurance?.hasAttorney) return 'own_attorney_no_delivery';
  if (!attorneyAvailable) return 'unmapped_no_attorney_delivery';

  const geoStatus = noDeliveryStatusForGeoEligibility(geoEligibilityStatus);
  if (geoStatus) return geoStatus;

  if (elapsedSeconds === null || elapsedSeconds < FORM_START_MIN_SECONDS) return 'too_fast_no_delivery';

  return null;
}

function leadInfrastructureNoDeliveryStatus(env: WorkerEnv): string | null {
  if (!isProductionRuntime(env)) return null;

  const smsProvider = env.SMS_PROVIDER || 'dev_stub';
  const expectsTwilioVerify = smsProvider === 'twilio' || smsProvider === 'twilio_verify';
  const twilioVerifyReady = Boolean(
    env.TWILIO_ACCOUNT_SID &&
    env.TWILIO_AUTH_TOKEN &&
    env.TWILIO_VERIFY_SERVICE_SID
  );

  if (!env.LEADS_DB) return LEAD_INFRASTRUCTURE_UNAVAILABLE_STATUS;
  if (!env.LEAD_HASH_SALT) return LEAD_INFRASTRUCTURE_UNAVAILABLE_STATUS;
  if (!env.LEAD_ENCRYPTION_KEY) return LEAD_INFRASTRUCTURE_UNAVAILABLE_STATUS;
  if (expectsTwilioVerify && !twilioVerifyReady) return LEAD_INFRASTRUCTURE_UNAVAILABLE_STATUS;

  return null;
}

function validateCalculatorData(data: InjuryCalculatorData): string | null {
  if (!data || typeof data !== 'object') return 'Invalid calculator data.';
  if (!data.accidentDetails?.county || !isCaliforniaCounty(data.accidentDetails.county)) {
    return 'Please select the California county where the accident happened.';
  }
  if (!data.demographics || !calculatorAgeFromDemographics(data.demographics)) {
    return 'Please enter a valid date of birth.';
  }
  if (!data.accidentDetails?.dateOfAccident || !data.accidentDetails?.impactSeverity) {
    return 'Please complete the required accident details.';
  }
  if (!dateOnlyIsValid(data.accidentDetails.dateOfAccident)) {
    return 'Please enter a valid Date of Loss.';
  }
  if (dateOnlyIsInFuture(data.accidentDetails.dateOfAccident)) {
    return 'Date of Loss cannot be in the future.';
  }
  if (!data.injuries?.bodyMap?.length || !data.injuries?.primaryInjury) {
    return 'Please tap at least one injury area.';
  }
  return null;
}

function prepareCalculatorDataForEstimate(data: InjuryCalculatorData): InjuryCalculatorData {
  const demographics: InjuryCalculatorData['demographics'] = data.demographics || {
    age: 0,
    dateOfBirth: '',
    occupation: '',
    annualIncome: ''
  };
  const accidentDetails: InjuryCalculatorData['accidentDetails'] = data.accidentDetails || {
    dateOfAccident: '',
    county: '',
    faultPercentage: 0,
    priorAccidents: 0,
    impactSeverity: ''
  };
  const impact: InjuryCalculatorData['impact'] = data.impact || {
    hasWageLoss: false,
    missedWorkDays: 0,
    lossOfConsortium: false,
    emotionalDistress: false,
    dylanVLeggClaim: false,
    permanentImpairment: false
  };
  const insurance: InjuryCalculatorData['insurance'] = data.insurance || {
    policyLimitsKnown: false,
    hasAttorney: false
  };

  return applyWageLossDefaults({
    ...data,
    demographics: {
      ...demographics,
      age: calculatorAgeFromDemographics(demographics)
    },
    accidentDetails: {
      ...accidentDetails,
      priorAccidents: 0
    },
    impact: {
      ...impact,
      missedWorkDays: 0,
      impairmentRating: undefined
    },
    insurance: {
      ...insurance,
      policyLimitsKnown: false,
      policyLimits: undefined,
      attorneyContingency: undefined
    }
  });
}

async function hashForAuditOrUnavailable(
  value: string,
  env: WorkerEnv,
  hashForAudit: LeadGateModule['hashForAudit'],
  label: string
): Promise<string> {
  try {
    return await hashForAudit(value, env);
  } catch (error) {
    console.info(`Estimate preview ${label} hash unavailable: ${errorMessage(error)}`);
    return AUDIT_HASH_UNAVAILABLE;
  }
}

async function createLeadSessionWithFallback(
  input: CreateLeadSessionInput,
  env: WorkerEnv,
  createLeadSession: LeadGateModule['createLeadSession']
) {
  try {
    return {
      session: await createLeadSession(input, env),
      sessionEnv: env,
      usedFallback: false
    };
  } catch (error) {
    console.error(`Estimate preview lead session persistence unavailable: ${errorMessage(error)}`);
    const fallbackEnv = {
      ...env,
      LEADS_DB: undefined
    };

    return {
      session: await createLeadSession({
        ...input,
        attorney: null,
        initialLeadDeliveryStatus: LEAD_INFRASTRUCTURE_UNAVAILABLE_STATUS
      }, fallbackEnv),
      sessionEnv: fallbackEnv,
      usedFallback: true
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const env = getWorkerEnv();
    const leadGate = await import('@/lib/leadGate');
    const body = await request.json() as {
      calculatorData?: InjuryCalculatorData;
      privacyChoiceSnapshot?: PrivacyChoiceSnapshot;
    };
    const data = body.calculatorData
      ? prepareCalculatorDataForEstimate(normalizeGuidedInjuryData(body.calculatorData))
      : undefined;

    if (!data) {
      return NextResponse.json({ error: 'Missing calculator data.' }, { status: 400 });
    }

    const validationError = validateCalculatorData(data);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const ip = clientIp(request);
    const turnstileStatus = 'disabled';

    const county = normalizeCounty(data.accidentDetails.county);
    const geo = requestGeo(request);
    const routing = await getCountyRouting(county, env);
    const infrastructureStatus = routing.responsibleAttorney ? leadInfrastructureNoDeliveryStatus(env) : null;
    const elapsedSeconds = await leadGate.formStartElapsedSeconds(
      request.cookies.get(leadGate.FORM_START_COOKIE_NAME)?.value,
      env
    );
    const estimateOnlyStatus = infrastructureStatus || estimateOnlyReason(
      data,
      Boolean(routing.responsibleAttorney),
      geo.geoEligibilityStatus,
      elapsedSeconds
    );
    const isSmsLead = !estimateOnlyStatus;
    const responsibleAttorney = isSmsLead ? routing.responsibleAttorney : null;
    const result = calculateSettlement({
      ...data,
      accidentDetails: {
        ...data.accidentDetails,
        county
      }
    });
    const preview = {
      severityBand: result.severityBand,
      caseTier: result.caseTier,
      blurredRangeLabel: '$••,••• - $•••,•••',
      summary: isSmsLead
        ? 'Your settlement estimate is ready. Verify your phone to unlock the full range.'
        : 'Your settlement estimate is ready to unlock.'
    };
    const leadSessionInput: CreateLeadSessionInput = {
      county,
      logicVersion: result.logicVersion,
      logicHash: result.logicHash,
      routingVersion: routing.routingVersion,
      turnstileStatus,
      input: data,
      result,
      preview,
      attorney: responsibleAttorney,
      initialLeadDeliveryStatus: isSmsLead ? 'preview_attorney_available' : estimateOnlyStatus || undefined,
      ipHash: await hashForAuditOrUnavailable(ip, env, leadGate.hashForAudit, 'IP'),
      userAgentHash: await hashForAuditOrUnavailable(userAgent(request), env, leadGate.hashForAudit, 'user-agent'),
      privacyChoiceSnapshot: body.privacyChoiceSnapshot,
      visitorCountry: geo.country,
      visitorRegionCode: geo.regionCode,
      visitorRegion: geo.region,
      visitorCity: geo.city,
      geoEligibilityStatus: geo.geoEligibilityStatus
    };
    const { session, sessionEnv, usedFallback } = await createLeadSessionWithFallback(
      leadSessionInput,
      env,
      leadGate.createLeadSession
    );
    const effectiveUnlockMode = usedFallback ? 'estimate_only' : (isSmsLead ? 'sms_lead' : 'estimate_only');
    const effectiveResponsibleAttorney = usedFallback ? null : responsibleAttorney;
    const effectiveLeadDeliveryStatus = usedFallback
      ? LEAD_INFRASTRUCTURE_UNAVAILABLE_STATUS
      : session.leadDeliveryStatus;
    const effectiveSummary = effectiveUnlockMode === 'sms_lead'
      ? preview.summary
      : 'Your settlement estimate is ready to unlock.';

    const response: EstimatePreviewResponse = {
      sessionId: session.id,
      expiresAt: session.expiresAt,
      county,
      severityBand: result.severityBand,
      caseTier: result.caseTier,
      blurredRangeLabel: preview.blurredRangeLabel,
      summary: effectiveSummary,
      logicVersion: result.logicVersion,
      logicHash: result.logicHash,
      routingVersion: routing.routingVersion,
      responsibleAttorney: effectiveResponsibleAttorney,
      requiresAttorneyConsent: effectiveUnlockMode === 'sms_lead',
      unlockMode: effectiveUnlockMode,
      leadDeliveryStatus: effectiveLeadDeliveryStatus
    };

    const nextResponse = NextResponse.json(response);
    if (!sessionEnv.LEADS_DB) {
      nextResponse.cookies.set(leadGate.localSessionCookieName(session.id), leadGate.encodeLocalSessionCookie(session), {
        httpOnly: true,
        sameSite: 'lax',
        secure: isProductionRuntime(sessionEnv),
        path: '/',
        maxAge: 30 * 60
      });
    }

    return nextResponse;
  } catch (error) {
    console.error('Estimate preview error:', error);
    return NextResponse.json({ error: 'Unable to prepare the estimate preview.' }, { status: 500 });
  }
}
