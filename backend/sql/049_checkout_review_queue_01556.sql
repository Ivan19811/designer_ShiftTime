BEGIN;
-- 01556: authenticated MANUAL-REVIEW preparation only. No order or customer PII.
CREATE TABLE IF NOT EXISTS shifttime_checkout_review_queue_01556 (
  draft_id text PRIMARY KEY REFERENCES shifttime_checkout_drafts_01554(id) ON DELETE CASCADE,
  store_id text NOT NULL REFERENCES platform_stores(id) ON DELETE CASCADE,
  site_id text NOT NULL,
  created_by_user_id text NOT NULL REFERENCES platform_users(id) ON DELETE CASCADE,
  state text NOT NULL DEFAULT 'awaiting_manual_review' CHECK (state='awaiting_manual_review'),
  cart_fingerprint char(64) NOT NULL,
  packing_fingerprint char(64) NOT NULL,
  provisional_total_cents bigint NOT NULL CHECK (provisional_total_cents>0),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_checkout_review_store_01556 ON shifttime_checkout_review_queue_01556(store_id,created_at DESC);
CREATE TABLE IF NOT EXISTS shifttime_checkout_crm_outbox_01556 (
  draft_id text PRIMARY KEY REFERENCES shifttime_checkout_review_queue_01556(draft_id) ON DELETE CASCADE,
  store_id text NOT NULL REFERENCES platform_stores(id) ON DELETE CASCADE,
  site_id text NOT NULL,
  event_type text NOT NULL CHECK(event_type='checkout_draft_ready_for_manual_review'),
  delivery_state text NOT NULL DEFAULT 'disabled' CHECK(delivery_state='disabled'),
  reference_payload jsonb NOT NULL CHECK(jsonb_typeof(reference_payload)='object'),
  created_at timestamptz NOT NULL DEFAULT now()
);
COMMIT;
