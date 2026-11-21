BEGIN;

-- 01084 · Real Auth / User Registration.
-- Historical migrations 001..011 stay immutable; credentials are added forward-only.
CREATE TABLE IF NOT EXISTS platform_user_credentials (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES platform_users(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'password' CHECK (kind IN ('password')),
  algorithm text NOT NULL DEFAULT 'scrypt-v1',
  secret_hash text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, kind)
);

CREATE INDEX IF NOT EXISTS idx_platform_user_credentials_user
  ON platform_user_credentials(user_id, kind);

CREATE INDEX IF NOT EXISTS idx_api_sessions_user_status
  ON api_sessions(user_id, status, expires_at);

COMMIT;
