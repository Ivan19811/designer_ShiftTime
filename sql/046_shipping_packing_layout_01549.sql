BEGIN;
-- 01549 · Saved, authenticated packing placements, isolated per Store/site/cart.
-- No checkout personal data, tokens, or carrier secrets. Stale hashes never auto-apply.
CREATE TABLE IF NOT EXISTS shifttime_shipping_cart_packing_01549 (
 store_id text NOT NULL REFERENCES platform_stores(id) ON DELETE CASCADE,
 site_id text NOT NULL,
 cart_id text NOT NULL,
 cart_fingerprint char(64) NOT NULL,
 moves jsonb NOT NULL DEFAULT '[]'::jsonb,
 revision integer NOT NULL DEFAULT 1 CHECK (revision BETWEEN 1 AND 1000000000),
 updated_by_user_id text REFERENCES platform_users(id) ON DELETE SET NULL,
 updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(store_id,site_id,cart_id),
 CHECK (jsonb_typeof(moves)='array'),
 CHECK (length(site_id) BETWEEN 1 AND 160),
 CHECK (length(cart_id) BETWEEN 24 AND 64)
);
CREATE INDEX IF NOT EXISTS shifttime_shipping_cart_packing_01549_updated_idx
 ON shifttime_shipping_cart_packing_01549(store_id,updated_at DESC);
COMMIT;
