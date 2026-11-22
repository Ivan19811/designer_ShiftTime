BEGIN;

CREATE TABLE IF NOT EXISTS shifttime_ai_assistant_settings (
  id text PRIMARY KEY,
  account_id text NOT NULL REFERENCES platform_accounts(id) ON DELETE CASCADE,
  workspace_id text NOT NULL REFERENCES platform_workspaces(id) ON DELETE CASCADE,
  store_id text NOT NULL REFERENCES platform_stores(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT true,
  default_mode text NOT NULL DEFAULT 'prepare' CHECK (default_mode IN ('explain','prepare','execute')),
  require_confirmation_high_risk boolean NOT NULL DEFAULT true,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by text REFERENCES platform_users(id) ON DELETE SET NULL,
  updated_by text REFERENCES platform_users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(store_id)
);

CREATE TABLE IF NOT EXISTS shifttime_ai_assistant_sessions (
  id text PRIMARY KEY,
  account_id text NOT NULL REFERENCES platform_accounts(id) ON DELETE CASCADE,
  workspace_id text NOT NULL REFERENCES platform_workspaces(id) ON DELETE CASCADE,
  store_id text NOT NULL REFERENCES platform_stores(id) ON DELETE CASCADE,
  user_id text REFERENCES platform_users(id) ON DELETE SET NULL,
  mode text NOT NULL DEFAULT 'prepare' CHECK (mode IN ('explain','prepare','execute')),
  title text NOT NULL DEFAULT '',
  context jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','archived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS shifttime_ai_assistant_turns (
  id text PRIMARY KEY,
  session_id text NOT NULL REFERENCES shifttime_ai_assistant_sessions(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user','assistant','system')),
  message text NOT NULL DEFAULT '',
  plan jsonb NOT NULL DEFAULT '{}'::jsonb,
  usage jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS shifttime_ai_assistant_action_runs (
  id text PRIMARY KEY,
  session_id text REFERENCES shifttime_ai_assistant_sessions(id) ON DELETE SET NULL,
  account_id text NOT NULL REFERENCES platform_accounts(id) ON DELETE CASCADE,
  workspace_id text NOT NULL REFERENCES platform_workspaces(id) ON DELETE CASCADE,
  store_id text NOT NULL REFERENCES platform_stores(id) ON DELETE CASCADE,
  user_id text REFERENCES platform_users(id) ON DELETE SET NULL,
  module_id text NOT NULL,
  tool_id text NOT NULL,
  risk text NOT NULL DEFAULT 'low' CHECK (risk IN ('low','medium','high')),
  status text NOT NULL DEFAULT 'planned' CHECK (status IN ('planned','approved','completed','failed','cancelled')),
  args jsonb NOT NULL DEFAULT '{}'::jsonb,
  result jsonb NOT NULL DEFAULT '{}'::jsonb,
  error_code text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_assistant_sessions_scope_01420 ON shifttime_ai_assistant_sessions(account_id,workspace_id,store_id,updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_assistant_turns_session_01420 ON shifttime_ai_assistant_turns(session_id,created_at);
CREATE INDEX IF NOT EXISTS idx_ai_assistant_actions_scope_01420 ON shifttime_ai_assistant_action_runs(account_id,workspace_id,store_id,created_at DESC);

COMMIT;
