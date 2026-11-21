BEGIN;
CREATE TABLE IF NOT EXISTS shifttime_store_site_links_01625 (
  account_id text NOT NULL REFERENCES platform_accounts(id) ON DELETE CASCADE,
  workspace_id text NOT NULL REFERENCES platform_workspaces(id) ON DELETE CASCADE,
  site_id text NOT NULL REFERENCES shifttime_builder_sites(id) ON DELETE CASCADE,
  store_id text NOT NULL REFERENCES platform_stores(id) ON DELETE CASCADE,
  linked_by_user_id text REFERENCES platform_users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(site_id,store_id)
);
CREATE INDEX IF NOT EXISTS idx_store_site_links_01625_scope ON shifttime_store_site_links_01625(account_id,workspace_id,store_id);
COMMIT;
