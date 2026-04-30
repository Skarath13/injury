import { WorkerEnv, getWorkerEnv } from '@/lib/cloudflareEnv';
import type { LeadSession } from '@/lib/leadGate';
import {
  InjuryCalculatorData,
  LeadDeliveryPayload,
  ResponsibleAttorney,
  SettlementResult
} from '@/types/calculator';

export const LEAD_QUALIFICATION_RULE_VERSION = 'lead-qualification-2026-04-30-v1';
export const LEAD_DELIVERY_PAYLOAD_SCHEMA_VERSION = 'lead-delivery-2026-04-30-v1';

export type LeadQualificationStatus = 'candidate' | 'valid' | 'invalid' | 'no_sale' | 'needs_review';
export type LeadVerificationStatus = 'unverified' | 'verified';
export type LeadTemperature = 'hot' | 'warm' | 'cold' | 'not_lead';

export interface LeadQualification {
  sessionId: string;
  createdAt: string;
  updatedAt: string;
  qualificationStatus: LeadQualificationStatus;
  verificationStatus: LeadVerificationStatus;
  temperature: LeadTemperature;
  score: number;
  reasons: string[];
  ruleVersion: string;
  qualifiedAt: string | null;
  overrideStatus: LeadQualificationStatus | null;
  overrideTemperature: LeadTemperature | null;
  overrideReason: string | null;
  overrideBy: string | null;
  overrideAt: string | null;
}

export interface LeadDeliveryQueueItem {
  id: string;
  sessionId: string;
  recipientId: string;
  createdAt: string;
  updatedAt: string;
  status: 'queued' | 'blocked' | 'sent' | 'failed' | 'cancelled';
  payloadSchemaVersion: string;
  payload: LeadDeliveryPayload;
  blockedReason: string | null;
  attempts: number;
}

interface LeadQualificationRow {
  session_id: string;
  created_at: string;
  updated_at: string;
  qualification_status: LeadQualificationStatus;
  verification_status: LeadVerificationStatus;
  temperature: LeadTemperature;
  score: number;
  reasons_json: string;
  rule_version: string;
  qualified_at: string | null;
  override_status: LeadQualificationStatus | null;
  override_temperature: LeadTemperature | null;
  override_reason: string | null;
  override_by: string | null;
  override_at: string | null;
}

interface LeadDeliveryQueueRow {
  id: string;
  session_id: string;
  recipient_id: string;
  created_at: string;
  updated_at: string;
  status: 'queued' | 'blocked' | 'sent' | 'failed' | 'cancelled';
  payload_schema_version: string;
  payload_json: string;
  blocked_reason: string | null;
  attempts: number;
}

const memoryLeadDelivery = globalThis as typeof globalThis & {
  __injuryLeadQualifications?: Map<string, LeadQualification>;
  __injuryLeadQualificationEvents?: Array<{
    id: string;
    sessionId: string;
    createdAt: string;
    eventType: string;
    actor: string;
    fromStatus: string | null;
    toStatus: string;
    fromTemperature: string | null;
    toTemperature: string;
    reasons: string[];
    metadata: unknown;
  }>;
  __injuryLeadDeliveryRecipients?: Map<string, {
    id: string;
    createdAt: string;
    updatedAt: string;
    active: boolean;
    attorneyId: string | null;
    displayName: string;
    contactEmail: string | null;
    deliveryChannel: string;
    metadataJson: string | null;
  }>;
  __injuryLeadDeliveryQueue?: LeadDeliveryQueueItem[];
};

let d1LeadDeliverySchemaReady = false;

function nowIso(): string {
  return new Date().toISOString();
}

function memoryQualifications(): Map<string, LeadQualification> {
  if (!memoryLeadDelivery.__injuryLeadQualifications) {
    memoryLeadDelivery.__injuryLeadQualifications = new Map();
  }
  return memoryLeadDelivery.__injuryLeadQualifications;
}

function memoryEvents() {
  if (!memoryLeadDelivery.__injuryLeadQualificationEvents) {
    memoryLeadDelivery.__injuryLeadQualificationEvents = [];
  }
  return memoryLeadDelivery.__injuryLeadQualificationEvents;
}

function memoryRecipients() {
  if (!memoryLeadDelivery.__injuryLeadDeliveryRecipients) {
    memoryLeadDelivery.__injuryLeadDeliveryRecipients = new Map();
  }
  return memoryLeadDelivery.__injuryLeadDeliveryRecipients;
}

function memoryQueue(): LeadDeliveryQueueItem[] {
  if (!memoryLeadDelivery.__injuryLeadDeliveryQueue) {
    memoryLeadDelivery.__injuryLeadDeliveryQueue = [];
  }
  return memoryLeadDelivery.__injuryLeadDeliveryQueue;
}

function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function qualificationFromRow(row: LeadQualificationRow): LeadQualification {
  return {
    sessionId: row.session_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    qualificationStatus: row.qualification_status,
    verificationStatus: row.verification_status,
    temperature: row.temperature,
    score: row.score,
    reasons: parseJson<string[]>(row.reasons_json, []),
    ruleVersion: row.rule_version,
    qualifiedAt: row.qualified_at,
    overrideStatus: row.override_status,
    overrideTemperature: row.override_temperature,
    overrideReason: row.override_reason,
    overrideBy: row.override_by,
    overrideAt: row.override_at
  };
}

function queueItemFromRow(row: LeadDeliveryQueueRow): LeadDeliveryQueueItem {
  return {
    id: row.id,
    sessionId: row.session_id,
    recipientId: row.recipient_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    status: row.status,
    payloadSchemaVersion: row.payload_schema_version,
    payload: parseJson<LeadDeliveryPayload>(row.payload_json, {} as LeadDeliveryPayload),
    blockedReason: row.blocked_reason,
    attempts: row.attempts
  };
}

async function ensureLeadDeliverySchema(env: WorkerEnv): Promise<void> {
  if (!env.LEADS_DB || d1LeadDeliverySchemaReady) return;

  await env.LEADS_DB.prepare(`
    CREATE TABLE IF NOT EXISTS lead_qualifications (
      session_id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      qualification_status TEXT NOT NULL CHECK (qualification_status IN ('candidate', 'valid', 'invalid', 'no_sale', 'needs_review')),
      verification_status TEXT NOT NULL CHECK (verification_status IN ('unverified', 'verified')),
      temperature TEXT NOT NULL CHECK (temperature IN ('hot', 'warm', 'cold', 'not_lead')),
      score INTEGER NOT NULL DEFAULT 0 CHECK (score >= 0 AND score <= 100),
      reasons_json TEXT NOT NULL,
      rule_version TEXT NOT NULL,
      qualified_at TEXT,
      override_status TEXT CHECK (override_status IS NULL OR override_status IN ('candidate', 'valid', 'invalid', 'no_sale', 'needs_review')),
      override_temperature TEXT CHECK (override_temperature IS NULL OR override_temperature IN ('hot', 'warm', 'cold', 'not_lead')),
      override_reason TEXT,
      override_by TEXT,
      override_at TEXT
    )
  `).run();
  await env.LEADS_DB.prepare('CREATE INDEX IF NOT EXISTS idx_lead_qualifications_status_updated ON lead_qualifications (qualification_status, verification_status, temperature, updated_at)').run();
  await env.LEADS_DB.prepare(`
    CREATE TABLE IF NOT EXISTS lead_qualification_events (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      event_type TEXT NOT NULL,
      actor TEXT NOT NULL,
      from_status TEXT,
      to_status TEXT NOT NULL,
      from_temperature TEXT,
      to_temperature TEXT NOT NULL,
      reasons_json TEXT NOT NULL,
      metadata_json TEXT
    )
  `).run();
  await env.LEADS_DB.prepare('CREATE INDEX IF NOT EXISTS idx_lead_qualification_events_session_created ON lead_qualification_events (session_id, created_at)').run();
  await env.LEADS_DB.prepare(`
    CREATE TABLE IF NOT EXISTS lead_delivery_recipients (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      attorney_id TEXT,
      display_name TEXT NOT NULL,
      contact_email TEXT,
      delivery_channel TEXT NOT NULL DEFAULT 'queue',
      county_scope_json TEXT,
      metadata_json TEXT
    )
  `).run();
  await env.LEADS_DB.prepare('CREATE UNIQUE INDEX IF NOT EXISTS idx_lead_delivery_recipients_attorney ON lead_delivery_recipients (attorney_id) WHERE attorney_id IS NOT NULL').run();
  await env.LEADS_DB.prepare(`
    CREATE TABLE IF NOT EXISTS lead_delivery_queue (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      recipient_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('queued', 'blocked', 'sent', 'failed', 'cancelled')),
      payload_schema_version TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      blocked_reason TEXT,
      attempts INTEGER NOT NULL DEFAULT 0,
      last_attempt_at TEXT,
      sent_at TEXT,
      failed_at TEXT,
      cancelled_at TEXT
    )
  `).run();
  await env.LEADS_DB.prepare('CREATE UNIQUE INDEX IF NOT EXISTS idx_lead_delivery_queue_session_recipient ON lead_delivery_queue (session_id, recipient_id)').run();
  await env.LEADS_DB.prepare('CREATE INDEX IF NOT EXISTS idx_lead_delivery_queue_status_created ON lead_delivery_queue (status, created_at)').run();
  await env.LEADS_DB.prepare(`
    CREATE TRIGGER IF NOT EXISTS trg_lead_delivery_queue_guard
    BEFORE INSERT ON lead_delivery_queue
    WHEN NEW.status = 'queued'
      AND NOT EXISTS (
        SELECT 1
        FROM lead_sessions AS s
        INNER JOIN lead_qualifications AS q ON q.session_id = s.id
        INNER JOIN lead_delivery_recipients AS r ON r.id = NEW.recipient_id
        WHERE s.id = NEW.session_id
          AND s.attorney_delivery_consent = 1
          AND s.phone_contact_consent = 1
          AND s.geo_eligibility_status = 'california'
          AND s.otp_status = 'verified'
          AND s.duplicate_within_30_days = 0
          AND s.lead_delivery_status = 'ready_for_delivery'
          AND s.attorney_id IS NOT NULL
          AND q.qualification_status = 'valid'
          AND q.verification_status = 'verified'
          AND r.active = 1
      )
    BEGIN
      SELECT RAISE(ABORT, 'lead_delivery_queue_guard_failed');
    END
  `).run();

  d1LeadDeliverySchemaReady = true;
}

function hasAdvancedTreatment(input: Partial<InjuryCalculatorData>): boolean {
  const treatment = input.treatment;
  if (!treatment) return false;

  return Boolean(
    treatment.surgeryCompleted ||
    treatment.surgeryRecommended ||
    Number(treatment.hospitalAdmissionDays || 0) > 0 ||
    Number(treatment.esiInjections || 0) > 0 ||
    Number(treatment.facetInjections || 0) > 0 ||
    Number(treatment.mbbInjections || 0) > 0 ||
    Number(treatment.rfaInjections || 0) > 0 ||
    Number(treatment.prpInjections || 0) > 0
  );
}

function leadTemperature(
  qualificationStatus: LeadQualificationStatus,
  result: SettlementResult | null,
  input: Partial<InjuryCalculatorData>
): { temperature: LeadTemperature; score: number } {
  if (qualificationStatus !== 'valid' || !result) {
    return { temperature: 'not_lead', score: 0 };
  }

  if (result.severityBand === 'high' || result.severityBand === 'severe' || hasAdvancedTreatment(input)) {
    return { temperature: 'hot', score: 90 };
  }

  if (result.severityBand === 'moderate' || result.severityBand === 'elevated') {
    return { temperature: 'warm', score: 70 };
  }

  return { temperature: 'cold', score: 50 };
}

function isNoDeliveryStatus(status: string): boolean {
  return status.endsWith('_no_delivery') ||
    status === 'unmapped_no_attorney_delivery' ||
    status === 'duplicate_30d_no_charge' ||
    status === 'too_fast_no_delivery';
}

export function qualifyLeadSession(session: LeadSession, at = nowIso()): LeadQualification {
  const input = parseJson<Partial<InjuryCalculatorData>>(session.inputJson, {});
  const result = parseJson<SettlementResult | null>(session.resultJson, null);
  const attorney = parseJson<ResponsibleAttorney | null>(session.attorneyJson, null);
  const reasons = new Set<string>();
  const hasExistingAttorney = input.insurance?.hasAttorney === true;
  const hasActiveRecipient = Boolean(attorney && session.attorneyId);
  const consented = session.attorneyDeliveryConsent && session.phoneContactConsent;
  const geoEligible = session.geoEligibilityStatus === 'california';
  const turnstileVerified = session.turnstileStatus === 'verified';
  const otpVerified = session.otpStatus === 'verified';
  const duplicate = session.duplicateWithin30Days || session.leadDeliveryStatus === 'duplicate_30d_no_charge';
  const readyForDelivery = session.leadDeliveryStatus === 'ready_for_delivery';
  const inProgress = session.leadDeliveryStatus === 'preview_attorney_available' ||
    session.otpStatus === 'pending_send' ||
    session.otpStatus === 'sent' ||
    session.otpStatus === 'failed';

  if (hasExistingAttorney) reasons.add('existing_or_planned_attorney');
  if (!hasActiveRecipient) reasons.add('missing_active_recipient');
  if (!consented) reasons.add('consent_missing');
  if (!session.attorneyDeliveryConsent) reasons.add('attorney_delivery_consent_missing');
  if (!session.phoneContactConsent) reasons.add('phone_contact_consent_missing');
  if (!geoEligible) reasons.add(`geo_${session.geoEligibilityStatus || 'unknown'}`);
  if (!turnstileVerified) reasons.add(`turnstile_${session.turnstileStatus || 'unknown'}`);
  if (!otpVerified) reasons.add(`otp_${session.otpStatus || 'unknown'}`);
  if (duplicate) reasons.add('duplicate_30d_no_charge');
  if (!session.phoneHash && consented) reasons.add('phone_hash_missing');
  if (isNoDeliveryStatus(session.leadDeliveryStatus)) reasons.add(session.leadDeliveryStatus);

  const valid = readyForDelivery &&
    !hasExistingAttorney &&
    hasActiveRecipient &&
    consented &&
    geoEligible &&
    turnstileVerified &&
    otpVerified &&
    !duplicate &&
    Boolean(session.phoneHash);

  let qualificationStatus: LeadQualificationStatus;
  if (valid) {
    qualificationStatus = 'valid';
    reasons.add('qualified_for_delivery_queue');
  } else if (session.turnstileStatus.startsWith('failed')) {
    qualificationStatus = 'invalid';
  } else if (inProgress && !isNoDeliveryStatus(session.leadDeliveryStatus)) {
    qualificationStatus = 'candidate';
  } else {
    qualificationStatus = 'no_sale';
  }

  const { temperature, score } = leadTemperature(qualificationStatus, result, input);

  return {
    sessionId: session.id,
    createdAt: at,
    updatedAt: at,
    qualificationStatus,
    verificationStatus: otpVerified ? 'verified' : 'unverified',
    temperature,
    score,
    reasons: [...reasons].sort(),
    ruleVersion: LEAD_QUALIFICATION_RULE_VERSION,
    qualifiedAt: qualificationStatus === 'valid' ? at : null,
    overrideStatus: null,
    overrideTemperature: null,
    overrideReason: null,
    overrideBy: null,
    overrideAt: null
  };
}

export async function getLeadQualification(
  sessionId: string,
  env: WorkerEnv = getWorkerEnv()
): Promise<LeadQualification | null> {
  if (env.LEADS_DB) {
    await ensureLeadDeliverySchema(env);
    const row = await env.LEADS_DB.prepare('SELECT * FROM lead_qualifications WHERE session_id = ?')
      .bind(sessionId)
      .first<LeadQualificationRow>();
    return row ? qualificationFromRow(row) : null;
  }

  return memoryQualifications().get(sessionId) || null;
}

async function writeQualificationEvent(
  previous: LeadQualification | null,
  next: LeadQualification,
  env: WorkerEnv,
  metadata?: unknown
): Promise<void> {
  const event = {
    id: crypto.randomUUID(),
    sessionId: next.sessionId,
    createdAt: next.updatedAt,
    eventType: previous ? 'qualification_updated' : 'qualification_created',
    actor: 'system',
    fromStatus: previous?.qualificationStatus || null,
    toStatus: next.qualificationStatus,
    fromTemperature: previous?.temperature || null,
    toTemperature: next.temperature,
    reasons: next.reasons,
    metadata: metadata || null
  };

  if (env.LEADS_DB) {
    await ensureLeadDeliverySchema(env);
    await env.LEADS_DB.prepare(`
      INSERT INTO lead_qualification_events (
        id, session_id, created_at, event_type, actor, from_status, to_status,
        from_temperature, to_temperature, reasons_json, metadata_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      event.id,
      event.sessionId,
      event.createdAt,
      event.eventType,
      event.actor,
      event.fromStatus,
      event.toStatus,
      event.fromTemperature,
      event.toTemperature,
      JSON.stringify(event.reasons),
      JSON.stringify(event.metadata)
    ).run();
  } else {
    memoryEvents().push(event);
  }
}

function qualificationChanged(previous: LeadQualification | null, next: LeadQualification): boolean {
  if (!previous) return true;
  return previous.qualificationStatus !== next.qualificationStatus ||
    previous.verificationStatus !== next.verificationStatus ||
    previous.temperature !== next.temperature ||
    previous.score !== next.score ||
    JSON.stringify(previous.reasons) !== JSON.stringify(next.reasons);
}

export async function recordLeadQualification(
  session: LeadSession,
  env: WorkerEnv = getWorkerEnv(),
  metadata?: unknown
): Promise<LeadQualification> {
  const previous = await getLeadQualification(session.id, env);
  const createdAt = previous?.createdAt || nowIso();
  const next = {
    ...qualifyLeadSession(session, nowIso()),
    createdAt,
    overrideStatus: previous?.overrideStatus || null,
    overrideTemperature: previous?.overrideTemperature || null,
    overrideReason: previous?.overrideReason || null,
    overrideBy: previous?.overrideBy || null,
    overrideAt: previous?.overrideAt || null
  };

  if (env.LEADS_DB) {
    await ensureLeadDeliverySchema(env);
    await env.LEADS_DB.prepare(`
      INSERT INTO lead_qualifications (
        session_id, created_at, updated_at, qualification_status, verification_status,
        temperature, score, reasons_json, rule_version, qualified_at,
        override_status, override_temperature, override_reason, override_by, override_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(session_id) DO UPDATE SET
        updated_at = excluded.updated_at,
        qualification_status = excluded.qualification_status,
        verification_status = excluded.verification_status,
        temperature = excluded.temperature,
        score = excluded.score,
        reasons_json = excluded.reasons_json,
        rule_version = excluded.rule_version,
        qualified_at = excluded.qualified_at,
        override_status = excluded.override_status,
        override_temperature = excluded.override_temperature,
        override_reason = excluded.override_reason,
        override_by = excluded.override_by,
        override_at = excluded.override_at
    `).bind(
      next.sessionId,
      next.createdAt,
      next.updatedAt,
      next.qualificationStatus,
      next.verificationStatus,
      next.temperature,
      next.score,
      JSON.stringify(next.reasons),
      next.ruleVersion,
      next.qualifiedAt,
      next.overrideStatus,
      next.overrideTemperature,
      next.overrideReason,
      next.overrideBy,
      next.overrideAt
    ).run();
  } else {
    memoryQualifications().set(session.id, next);
  }

  if (qualificationChanged(previous, next)) {
    await writeQualificationEvent(previous, next, env, metadata);
  }

  return next;
}

function recipientIdForAttorney(attorney: ResponsibleAttorney): string {
  return `attorney:${attorney.id}`;
}

async function upsertLeadDeliveryRecipient(
  attorney: ResponsibleAttorney,
  env: WorkerEnv
): Promise<string> {
  const now = nowIso();
  const id = recipientIdForAttorney(attorney);
  const metadataJson = JSON.stringify({
    barNumber: attorney.barNumber,
    officeLocation: attorney.officeLocation,
    disclosure: attorney.disclosure,
    consentCopyVersion: attorney.consentCopyVersion
  });

  if (env.LEADS_DB) {
    await ensureLeadDeliverySchema(env);
    const existing = await env.LEADS_DB.prepare('SELECT id FROM lead_delivery_recipients WHERE attorney_id = ? LIMIT 1')
      .bind(attorney.id)
      .first<{ id: string }>();

    if (existing) {
      await env.LEADS_DB.prepare(`
        UPDATE lead_delivery_recipients
        SET updated_at = ?, active = 1, display_name = ?, metadata_json = ?
        WHERE id = ?
      `).bind(now, attorney.name, metadataJson, existing.id).run();
      return existing.id;
    }

    await env.LEADS_DB.prepare(`
      INSERT INTO lead_delivery_recipients (
        id, created_at, updated_at, active, attorney_id, display_name,
        contact_email, delivery_channel, county_scope_json, metadata_json
      ) VALUES (?, ?, ?, 1, ?, ?, NULL, 'queue', NULL, ?)
    `).bind(id, now, now, attorney.id, attorney.name, metadataJson).run();
  } else {
    const existing = memoryRecipients().get(id);
    memoryRecipients().set(id, {
      id,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
      active: true,
      attorneyId: attorney.id,
      displayName: attorney.name,
      contactEmail: null,
      deliveryChannel: 'queue',
      metadataJson
    });
  }

  return id;
}

function humanMoney(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(value);
}

function inputAge(input: Partial<InjuryCalculatorData>): number | null {
  const age = Number(input.demographics?.age);
  return Number.isFinite(age) && age > 0 ? age : null;
}

function injurySummary(input: Partial<InjuryCalculatorData>): string[] {
  const injuries = input.injuries;
  if (!injuries) return [];

  const parts = [
    injuries.primaryInjury ? `Primary injury: ${injuries.primaryInjury}` : null,
    ...(injuries.bodyMap || []).map((area) => `${area.label} severity ${area.severity}`),
    ...(injuries.secondaryInjuries || []).map((injury) => `Secondary injury: ${injury}`)
  ].filter(Boolean) as string[];

  return parts.length ? parts : ['No injury summary provided.'];
}

function treatmentSummary(input: Partial<InjuryCalculatorData>): string[] {
  const treatment = input.treatment;
  if (!treatment) return [];

  const entries = [
    ['Ambulance transports', treatment.ambulanceTransports],
    ['Emergency room visits', treatment.emergencyRoomVisits],
    ['Urgent care visits', treatment.urgentCareVisits],
    ['Hospital admission days', treatment.hospitalAdmissionDays],
    ['Physical therapy sessions', treatment.physicalTherapySessions],
    ['Chiropractic sessions', treatment.chiropracticSessions],
    ['MRIs', treatment.mris],
    ['CT scans', treatment.ctScans],
    ['Pain management visits', treatment.painManagementVisits],
    ['ESI injections', treatment.esiInjections],
    ['Facet injections', treatment.facetInjections],
    ['RFA injections', treatment.rfaInjections]
  ]
    .filter(([, count]) => Number(count || 0) > 0)
    .map(([label, count]) => `${label}: ${count}`);

  if (treatment.surgeryCompleted) entries.push(`Surgery completed${treatment.surgeryType ? `: ${treatment.surgeryType}` : ''}`);
  if (!treatment.surgeryCompleted && treatment.surgeryRecommended) entries.push(`Surgery recommended${treatment.surgeryType ? `: ${treatment.surgeryType}` : ''}`);
  if (treatment.ongoingTreatment) entries.push('Ongoing treatment reported');

  return entries.length ? entries : ['Minimal treatment reported.'];
}

function phoneMask(last4: string | null): string | null {
  return last4 ? `(***) ***-${last4}` : null;
}

export function buildLeadDeliveryPayload(
  session: LeadSession,
  qualification: LeadQualification,
  generatedAt = nowIso()
): LeadDeliveryPayload {
  const input = parseJson<Partial<InjuryCalculatorData>>(session.inputJson, {});
  const result = parseJson<SettlementResult>(session.resultJson, {
    lowEstimate: 0,
    midEstimate: 0,
    highEstimate: 0,
    medicalCosts: 0,
    medicalCostRange: { low: 0, mid: 0, high: 0 },
    specials: 0,
    severityBand: 'low',
    caseTier: 'low',
    logicVersion: session.logicVersion,
    logicHash: session.logicHash,
    factors: [],
    explanation: ''
  });
  const attorney = parseJson<ResponsibleAttorney | null>(session.attorneyJson, null);
  const hasExistingAttorney = input.insurance?.hasAttorney === true;
  const injuries = injurySummary(input);
  const treatments = treatmentSummary(input);
  const rangeLine = `${humanMoney(result.lowEstimate)} to ${humanMoney(result.highEstimate)} gross estimate, midpoint ${humanMoney(result.midEstimate)}.`;

  return {
    schemaVersion: LEAD_DELIVERY_PAYLOAD_SCHEMA_VERSION,
    generatedAt,
    lead: {
      sessionId: session.id,
      leadDeliveryStatus: session.leadDeliveryStatus,
      qualificationStatus: qualification.qualificationStatus,
      verificationStatus: qualification.verificationStatus,
      temperature: qualification.temperature,
      score: qualification.score,
      reasons: qualification.reasons
    },
    recipient: {
      attorneyId: attorney?.id || session.attorneyId,
      name: attorney?.name || null,
      barNumber: attorney?.barNumber || null,
      officeLocation: attorney?.officeLocation || null
    },
    consent: {
      attorneyDeliveryConsent: session.attorneyDeliveryConsent,
      attorneyDeliveryConsentAt: session.attorneyDeliveryConsentAt,
      phoneContactConsent: session.phoneContactConsent,
      phoneContactConsentAt: session.phoneContactConsentAt,
      consentCopyVersion: session.consentCopyVersion,
      consentText: session.attorneyDeliveryConsentText,
      gpcStatus: session.gpcStatus
    },
    phoneContact: {
      maskedPhone: phoneMask(session.phoneLast4),
      phoneLast4: session.phoneLast4,
      encryptedPhoneRef: session.phoneE164Encrypted
    },
    eligibility: {
      californiaVisitor: session.geoEligibilityStatus === 'california',
      geoEligibilityStatus: session.geoEligibilityStatus,
      county: session.county,
      hasExistingAttorney,
      duplicateWithin30Days: session.duplicateWithin30Days
    },
    caseSummary: {
      accidentCounty: session.county,
      accidentDate: input.accidentDetails?.dateOfAccident || null,
      age: inputAge(input),
      severityBand: result.severityBand,
      estimateRange: {
        low: result.lowEstimate,
        mid: result.midEstimate,
        high: result.highEstimate
      },
      injurySummary: injuries,
      treatmentSummary: treatments,
      readableSections: [
        {
          title: 'Lead status',
          lines: [
            `Status: ${qualification.qualificationStatus}`,
            `Verification: ${qualification.verificationStatus}`,
            `Temperature: ${qualification.temperature}`,
            `Reason codes: ${qualification.reasons.join(', ') || 'none'}`
          ]
        },
        {
          title: 'Consent and contact',
          lines: [
            `Attorney share consent: ${session.attorneyDeliveryConsent ? 'yes' : 'no'}`,
            `Phone contact consent: ${session.phoneContactConsent ? 'yes' : 'no'}`,
            `Phone: ${phoneMask(session.phoneLast4) || 'not stored'}`
          ]
        },
        {
          title: 'Case snapshot',
          lines: [
            `County: ${session.county}`,
            `Date of loss: ${input.accidentDetails?.dateOfAccident || 'not provided'}`,
            `Age: ${inputAge(input) ?? 'not provided'}`,
            `Severity band: ${result.severityBand}`,
            rangeLine
          ]
        },
        {
          title: 'Injuries and treatment',
          lines: [...injuries, ...treatments]
        }
      ]
    }
  };
}

export function leadIsDeliverable(session: LeadSession, qualification: LeadQualification): boolean {
  return qualification.qualificationStatus === 'valid' &&
    qualification.verificationStatus === 'verified' &&
    session.attorneyDeliveryConsent &&
    session.phoneContactConsent &&
    session.geoEligibilityStatus === 'california' &&
    session.otpStatus === 'verified' &&
    !session.duplicateWithin30Days &&
    session.leadDeliveryStatus === 'ready_for_delivery' &&
    Boolean(session.attorneyId);
}

export async function queueLeadDeliveryIfEligible(
  session: LeadSession,
  qualification: LeadQualification,
  env: WorkerEnv = getWorkerEnv()
): Promise<LeadDeliveryQueueItem | null> {
  if (!leadIsDeliverable(session, qualification)) return null;

  const attorney = parseJson<ResponsibleAttorney | null>(session.attorneyJson, null);
  if (!attorney) return null;

  const now = nowIso();
  const recipientId = await upsertLeadDeliveryRecipient(attorney, env);
  const payload = buildLeadDeliveryPayload(session, qualification, now);

  if (env.LEADS_DB) {
    await ensureLeadDeliverySchema(env);
    const existing = await env.LEADS_DB.prepare(`
      SELECT id FROM lead_delivery_queue
      WHERE session_id = ? AND recipient_id = ?
      LIMIT 1
    `).bind(session.id, recipientId).first<{ id: string }>();
    const id = existing?.id || crypto.randomUUID();

    await env.LEADS_DB.prepare(`
      INSERT INTO lead_delivery_queue (
        id, session_id, recipient_id, created_at, updated_at, status,
        payload_schema_version, payload_json, blocked_reason, attempts
      ) VALUES (?, ?, ?, ?, ?, 'queued', ?, ?, NULL, 0)
      ON CONFLICT(session_id, recipient_id) DO UPDATE SET
        updated_at = excluded.updated_at,
        status = 'queued',
        payload_schema_version = excluded.payload_schema_version,
        payload_json = excluded.payload_json,
        blocked_reason = NULL
    `).bind(
      id,
      session.id,
      recipientId,
      now,
      now,
      LEAD_DELIVERY_PAYLOAD_SCHEMA_VERSION,
      JSON.stringify(payload)
    ).run();

    const row = await env.LEADS_DB.prepare('SELECT * FROM lead_delivery_queue WHERE id = ?')
      .bind(id)
      .first<LeadDeliveryQueueRow>();
    return row ? queueItemFromRow(row) : null;
  }

  const existing = memoryQueue().find((item) => (
    item.sessionId === session.id && item.recipientId === recipientId
  ));

  if (existing) {
    existing.updatedAt = now;
    existing.status = 'queued';
    existing.payload = payload;
    existing.blockedReason = null;
    return existing;
  }

  const item: LeadDeliveryQueueItem = {
    id: crypto.randomUUID(),
    sessionId: session.id,
    recipientId,
    createdAt: now,
    updatedAt: now,
    status: 'queued',
    payloadSchemaVersion: LEAD_DELIVERY_PAYLOAD_SCHEMA_VERSION,
    payload,
    blockedReason: null,
    attempts: 0
  };
  memoryQueue().push(item);
  return item;
}

export async function getLeadDeliveryQueueItems(
  sessionId: string,
  env: WorkerEnv = getWorkerEnv()
): Promise<LeadDeliveryQueueItem[]> {
  if (env.LEADS_DB) {
    await ensureLeadDeliverySchema(env);
    const rows = await env.LEADS_DB.prepare('SELECT * FROM lead_delivery_queue WHERE session_id = ? ORDER BY created_at')
      .bind(sessionId)
      .all<LeadDeliveryQueueRow>();
    return (rows.results || []).map(queueItemFromRow);
  }

  return memoryQueue().filter((item) => item.sessionId === sessionId);
}
