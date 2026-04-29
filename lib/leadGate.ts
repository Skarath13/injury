import { getWorkerEnv, WorkerEnv } from '@/lib/cloudflareEnv';
import { attorneyConsentCopyVersion, DEFAULT_ATTORNEY_CONSENT_COPY_VERSION } from '@/lib/leadConsent';
import { PrivacyChoiceSnapshot } from '@/lib/privacyChoices';
import { ResponsibleAttorney, SettlementResult } from '@/types/calculator';

export const CONSENT_COPY_VERSION = DEFAULT_ATTORNEY_CONSENT_COPY_VERSION;
const SESSION_TTL_SECONDS = 30 * 60;
const OTP_TTL_SECONDS = 10 * 60;
const DEDUPE_WINDOW_SECONDS = 30 * 24 * 60 * 60;
export const FORM_START_COOKIE_NAME = 'injury_form_started';
export const FORM_START_MIN_SECONDS = 120;
const FORM_START_COOKIE_MAX_AGE_SECONDS = 2 * 60 * 60;

export interface LeadSession {
  id: string;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  county: string;
  attorneyId: string | null;
  logicVersion: string;
  logicHash: string;
  routingVersion: string;
  consentCopyVersion: string;
  attorneyDeliveryConsent: boolean;
  attorneyDeliveryConsentAt: string | null;
  attorneyDeliveryConsentText: string | null;
  phoneContactConsent: boolean;
  phoneContactConsentAt: string | null;
  privacyChoiceSnapshot: string | null;
  gpcStatus: string;
  visitorCountry: string | null;
  visitorRegionCode: string | null;
  visitorRegion: string | null;
  visitorCity: string | null;
  geoEligibilityStatus: string;
  phoneHash: string | null;
  ipHash: string;
  userAgentHash: string;
  turnstileStatus: string;
  otpStatus: string;
  leadDeliveryStatus: string;
  duplicateWithin30Days: boolean;
  inputJson: string;
  resultJson: string;
  previewJson: string;
  attorneyJson: string | null;
  otpHash: string | null;
  otpExpiresAt: string | null;
  otpAttempts: number;
}

export interface CreateLeadSessionInput {
  county: string;
  logicVersion: string;
  logicHash: string;
  routingVersion: string;
  turnstileStatus: string;
  input: unknown;
  result: SettlementResult;
  preview: unknown;
  attorney: ResponsibleAttorney | null;
  ipHash: string;
  userAgentHash: string;
  privacyChoiceSnapshot?: PrivacyChoiceSnapshot;
  visitorCountry?: string | null;
  visitorRegionCode?: string | null;
  visitorRegion?: string | null;
  visitorCity?: string | null;
  geoEligibilityStatus?: string;
  initialLeadDeliveryStatus?: string;
}

export interface AttorneyLeadConsentInput {
  attorneyDeliveryConsent: boolean;
  phoneContactConsent: boolean;
  consentText: string;
  consentCopyVersion: string;
}

export interface OtpSendResult {
  maskedPhone: string;
  duplicateWithin30Days: boolean;
  provider: string;
  devCode?: string;
}

type LeadSessionRow = {
  id: string;
  created_at: string;
  updated_at: string;
  expires_at: string;
  county: string;
  attorney_id: string | null;
  logic_version: string;
  logic_hash: string;
  routing_version: string;
  consent_copy_version: string;
  attorney_delivery_consent?: number;
  attorney_delivery_consent_at?: string | null;
  attorney_delivery_consent_text?: string | null;
  phone_contact_consent?: number;
  phone_contact_consent_at?: string | null;
  privacy_choice_snapshot?: string | null;
  gpc_status?: string | null;
  visitor_country?: string | null;
  visitor_region_code?: string | null;
  visitor_region?: string | null;
  visitor_city?: string | null;
  geo_eligibility_status?: string | null;
  phone_hash: string | null;
  ip_hash: string;
  user_agent_hash: string;
  turnstile_status: string;
  otp_status: string;
  lead_delivery_status: string;
  duplicate_within_30_days: number;
  input_json: string;
  result_json: string;
  preview_json: string;
  attorney_json: string | null;
  otp_hash: string | null;
  otp_expires_at: string | null;
  otp_attempts: number;
};

const memorySessions = globalThis as typeof globalThis & {
  __injuryLeadSessions?: Map<string, LeadSession>;
};

function getMemorySessions(): Map<string, LeadSession> {
  if (!memorySessions.__injuryLeadSessions) {
    memorySessions.__injuryLeadSessions = new Map();
  }

  return memorySessions.__injuryLeadSessions;
}

export function rememberLocalLeadSession(session: LeadSession): void {
  getMemorySessions().set(session.id, session);
}

function nowIso(): string {
  return new Date().toISOString();
}

function secondsFromNow(seconds: number): string {
  return new Date(Date.now() + seconds * 1000).toISOString();
}

function isExpired(isoDate: string): boolean {
  return Date.parse(isoDate) <= Date.now();
}

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return digits;
  return digits;
}

export function isValidUsMobileCandidate(phone: string): boolean {
  const normalized = normalizePhone(phone);
  return /^1[2-9]\d{9}$/.test(normalized);
}

export function maskPhone(phone: string): string {
  const normalized = normalizePhone(phone);
  if (normalized.length < 4) return '***';
  return `(***) ***-${normalized.slice(-4)}`;
}

async function sha256(value: string): Promise<string> {
  const encoded = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', encoded);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export async function hashForAudit(value: string, env: WorkerEnv = getWorkerEnv()): Promise<string> {
  const salt = env.LEAD_HASH_SALT || 'development-only-lead-hash-salt';
  return sha256(`${salt}:${value || 'unknown'}`);
}

async function hashOtp(sessionId: string, code: string, env: WorkerEnv): Promise<string> {
  const salt = env.LEAD_HASH_SALT || 'development-only-lead-hash-salt';
  return sha256(`${salt}:otp:${sessionId}:${code}`);
}

function rowToSession(row: LeadSessionRow): LeadSession {
  return {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    expiresAt: row.expires_at,
    county: row.county,
    attorneyId: row.attorney_id,
    logicVersion: row.logic_version,
    logicHash: row.logic_hash,
    routingVersion: row.routing_version,
    consentCopyVersion: row.consent_copy_version,
    attorneyDeliveryConsent: Boolean(row.attorney_delivery_consent),
    attorneyDeliveryConsentAt: row.attorney_delivery_consent_at || null,
    attorneyDeliveryConsentText: row.attorney_delivery_consent_text || null,
    phoneContactConsent: Boolean(row.phone_contact_consent),
    phoneContactConsentAt: row.phone_contact_consent_at || null,
    privacyChoiceSnapshot: row.privacy_choice_snapshot || null,
    gpcStatus: row.gpc_status || 'unknown',
    visitorCountry: row.visitor_country || null,
    visitorRegionCode: row.visitor_region_code || null,
    visitorRegion: row.visitor_region || null,
    visitorCity: row.visitor_city || null,
    geoEligibilityStatus: row.geo_eligibility_status || 'unknown',
    phoneHash: row.phone_hash,
    ipHash: row.ip_hash,
    userAgentHash: row.user_agent_hash,
    turnstileStatus: row.turnstile_status,
    otpStatus: row.otp_status,
    leadDeliveryStatus: row.lead_delivery_status,
    duplicateWithin30Days: Boolean(row.duplicate_within_30_days),
    inputJson: row.input_json,
    resultJson: row.result_json,
    previewJson: row.preview_json,
    attorneyJson: row.attorney_json,
    otpHash: row.otp_hash,
    otpExpiresAt: row.otp_expires_at,
    otpAttempts: row.otp_attempts
  };
}

async function ensureD1Schema(env: WorkerEnv): Promise<void> {
  if (!env.LEADS_DB) return;

  await env.LEADS_DB.prepare(`
    CREATE TABLE IF NOT EXISTS lead_sessions (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      county TEXT NOT NULL,
      attorney_id TEXT,
      logic_version TEXT NOT NULL,
      logic_hash TEXT NOT NULL,
      routing_version TEXT NOT NULL,
      consent_copy_version TEXT NOT NULL,
      attorney_delivery_consent INTEGER NOT NULL DEFAULT 0,
      attorney_delivery_consent_at TEXT,
      attorney_delivery_consent_text TEXT,
      phone_contact_consent INTEGER NOT NULL DEFAULT 0,
      phone_contact_consent_at TEXT,
      privacy_choice_snapshot TEXT,
      gpc_status TEXT NOT NULL DEFAULT 'unknown',
      visitor_country TEXT,
      visitor_region_code TEXT,
      visitor_region TEXT,
      visitor_city TEXT,
      geo_eligibility_status TEXT NOT NULL DEFAULT 'unknown',
      phone_hash TEXT,
      ip_hash TEXT NOT NULL,
      user_agent_hash TEXT NOT NULL,
      turnstile_status TEXT NOT NULL,
      otp_status TEXT NOT NULL,
      lead_delivery_status TEXT NOT NULL,
      duplicate_within_30_days INTEGER NOT NULL DEFAULT 0,
      input_json TEXT NOT NULL,
      result_json TEXT NOT NULL,
      preview_json TEXT NOT NULL,
      attorney_json TEXT,
      otp_hash TEXT,
      otp_expires_at TEXT,
      otp_attempts INTEGER NOT NULL DEFAULT 0
    )
  `).run();

  const columns = await env.LEADS_DB.prepare('PRAGMA table_info(lead_sessions)').all<{ name: string }>();
  const existingColumns = new Set((columns.results || []).map((column) => column.name));
  const addColumn = async (name: string, definition: string) => {
    if (existingColumns.has(name)) return;
    await env.LEADS_DB?.prepare(`ALTER TABLE lead_sessions ADD COLUMN ${definition}`).run();
    existingColumns.add(name);
  };

  await addColumn('attorney_delivery_consent', 'attorney_delivery_consent INTEGER NOT NULL DEFAULT 0');
  await addColumn('attorney_delivery_consent_at', 'attorney_delivery_consent_at TEXT');
  await addColumn('attorney_delivery_consent_text', 'attorney_delivery_consent_text TEXT');
  await addColumn('phone_contact_consent', 'phone_contact_consent INTEGER NOT NULL DEFAULT 0');
  await addColumn('phone_contact_consent_at', 'phone_contact_consent_at TEXT');
  await addColumn('privacy_choice_snapshot', 'privacy_choice_snapshot TEXT');
  await addColumn('gpc_status', "gpc_status TEXT NOT NULL DEFAULT 'unknown'");
  await addColumn('visitor_country', 'visitor_country TEXT');
  await addColumn('visitor_region_code', 'visitor_region_code TEXT');
  await addColumn('visitor_region', 'visitor_region TEXT');
  await addColumn('visitor_city', 'visitor_city TEXT');
  await addColumn('geo_eligibility_status', "geo_eligibility_status TEXT NOT NULL DEFAULT 'unknown'");

  await env.LEADS_DB.prepare('CREATE INDEX IF NOT EXISTS idx_lead_sessions_phone_created ON lead_sessions (phone_hash, created_at)').run();
  await env.LEADS_DB.prepare('CREATE INDEX IF NOT EXISTS idx_lead_sessions_geo_eligibility_created ON lead_sessions (geo_eligibility_status, created_at)').run();
}

export async function createLeadSession(
  input: CreateLeadSessionInput,
  env: WorkerEnv = getWorkerEnv()
): Promise<LeadSession> {
  const id = crypto.randomUUID();
  const createdAt = nowIso();
  const expiresAt = secondsFromNow(SESSION_TTL_SECONDS);
  const privacyChoiceSnapshot = input.privacyChoiceSnapshot
    ? JSON.stringify(input.privacyChoiceSnapshot)
    : null;
  const session: LeadSession = {
    id,
    createdAt,
    updatedAt: createdAt,
    expiresAt,
    county: input.county,
    attorneyId: input.attorney?.id || null,
    logicVersion: input.logicVersion,
    logicHash: input.logicHash,
    routingVersion: input.routingVersion,
    consentCopyVersion: input.attorney ? attorneyConsentCopyVersion(input.attorney) : CONSENT_COPY_VERSION,
    attorneyDeliveryConsent: false,
    attorneyDeliveryConsentAt: null,
    attorneyDeliveryConsentText: null,
    phoneContactConsent: false,
    phoneContactConsentAt: null,
    privacyChoiceSnapshot,
    gpcStatus: input.privacyChoiceSnapshot?.gpcEnabled
      ? 'enabled_honored'
      : input.privacyChoiceSnapshot
        ? 'not_enabled'
        : 'not_provided',
    visitorCountry: input.visitorCountry || null,
    visitorRegionCode: input.visitorRegionCode || null,
    visitorRegion: input.visitorRegion || null,
    visitorCity: input.visitorCity || null,
    geoEligibilityStatus: input.geoEligibilityStatus || 'unknown',
    phoneHash: null,
    ipHash: input.ipHash,
    userAgentHash: input.userAgentHash,
    turnstileStatus: input.turnstileStatus,
    otpStatus: 'not_started',
    leadDeliveryStatus: input.initialLeadDeliveryStatus || (input.attorney ? 'preview_attorney_available' : 'preview_no_attorney'),
    duplicateWithin30Days: false,
    inputJson: JSON.stringify(input.input),
    resultJson: JSON.stringify(input.result),
    previewJson: JSON.stringify(input.preview),
    attorneyJson: input.attorney ? JSON.stringify(input.attorney) : null,
    otpHash: null,
    otpExpiresAt: null,
    otpAttempts: 0
  };

  if (env.LEADS_DB) {
    await ensureD1Schema(env);
    await env.LEADS_DB.prepare(`
      INSERT INTO lead_sessions (
        id, created_at, updated_at, expires_at, county, attorney_id, logic_version, logic_hash,
        routing_version, consent_copy_version, attorney_delivery_consent, attorney_delivery_consent_at,
        attorney_delivery_consent_text, phone_contact_consent, phone_contact_consent_at,
        privacy_choice_snapshot, gpc_status, visitor_country, visitor_region_code, visitor_region,
        visitor_city, geo_eligibility_status, phone_hash, ip_hash, user_agent_hash,
        turnstile_status, otp_status, lead_delivery_status, duplicate_within_30_days,
        input_json, result_json, preview_json, attorney_json, otp_hash, otp_expires_at, otp_attempts
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      session.id,
      session.createdAt,
      session.updatedAt,
      session.expiresAt,
      session.county,
      session.attorneyId,
      session.logicVersion,
      session.logicHash,
      session.routingVersion,
      session.consentCopyVersion,
      session.attorneyDeliveryConsent ? 1 : 0,
      session.attorneyDeliveryConsentAt,
      session.attorneyDeliveryConsentText,
      session.phoneContactConsent ? 1 : 0,
      session.phoneContactConsentAt,
      session.privacyChoiceSnapshot,
      session.gpcStatus,
      session.visitorCountry,
      session.visitorRegionCode,
      session.visitorRegion,
      session.visitorCity,
      session.geoEligibilityStatus,
      session.phoneHash,
      session.ipHash,
      session.userAgentHash,
      session.turnstileStatus,
      session.otpStatus,
      session.leadDeliveryStatus,
      session.duplicateWithin30Days ? 1 : 0,
      session.inputJson,
      session.resultJson,
      session.previewJson,
      session.attorneyJson,
      session.otpHash,
      session.otpExpiresAt,
      session.otpAttempts
    ).run();
  } else {
    getMemorySessions().set(id, session);
  }

  return session;
}

export async function getLeadSession(
  sessionId: string,
  env: WorkerEnv = getWorkerEnv()
): Promise<LeadSession | null> {
  if (env.LEADS_DB) {
    await ensureD1Schema(env);
    const row = await env.LEADS_DB.prepare('SELECT * FROM lead_sessions WHERE id = ?').bind(sessionId).first<LeadSessionRow>();
    return row ? rowToSession(row) : null;
  }

  return getMemorySessions().get(sessionId) || null;
}

type CookieLeadSession = Omit<LeadSession, 'inputJson' | 'previewJson'>;

function base64UrlEncode(value: string): string {
  return btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlDecode(value: string): string {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  return atob(padded);
}

function formStartSignature(payload: string, env: WorkerEnv): Promise<string> {
  const salt = env.LEAD_HASH_SALT || 'development-only-lead-hash-salt';
  return sha256(`${salt}:form-start:${payload}`);
}

export function formStartCookieMaxAgeSeconds(): number {
  return FORM_START_COOKIE_MAX_AGE_SECONDS;
}

export async function createFormStartToken(
  env: WorkerEnv = getWorkerEnv(),
  startedAtMs = Date.now()
): Promise<string> {
  const payload = `${startedAtMs}.${crypto.randomUUID()}`;
  const signature = await formStartSignature(payload, env);
  return `${base64UrlEncode(payload)}.${signature}`;
}

export async function formStartElapsedSeconds(
  token: string | undefined,
  env: WorkerEnv = getWorkerEnv()
): Promise<number | null> {
  if (!token) return null;

  const [encodedPayload, signature] = token.split('.');
  if (!encodedPayload || !signature) return null;

  try {
    const payload = base64UrlDecode(encodedPayload);
    const expectedSignature = await formStartSignature(payload, env);
    if (signature !== expectedSignature) return null;

    const [startedAtValue] = payload.split('.');
    const startedAt = Number(startedAtValue);
    if (!Number.isFinite(startedAt) || startedAt <= 0) return null;

    const elapsedSeconds = Math.floor((Date.now() - startedAt) / 1000);
    if (elapsedSeconds < 0 || elapsedSeconds > FORM_START_COOKIE_MAX_AGE_SECONDS) return null;

    return elapsedSeconds;
  } catch {
    return null;
  }
}

export function localSessionCookieName(sessionId: string): string {
  return `estimate_session_${sessionId}`;
}

export function encodeLocalSessionCookie(session: LeadSession): string {
  const compact: CookieLeadSession = {
    ...session
  };
  delete (compact as Partial<LeadSession>).inputJson;
  delete (compact as Partial<LeadSession>).previewJson;
  return base64UrlEncode(JSON.stringify(compact));
}

export function decodeLocalSessionCookie(value: string | undefined): LeadSession | null {
  if (!value) return null;

  try {
    const compact = JSON.parse(base64UrlDecode(value)) as CookieLeadSession;
    return {
      ...compact,
      attorneyDeliveryConsent: Boolean(compact.attorneyDeliveryConsent),
      attorneyDeliveryConsentAt: compact.attorneyDeliveryConsentAt || null,
      attorneyDeliveryConsentText: compact.attorneyDeliveryConsentText || null,
      phoneContactConsent: Boolean(compact.phoneContactConsent),
      phoneContactConsentAt: compact.phoneContactConsentAt || null,
      privacyChoiceSnapshot: compact.privacyChoiceSnapshot || null,
      gpcStatus: compact.gpcStatus || 'unknown',
      visitorCountry: compact.visitorCountry || null,
      visitorRegionCode: compact.visitorRegionCode || null,
      visitorRegion: compact.visitorRegion || null,
      visitorCity: compact.visitorCity || null,
      geoEligibilityStatus: compact.geoEligibilityStatus || 'unknown',
      inputJson: '{}',
      previewJson: '{}'
    };
  } catch {
    return null;
  }
}

async function updateSession(session: LeadSession, env: WorkerEnv): Promise<void> {
  session.updatedAt = nowIso();

  if (env.LEADS_DB) {
    await ensureD1Schema(env);
    await env.LEADS_DB.prepare(`
      UPDATE lead_sessions
      SET updated_at = ?, phone_hash = ?, otp_status = ?, lead_delivery_status = ?,
          duplicate_within_30_days = ?, otp_hash = ?, otp_expires_at = ?, otp_attempts = ?,
          attorney_delivery_consent = ?, attorney_delivery_consent_at = ?,
          attorney_delivery_consent_text = ?, phone_contact_consent = ?, phone_contact_consent_at = ?,
          privacy_choice_snapshot = ?, gpc_status = ?, consent_copy_version = ?
      WHERE id = ?
    `).bind(
      session.updatedAt,
      session.phoneHash,
      session.otpStatus,
      session.leadDeliveryStatus,
      session.duplicateWithin30Days ? 1 : 0,
      session.otpHash,
      session.otpExpiresAt,
      session.otpAttempts,
      session.attorneyDeliveryConsent ? 1 : 0,
      session.attorneyDeliveryConsentAt,
      session.attorneyDeliveryConsentText,
      session.phoneContactConsent ? 1 : 0,
      session.phoneContactConsentAt,
      session.privacyChoiceSnapshot,
      session.gpcStatus,
      session.consentCopyVersion,
      session.id
    ).run();
  } else {
    getMemorySessions().set(session.id, session);
  }
}

async function hasRecentSubmittedPhone(phoneHash: string, currentSessionId: string, env: WorkerEnv): Promise<boolean> {
  const cutoff = new Date(Date.now() - DEDUPE_WINDOW_SECONDS * 1000).toISOString();

  if (env.LEADS_DB) {
    await ensureD1Schema(env);
    const row = await env.LEADS_DB.prepare(`
      SELECT id FROM lead_sessions
      WHERE phone_hash = ?
        AND id != ?
        AND created_at >= ?
        AND lead_delivery_status != 'estimate_only_no_delivery'
      LIMIT 1
    `).bind(phoneHash, currentSessionId, cutoff).first<{ id: string }>();
    return Boolean(row);
  }

  return [...getMemorySessions().values()].some((session) => (
    session.id !== currentSessionId &&
    session.phoneHash === phoneHash &&
    session.leadDeliveryStatus !== 'estimate_only_no_delivery' &&
    session.createdAt >= cutoff
  ));
}

function noDeliveryStatusForGeo(session: LeadSession, env: WorkerEnv): string | null {
  if (session.geoEligibilityStatus === 'california') return null;

  if (session.geoEligibilityStatus === 'outside_california') {
    return 'outside_california_no_delivery';
  }

  if (session.geoEligibilityStatus === 'outside_us') {
    return 'outside_us_no_delivery';
  }

  return 'unknown_location_no_delivery';
}

function isNoDeliveryStatus(status: string): boolean {
  return status.endsWith('_no_delivery') || status === 'unmapped_no_attorney_delivery';
}

function generateOtp(env: WorkerEnv): string {
  if (env.OTP_DEV_CODE && env.NODE_ENV !== 'production') {
    return env.OTP_DEV_CODE;
  }

  return Math.floor(1000 + Math.random() * 9000).toString();
}

async function sendOtp(phone: string, code: string, env: WorkerEnv): Promise<{ provider: string; devCode?: string }> {
  const provider = env.SMS_PROVIDER || 'dev_stub';
  const canUseTwilio = provider === 'twilio' &&
    env.TWILIO_ACCOUNT_SID &&
    env.TWILIO_AUTH_TOKEN &&
    env.TWILIO_FROM_NUMBER;

  if (canUseTwilio) {
    const body = new URLSearchParams();
    body.set('To', `+${normalizePhone(phone)}`);
    body.set('From', env.TWILIO_FROM_NUMBER || '');
    body.set('Body', `Your California Settlement Calculator verification code is ${code}.`);

    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${btoa(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body
    });

    if (!response.ok) {
      throw new Error('Unable to send SMS verification code.');
    }

    return { provider: 'twilio' };
  }

  const devModeAllowed = env.NODE_ENV !== 'production' || env.OTP_DEV_MODE === 'true';
  if (!devModeAllowed) {
    throw new Error('SMS provider is not configured.');
  }

  return { provider: 'dev_stub', devCode: code };
}

export async function startOtpUnlock(
  sessionId: string,
  phone: string,
  consent: AttorneyLeadConsentInput,
  env: WorkerEnv = getWorkerEnv()
): Promise<OtpSendResult> {
  const session = await getLeadSession(sessionId, env);
  if (!session || isExpired(session.expiresAt)) {
    throw new Error('This estimate session expired. Please calculate again.');
  }

  const attorney = session.attorneyJson ? JSON.parse(session.attorneyJson) as ResponsibleAttorney : null;
  if (!attorney) {
    throw new Error('Attorney delivery is not available for this estimate.');
  }

  if (!consent.attorneyDeliveryConsent || !consent.phoneContactConsent) {
    throw new Error(`Please confirm permission to send your results to ${attorney.name} and be contacted about your inquiry.`);
  }

  if (session.leadDeliveryStatus !== 'preview_attorney_available') {
    throw new Error('Phone verification is not available for this estimate.');
  }

  if (!isValidUsMobileCandidate(phone)) {
    throw new Error('Please enter a valid US mobile phone number.');
  }

  const geoNoDeliveryStatus = noDeliveryStatusForGeo(session, env);
  if (geoNoDeliveryStatus) {
    session.leadDeliveryStatus = geoNoDeliveryStatus;
    await updateSession(session, env);
    throw new Error('Attorney delivery is only available for visitors we can confirm are in California.');
  }

  const normalizedPhone = normalizePhone(phone);
  const phoneHash = await hashForAudit(normalizedPhone, env);
  const duplicateWithin30Days = await hasRecentSubmittedPhone(phoneHash, session.id, env);
  const code = generateOtp(env);
  const otpHash = await hashOtp(session.id, code, env);

  session.phoneHash = phoneHash;
  session.attorneyDeliveryConsent = true;
  session.attorneyDeliveryConsentAt = nowIso();
  session.attorneyDeliveryConsentText = consent.consentText;
  session.phoneContactConsent = true;
  session.phoneContactConsentAt = session.attorneyDeliveryConsentAt;
  session.consentCopyVersion = consent.consentCopyVersion;
  session.otpAttempts = 0;
  session.otpStatus = 'pending_send';
  session.duplicateWithin30Days = duplicateWithin30Days;
  session.leadDeliveryStatus = duplicateWithin30Days ? 'duplicate_30d_no_charge' : session.leadDeliveryStatus;
  await updateSession(session, env);

  const sms = await sendOtp(phone, code, env);

  session.otpHash = otpHash;
  session.otpExpiresAt = secondsFromNow(OTP_TTL_SECONDS);
  session.otpStatus = 'sent';
  await updateSession(session, env);

  return {
    maskedPhone: maskPhone(phone),
    duplicateWithin30Days,
    provider: sms.provider,
    devCode: sms.devCode
  };
}

export async function unlockEstimateOnly(
  sessionId: string,
  env: WorkerEnv = getWorkerEnv()
): Promise<{ session: LeadSession; result: SettlementResult }> {
  const session = await getLeadSession(sessionId, env);
  if (!session || isExpired(session.expiresAt)) {
    throw new Error('This estimate session expired. Please calculate again.');
  }

  session.leadDeliveryStatus = isNoDeliveryStatus(session.leadDeliveryStatus)
    ? session.leadDeliveryStatus
    : 'estimate_only_no_delivery';
  session.attorneyDeliveryConsent = false;
  session.attorneyDeliveryConsentAt = null;
  session.attorneyDeliveryConsentText = null;
  session.phoneContactConsent = false;
  session.phoneContactConsentAt = null;
  session.phoneHash = null;
  session.otpHash = null;
  session.otpExpiresAt = null;
  session.otpAttempts = 0;
  session.otpStatus = 'not_started';
  session.duplicateWithin30Days = false;
  await updateSession(session, env);

  return {
    session,
    result: JSON.parse(session.resultJson) as SettlementResult
  };
}

export async function verifyOtpUnlock(
  sessionId: string,
  code: string,
  env: WorkerEnv = getWorkerEnv()
): Promise<{ session: LeadSession; result: SettlementResult; attorney: ResponsibleAttorney | null }> {
  const session = await getLeadSession(sessionId, env);
  if (!session || isExpired(session.expiresAt)) {
    throw new Error('This estimate session expired. Please calculate again.');
  }

  if (!session.otpHash || !session.otpExpiresAt || isExpired(session.otpExpiresAt)) {
    session.otpStatus = 'expired';
    await updateSession(session, env);
    throw new Error('The verification code expired. Please request a new code.');
  }

  if (session.otpAttempts >= 5) {
    throw new Error('Too many verification attempts. Please calculate again.');
  }

  const candidateHash = await hashOtp(session.id, code.trim(), env);
  if (candidateHash !== session.otpHash) {
    session.otpAttempts += 1;
    session.otpStatus = 'failed';
    await updateSession(session, env);
    throw new Error('That verification code is not correct.');
  }

  const attorney = session.attorneyJson ? JSON.parse(session.attorneyJson) as ResponsibleAttorney : null;
  if (attorney && (!session.attorneyDeliveryConsent || !session.phoneContactConsent)) {
    throw new Error(`Please confirm permission to send your results to ${attorney.name}.`);
  }

  const geoNoDeliveryStatus = noDeliveryStatusForGeo(session, env);
  session.otpStatus = 'verified';
  session.leadDeliveryStatus = session.duplicateWithin30Days
    ? 'duplicate_30d_no_charge'
    : geoNoDeliveryStatus
      ? geoNoDeliveryStatus
      : attorney
      ? 'ready_for_delivery'
      : 'unmapped_no_attorney_delivery';
  await updateSession(session, env);

  return {
    session,
    result: JSON.parse(session.resultJson) as SettlementResult,
    attorney
  };
}

export async function verifyTurnstileToken(
  token: string | undefined,
  remoteIp: string,
  env: WorkerEnv = getWorkerEnv()
): Promise<{ ok: boolean; status: string; errors: string[] }> {
  const secret = env.TURNSTILE_SECRET_KEY;

  if (!secret) {
    const devModeAllowed = env.NODE_ENV !== 'production';
    return devModeAllowed
      ? { ok: true, status: 'skipped_dev_no_secret', errors: [] }
      : { ok: false, status: 'failed_missing_secret', errors: ['missing-secret'] };
  }

  if (!token) {
    return { ok: false, status: 'failed_missing_token', errors: ['missing-input-response'] };
  }

  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret,
        response: token,
        remoteip: remoteIp,
        idempotency_key: crypto.randomUUID()
      })
    });
    const outcome = await response.json() as { success?: boolean; 'error-codes'?: string[] };

    return {
      ok: Boolean(outcome.success),
      status: outcome.success ? 'verified' : 'failed',
      errors: outcome['error-codes'] || []
    };
  } catch {
    return { ok: false, status: 'failed_request_error', errors: ['internal-error'] };
  }
}
