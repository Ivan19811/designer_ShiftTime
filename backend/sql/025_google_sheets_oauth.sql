BEGIN;

CREATE TABLE IF NOT EXISTS integration_google_oauth_credentials (
  id text PRIMARY KEY,
  account_id text NOT NULL REFERENCES platform_accounts(id) ON DELETE CASCADE,
  workspace_id text NOT NULL REFERENCES platform_workspaces(id) ON DELETE CASCADE,
  store_id text NOT NULL REFERENCES platform_stores(id) ON DELETE CASCADE,
  user_id text NOT NULL REFERENCES platform_users(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'google',
  status text NOT NULL DEFAULT 'active' CHECK(status IN ('active','revoked')),
  refresh_token_encrypted text NOT NULL,
  scopes jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  UNIQUE(store_id,user_id,provider)
);
CREATE INDEX IF NOT EXISTS idx_google_oauth_credentials_store_01398 ON integration_google_oauth_credentials(store_id,status,updated_at DESC);

CREATE TABLE IF NOT EXISTS integration_google_oauth_states (
  state_hash text PRIMARY KEY,
  account_id text NOT NULL REFERENCES platform_accounts(id) ON DELETE CASCADE,
  workspace_id text NOT NULL REFERENCES platform_workspaces(id) ON DELETE CASCADE,
  store_id text NOT NULL REFERENCES platform_stores(id) ON DELETE CASCADE,
  user_id text NOT NULL REFERENCES platform_users(id) ON DELETE CASCADE,
  return_origin text NOT NULL DEFAULT '',
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_google_oauth_states_expiry_01398 ON integration_google_oauth_states(expires_at);

COMMIT;
