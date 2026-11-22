-- 01563 · Store-scoped NP price estimate snapshot; NOT a final shipping cost or real order.
BEGIN;
CREATE TABLE IF NOT EXISTS shifttime_order_carrier_quotes_01563 (
 draft_id text PRIMARY KEY REFERENCES shifttime_checkout_review_queue_01556(draft_id) ON DELETE CASCADE,
 store_id text NOT NULL REFERENCES platform_stores(id) ON DELETE CASCADE,
 site_id text NOT NULL,
 cart_fingerprint text NOT NULL,
 packing_fingerprint text NOT NULL,
 recipient_city_ref text NOT NULL,
 recipient_warehouse_ref text NOT NULL,
 sender_city_ref text NOT NULL,
 total_weight_grams bigint NOT NULL CHECK(total_weight_grams>0),
 number_of_packages integer NOT NULL CHECK(number_of_packages>0),
 old_shipping_cents bigint NOT NULL CHECK(old_shipping_cents>0),
 subtotal_cents bigint NOT NULL CHECK (subtotal_cents>0),
 carrier_price_cents bigint NOT NULL CHECK (carrier_price_cents>0),
 checked_by_user_id text REFERENCES platform_users(id) ON DELETE SET NULL,
 checked_at timestamptz NOT NULL,
 expires_at timestamptz NOT NULL CHECK(expires_at>checked_at)
);
CREATE INDEX IF NOT EXISTS idx_orders_carrier_requote_01563_store ON shifttime_order_carrier_quotes_01563(store_id,expires_at DESC);
CREATE TABLE IF NOT EXISTS shifttime_order_carrier_quote_history_01563 (
 id bigserial PRIMARY KEY,
 draft_id text NOT NULL REFERENCES shifttime_checkout_review_queue_01556(draft_id) ON DELETE CASCADE,
 store_id text NOT NULL REFERENCES platform_stores(id) ON DELETE CASCADE,
 old_shipping_cents bigint NOT NULL CHECK (old_shipping_cents>0),
 carrier_price_cents bigint NOT NULL CHECK (carrier_price_cents>0),
 checked_by_user_id text REFERENCES platform_users(id) ON DELETE SET NULL,
 checked_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_orders_quote_history_01563 ON shifttime_order_carrier_quote_history_01563(store_id,draft_id,id DESC);
COMMIT;
