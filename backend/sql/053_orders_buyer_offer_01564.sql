-- 01564 · Short-lived, explicitly acknowledged store price proposals, NOT production orders.
BEGIN;
CREATE TABLE IF NOT EXISTS shifttime_order_buyer_offers_01564 (
 id uuid PRIMARY KEY,
 draft_id text NOT NULL REFERENCES shifttime_checkout_review_queue_01556(draft_id) ON DELETE CASCADE,
 store_id text NOT NULL REFERENCES platform_stores(id) ON DELETE CASCADE,
 site_id text NOT NULL,
 token_hash char(64) NOT NULL UNIQUE,
 cart_fingerprint text NOT NULL,
 packing_fingerprint text NOT NULL,
 carrier_checked_at timestamptz NOT NULL,
 subtotal_cents bigint NOT NULL CHECK(subtotal_cents>0),
 delivery_cents bigint NOT NULL CHECK(delivery_cents>0),
 total_cents bigint NOT NULL CHECK(total_cents=subtotal_cents+delivery_cents),
 number_of_packages integer NOT NULL CHECK(number_of_packages BETWEEN 1 AND 100),
 items jsonb NOT NULL,
 created_by_user_id text REFERENCES platform_users(id) ON DELETE SET NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 expires_at timestamptz NOT NULL,
 accepted_at timestamptz,
 revoked_at timestamptz,
 CONSTRAINT order_buyer_offer_expiry_01564 CHECK(expires_at>created_at)
);
CREATE INDEX IF NOT EXISTS idx_buyer_offers_store_01564 ON shifttime_order_buyer_offers_01564(store_id,draft_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_buyer_offers_expiry_01564 ON shifttime_order_buyer_offers_01564(expires_at);
COMMIT;
