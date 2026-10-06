BEGIN;

ALTER TABLE shifttime_notification_deliveries
  ADD COLUMN IF NOT EXISTS recipient_key text NOT NULL DEFAULT 'default',
  ADD COLUMN IF NOT EXISTS recipient_user_id text REFERENCES platform_users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS recipient_role text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS recipient_name text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS recipient_email text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS matched_rule_ids jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE shifttime_notification_deliveries
  DROP CONSTRAINT IF EXISTS shifttime_notification_deliveries_store_id_event_key_channel_key;

CREATE UNIQUE INDEX IF NOT EXISTS uq_notification_deliveries_recipient_01416
  ON shifttime_notification_deliveries(store_id,event_key,channel,recipient_key);
CREATE INDEX IF NOT EXISTS idx_notification_deliveries_recipient_user_01416
  ON shifttime_notification_deliveries(store_id,recipient_user_id,updated_at DESC)
  WHERE recipient_user_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS shifttime_notification_user_receipts (
  store_id text NOT NULL REFERENCES platform_stores(id) ON DELETE CASCADE,
  provider text NOT NULL,
  event_key text NOT NULL,
  user_id text NOT NULL REFERENCES platform_users(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('read','dismissed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(store_id,provider,event_key,user_id)
);
CREATE INDEX IF NOT EXISTS idx_notification_user_receipts_user_01416
  ON shifttime_notification_user_receipts(user_id,store_id,status,updated_at DESC);

COMMIT;
