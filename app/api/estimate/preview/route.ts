import { NextRequest, NextResponse } from 'next/server';
import { getCountyRouting } from '@/lib/attorneyRouting';
import { isCaliforniaCounty, normalizeCounty } from '@/lib/californiaCounties';
import { getWorkerEnv } from '@/lib/cloudflareEnv';
import { calculatorAgeFromDemographics, dateOnlyIsInFuture, dateOnlyIsValid } from '@/lib/demographics';
import { normalizeGuidedInjuryData } from '@/lib/guidedInjurySignals';
import { PrivacyChoiceSnapshot } from '@/lib/privacyChoices';
import { calculateSettlement } from '@/lib/settlementEngine';
import {
  createLeadSession,
  encodeLocalSessionCookie,
  FORM_START_COOKIE_NAME,
  FORM_START_MIN_SECONDS,
  formStartElapsedSeconds,
  hashForAudit,
  localSessionCookieName,
  verifyTurnstileToken
} from '@/lib/leadGate';
import { EstimatePreviewResponse, InjuryCalculatorData } from '@/types/calculator';

export const runtime = 'edge';

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

function validateCalculatorData(data: InjuryCalculatorData): string | null {
  if (!data || typeof data !== 'object') return 'Invalid calculator data.';
  if (!data.accidentDetails?.county || !isCaliforniaCounty(data.accidentDetails.county)) {
    return 'Please select the California county where the accident happened.';
  }
  if (!data.demographics || !calculatorAgeFromDemographics(data.demographics)) {
    return 'Please enter a valid date of birth.';
  }
  if (data.impact?.hasWageLoss && (!data.demographics.occupation || !data.demographics.annualIncome)) {
    return 'Please complete occupation and income details for wage loss.';
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

  return {
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
  };
}

export async function POST(request: NextRequest) {
  try {
    const env = getWorkerEnv();
    const body = await request.json() as {
      calculatorData?: InjuryCalculatorData;
      turnstileToken?: string;
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
    const turnstile = await verifyTurnstileToken(body.turnstileToken, ip, env);
    if (!turnstile.ok) {
      return NextResponse.json(
        { error: 'Verification failed. Please refresh and try again.', details: turnstile.errors },
        { status: 400 }
      );
    }

    const county = normalizeCounty(data.accidentDetails.county);
    const geo = requestGeo(request);
    const routing = await getCountyRouting(county, env);
    const elapsedSeconds = await formStartElapsedSeconds(
      request.cookies.get(FORM_START_COOKIE_NAME)?.value,
      env
    );
    const estimateOnlyStatus = estimateOnlyReason(
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
    const session = await createLeadSession({
      county,
      logicVersion: result.logicVersion,
      logicHash: result.logicHash,
      routingVersion: routing.routingVersion,
      turnstileStatus: turnstile.status,
      input: data,
      result,
      preview,
      attorney: responsibleAttorney,
      initialLeadDeliveryStatus: isSmsLead ? 'preview_attorney_available' : estimateOnlyStatus || undefined,
      ipHash: await hashForAudit(ip, env),
      userAgentHash: await hashForAudit(userAgent(request), env),
      privacyChoiceSnapshot: body.privacyChoiceSnapshot,
      visitorCountry: geo.country,
      visitorRegionCode: geo.regionCode,
      visitorRegion: geo.region,
      visitorCity: geo.city,
      geoEligibilityStatus: geo.geoEligibilityStatus
    }, env);

    const response: EstimatePreviewResponse = {
      sessionId: session.id,
      expiresAt: session.expiresAt,
      county,
      severityBand: result.severityBand,
      caseTier: result.caseTier,
      blurredRangeLabel: preview.blurredRangeLabel,
      summary: preview.summary,
      logicVersion: result.logicVersion,
      logicHash: result.logicHash,
      routingVersion: routing.routingVersion,
      responsibleAttorney,
      requiresAttorneyConsent: isSmsLead,
      unlockMode: isSmsLead ? 'sms_lead' : 'estimate_only',
      leadDeliveryStatus: session.leadDeliveryStatus
    };

    const nextResponse = NextResponse.json(response);
    if (!env.LEADS_DB) {
      nextResponse.cookies.set(localSessionCookieName(session.id), encodeLocalSessionCookie(session), {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
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
