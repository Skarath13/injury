ALTER TABLE lead_sessions ADD COLUMN phone_e164_encrypted TEXT;
ALTER TABLE lead_sessions ADD COLUMN phone_last4 TEXT;
ALTER TABLE lead_sessions ADD COLUMN phone_encrypted_at TEXT;
ALTER TABLE lead_sessions ADD COLUMN phone_encryption_key_version TEXT;
ALTER TABLE lead_sessions ADD COLUMN otp_provider TEXT NOT NULL DEFAULT 'none';
ALTER TABLE lead_sessions ADD COLUMN twilio_verify_service_sid TEXT;
ALTER TABLE lead_sessions ADD COLUMN twilio_verify_sid TEXT;
ALTER TABLE lead_sessions ADD COLUMN twilio_verify_channel TEXT;
ALTER TABLE lead_sessions ADD COLUMN twilio_verify_status TEXT;
ALTER TABLE lead_sessions ADD COLUMN twilio_verify_error_code TEXT;
ALTER TABLE lead_sessions ADD COLUMN twilio_verify_error_message TEXT;

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
  override_at TEXT,
  FOREIGN KEY (session_id) REFERENCES lead_sessions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_lead_qualifications_status_updated
  ON lead_qualifications (qualification_status, verification_status, temperature, updated_at);

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
  metadata_json TEXT,
  FOREIGN KEY (session_id) REFERENCES lead_sessions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_lead_qualification_events_session_created
  ON lead_qualification_events (session_id, created_at);

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
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_lead_delivery_recipients_attorney
  ON lead_delivery_recipients (attorney_id)
  WHERE attorney_id IS NOT NULL;

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
  cancelled_at TEXT,
  FOREIGN KEY (session_id) REFERENCES lead_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (recipient_id) REFERENCES lead_delivery_recipients(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_lead_delivery_queue_session_recipient
  ON lead_delivery_queue (session_id, recipient_id);

CREATE INDEX IF NOT EXISTS idx_lead_delivery_queue_status_created
  ON lead_delivery_queue (status, created_at);

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
END;

CREATE VIEW IF NOT EXISTS deliverable_leads_v AS
SELECT
  s.id AS session_id,
  s.created_at,
  s.updated_at,
  s.county,
  s.attorney_id,
  s.phone_last4,
  s.lead_delivery_status,
  q.qualification_status,
  q.verification_status,
  q.temperature,
  q.score,
  q.reasons_json,
  q.qualified_at
FROM lead_sessions AS s
INNER JOIN lead_qualifications AS q ON q.session_id = s.id
WHERE s.attorney_delivery_consent = 1
  AND s.phone_contact_consent = 1
  AND s.geo_eligibility_status = 'california'
  AND s.otp_status = 'verified'
  AND s.duplicate_within_30_days = 0
  AND s.lead_delivery_status = 'ready_for_delivery'
  AND q.qualification_status = 'valid'
  AND q.verification_status = 'verified';

CREATE VIEW IF NOT EXISTS non_deliverable_leads_v AS
SELECT
  s.id AS session_id,
  s.created_at,
  s.updated_at,
  s.county,
  s.attorney_id,
  s.lead_delivery_status,
  s.otp_status,
  s.geo_eligibility_status,
  s.attorney_delivery_consent,
  s.phone_contact_consent,
  s.duplicate_within_30_days,
  q.qualification_status,
  q.verification_status,
  q.temperature,
  q.reasons_json
FROM lead_sessions AS s
LEFT JOIN lead_qualifications AS q ON q.session_id = s.id
WHERE q.qualification_status IS NULL
  OR q.qualification_status != 'valid'
  OR q.verification_status != 'verified'
  OR s.lead_delivery_status != 'ready_for_delivery'
  OR s.duplicate_within_30_days = 1
  OR s.attorney_delivery_consent = 0
  OR s.phone_contact_consent = 0
  OR s.geo_eligibility_status != 'california';

CREATE VIEW IF NOT EXISTS consented_leads_v AS
SELECT
  id AS session_id,
  created_at,
  updated_at,
  county,
  attorney_id,
  phone_last4,
  attorney_delivery_consent_at,
  phone_contact_consent_at,
  consent_copy_version,
  lead_delivery_status
FROM lead_sessions
WHERE attorney_delivery_consent = 1
  AND phone_contact_consent = 1;

CREATE VIEW IF NOT EXISTS non_consented_sessions_v AS
SELECT
  id AS session_id,
  created_at,
  updated_at,
  county,
  attorney_id,
  lead_delivery_status,
  attorney_delivery_consent,
  phone_contact_consent
FROM lead_sessions
WHERE attorney_delivery_consent = 0
  OR phone_contact_consent = 0;
