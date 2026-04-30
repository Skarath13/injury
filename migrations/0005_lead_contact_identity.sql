ALTER TABLE lead_sessions ADD COLUMN email_hash TEXT;
ALTER TABLE lead_sessions ADD COLUMN lead_contact_encrypted TEXT;
ALTER TABLE lead_sessions ADD COLUMN lead_contact_encrypted_at TEXT;
ALTER TABLE lead_sessions ADD COLUMN lead_contact_encryption_key_version TEXT;

CREATE INDEX IF NOT EXISTS idx_lead_sessions_email_created
  ON lead_sessions (email_hash, created_at);

DROP TRIGGER IF EXISTS trg_lead_delivery_queue_guard;

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
      AND s.email_hash IS NOT NULL
      AND s.lead_contact_encrypted IS NOT NULL
      AND q.qualification_status = 'valid'
      AND q.verification_status = 'verified'
      AND r.active = 1
  )
BEGIN
  SELECT RAISE(ABORT, 'lead_delivery_queue_guard_failed');
END;
