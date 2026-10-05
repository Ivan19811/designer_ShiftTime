CREATE TABLE IF NOT EXISTS commerce_supplier_sync_alert_rules (
  store_id text PRIMARY KEY,
  account_id text NOT NULL,
  workspace_id text NOT NULL,
  rules jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE commerce_supplier_sync_alerts DROP CONSTRAINT IF EXISTS commerce_supplier_sync_alerts_kind_check;
ALTER TABLE commerce_supplier_sync_alerts ADD CONSTRAINT commerce_supplier_sync_alerts_kind_check CHECK (kind IN ('approval-ready','risk-detected','price-change','stock-zero','scheduler-error'));
