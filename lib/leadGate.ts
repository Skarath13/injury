import { getWorkerEnv, WorkerEnv } from '@/lib/cloudflareEnv';
import { attorneyConsentCopyVersion, DEFAULT_ATTORNEY_CONSENT_COPY_VERSION } from '@/lib/leadConsent';
import { queueLeadDeliveryIfEligible, recordLeadQualification } from '@/lib/leadDelivery';
import { PrivacyChoiceSnapshot } from '@/lib/privacyChoices';
import { ResponsibleAttorney, SettlementResult } from '@/types/calculator';

export const CONSENT_COPY_VERSION = DEFAULT_ATTORNEY_CONSENT_COPY_VERSION;
const SESSION_TTL_SECONDS = 30 * 60;
const OTP_TTL_SECONDS = 10 * 60;
const OTP_CODE_LENGTH = 6;
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
  phoneE164Encrypted: string | null;
  phoneLast4: string | null;
  phoneEncryptedAt: string | null;
  phoneEncryptionKeyVersion: string | null;
  emailHash: string | null;
  leadContactEncrypted: string | null;
  leadContactEncryptedAt: string | null;
  leadContactEncryptionKeyVersion: string | null;
  ipHash: string;
  userAgentHash: string;
  turnstileStatus: string;
  otpStatus: string;
  otpProvider: string;
  leadDeliveryStatus: string;
  duplicateWithin30Days: boolean;
  inputJson: string;
  resultJson: string;
  previewJson: string;
  attorneyJson: string | null;
  otpHash: string | null;
  otpExpiresAt: string | null;
  otpAttempts: number;
  twilioVerifyServiceSid: string | null;
  twilioVerifySid: string | null;
  twilioVerifyChannel: string | null;
  twilioVerifyStatus: string | null;
  twilioVerifyErrorCode: string | null;
  twilioVerifyErrorMessage: string | null;
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

export interface LeadContactInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface LeadContactIdentity {
  firstName: string;
  lastName: string;
  email: string;
}

export interface OtpSendResult {
  maskedPhone: string;
  duplicateWithin30Days: boolean;
  provider: string;
  otpLength: number;
  providerStatus?: string;
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
  phone_e164_encrypted?: string | null;
  phone_last4?: string | null;
  phone_encrypted_at?: string | null;
  phone_encryption_key_version?: string | null;
  email_hash?: string | null;
  lead_contact_encrypted?: string | null;
  lead_contact_encrypted_at?: string | null;
  lead_contact_encryption_key_version?: string | null;
  ip_hash: string;
  user_agent_hash: string;
  turnstile_status: string;
  otp_status: string;
  otp_provider?: string | null;
  lead_delivery_status: string;
  duplicate_within_30_days: number;
  input_json: string;
  result_json: string;
  preview_json: string;
  attorney_json: string | null;
  otp_hash: string | null;
  otp_expires_at: string | null;
  otp_attempts: number;
  twilio_verify_service_sid?: string | null;
  twilio_verify_sid?: string | null;
  twilio_verify_channel?: string | null;
  twilio_verify_status?: string | null;
  twilio_verify_error_code?: string | null;
  twilio_verify_error_message?: string | null;
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

function normalizeContactName(value: string, fieldLabel: string): string {
  const normalized = value.trim().replace(/\s+/g, ' ');
  if (!normalized) {
    throw new Error(`${fieldLabel} is required.`);
  }
  if (normalized.length > 80) {
    throw new Error(`${fieldLabel} must be 80 characters or fewer.`);
  }
  return normalized;
}

function normalizeContactEmail(value: string): string {
  const normalized = value.trim().toLowerCase();
  if (!normalized) {
    throw new Error('Email is required.');
  }
  if (normalized.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw new Error('Please enter a valid email address.');
  }
  return normalized;
}

function normalizeLeadContact(contact: LeadContactInput): LeadContactIdentity & { phone: string; normalizedPhone: string } {
  const normalizedPhone = normalizePhone(contact.phone || '');

  return {
    firstName: normalizeContactName(contact.firstName || '', 'First name'),
    lastName: normalizeContactName(contact.lastName || '', 'Last name'),
    email: normalizeContactEmail(contact.email || ''),
    phone: contact.phone || '',
    normalizedPhone
  };
}

async function sha256(value: string): Promise<string> {
  const encoded = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', encoded);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export async function hashForAudit(value: string, env: WorkerEnv = getWorkerEnv()): Promise<string> {
  const salt = requireLeadSecret(
    env.LEAD_HASH_SALT,
    env,
    'LEAD_HASH_SALT',
    'development-only-lead-hash-salt'
  );
  return sha256(`${salt}:${value || 'unknown'}`);
}

async function hashOtp(sessionId: string, code: string, env: WorkerEnv): Promise<string> {
  const salt = requireLeadSecret(
    env.LEAD_HASH_SALT,
    env,
    'LEAD_HASH_SALT',
    'development-only-lead-hash-salt'
  );
  return sha256(`${salt}:otp:${sessionId}:${code}`);
}

function requireLeadSecret(value: string | undefined, env: WorkerEnv, name: string, devFallback: string): string {
  if (value) return value;
  if (env.NODE_ENV === 'production') {
    throw new Error(`${name} is not configured.`);
  }
  return devFallback;
}

async function leadEncryptionKey(env: WorkerEnv): Promise<CryptoKey> {
  const secret = requireLeadSecret(
    env.LEAD_ENCRYPTION_KEY,
    env,
    'LEAD_ENCRYPTION_KEY',
    'development-only-lead-encryption-key'
  );
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret));
  return crypto.subtle.importKey('raw', digest, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlToBytes(value: string): Uint8Array {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function encryptPhoneE164(phoneE164: string, env: WorkerEnv): Promise<string> {
  const key = await leadEncryptionKey(env);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(phoneE164);
  const cipher = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded));
  return `v1.${bytesToBase64Url(iv)}.${bytesToBase64Url(cipher)}`;
}

async function encryptLeadContactIdentity(contact: LeadContactIdentity, env: WorkerEnv): Promise<string> {
  const key = await leadEncryptionKey(env);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(JSON.stringify(contact));
  const cipher = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded));
  return `v1.${bytesToBase64Url(iv)}.${bytesToBase64Url(cipher)}`;
}

export async function decryptPhoneE164ForDelivery(encryptedPhone: string, env: WorkerEnv = getWorkerEnv()): Promise<string> {
  const [version, ivValue, cipherValue] = encryptedPhone.split('.');
  if (version !== 'v1' || !ivValue || !cipherValue) {
    throw new Error('Unsupported encrypted phone format.');
  }

  const key = await leadEncryptionKey(env);
  const plain = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: base64UrlToBytes(ivValue) },
    key,
    base64UrlToBytes(cipherValue)
  );
  return new TextDecoder().decode(plain);
}

export async function decryptLeadContactForDelivery(
  encryptedContact: string,
  env: WorkerEnv = getWorkerEnv()
): Promise<LeadContactIdentity> {
  const [version, ivValue, cipherValue] = encryptedContact.split('.');
  if (version !== 'v1' || !ivValue || !cipherValue) {
    throw new Error('Unsupported encrypted contact format.');
  }

  const key = await leadEncryptionKey(env);
  const plain = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: base64UrlToBytes(ivValue) },
    key,
    base64UrlToBytes(cipherValue)
  );
  return JSON.parse(new TextDecoder().decode(plain)) as LeadContactIdentity;
}

function phoneEncryptionKeyVersion(env: WorkerEnv): string {
  return env.LEAD_ENCRYPTION_KEY_VERSION || 'lead-phone-key-v1';
}

function leadContactEncryptionKeyVersion(env: WorkerEnv): string {
  return env.LEAD_ENCRYPTION_KEY_VERSION || 'lead-contact-key-v1';
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
    phoneE164Encrypted: row.phone_e164_encrypted || null,
    phoneLast4: row.phone_last4 || null,
    phoneEncryptedAt: row.phone_encrypted_at || null,
    phoneEncryptionKeyVersion: row.phone_encryption_key_version || null,
    emailHash: row.email_hash || null,
    leadContactEncrypted: row.lead_contact_encrypted || null,
    leadContactEncryptedAt: row.lead_contact_encrypted_at || null,
    leadContactEncryptionKeyVersion: row.lead_contact_encryption_key_version || null,
    ipHash: row.ip_hash,
    userAgentHash: row.user_agent_hash,
    turnstileStatus: row.turnstile_status,
    otpStatus: row.otp_status,
    otpProvider: row.otp_provider || 'none',
    leadDeliveryStatus: row.lead_delivery_status,
    duplicateWithin30Days: Boolean(row.duplicate_within_30_days),
    inputJson: row.input_json,
    resultJson: row.result_json,
    previewJson: row.preview_json,
    attorneyJson: row.attorney_json,
    otpHash: row.otp_hash,
    otpExpiresAt: row.otp_expires_at,
    otpAttempts: row.otp_attempts,
    twilioVerifyServiceSid: row.twilio_verify_service_sid || null,
    twilioVerifySid: row.twilio_verify_sid || null,
    twilioVerifyChannel: row.twilio_verify_channel || null,
    twilioVerifyStatus: row.twilio_verify_status || null,
    twilioVerifyErrorCode: row.twilio_verify_error_code || null,
    twilioVerifyErrorMessage: row.twilio_verify_error_message || null
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
      phone_e164_encrypted TEXT,
      phone_last4 TEXT,
      phone_encrypted_at TEXT,
      phone_encryption_key_version TEXT,
      email_hash TEXT,
      lead_contact_encrypted TEXT,
      lead_contact_encrypted_at TEXT,
      lead_contact_encryption_key_version TEXT,
      ip_hash TEXT NOT NULL,
      user_agent_hash TEXT NOT NULL,
      turnstile_status TEXT NOT NULL,
      otp_status TEXT NOT NULL,
      otp_provider TEXT NOT NULL DEFAULT 'none',
      lead_delivery_status TEXT NOT NULL,
      duplicate_within_30_days INTEGER NOT NULL DEFAULT 0,
      input_json TEXT NOT NULL,
      result_json TEXT NOT NULL,
      preview_json TEXT NOT NULL,
      attorney_json TEXT,
      otp_hash TEXT,
      otp_expires_at TEXT,
      otp_attempts INTEGER NOT NULL DEFAULT 0,
      twilio_verify_service_sid TEXT,
      twilio_verify_sid TEXT,
      twilio_verify_channel TEXT,
      twilio_verify_status TEXT,
      twilio_verify_error_code TEXT,
      twilio_verify_error_message TEXT
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
  await addColumn('phone_e164_encrypted', 'phone_e164_encrypted TEXT');
  await addColumn('phone_last4', 'phone_last4 TEXT');
  await addColumn('phone_encrypted_at', 'phone_encrypted_at TEXT');
  await addColumn('phone_encryption_key_version', 'phone_encryption_key_version TEXT');
  await addColumn('email_hash', 'email_hash TEXT');
  await addColumn('lead_contact_encrypted', 'lead_contact_encrypted TEXT');
  await addColumn('lead_contact_encrypted_at', 'lead_contact_encrypted_at TEXT');
  await addColumn('lead_contact_encryption_key_version', 'lead_contact_encryption_key_version TEXT');
  await addColumn('otp_provider', "otp_provider TEXT NOT NULL DEFAULT 'none'");
  await addColumn('twilio_verify_service_sid', 'twilio_verify_service_sid TEXT');
  await addColumn('twilio_verify_sid', 'twilio_verify_sid TEXT');
  await addColumn('twilio_verify_channel', 'twilio_verify_channel TEXT');
  await addColumn('twilio_verify_status', 'twilio_verify_status TEXT');
  await addColumn('twilio_verify_error_code', 'twilio_verify_error_code TEXT');
  await addColumn('twilio_verify_error_message', 'twilio_verify_error_message TEXT');

  await env.LEADS_DB.prepare('CREATE INDEX IF NOT EXISTS idx_lead_sessions_phone_created ON lead_sessions (phone_hash, created_at)').run();
  await env.LEADS_DB.prepare('CREATE INDEX IF NOT EXISTS idx_lead_sessions_email_created ON lead_sessions (email_hash, created_at)').run();
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
    phoneE164Encrypted: null,
    phoneLast4: null,
    phoneEncryptedAt: null,
    phoneEncryptionKeyVersion: null,
    emailHash: null,
    leadContactEncrypted: null,
    leadContactEncryptedAt: null,
    leadContactEncryptionKeyVersion: null,
    ipHash: input.ipHash,
    userAgentHash: input.userAgentHash,
    turnstileStatus: input.turnstileStatus,
    otpStatus: 'not_started',
    otpProvider: 'none',
    leadDeliveryStatus: input.initialLeadDeliveryStatus || (input.attorney ? 'preview_attorney_available' : 'preview_no_attorney'),
    duplicateWithin30Days: false,
    inputJson: JSON.stringify(input.input),
    resultJson: JSON.stringify(input.result),
    previewJson: JSON.stringify(input.preview),
    attorneyJson: input.attorney ? JSON.stringify(input.attorney) : null,
    otpHash: null,
    otpExpiresAt: null,
    otpAttempts: 0,
    twilioVerifyServiceSid: null,
    twilioVerifySid: null,
    twilioVerifyChannel: null,
    twilioVerifyStatus: null,
    twilioVerifyErrorCode: null,
    twilioVerifyErrorMessage: null
  };

  if (env.LEADS_DB) {
    await ensureD1Schema(env);
    await env.LEADS_DB.prepare(`
      INSERT INTO lead_sessions (
        id, created_at, updated_at, expires_at, county, attorney_id, logic_version, logic_hash,
        routing_version, consent_copy_version, attorney_delivery_consent, attorney_delivery_consent_at,
        attorney_delivery_consent_text, phone_contact_consent, phone_contact_consent_at,
        privacy_choice_snapshot, gpc_status, visitor_country, visitor_region_code, visitor_region,
        visitor_city, geo_eligibility_status, phone_hash, phone_e164_encrypted, phone_last4,
        phone_encrypted_at, phone_encryption_key_version, email_hash, lead_contact_encrypted,
        lead_contact_encrypted_at, lead_contact_encryption_key_version, ip_hash, user_agent_hash,
        turnstile_status, otp_status, otp_provider, lead_delivery_status, duplicate_within_30_days,
        input_json, result_json, preview_json, attorney_json, otp_hash, otp_expires_at, otp_attempts,
        twilio_verify_service_sid, twilio_verify_sid, twilio_verify_channel, twilio_verify_status,
        twilio_verify_error_code, twilio_verify_error_message
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      session.phoneE164Encrypted,
      session.phoneLast4,
      session.phoneEncryptedAt,
      session.phoneEncryptionKeyVersion,
      session.emailHash,
      session.leadContactEncrypted,
      session.leadContactEncryptedAt,
      session.leadContactEncryptionKeyVersion,
      session.ipHash,
      session.userAgentHash,
      session.turnstileStatus,
      session.otpStatus,
      session.otpProvider,
      session.leadDeliveryStatus,
      session.duplicateWithin30Days ? 1 : 0,
      session.inputJson,
      session.resultJson,
      session.previewJson,
      session.attorneyJson,
      session.otpHash,
      session.otpExpiresAt,
      session.otpAttempts,
      session.twilioVerifyServiceSid,
      session.twilioVerifySid,
      session.twilioVerifyChannel,
      session.twilioVerifyStatus,
      session.twilioVerifyErrorCode,
      session.twilioVerifyErrorMessage
    ).run();
  } else {
    getMemorySessions().set(id, session);
  }

  await recordLeadQualification(session, env, { action: 'create_lead_session' });

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

type LegacyCookieLeadSession = Omit<LeadSession, 'inputJson' | 'previewJson'>;

type CompactCookieLeadSession = {
  v: 1;
  i: string;
  c: string;
  u: string;
  e: string;
  n: string;
  ai: string | null;
  lv: string;
  lh: string;
  rv: string;
  cv: string;
  ad?: 1;
  ada?: string | null;
  pc?: 1;
  pca?: string | null;
  gs?: string;
  ge?: string;
  ph?: string | null;
  pe?: string | null;
  pl?: string | null;
  pt?: string | null;
  pk?: string | null;
  eh?: string | null;
  ce?: string | null;
  ct?: string | null;
  ck?: string | null;
  ip?: string;
  ua?: string;
  ts: string;
  os: string;
  op?: string;
  ls: string;
  d?: 1;
  r: unknown;
  a?: unknown;
  oh?: string | null;
  oe?: string | null;
  oa?: number;
  tvs?: string | null;
  tvid?: string | null;
  tvc?: string | null;
  tvst?: string | null;
  tve?: string | null;
  tvm?: string | null;
};

function base64UrlEncode(value: string): string {
  return btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlDecode(value: string): string {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  return atob(padded);
}

function formStartSignature(payload: string, env: WorkerEnv): Promise<string> {
  const salt = requireLeadSecret(
    env.LEAD_HASH_SALT,
    env,
    'LEAD_HASH_SALT',
    'development-only-lead-hash-salt'
  );
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
  const compact: CompactCookieLeadSession = {
    v: 1,
    i: session.id,
    c: session.createdAt,
    u: session.updatedAt,
    e: session.expiresAt,
    n: session.county,
    ai: session.attorneyId,
    lv: session.logicVersion,
    lh: session.logicHash,
    rv: session.routingVersion,
    cv: session.consentCopyVersion,
    ad: session.attorneyDeliveryConsent ? 1 : undefined,
    ada: session.attorneyDeliveryConsentAt,
    pc: session.phoneContactConsent ? 1 : undefined,
    pca: session.phoneContactConsentAt,
    gs: session.gpcStatus,
    ge: session.geoEligibilityStatus,
    ph: session.phoneHash,
    pe: session.phoneE164Encrypted,
    pl: session.phoneLast4,
    pt: session.phoneEncryptedAt,
    pk: session.phoneEncryptionKeyVersion,
    eh: session.emailHash,
    ce: session.leadContactEncrypted,
    ct: session.leadContactEncryptedAt,
    ck: session.leadContactEncryptionKeyVersion,
    ip: session.ipHash,
    ua: session.userAgentHash,
    ts: session.turnstileStatus,
    os: session.otpStatus,
    op: session.otpProvider,
    ls: session.leadDeliveryStatus,
    d: session.duplicateWithin30Days ? 1 : undefined,
    r: JSON.parse(session.resultJson),
    a: session.attorneyJson ? JSON.parse(session.attorneyJson) : undefined,
    oh: session.otpHash,
    oe: session.otpExpiresAt,
    oa: session.otpAttempts,
    tvs: session.twilioVerifyServiceSid,
    tvid: session.twilioVerifySid,
    tvc: session.twilioVerifyChannel,
    tvst: session.twilioVerifyStatus,
    tve: session.twilioVerifyErrorCode,
    tvm: session.twilioVerifyErrorMessage
  };

  return base64UrlEncode(JSON.stringify(compact));
}

export function decodeLocalSessionCookie(value: string | undefined): LeadSession | null {
  if (!value) return null;

  try {
    const compact = JSON.parse(base64UrlDecode(value)) as CompactCookieLeadSession | LegacyCookieLeadSession;

    if ('v' in compact && compact.v === 1) {
      return {
        id: compact.i,
        createdAt: compact.c,
        updatedAt: compact.u,
        expiresAt: compact.e,
        county: compact.n,
        attorneyId: compact.ai,
        logicVersion: compact.lv,
        logicHash: compact.lh,
        routingVersion: compact.rv,
        consentCopyVersion: compact.cv,
        attorneyDeliveryConsent: Boolean(compact.ad),
        attorneyDeliveryConsentAt: compact.ada || null,
        attorneyDeliveryConsentText: null,
        phoneContactConsent: Boolean(compact.pc),
        phoneContactConsentAt: compact.pca || null,
        privacyChoiceSnapshot: null,
        gpcStatus: compact.gs || 'unknown',
        visitorCountry: null,
        visitorRegionCode: null,
        visitorRegion: null,
        visitorCity: null,
        geoEligibilityStatus: compact.ge || 'unknown',
        phoneHash: compact.ph || null,
        phoneE164Encrypted: compact.pe || null,
        phoneLast4: compact.pl || null,
        phoneEncryptedAt: compact.pt || null,
        phoneEncryptionKeyVersion: compact.pk || null,
        emailHash: compact.eh || null,
        leadContactEncrypted: compact.ce || null,
        leadContactEncryptedAt: compact.ct || null,
        leadContactEncryptionKeyVersion: compact.ck || null,
        ipHash: compact.ip || 'local-cookie',
        userAgentHash: compact.ua || 'local-cookie',
        turnstileStatus: compact.ts,
        otpStatus: compact.os,
        otpProvider: compact.op || 'none',
        leadDeliveryStatus: compact.ls,
        duplicateWithin30Days: Boolean(compact.d),
        inputJson: '{}',
        resultJson: JSON.stringify(compact.r),
        previewJson: '{}',
        attorneyJson: compact.a ? JSON.stringify(compact.a) : null,
        otpHash: compact.oh || null,
        otpExpiresAt: compact.oe || null,
        otpAttempts: compact.oa || 0,
        twilioVerifyServiceSid: compact.tvs || null,
        twilioVerifySid: compact.tvid || null,
        twilioVerifyChannel: compact.tvc || null,
        twilioVerifyStatus: compact.tvst || null,
        twilioVerifyErrorCode: compact.tve || null,
        twilioVerifyErrorMessage: compact.tvm || null
      };
    }

    const legacy = compact as LegacyCookieLeadSession;
    return {
      ...legacy,
      attorneyDeliveryConsent: Boolean(legacy.attorneyDeliveryConsent),
      attorneyDeliveryConsentAt: legacy.attorneyDeliveryConsentAt || null,
      attorneyDeliveryConsentText: legacy.attorneyDeliveryConsentText || null,
      phoneContactConsent: Boolean(legacy.phoneContactConsent),
      phoneContactConsentAt: legacy.phoneContactConsentAt || null,
      privacyChoiceSnapshot: legacy.privacyChoiceSnapshot || null,
      gpcStatus: legacy.gpcStatus || 'unknown',
      visitorCountry: legacy.visitorCountry || null,
      visitorRegionCode: legacy.visitorRegionCode || null,
      visitorRegion: legacy.visitorRegion || null,
      visitorCity: legacy.visitorCity || null,
      geoEligibilityStatus: legacy.geoEligibilityStatus || 'unknown',
      phoneE164Encrypted: legacy.phoneE164Encrypted || null,
      phoneLast4: legacy.phoneLast4 || null,
      phoneEncryptedAt: legacy.phoneEncryptedAt || null,
      phoneEncryptionKeyVersion: legacy.phoneEncryptionKeyVersion || null,
      emailHash: legacy.emailHash || null,
      leadContactEncrypted: legacy.leadContactEncrypted || null,
      leadContactEncryptedAt: legacy.leadContactEncryptedAt || null,
      leadContactEncryptionKeyVersion: legacy.leadContactEncryptionKeyVersion || null,
      otpProvider: legacy.otpProvider || 'none',
      twilioVerifyServiceSid: legacy.twilioVerifyServiceSid || null,
      twilioVerifySid: legacy.twilioVerifySid || null,
      twilioVerifyChannel: legacy.twilioVerifyChannel || null,
      twilioVerifyStatus: legacy.twilioVerifyStatus || null,
      twilioVerifyErrorCode: legacy.twilioVerifyErrorCode || null,
      twilioVerifyErrorMessage: legacy.twilioVerifyErrorMessage || null,
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
          privacy_choice_snapshot = ?, gpc_status = ?, consent_copy_version = ?,
          phone_e164_encrypted = ?, phone_last4 = ?, phone_encrypted_at = ?,
          phone_encryption_key_version = ?, otp_provider = ?, twilio_verify_service_sid = ?,
          twilio_verify_sid = ?, twilio_verify_channel = ?, twilio_verify_status = ?,
          twilio_verify_error_code = ?, twilio_verify_error_message = ?, email_hash = ?,
          lead_contact_encrypted = ?, lead_contact_encrypted_at = ?,
          lead_contact_encryption_key_version = ?
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
      session.phoneE164Encrypted,
      session.phoneLast4,
      session.phoneEncryptedAt,
      session.phoneEncryptionKeyVersion,
      session.otpProvider,
      session.twilioVerifyServiceSid,
      session.twilioVerifySid,
      session.twilioVerifyChannel,
      session.twilioVerifyStatus,
      session.twilioVerifyErrorCode,
      session.twilioVerifyErrorMessage,
      session.emailHash,
      session.leadContactEncrypted,
      session.leadContactEncryptedAt,
      session.leadContactEncryptionKeyVersion,
      session.id
    ).run();
  } else {
    getMemorySessions().set(session.id, session);
  }

  await recordLeadQualification(session, env, { action: 'update_lead_session' });
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

function noDeliveryStatusForGeo(session: LeadSession): string | null {
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
  return status.endsWith('_no_delivery') ||
    status === 'unmapped_no_attorney_delivery' ||
    status === 'duplicate_30d_no_charge';
}

function generateOtp(env: WorkerEnv): string {
  if (env.OTP_DEV_CODE && env.NODE_ENV !== 'production') {
    return env.OTP_DEV_CODE;
  }

  const min = 10 ** (OTP_CODE_LENGTH - 1);
  const max = (10 ** OTP_CODE_LENGTH) - 1;
  return Math.floor(min + Math.random() * (max - min + 1)).toString();
}

interface PhoneVerificationStartResult {
  provider: string;
  otpHash: string | null;
  otpExpiresAt: string | null;
  verificationSid: string | null;
  serviceSid: string | null;
  channel: string | null;
  providerStatus: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  devCode?: string;
}

interface PhoneVerificationCheckResult {
  approved: boolean;
  providerStatus: string;
  errorCode: string | null;
  errorMessage: string | null;
}

async function startPhoneVerification(
  sessionId: string,
  phoneE164: string,
  env: WorkerEnv
): Promise<PhoneVerificationStartResult> {
  const provider = env.SMS_PROVIDER || 'dev_stub';
  const wantsTwilioVerify = provider === 'twilio' || provider === 'twilio_verify';
  const canUseTwilioVerify = wantsTwilioVerify &&
    env.TWILIO_ACCOUNT_SID &&
    env.TWILIO_AUTH_TOKEN &&
    env.TWILIO_VERIFY_SERVICE_SID;

  if (canUseTwilioVerify) {
    const body = new URLSearchParams();
    body.set('To', `+${phoneE164}`);
    body.set('Channel', 'sms');

    const response = await fetch(`https://verify.twilio.com/v2/Services/${env.TWILIO_VERIFY_SERVICE_SID}/Verifications`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${btoa(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body
    });
    const payload = await response.json().catch(() => ({})) as {
      sid?: string;
      status?: string;
      channel?: string;
      code?: number | string;
      message?: string;
    };

    if (!response.ok) {
      return {
        provider: 'twilio_verify',
        otpHash: null,
        otpExpiresAt: null,
        verificationSid: payload.sid || null,
        serviceSid: env.TWILIO_VERIFY_SERVICE_SID || null,
        channel: payload.channel || 'sms',
        providerStatus: payload.status || 'failed',
        errorCode: payload.code ? String(payload.code) : String(response.status),
        errorMessage: payload.message || 'Unable to send SMS verification code.'
      };
    }

    return {
      provider: 'twilio_verify',
      otpHash: null,
      otpExpiresAt: null,
      verificationSid: payload.sid || null,
      serviceSid: env.TWILIO_VERIFY_SERVICE_SID || null,
      channel: payload.channel || 'sms',
      providerStatus: payload.status || 'pending',
      errorCode: null,
      errorMessage: null
    };
  }

  if (wantsTwilioVerify && env.NODE_ENV === 'production') {
    throw new Error('Twilio Verify is not configured.');
  }

  const devModeAllowed = env.NODE_ENV !== 'production';
  if (!devModeAllowed) {
    throw new Error('SMS provider is not configured.');
  }

  const code = generateOtp(env);
  return {
    provider: 'dev_stub',
    otpHash: await hashOtp(sessionId, code, env),
    otpExpiresAt: secondsFromNow(OTP_TTL_SECONDS),
    verificationSid: `VEdev${sessionId.replace(/-/g, '').slice(0, 24)}`,
    serviceSid: 'dev_stub',
    channel: 'sms',
    providerStatus: 'pending',
    errorCode: null,
    errorMessage: null,
    devCode: code
  };
}

async function checkPhoneVerification(
  session: LeadSession,
  code: string,
  env: WorkerEnv
): Promise<PhoneVerificationCheckResult> {
  if (session.otpProvider === 'twilio_verify') {
    if (!session.twilioVerifyServiceSid || !session.twilioVerifySid) {
      return {
        approved: false,
        providerStatus: 'missing_verification_sid',
        errorCode: 'missing_verification_sid',
        errorMessage: 'Verification session is missing.'
      };
    }

    const body = new URLSearchParams();
    body.set('VerificationSid', session.twilioVerifySid);
    body.set('Code', code.trim());

    const response = await fetch(`https://verify.twilio.com/v2/Services/${session.twilioVerifyServiceSid}/VerificationCheck`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${btoa(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body
    });
    const payload = await response.json().catch(() => ({})) as {
      status?: string;
      code?: number | string;
      message?: string;
    };

    if (!response.ok) {
      return {
        approved: false,
        providerStatus: payload.status || 'failed',
        errorCode: payload.code ? String(payload.code) : String(response.status),
        errorMessage: payload.message || 'Unable to verify code.'
      };
    }

    return {
      approved: payload.status === 'approved',
      providerStatus: payload.status || 'pending',
      errorCode: null,
      errorMessage: null
    };
  }

  if (!session.otpHash || !session.otpExpiresAt || isExpired(session.otpExpiresAt)) {
    return {
      approved: false,
      providerStatus: 'expired',
      errorCode: 'expired',
      errorMessage: 'The verification code expired. Please request a new code.'
    };
  }

  const candidateHash = await hashOtp(session.id, code.trim(), env);
  return {
    approved: candidateHash === session.otpHash,
    providerStatus: candidateHash === session.otpHash ? 'approved' : 'failed',
    errorCode: candidateHash === session.otpHash ? null : 'incorrect_code',
    errorMessage: candidateHash === session.otpHash ? null : 'That verification code is not correct.'
  };
}

function throwIfVerificationStartFailed(start: PhoneVerificationStartResult): void {
  if (start.errorCode || start.errorMessage) {
    throw new Error(start.errorMessage || 'Unable to send SMS verification code.');
  }
}

export async function startOtpUnlock(
  sessionId: string,
  contact: LeadContactInput,
  consent: AttorneyLeadConsentInput,
  env: WorkerEnv = getWorkerEnv()
): Promise<OtpSendResult> {
  const session = await getLeadSession(sessionId, env);
  if (!session) {
    throw new Error('Estimate session was not found. Please prepare the preview again.');
  }
  if (isExpired(session.expiresAt)) {
    throw new Error('This estimate preview expired. Please prepare a new preview.');
  }

  const attorney = session.attorneyJson ? JSON.parse(session.attorneyJson) as ResponsibleAttorney : null;
  if (!attorney) {
    throw new Error('No named law firm or attorney contact option is available for this estimate.');
  }

  if (!consent.attorneyDeliveryConsent || !consent.phoneContactConsent) {
    throw new Error(`Please confirm permission to send your results to ${attorney.name} and be contacted about your inquiry.`);
  }

  if (session.leadDeliveryStatus !== 'preview_attorney_available') {
    throw new Error('Phone verification is not available for this estimate.');
  }

  const normalizedContact = normalizeLeadContact(contact);
  if (!isValidUsMobileCandidate(normalizedContact.phone)) {
    throw new Error('Please enter a valid US mobile phone number.');
  }

  const geoNoDeliveryStatus = noDeliveryStatusForGeo(session);
  if (geoNoDeliveryStatus) {
    session.leadDeliveryStatus = geoNoDeliveryStatus;
    await updateSession(session, env);
    throw new Error('This optional contact flow is available only for visitors we can confirm are in California.');
  }

  const normalizedPhone = normalizedContact.normalizedPhone;
  const phoneHash = await hashForAudit(normalizedPhone, env);
  const emailHash = await hashForAudit(normalizedContact.email, env);
  const duplicateWithin30Days = await hasRecentSubmittedPhone(phoneHash, session.id, env);

  session.phoneHash = phoneHash;
  session.phoneLast4 = normalizedPhone.slice(-4);
  session.emailHash = emailHash;
  session.attorneyDeliveryConsent = true;
  session.attorneyDeliveryConsentAt = nowIso();
  session.attorneyDeliveryConsentText = consent.consentText;
  session.phoneContactConsent = true;
  session.phoneContactConsentAt = session.attorneyDeliveryConsentAt;
  session.consentCopyVersion = consent.consentCopyVersion;
  session.otpAttempts = 0;
  session.duplicateWithin30Days = duplicateWithin30Days;

  if (duplicateWithin30Days) {
    session.phoneE164Encrypted = null;
    session.phoneEncryptedAt = null;
    session.phoneEncryptionKeyVersion = null;
    session.leadContactEncrypted = null;
    session.leadContactEncryptedAt = null;
    session.leadContactEncryptionKeyVersion = null;
    session.otpHash = null;
    session.otpExpiresAt = null;
    session.otpStatus = 'not_started';
    session.otpProvider = 'skipped_duplicate_no_charge';
    session.twilioVerifyServiceSid = null;
    session.twilioVerifySid = null;
    session.twilioVerifyChannel = null;
    session.twilioVerifyStatus = 'skipped';
    session.twilioVerifyErrorCode = null;
    session.twilioVerifyErrorMessage = null;
    session.leadDeliveryStatus = 'duplicate_30d_no_charge';
    await updateSession(session, env);

    return {
      maskedPhone: maskPhone(normalizedContact.phone),
      duplicateWithin30Days: true,
      provider: 'skipped_duplicate_no_charge',
      otpLength: 0,
      providerStatus: 'skipped'
    };
  }

  const encryptedPhone = await encryptPhoneE164(`+${normalizedPhone}`, env);
  const encryptedContact = await encryptLeadContactIdentity({
    firstName: normalizedContact.firstName,
    lastName: normalizedContact.lastName,
    email: normalizedContact.email
  }, env);
  const encryptedAt = nowIso();

  session.phoneE164Encrypted = encryptedPhone;
  session.phoneEncryptedAt = encryptedAt;
  session.phoneEncryptionKeyVersion = phoneEncryptionKeyVersion(env);
  session.leadContactEncrypted = encryptedContact;
  session.leadContactEncryptedAt = encryptedAt;
  session.leadContactEncryptionKeyVersion = leadContactEncryptionKeyVersion(env);
  session.otpStatus = 'pending_send';
  await updateSession(session, env);

  const verificationStart = await startPhoneVerification(session.id, normalizedPhone, env);

  session.otpProvider = verificationStart.provider;
  session.otpHash = verificationStart.otpHash;
  session.otpExpiresAt = verificationStart.otpExpiresAt;
  session.twilioVerifyServiceSid = verificationStart.serviceSid;
  session.twilioVerifySid = verificationStart.verificationSid;
  session.twilioVerifyChannel = verificationStart.channel;
  session.twilioVerifyStatus = verificationStart.providerStatus;
  session.twilioVerifyErrorCode = verificationStart.errorCode;
  session.twilioVerifyErrorMessage = verificationStart.errorMessage;
  session.otpStatus = verificationStart.errorCode || verificationStart.errorMessage ? 'failed' : 'sent';
  await updateSession(session, env);
  throwIfVerificationStartFailed(verificationStart);

  return {
    maskedPhone: maskPhone(normalizedContact.phone),
    duplicateWithin30Days,
    provider: verificationStart.provider,
    otpLength: OTP_CODE_LENGTH,
    providerStatus: verificationStart.providerStatus || undefined,
    devCode: verificationStart.devCode
  };
}

export async function unlockEstimateOnly(
  sessionId: string,
  env: WorkerEnv = getWorkerEnv()
): Promise<{ session: LeadSession; result: SettlementResult }> {
  const session = await getLeadSession(sessionId, env);
  if (!session) {
    throw new Error('Estimate session was not found. Please prepare the preview again.');
  }
  if (isExpired(session.expiresAt)) {
    throw new Error('This estimate preview expired. Please prepare a new preview.');
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
  session.phoneE164Encrypted = null;
  session.phoneLast4 = null;
  session.phoneEncryptedAt = null;
  session.phoneEncryptionKeyVersion = null;
  session.emailHash = null;
  session.leadContactEncrypted = null;
  session.leadContactEncryptedAt = null;
  session.leadContactEncryptionKeyVersion = null;
  session.otpHash = null;
  session.otpExpiresAt = null;
  session.otpAttempts = 0;
  session.otpStatus = 'not_started';
  session.otpProvider = 'none';
  session.twilioVerifyServiceSid = null;
  session.twilioVerifySid = null;
  session.twilioVerifyChannel = null;
  session.twilioVerifyStatus = null;
  session.twilioVerifyErrorCode = null;
  session.twilioVerifyErrorMessage = null;
  session.duplicateWithin30Days = session.leadDeliveryStatus === 'duplicate_30d_no_charge'
    ? true
    : false;
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
  if (!session) {
    throw new Error('Estimate session was not found. Please prepare the preview again.');
  }
  if (isExpired(session.expiresAt)) {
    throw new Error('This estimate preview expired. Please prepare a new preview.');
  }

  if (session.otpAttempts >= 5) {
    throw new Error('Too many verification attempts. Please prepare a new preview.');
  }

  const verificationCheck = await checkPhoneVerification(session, code, env);
  session.twilioVerifyStatus = verificationCheck.providerStatus;
  session.twilioVerifyErrorCode = verificationCheck.errorCode;
  session.twilioVerifyErrorMessage = verificationCheck.errorMessage;

  if (verificationCheck.errorCode === 'expired') {
    session.otpStatus = 'expired';
    await updateSession(session, env);
    throw new Error(verificationCheck.errorMessage || 'The verification code expired. Please request a new code.');
  }

  if (!verificationCheck.approved) {
    session.otpAttempts += 1;
    session.otpStatus = 'failed';
    await updateSession(session, env);
    throw new Error(verificationCheck.errorMessage || 'That verification code is not correct.');
  }

  const attorney = session.attorneyJson ? JSON.parse(session.attorneyJson) as ResponsibleAttorney : null;
  if (attorney && (!session.attorneyDeliveryConsent || !session.phoneContactConsent)) {
    throw new Error(`Please confirm permission to send your results to ${attorney.name}.`);
  }

  const geoNoDeliveryStatus = noDeliveryStatusForGeo(session);
  session.otpStatus = 'verified';
  session.twilioVerifyErrorCode = null;
  session.twilioVerifyErrorMessage = null;
  session.leadDeliveryStatus = session.duplicateWithin30Days
    ? 'duplicate_30d_no_charge'
    : geoNoDeliveryStatus
      ? geoNoDeliveryStatus
      : attorney
      ? 'ready_for_delivery'
      : 'unmapped_no_attorney_delivery';
  await updateSession(session, env);
  const qualification = await recordLeadQualification(session, env, { action: 'verify_otp_unlock' });
  await queueLeadDeliveryIfEligible(session, qualification, env);

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
