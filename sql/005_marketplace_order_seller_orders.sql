BEGIN;
-- 01075 · One MarketplaceOrder split into immutable-price SellerOrders.
CREATE TABLE IF NOT EXISTS marketplace_orders (
  id text PRIMARY KEY,
  marketplace_id text NOT NULL REFERENCES marketplace_networks(id) ON DELETE RESTRICT,
  order_number text NOT NULL UNIQUE,
  cart_id text REFERENCES marketplace_carts(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','confirmed','processing','partially-completed','completed','cancelled')),
  currency text NOT NULL DEFAULT 'UAH',
  subtotal numeric(14,2) NOT NULL DEFAULT 0,
  shipping_total numeric(14,2) NOT NULL DEFAULT 0,
  total numeric(14,2) NOT NULL DEFAULT 0,
  buyer jsonb NOT NULL DEFAULT '{}'::jsonb,
  delivery jsonb NOT NULL DEFAULT '{}'::jsonb,
  payment jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS marketplace_seller_orders (
  id text PRIMARY KEY,
  marketplace_order_id text NOT NULL REFERENCES marketplace_orders(id) ON DELETE RESTRICT,
  marketplace_id text NOT NULL REFERENCES marketplace_networks(id) ON DELETE RESTRICT,
  seller_profile_id text NOT NULL REFERENCES marketplace_seller_profiles(id) ON DELETE RESTRICT,
  store_id text NOT NULL REFERENCES platform_stores(id) ON DELETE RESTRICT,
  order_number text NOT NULL UNIQUE,
  seller_name text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','confirmed','processing','shipped','completed','cancelled')),
  currency text NOT NULL DEFAULT 'UAH',
  subtotal numeric(14,2) NOT NULL DEFAULT 0,
  shipping_total numeric(14,2) NOT NULL DEFAULT 0,
  total numeric(14,2) NOT NULL DEFAULT 0,
  buyer jsonb NOT NULL DEFAULT '{}'::jsonb,
  delivery jsonb NOT NULL DEFAULT '{}'::jsonb,
  payment jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS marketplace_order_items (
  id text PRIMARY KEY,
  marketplace_order_id text NOT NULL REFERENCES marketplace_orders(id) ON DELETE RESTRICT,
  seller_order_id text NOT NULL REFERENCES marketplace_seller_orders(id) ON DELETE RESTRICT,
  seller_offer_id text REFERENCES marketplace_seller_offers(id) ON DELETE SET NULL,
  listing_id text REFERENCES marketplace_listings(id) ON DELETE SET NULL,
  catalog_product_id text REFERENCES marketplace_catalog_products(id) ON DELETE SET NULL,
  source_product_id text,
  title text NOT NULL,
  brand text NOT NULL DEFAULT '',
  sku text NOT NULL DEFAULT '',
  quantity integer NOT NULL CHECK (quantity > 0 AND quantity <= 99),
  unit_price numeric(14,2) NOT NULL,
  old_price numeric(14,2) NOT NULL DEFAULT 0,
  line_total numeric(14,2) NOT NULL,
  currency text NOT NULL DEFAULT 'UAH',
  snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_created_01075 ON marketplace_orders(marketplace_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_seller_orders_store_01075 ON marketplace_seller_orders(store_id,status,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_seller_orders_parent_01075 ON marketplace_seller_orders(marketplace_order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_seller_order_01075 ON marketplace_order_items(seller_order_id);
COMMIT;
