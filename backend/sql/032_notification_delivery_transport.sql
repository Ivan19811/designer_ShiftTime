BEGIN;

CREATE TABLE IF NOT EXISTS shifttime_notification_deliveries (
  id text PRIMARY KEY,
  account_id text NOT NULL,
  workspace_id text NOT NULL,
  store_id text NOT NULL REFERENCES platform_stores(id) ON DELETE CASCADE,
  event_key text NOT NULL,
  event_type text NOT NULL,
  provider text NOT NULL,
  channel text NOT NULL CHECK (channel IN ('email','telegram','webhook','slack')),
  severity text NOT NULL CHECK (severity IN ('low','medium','high','critical')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','failed','skipped')),
  attempt_count integer NOT NULL DEFAULT 0,
  notification jsonb NOT NULL DEFAULT '{}'::jsonb,
  event_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  response_code integer,
  error_code text NOT NULL DEFAULT '',
  error_detail text NOT NULL DEFAULT '',
  external_id text NOT NULL DEFAULT '',
  last_attempt_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(store_id,event_key,channel)
);
CREATE INDEX IF NOT EXISTS idx_notification_deliveries_store_status_01409
  ON shifttime_notification_deliveries(store_id,status,updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_deliveries_store_event_01409
  ON shifttime_notification_deliveries(store_id,event_type,updated_at DESC);

COMMIT;
