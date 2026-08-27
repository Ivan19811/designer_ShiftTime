BEGIN;
-- 01074 · Anonymous/public buyer cart. Cart is Marketplace-scoped and references only public SellerOffers.
CREATE TABLE IF NOT EXISTS marketplace_carts (
  id text PRIMARY KEY,
  marketplace_id text NOT NULL REFERENCES marketplace_networks(id) ON DELETE CASCADE,
  anonymous_token text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','converted','abandoned')),
  currency text NOT NULL DEFAULT 'UAH',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS marketplace_cart_items (
  id text PRIMARY KEY,
  cart_id text NOT NULL REFERENCES marketplace_carts(id) ON DELETE CASCADE,
  seller_offer_id text NOT NULL REFERENCES marketplace_seller_offers(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0 AND quantity <= 99),
  added_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(cart_id,seller_offer_id)
);
CREATE INDEX IF NOT EXISTS idx_marketplace_cart_items_cart_01074 ON marketplace_cart_items(cart_id,added_at);
CREATE INDEX IF NOT EXISTS idx_marketplace_carts_updated_01074 ON marketplace_carts(marketplace_id,status,updated_at DESC);
COMMIT;
