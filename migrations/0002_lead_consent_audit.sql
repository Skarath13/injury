ALTER TABLE lead_sessions ADD COLUMN attorney_delivery_consent INTEGER NOT NULL DEFAULT 0;
ALTER TABLE lead_sessions ADD COLUMN attorney_delivery_consent_at TEXT;
ALTER TABLE lead_sessions ADD COLUMN attorney_delivery_consent_text TEXT;
ALTER TABLE lead_sessions ADD COLUMN phone_contact_consent INTEGER NOT NULL DEFAULT 0;
ALTER TABLE lead_sessions ADD COLUMN phone_contact_consent_at TEXT;
ALTER TABLE lead_sessions ADD COLUMN privacy_choice_snapshot TEXT;
ALTER TABLE lead_sessions ADD COLUMN gpc_status TEXT NOT NULL DEFAULT 'unknown';
