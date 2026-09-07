BEGIN;

CREATE TABLE IF NOT EXISTS shifttime_published_sites (
  id text PRIMARY KEY,
  account_id text NOT NULL REFERENCES platform_accounts(id) ON DELETE CASCADE,
  workspace_id text NOT NULL REFERENCES platform_workspaces(id) ON DELETE CASCADE,
  store_id text NOT NULL REFERENCES platform_stores(id) ON DELETE CASCADE,
  builder_site_id text NOT NULL,
  site_name text NOT NULL DEFAULT '',
  site_slug text NOT NULL DEFAULT '',
  provider text NOT NULL DEFAULT 'netlify' CHECK (provider IN ('netlify')),
  netlify_site_id text,
  netlify_site_name text NOT NULL DEFAULT '',
  netlify_url text NOT NULL DEFAULT '',
  netlify_ssl_url text NOT NULL DEFAULT '',
  netlify_admin_url text NOT NULL DEFAULT '',
  last_deploy_id text,
  last_deploy_state text NOT NULL DEFAULT 'not-published',
  requested_revision text NOT NULL DEFAULT '',
  published_revision text NOT NULL DEFAULT '',
  last_publish_error text NOT NULL DEFAULT '',
  last_published_at timestamptz,
  created_by_user_id text REFERENCES platform_users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(store_id,builder_site_id),
  UNIQUE(netlify_site_id)
);

CREATE TABLE IF NOT EXISTS shifttime_site_deployments (
  id text PRIMARY KEY,
  published_site_id text NOT NULL REFERENCES shifttime_published_sites(id) ON DELETE CASCADE,
  netlify_deploy_id text NOT NULL UNIQUE,
  revision text NOT NULL DEFAULT '',
  state text NOT NULL DEFAULT 'new',
  error text NOT NULL DEFAULT '',
  created_by_user_id text REFERENCES platform_users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_shifttime_published_sites_scope_01143
  ON shifttime_published_sites(account_id,workspace_id,store_id,updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_shifttime_site_deployments_site_01143
  ON shifttime_site_deployments(published_site_id,created_at DESC);

COMMIT;
