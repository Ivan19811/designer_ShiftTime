-- 01595 · Site-customer sessions are deliberately isolated from API/SSO sessions.
-- 01592 tables must exist before this additive migration runs.
BEGIN;
CREATE TABLE IF NOT EXISTS platform_site_customer_sessions_01595 (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES platform_users(id) ON DELETE CASCADE,
  site_id text NOT NULL REFERENCES shifttime_builder_sites(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'active' CHECK(status IN ('active','revoked')),
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_site_customer_sessions_site_01595 ON platform_site_customer_sessions_01595(site_id,user_id,status,expires_at);
CREATE TABLE IF NOT EXISTS platform_site_customer_flows_01595 (
  id text PRIMARY KEY,
  site_id text NOT NULL REFERENCES shifttime_builder_sites(id) ON DELETE CASCADE,
  published_site_id text NOT NULL REFERENCES shifttime_published_sites(id) ON DELETE CASCADE,
  redirect_origin text NOT NULL,
  redirect_path text NOT NULL,
  client_state text NOT NULL,
  code_challenge text NOT NULL,
  requested_mode text NOT NULL DEFAULT 'login' CHECK(requested_mode IN ('login','register')),
  user_id text REFERENCES platform_users(id) ON DELETE CASCADE,
  code_hash text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT now()+interval '15 minutes',
  consumed_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_site_customer_flows_ttl_01595 ON platform_site_customer_flows_01595(expires_at);
COMMIT;
