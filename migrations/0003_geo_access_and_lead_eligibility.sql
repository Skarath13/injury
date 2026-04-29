ALTER TABLE lead_sessions ADD COLUMN visitor_country TEXT;
ALTER TABLE lead_sessions ADD COLUMN visitor_region_code TEXT;
ALTER TABLE lead_sessions ADD COLUMN visitor_region TEXT;
ALTER TABLE lead_sessions ADD COLUMN visitor_city TEXT;
ALTER TABLE lead_sessions ADD COLUMN geo_eligibility_status TEXT NOT NULL DEFAULT 'unknown';

CREATE INDEX IF NOT EXISTS idx_lead_sessions_geo_eligibility_created
  ON lead_sessions (geo_eligibility_status, created_at);

CREATE TABLE IF NOT EXISTS geo_access_logs (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  path TEXT NOT NULL,
  method TEXT NOT NULL,
  decision TEXT NOT NULL,
  reason TEXT,
  mode TEXT NOT NULL,
  lead_eligibility TEXT NOT NULL,
  country TEXT,
  region_code TEXT,
  region TEXT,
  city TEXT,
  ip_hash TEXT NOT NULL,
  user_agent_hash TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_geo_access_logs_created
  ON geo_access_logs (created_at);

CREATE INDEX IF NOT EXISTS idx_geo_access_logs_decision_created
  ON geo_access_logs (decision, created_at);
