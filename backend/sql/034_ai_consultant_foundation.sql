BEGIN;

CREATE TABLE IF NOT EXISTS shifttime_ai_consultants (
  id text PRIMARY KEY,
  account_id text NOT NULL REFERENCES platform_accounts(id) ON DELETE CASCADE,
  workspace_id text NOT NULL REFERENCES platform_workspaces(id) ON DELETE CASCADE,
  store_id text NOT NULL REFERENCES platform_stores(id) ON DELETE CASCADE,
  site_id text NOT NULL REFERENCES shifttime_builder_sites(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT false,
  name text NOT NULL DEFAULT '',
  mode text NOT NULL DEFAULT 'assist' CHECK (mode IN ('assist','recommend')),
  product_search_enabled boolean NOT NULL DEFAULT true,
  discounts_enabled boolean NOT NULL DEFAULT false,
  conversation_enabled boolean NOT NULL DEFAULT true,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by text REFERENCES platform_users(id) ON DELETE SET NULL,
  updated_by text REFERENCES platform_users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(store_id,site_id)
);

CREATE INDEX IF NOT EXISTS idx_ai_consultants_scope_01411
  ON shifttime_ai_consultants(account_id,workspace_id,store_id,updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_consultants_site_01411
  ON shifttime_ai_consultants(site_id,updated_at DESC);

COMMIT;
