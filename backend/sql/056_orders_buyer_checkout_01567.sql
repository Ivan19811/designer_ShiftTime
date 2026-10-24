-- 01567 · A capability-verified buyer can place the accepted store proposal.
-- No payment, shipment, stock reservation or CRM effects.
BEGIN;
ALTER TABLE shifttime_production_orders_01566 ALTER COLUMN created_by_manager_id DROP NOT NULL;
ALTER TABLE shifttime_production_orders_01566
  ADD COLUMN IF NOT EXISTS placement_channel text NOT NULL DEFAULT 'manager';
ALTER TABLE shifttime_production_orders_01566
  ADD CONSTRAINT production_order_placement_channel_01567 CHECK (
    (placement_channel='manager' AND created_by_manager_id IS NOT NULL) OR
    (placement_channel='buyer_link' AND created_by_manager_id IS NULL));
COMMIT;
