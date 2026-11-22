BEGIN;

CREATE TABLE IF NOT EXISTS shifttime_notification_rules (
  id text PRIMARY KEY,
  account_id text NOT NULL,
  workspace_id text NOT NULL,
  store_id text NOT NULL REFERENCES platform_stores(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  enabled boolean NOT NULL DEFAULT true,
  provider text NOT NULL,
  event_type text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('low','medium','high','critical')),
  conditions jsonb NOT NULL DEFAULT '{"mode":"all","items":[]}'::jsonb,
  actions jsonb NOT NULL DEFAULT '{"notify":true,"channels":["inApp"],"delivery":"immediate"}'::jsonb,
  scope jsonb NOT NULL DEFAULT '{"type":"store"}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notification_rules_store_event_01408
  ON shifttime_notification_rules(store_id, event_type, enabled);
CREATE INDEX IF NOT EXISTS idx_notification_rules_store_provider_01408
  ON shifttime_notification_rules(store_id, provider, updated_at DESC);

COMMIT;
