BEGIN;
-- 01569 · Align persisted checkout draft revisions with the already-authorized
-- unsaved automatic packing plan (revision 0) in 01553/01567B.
-- Existing saved revisions >=1 remain valid; negative revisions stay invalid.
-- No existing draft, order, payment, TTN, CRM or buyer contact is changed.
ALTER TABLE shifttime_checkout_drafts_01554
  DROP CONSTRAINT IF EXISTS shifttime_checkout_drafts_01554_packing_revision_check;
ALTER TABLE shifttime_checkout_drafts_01554
  ADD CONSTRAINT shifttime_checkout_drafts_01554_packing_revision_check
  CHECK (packing_revision >= 0);
COMMIT;
