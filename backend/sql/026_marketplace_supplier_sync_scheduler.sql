CREATE TABLE IF NOT EXISTS commerce_supplier_sync_schedules (
  id text PRIMARY KEY,
  account_id text NOT NULL,
  workspace_id text NOT NULL,
  store_id text NOT NULL,
  supplier_source_id text NOT NULL,
  created_by_user_id text,
  enabled boolean NOT NULL DEFAULT false,
  mode text NOT NULL DEFAULT 'validate' CHECK (mode IN ('validate','apply')),
  cadence_minutes integer NOT NULL DEFAULT 1440 CHECK (cadence_minutes BETWEEN 15 AND 10080),
  media_mode text NOT NULL DEFAULT 'external-only' CHECK (media_mode IN ('external-only')),
  next_run_at timestamptz,
  lease_until timestamptz,
  last_started_at timestamptz,
  last_finished_at timestamptz,
  last_status text NOT NULL DEFAULT 'never',
  last_error text NOT NULL DEFAULT '',
  last_summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  run_count bigint NOT NULL DEFAULT 0,
  success_count bigint NOT NULL DEFAULT 0,
  failure_count bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(store_id,supplier_source_id)
);
CREATE INDEX IF NOT EXISTS idx_commerce_supplier_sync_due ON commerce_supplier_sync_schedules(enabled,next_run_at) WHERE enabled=true;
CREATE INDEX IF NOT EXISTS idx_commerce_supplier_sync_store ON commerce_supplier_sync_schedules(store_id,updated_at DESC);
