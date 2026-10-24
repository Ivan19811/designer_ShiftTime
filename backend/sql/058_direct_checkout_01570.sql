-- 01570: directly accepted Store-catalog orders, no manager quote.
-- Isolated from legacy buyer_link and manager flows; preserve existing orders.
BEGIN;
ALTER TABLE shifttime_production_orders_01566 ALTER COLUMN source_offer_id DROP NOT NULL;
ALTER TABLE shifttime_production_orders_01566 DROP CONSTRAINT IF EXISTS production_order_placement_channel_01567;
ALTER TABLE shifttime_production_orders_01566
  ADD CONSTRAINT production_order_placement_channel_01570 CHECK (
    (placement_channel='manager' AND created_by_manager_id IS NOT NULL AND source_offer_id IS NOT NULL) OR
    (placement_channel='buyer_link' AND created_by_manager_id IS NULL AND source_offer_id IS NOT NULL) OR
    (placement_channel='direct_checkout' AND created_by_manager_id IS NULL AND source_offer_id IS NULL)
  );
CREATE UNIQUE INDEX IF NOT EXISTS idx_direct_checkout_cart_01570
  ON shifttime_production_orders_01566(store_id,site_id,source_cart_id) WHERE placement_channel='direct_checkout';
COMMIT;
