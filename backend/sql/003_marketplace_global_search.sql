BEGIN;
-- 01073 · Read-side indexes for the public ShiftTime Marketplace catalog.
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_public_updated_01073
  ON marketplace_listings(marketplace_id, publication_status, moderation_status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_title_lower_01073
  ON marketplace_listings(marketplace_id, lower(title));
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_public_projection_01073
  ON marketplace_listings USING gin(public_projection jsonb_path_ops);
CREATE INDEX IF NOT EXISTS idx_marketplace_offers_catalog_public_01073
  ON marketplace_seller_offers(marketplace_id, catalog_product_id, status, price);
CREATE INDEX IF NOT EXISTS idx_marketplace_sellers_public_01073
  ON marketplace_seller_profiles(marketplace_id, status, display_name);
COMMIT;
