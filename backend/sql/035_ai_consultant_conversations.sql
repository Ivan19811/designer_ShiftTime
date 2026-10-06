BEGIN;

CREATE TABLE IF NOT EXISTS shifttime_ai_consultant_sessions (
  id text PRIMARY KEY,
  consultant_id text NOT NULL REFERENCES shifttime_ai_consultants(id) ON DELETE CASCADE,
  account_id text NOT NULL REFERENCES platform_accounts(id) ON DELETE CASCADE,
  workspace_id text NOT NULL REFERENCES platform_workspaces(id) ON DELETE CASCADE,
  store_id text NOT NULL REFERENCES platform_stores(id) ON DELETE CASCADE,
  site_id text NOT NULL REFERENCES shifttime_builder_sites(id) ON DELETE CASCADE,
  channel text NOT NULL DEFAULT 'builder-preview' CHECK (channel IN ('builder-preview','site-runtime')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','closed')),
  context jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by text REFERENCES platform_users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_activity_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_consultant_sessions_scope_01413
  ON shifttime_ai_consultant_sessions(account_id,workspace_id,store_id,site_id,last_activity_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_consultant_sessions_consultant_01413
  ON shifttime_ai_consultant_sessions(consultant_id,last_activity_at DESC);

CREATE TABLE IF NOT EXISTS shifttime_ai_consultant_turns (
  id text PRIMARY KEY,
  session_id text NOT NULL REFERENCES shifttime_ai_consultant_sessions(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user','assistant')),
  message text NOT NULL DEFAULT '',
  response_code text NOT NULL DEFAULT '',
  query_plan jsonb NOT NULL DEFAULT '{}'::jsonb,
  result_summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_consultant_turns_session_01413
  ON shifttime_ai_consultant_turns(session_id,created_at,id);

COMMIT;
