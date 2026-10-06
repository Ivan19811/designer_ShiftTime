BEGIN;

CREATE TABLE IF NOT EXISTS shifttime_ai_consultant_llm_runs (
  id text PRIMARY KEY,
  consultant_id text NOT NULL REFERENCES shifttime_ai_consultants(id) ON DELETE CASCADE,
  session_id text REFERENCES shifttime_ai_consultant_sessions(id) ON DELETE SET NULL,
  account_id text NOT NULL REFERENCES platform_accounts(id) ON DELETE CASCADE,
  workspace_id text NOT NULL REFERENCES platform_workspaces(id) ON DELETE CASCADE,
  store_id text NOT NULL REFERENCES platform_stores(id) ON DELETE CASCADE,
  site_id text NOT NULL REFERENCES shifttime_builder_sites(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'openai',
  model text NOT NULL DEFAULT '',
  status text NOT NULL CHECK (status IN ('completed','failed','skipped')),
  response_id text NOT NULL DEFAULT '',
  input_chars integer NOT NULL DEFAULT 0 CHECK (input_chars >= 0),
  output_chars integer NOT NULL DEFAULT 0 CHECK (output_chars >= 0),
  input_tokens integer NOT NULL DEFAULT 0 CHECK (input_tokens >= 0),
  output_tokens integer NOT NULL DEFAULT 0 CHECK (output_tokens >= 0),
  total_tokens integer NOT NULL DEFAULT 0 CHECK (total_tokens >= 0),
  latency_ms integer NOT NULL DEFAULT 0 CHECK (latency_ms >= 0),
  error_code text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_consultant_llm_runs_scope_01417
  ON shifttime_ai_consultant_llm_runs(account_id,workspace_id,store_id,site_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_consultant_llm_runs_session_01417
  ON shifttime_ai_consultant_llm_runs(session_id,created_at DESC);

COMMIT;
