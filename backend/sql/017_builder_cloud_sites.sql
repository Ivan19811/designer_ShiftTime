BEGIN;

CREATE TABLE IF NOT EXISTS shifttime_builder_sites (
  id text PRIMARY KEY,
  account_id text NOT NULL REFERENCES platform_accounts(id) ON DELETE CASCADE,
  workspace_id text NOT NULL REFERENCES platform_workspaces(id) ON DELETE CASCADE,
  store_id text NOT NULL REFERENCES platform_stores(id) ON DELETE CASCADE,
  owner_user_id text REFERENCES platform_users(id) ON DELETE SET NULL,
  name text NOT NULL DEFAULT '',
  slug text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','archived','delete_failed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS shifttime_builder_site_projects (
  site_id text PRIMARY KEY REFERENCES shifttime_builder_sites(id) ON DELETE CASCADE,
  schema_version text NOT NULL DEFAULT '01170',
  revision bigint NOT NULL DEFAULT 1,
  project_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_by_user_id text REFERENCES platform_users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_shifttime_builder_sites_store_slug_01170
  ON shifttime_builder_sites(store_id,slug)
  WHERE slug<>'';

CREATE INDEX IF NOT EXISTS idx_shifttime_builder_sites_scope_01170
  ON shifttime_builder_sites(account_id,workspace_id,store_id,updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_shifttime_builder_sites_owner_01170
  ON shifttime_builder_sites(owner_user_id,updated_at DESC);

COMMIT;
