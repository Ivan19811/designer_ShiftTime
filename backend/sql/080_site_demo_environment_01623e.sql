-- 01623E: isolated Netlify demo projects per Builder site. Never reuse the production Netlify Site ID.
BEGIN;
CREATE TABLE IF NOT EXISTS shifttime_published_demo_sites (
  id text PRIMARY KEY,
  account_id text NOT NULL REFERENCES platform_accounts(id) ON DELETE CASCADE,
  workspace_id text NOT NULL REFERENCES platform_workspaces(id) ON DELETE CASCADE,
  store_id text NOT NULL REFERENCES platform_stores(id) ON DELETE CASCADE,
  builder_site_id text NOT NULL,
  site_name text NOT NULL DEFAULT '',
  site_slug text NOT NULL DEFAULT '',
  provider text NOT NULL DEFAULT 'netlify' CHECK (provider='netlify'),
  netlify_site_id text UNIQUE,
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
  traffic_identity_token text,
  created_by_user_id text REFERENCES platform_users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(store_id,builder_site_id)
);
CREATE TABLE IF NOT EXISTS shifttime_site_demo_deployments (
  id text PRIMARY KEY,
  published_site_id text NOT NULL REFERENCES shifttime_published_demo_sites(id) ON DELETE CASCADE,
  netlify_deploy_id text NOT NULL UNIQUE,
  revision text NOT NULL DEFAULT '',
  state text NOT NULL DEFAULT 'new',
  error text NOT NULL DEFAULT '',
  created_by_user_id text REFERENCES platform_users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_site_demo_scope_01623e ON shifttime_published_demo_sites(account_id,workspace_id,store_id,updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_site_demo_deployments_01623e ON shifttime_site_demo_deployments(published_site_id,created_at DESC);
COMMIT;
