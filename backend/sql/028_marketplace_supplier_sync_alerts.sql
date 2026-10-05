ALTER TABLE commerce_supplier_sync_approvals ADD COLUMN IF NOT EXISTS risk jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS commerce_supplier_sync_alerts (
  id text PRIMARY KEY,
  account_id text NOT NULL,
  workspace_id text NOT NULL,
  store_id text NOT NULL,
  supplier_source_id text,
  approval_id text,
  kind text NOT NULL CHECK (kind IN ('approval-ready','risk-detected','scheduler-error')),
  severity text NOT NULL DEFAULT 'info' CHECK (severity IN ('info','warning','high','critical')),
  status text NOT NULL DEFAULT 'unread' CHECK (status IN ('unread','read','dismissed')),
  code text NOT NULL DEFAULT '',
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  dedupe_key text NOT NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(store_id,dedupe_key)
);
CREATE INDEX IF NOT EXISTS idx_commerce_supplier_sync_alerts_store ON commerce_supplier_sync_alerts(store_id,updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_commerce_supplier_sync_alerts_unread ON commerce_supplier_sync_alerts(store_id,status,updated_at DESC) WHERE status='unread';
CREATE INDEX IF NOT EXISTS idx_commerce_supplier_sync_alerts_source ON commerce_supplier_sync_alerts(store_id,supplier_source_id,updated_at DESC);
