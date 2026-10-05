BEGIN;

CREATE TABLE IF NOT EXISTS shifttime_notification_receipts (
  store_id text NOT NULL REFERENCES platform_stores(id) ON DELETE CASCADE,
  provider text NOT NULL,
  event_key text NOT NULL,
  status text NOT NULL CHECK (status IN ('read','dismissed')),
  actor_user_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (store_id, provider, event_key)
);
CREATE INDEX IF NOT EXISTS idx_notification_receipts_store_status_01404
  ON shifttime_notification_receipts(store_id, status, updated_at DESC);

-- Existing orders predate Notification Center 01404 and must not flood the first unread inbox.
INSERT INTO shifttime_notification_receipts(store_id,provider,event_key,status)
SELECT store_id,'orders',id,'read' FROM marketplace_seller_orders
ON CONFLICT(store_id,provider,event_key) DO NOTHING;

CREATE TABLE IF NOT EXISTS shifttime_customer_messages (
  id text PRIMARY KEY,
  account_id text NOT NULL,
  workspace_id text NOT NULL,
  store_id text NOT NULL REFERENCES platform_stores(id) ON DELETE CASCADE,
  builder_site_id text NOT NULL,
  published_site_id text,
  site_name text NOT NULL DEFAULT '',
  channel text NOT NULL DEFAULT 'contact-form' CHECK (channel IN ('contact-form','product-question','chat','callback','other')),
  subject text NOT NULL DEFAULT '',
  body text NOT NULL,
  customer jsonb NOT NULL DEFAULT '{}'::jsonb,
  context jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip_hash text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','read','closed','spam')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_customer_messages_store_status_01404
  ON shifttime_customer_messages(store_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_customer_messages_site_created_01404
  ON shifttime_customer_messages(builder_site_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_customer_messages_rate_01404
  ON shifttime_customer_messages(builder_site_id, ip_hash, created_at DESC);

COMMIT;
