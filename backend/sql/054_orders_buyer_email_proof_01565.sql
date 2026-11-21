-- 01565 · Rate-limited email possession proof for a specific acknowledged buyer offer.
-- Do not store email, OTP, order, payment, waybill or CRM transmission here.
BEGIN;
CREATE TABLE IF NOT EXISTS shifttime_order_buyer_email_challenges_01565 (
 id uuid PRIMARY KEY,
 offer_id uuid NOT NULL UNIQUE REFERENCES shifttime_order_buyer_offers_01564(id) ON DELETE CASCADE,
 draft_id text NOT NULL REFERENCES shifttime_checkout_drafts_01554(id) ON DELETE CASCADE,
 store_id text NOT NULL REFERENCES platform_stores(id) ON DELETE CASCADE,
 code_hash char(64) NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 sent_at timestamptz NOT NULL DEFAULT now(),
 expires_at timestamptz NOT NULL,
 send_count integer NOT NULL DEFAULT 1 CHECK(send_count BETWEEN 1 AND 3),
 attempt_count integer NOT NULL DEFAULT 0 CHECK(attempt_count BETWEEN 0 AND 5),
 verified_at timestamptz,
 CONSTRAINT order_buyer_email_proof_expiry_01565 CHECK(expires_at>created_at)
);
CREATE INDEX IF NOT EXISTS idx_orders_buyer_email_proof_store_01565 ON shifttime_order_buyer_email_challenges_01565(store_id,draft_id);
CREATE INDEX IF NOT EXISTS idx_orders_buyer_email_proof_expiry_01565 ON shifttime_order_buyer_email_challenges_01565(expires_at);
COMMIT;
