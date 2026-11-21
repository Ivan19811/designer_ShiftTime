BEGIN;

CREATE TABLE IF NOT EXISTS shifttime_traffic_events (
  id bigserial PRIMARY KEY,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  request_id text NOT NULL,
  dedupe_key text NOT NULL UNIQUE,
  account_id text NOT NULL,
  workspace_id text,
  store_id text,
  actor_user_id text,
  site_id text,
  module text NOT NULL DEFAULT 'http',
  operation text NOT NULL DEFAULT 'http.request',
  route_key text NOT NULL DEFAULT '',
  event_type text NOT NULL DEFAULT 'http',
  integration text NOT NULL DEFAULT 'browser',
  inbound_bytes bigint NOT NULL DEFAULT 0 CHECK (inbound_bytes >= 0),
  outbound_bytes bigint NOT NULL DEFAULT 0 CHECK (outbound_bytes >= 0),
  render_billable_outbound_bytes bigint NOT NULL DEFAULT 0 CHECK (render_billable_outbound_bytes >= 0),
  status_code integer NOT NULL DEFAULT 0,
  result text NOT NULL DEFAULT 'success' CHECK (result IN ('success','failed')),
  duration_ms integer NOT NULL DEFAULT 0 CHECK (duration_ms >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shifttime_traffic_events_account_time_01194
  ON shifttime_traffic_events(account_id,occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_shifttime_traffic_events_account_module_time_01194
  ON shifttime_traffic_events(account_id,module,occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_shifttime_traffic_events_account_site_time_01194
  ON shifttime_traffic_events(account_id,site_id,occurred_at DESC)
  WHERE site_id IS NOT NULL;

COMMIT;
