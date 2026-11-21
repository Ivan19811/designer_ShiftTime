-- 01581: short-lived one-time SSO codes, no cross-app bearer token in URLs.
BEGIN;
CREATE TABLE IF NOT EXISTS platform_sso_codes_01581 (
  code_hash text PRIMARY KEY,
  kind text NOT NULL CHECK (kind IN ('handoff','authorization')),
  session_id text NOT NULL REFERENCES api_sessions(id) ON DELETE CASCADE,
  user_id text NOT NULL REFERENCES platform_users(id) ON DELETE CASCADE,
  client_id text NOT NULL CHECK (client_id IN ('crm','builder')),
  redirect_uri text NOT NULL,
  code_challenge text NOT NULL DEFAULT '',
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS platform_sso_codes_01581_expire_idx ON platform_sso_codes_01581(expires_at);
COMMIT;
