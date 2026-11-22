-- 01613D3 · Remove the historic five-draft cap without modifying live/published revisions.
-- Existing data and unique draft slot index are preserved.
BEGIN;
ALTER TABLE shifttime_builder_site_revisions
  DROP CONSTRAINT IF EXISTS shifttime_builder_site_revisions_slot_check;
ALTER TABLE shifttime_builder_site_revisions
  ALTER COLUMN slot TYPE integer USING slot::integer;
ALTER TABLE shifttime_builder_site_revisions
  ADD CONSTRAINT shifttime_builder_site_revisions_slot_nonnegative_01613d3 CHECK (slot >= 0);
COMMIT;
