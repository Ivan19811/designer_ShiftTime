BEGIN;
-- 01079 · Explicit discount fields + authoritative item/shipping/grand totals.
ALTER TABLE marketplace_orders ADD COLUMN IF NOT EXISTS discount_total numeric(14,2) NOT NULL DEFAULT 0;
ALTER TABLE marketplace_seller_orders ADD COLUMN IF NOT EXISTS discount_total numeric(14,2) NOT NULL DEFAULT 0;

-- Rebuild SellerOrder financial totals from immutable OrderItems + operational Delivery.
WITH seller_calc AS (
  SELECT so.id,
         COALESCE(SUM(oi.line_total),0)::numeric(14,2) AS items_subtotal,
         COALESCE(MAX(d.shipping_price),so.shipping_total,0)::numeric(14,2) AS shipping_total,
         LEAST(GREATEST(COALESCE(so.discount_total,0),0),COALESCE(SUM(oi.line_total),0)+COALESCE(MAX(d.shipping_price),so.shipping_total,0))::numeric(14,2) AS discount_total
  FROM marketplace_seller_orders so
  LEFT JOIN marketplace_order_items oi ON oi.seller_order_id=so.id
  LEFT JOIN marketplace_seller_order_deliveries d ON d.seller_order_id=so.id
  GROUP BY so.id,so.shipping_total,so.discount_total
)
UPDATE marketplace_seller_orders so
SET subtotal=c.items_subtotal,
    shipping_total=c.shipping_total,
    discount_total=c.discount_total,
    total=GREATEST(0,c.items_subtotal+c.shipping_total-c.discount_total),
    updated_at=now()
FROM seller_calc c WHERE c.id=so.id;

-- Parent MarketplaceOrder is the sum of its SellerOrder financial snapshots.
WITH order_calc AS (
  SELECT marketplace_order_id AS id,
         COALESCE(SUM(subtotal),0)::numeric(14,2) AS items_total,
         COALESCE(SUM(shipping_total),0)::numeric(14,2) AS shipping_total,
         COALESCE(SUM(discount_total),0)::numeric(14,2) AS discount_total,
         COALESCE(SUM(total),0)::numeric(14,2) AS grand_total
  FROM marketplace_seller_orders GROUP BY marketplace_order_id
)
UPDATE marketplace_orders o
SET subtotal=c.items_total,
    shipping_total=c.shipping_total,
    discount_total=c.discount_total,
    total=c.grand_total,
    updated_at=now()
FROM order_calc c WHERE c.id=o.id;
COMMIT;
