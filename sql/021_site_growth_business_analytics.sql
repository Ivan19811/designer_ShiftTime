BEGIN;

-- 01228 · Daily per-site resource/storage checkpoints for historical growth analytics.
CREATE TABLE IF NOT EXISTS shifttime_site_metric_snapshots (
  id bigserial PRIMARY KEY,
  snapshot_date date NOT NULL DEFAULT current_date,
  captured_at timestamptz NOT NULL DEFAULT now(),
  account_id text NOT NULL REFERENCES platform_accounts(id) ON DELETE CASCADE,
  workspace_id text REFERENCES platform_workspaces(id) ON DELETE CASCADE,
  store_id text REFERENCES platform_stores(id) ON DELETE CASCADE,
  site_id text NOT NULL REFERENCES shifttime_builder_sites(id) ON DELETE CASCADE,
  r2_physical_bytes bigint NOT NULL DEFAULT 0 CHECK (r2_physical_bytes >= 0),
  logical_referenced_bytes bigint NOT NULL DEFAULT 0 CHECK (logical_referenced_bytes >= 0),
  resource_count integer NOT NULL DEFAULT 0 CHECK (resource_count >= 0),
  shared_resource_count integer NOT NULL DEFAULT 0 CHECK (shared_resource_count >= 0),
  broken_reference_count integer NOT NULL DEFAULT 0 CHECK (broken_reference_count >= 0),
  source text NOT NULL DEFAULT 'site-resource-inventory',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE(account_id,site_id,snapshot_date)
);

CREATE INDEX IF NOT EXISTS idx_site_metric_snapshots_account_site_date_01228
  ON shifttime_site_metric_snapshots(account_id,site_id,snapshot_date DESC);

CREATE INDEX IF NOT EXISTS idx_site_metric_snapshots_store_date_01228
  ON shifttime_site_metric_snapshots(store_id,snapshot_date DESC)
  WHERE store_id IS NOT NULL;

COMMIT;
