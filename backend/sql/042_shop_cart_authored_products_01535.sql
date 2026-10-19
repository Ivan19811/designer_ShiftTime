BEGIN;
-- 01535: authored shop items live in canonical marketplace_carts / marketplace_cart_items.
-- SellerOffer rows remain unchanged; no second cart or duplication of prices.
ALTER TABLE marketplace_cart_items ALTER COLUMN seller_offer_id DROP NOT NULL;
ALTER TABLE marketplace_cart_items ADD COLUMN IF NOT EXISTS source_kind text NOT NULL DEFAULT 'seller-offer';
ALTER TABLE marketplace_cart_items ADD COLUMN IF NOT EXISTS store_id text;
ALTER TABLE marketplace_cart_items ADD COLUMN IF NOT EXISTS site_id text;
ALTER TABLE marketplace_cart_items ADD COLUMN IF NOT EXISTS product_id text;
ALTER TABLE marketplace_cart_items ADD COLUMN IF NOT EXISTS variant_id text;
ALTER TABLE marketplace_cart_items ADD COLUMN IF NOT EXISTS variant_sku text;
ALTER TABLE marketplace_cart_items ADD COLUMN IF NOT EXISTS bundle_id text;
ALTER TABLE marketplace_cart_items ADD COLUMN IF NOT EXISTS component_kind text;
ALTER TABLE marketplace_cart_items ADD COLUMN IF NOT EXISTS parent_item_id text;
ALTER TABLE marketplace_cart_items ADD CONSTRAINT marketplace_cart_item_authored_reference_01535
 CHECK (seller_offer_id IS NOT NULL OR
 (source_kind='store-product-01534' AND store_id IS NOT NULL AND site_id IS NOT NULL AND product_id IS NOT NULL)) NOT VALID;
CREATE INDEX IF NOT EXISTS idx_marketplace_cart_authored_01535 ON marketplace_cart_items(cart_id,store_id,site_id) WHERE source_kind='store-product-01534';
COMMIT;
