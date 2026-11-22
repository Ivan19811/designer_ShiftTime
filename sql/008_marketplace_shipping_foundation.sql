BEGIN;
-- 01078 · One operational Delivery entity per SellerOrder + provider-neutral shipping event ledger.
CREATE TABLE IF NOT EXISTS marketplace_seller_order_deliveries (
  id text PRIMARY KEY,
  marketplace_id text NOT NULL REFERENCES marketplace_networks(id) ON DELETE RESTRICT,
  marketplace_order_id text NOT NULL REFERENCES marketplace_orders(id) ON DELETE RESTRICT,
  seller_order_id text NOT NULL UNIQUE REFERENCES marketplace_seller_orders(id) ON DELETE RESTRICT,
  seller_profile_id text NOT NULL REFERENCES marketplace_seller_profiles(id) ON DELETE RESTRICT,
  store_id text NOT NULL REFERENCES platform_stores(id) ON DELETE RESTRICT,
  provider text NOT NULL DEFAULT 'manual-dev',
  provider_reference text,
  shipping_method text NOT NULL DEFAULT 'nova-poshta' CHECK (shipping_method IN ('nova-poshta','ukrposhta','courier','pickup','custom')),
  carrier text NOT NULL DEFAULT '',
  delivery_status text NOT NULL DEFAULT 'pending' CHECK (delivery_status IN ('pending','ready','label-created','shipped','in-transit','delivered','cancelled','returned')),
  shipping_price numeric(14,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'UAH',
  recipient jsonb NOT NULL DEFAULT '{}'::jsonb,
  city text NOT NULL DEFAULT '',
  warehouse text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  tracking_number text NOT NULL DEFAULT '',
  estimated_delivery timestamptz,
  comment text NOT NULL DEFAULT '',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  shipped_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS marketplace_shipping_events (
  id text PRIMARY KEY,
  delivery_id text NOT NULL REFERENCES marketplace_seller_order_deliveries(id) ON DELETE RESTRICT,
  seller_order_id text NOT NULL REFERENCES marketplace_seller_orders(id) ON DELETE RESTRICT,
  store_id text NOT NULL REFERENCES platform_stores(id) ON DELETE RESTRICT,
  event_type text NOT NULL,
  provider text NOT NULL DEFAULT 'manual-dev',
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_shipping_delivery_store_01078 ON marketplace_seller_order_deliveries(store_id,delivery_status,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shipping_delivery_parent_01078 ON marketplace_seller_order_deliveries(marketplace_order_id);
CREATE INDEX IF NOT EXISTS idx_shipping_tracking_01078 ON marketplace_seller_order_deliveries(tracking_number) WHERE tracking_number<>'';
CREATE INDEX IF NOT EXISTS idx_shipping_events_delivery_01078 ON marketplace_shipping_events(delivery_id,created_at DESC);

-- Backfill pre-01078 SellerOrders without destroying their original buyer delivery intent.
INSERT INTO marketplace_seller_order_deliveries(
  id,marketplace_id,marketplace_order_id,seller_order_id,seller_profile_id,store_id,provider,shipping_method,carrier,delivery_status,shipping_price,currency,recipient,city,warehouse,address,tracking_number,estimated_delivery,comment,metadata,shipped_at,delivered_at,created_at,updated_at
)
SELECT
  'delivery_'||md5(so.id),so.marketplace_id,so.marketplace_order_id,so.id,so.seller_profile_id,so.store_id,'manual-dev',
  CASE WHEN COALESCE(so.delivery->>'method','') IN ('nova-poshta','ukrposhta','courier','pickup','custom') THEN so.delivery->>'method' ELSE 'nova-poshta' END,
  CASE COALESCE(so.delivery->>'method','') WHEN 'nova-poshta' THEN 'Nova Poshta' WHEN 'ukrposhta' THEN 'Ukrposhta' WHEN 'courier' THEN 'Seller Courier' WHEN 'pickup' THEN 'Seller Pickup' WHEN 'custom' THEN 'Custom Delivery' ELSE 'Nova Poshta' END,
  CASE so.status WHEN 'completed' THEN 'delivered' WHEN 'shipped' THEN 'shipped' WHEN 'cancelled' THEN 'cancelled' ELSE 'pending' END,
  COALESCE(so.shipping_total,0),so.currency,
  jsonb_build_object('name',COALESCE(so.buyer->>'name',''),'phone',COALESCE(so.buyer->>'phone',''),'email',COALESCE(so.buyer->>'email','')),
  COALESCE(so.delivery->>'city',''),
  CASE WHEN COALESCE(so.delivery->>'method','') IN ('nova-poshta','ukrposhta') THEN COALESCE(so.delivery->>'address','') ELSE '' END,
  CASE WHEN COALESCE(so.delivery->>'method','') IN ('nova-poshta','ukrposhta') THEN '' ELSE COALESCE(so.delivery->>'address','') END,
  COALESCE(so.delivery->>'trackingNumber',''),NULL,COALESCE(so.delivery->>'comment',''),jsonb_build_object('backfilledBy','01078'),
  CASE WHEN so.status IN ('shipped','completed') THEN so.updated_at ELSE NULL END,
  CASE WHEN so.status='completed' THEN so.updated_at ELSE NULL END,
  so.created_at,so.updated_at
FROM marketplace_seller_orders so
WHERE NOT EXISTS(SELECT 1 FROM marketplace_seller_order_deliveries d WHERE d.seller_order_id=so.id)
ON CONFLICT(seller_order_id) DO NOTHING;
COMMIT;
