ALTER TABLE commerce_supplier_sync_schedules DROP CONSTRAINT IF EXISTS commerce_supplier_sync_schedules_mode_check;
ALTER TABLE commerce_supplier_sync_schedules ADD CONSTRAINT commerce_supplier_sync_schedules_mode_check CHECK (mode IN ('validate','approval','apply'));

CREATE TABLE IF NOT EXISTS commerce_supplier_sync_approvals (
  id text PRIMARY KEY,
  account_id text NOT NULL,
  workspace_id text NOT NULL,
  store_id text NOT NULL,
  supplier_source_id text NOT NULL,
  schedule_id text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','stale')),
  plan_fingerprint text NOT NULL,
  base_revision bigint NOT NULL DEFAULT 0,
  summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  diff jsonb NOT NULL DEFAULT '{}'::jsonb,
  source_meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  reviewed_at timestamptz,
  reviewed_by_user_id text,
  applied_history_id text NOT NULL DEFAULT '',
  last_error text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_commerce_supplier_sync_approvals_store ON commerce_supplier_sync_approvals(store_id,updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_commerce_supplier_sync_approvals_pending ON commerce_supplier_sync_approvals(store_id,status,updated_at DESC) WHERE status='pending';
