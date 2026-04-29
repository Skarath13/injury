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
);

CREATE INDEX IF NOT EXISTS idx_lead_sessions_phone_created
  ON lead_sessions (phone_hash, created_at);
