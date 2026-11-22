BEGIN;
-- 01077 · Inventory reservation / stock commit ledger.
-- Physical stock remains on SellerOffer. availableStock = physical stock - active, unexpired reservations.
CREATE TABLE IF NOT EXISTS marketplace_inventory_reservations (
  id text PRIMARY KEY,
  marketplace_id text NOT NULL REFERENCES marketplace_networks(id) ON DELETE RESTRICT,
  cart_id text REFERENCES marketplace_carts(id) ON DELETE SET NULL,
  marketplace_order_id text NOT NULL UNIQUE REFERENCES marketplace_orders(id) ON DELETE RESTRICT,
  payment_method text NOT NULL DEFAULT 'cod',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','committed','released','expired')),
  expires_at timestamptz NOT NULL,
  committed_at timestamptz,
  released_at timestamptz,
  release_reason text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS marketplace_inventory_reservation_items (
  id text PRIMARY KEY,
  reservation_id text NOT NULL REFERENCES marketplace_inventory_reservations(id) ON DELETE RESTRICT,
  marketplace_order_id text NOT NULL REFERENCES marketplace_orders(id) ON DELETE RESTRICT,
  seller_order_id text NOT NULL REFERENCES marketplace_seller_orders(id) ON DELETE RESTRICT,
  order_item_id text NOT NULL UNIQUE REFERENCES marketplace_order_items(id) ON DELETE RESTRICT,
  seller_offer_id text NOT NULL REFERENCES marketplace_seller_offers(id) ON DELETE RESTRICT,
  seller_profile_id text NOT NULL REFERENCES marketplace_seller_profiles(id) ON DELETE RESTRICT,
  store_id text NOT NULL REFERENCES platform_stores(id) ON DELETE RESTRICT,
  source_product_id text,
  quantity integer NOT NULL CHECK (quantity > 0 AND quantity <= 99),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','committed','released','expired','restocked')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(reservation_id,seller_offer_id)
);

CREATE TABLE IF NOT EXISTS marketplace_inventory_ledger (
  id text PRIMARY KEY,
  marketplace_id text NOT NULL REFERENCES marketplace_networks(id) ON DELETE RESTRICT,
  seller_offer_id text NOT NULL REFERENCES marketplace_seller_offers(id) ON DELETE RESTRICT,
  store_id text NOT NULL REFERENCES platform_stores(id) ON DELETE RESTRICT,
  reservation_id text REFERENCES marketplace_inventory_reservations(id) ON DELETE SET NULL,
  marketplace_order_id text REFERENCES marketplace_orders(id) ON DELETE SET NULL,
  seller_order_id text REFERENCES marketplace_seller_orders(id) ON DELETE SET NULL,
  entry_type text NOT NULL CHECK (entry_type IN ('reserve','release','expire','commit','restock','adjustment')),
  quantity numeric(18,4) NOT NULL DEFAULT 0,
  stock_after numeric(18,4),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inventory_res_active_01077
  ON marketplace_inventory_reservations(status,expires_at,marketplace_order_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_offer_01077
  ON marketplace_inventory_reservation_items(seller_offer_id,status,reservation_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_store_01077
  ON marketplace_inventory_reservation_items(store_id,status,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_ledger_offer_01077
  ON marketplace_inventory_ledger(seller_offer_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_ledger_store_01077
  ON marketplace_inventory_ledger(store_id,created_at DESC);
COMMIT;
