-- 01609: Messenger uses the existing tenant-scoped Customer Messages and Inbox tables.
-- Guest access is capability-based; only SHA-256 digests are persisted.
BEGIN;
ALTER TABLE shifttime_customer_messages
  ADD COLUMN IF NOT EXISTS messenger_visitor_hash char(64),
  ADD COLUMN IF NOT EXISTS customer_user_id text REFERENCES platform_users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS production_order_id uuid REFERENCES shifttime_production_orders_01566(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_customer_messenger_customer_01609
  ON shifttime_customer_messages(store_id,customer_user_id,last_activity_at DESC)
  WHERE customer_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_customer_messenger_order_01609
  ON shifttime_customer_messages(store_id,production_order_id)
  WHERE production_order_id IS NOT NULL;
COMMIT;
