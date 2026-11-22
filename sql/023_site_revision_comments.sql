BEGIN;

ALTER TABLE shifttime_builder_site_revisions
  ADD COLUMN IF NOT EXISTS comment text NOT NULL DEFAULT '';

COMMIT;
