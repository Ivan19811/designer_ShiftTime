BEGIN;
-- 01561. Internal merchant-only priority and encrypted private notes for manual-review drafts.
-- No new orders, delivery/CRM jobs, buyer chat, contact disclosure or financial actions.
CREATE TABLE IF NOT EXISTS shifttime_orders_review_priority_01561 (
 draft_id text PRIMARY KEY REFERENCES shifttime_checkout_review_queue_01556(draft_id) ON DELETE CASCADE,
 store_id text NOT NULL REFERENCES platform_stores(id) ON DELETE CASCADE,
 priority text NOT NULL DEFAULT 'normal' CHECK(priority IN ('low','normal','high','urgent')),
 version bigint NOT NULL DEFAULT 0 CHECK(version>=0),
 changed_by_user_id text REFERENCES platform_users(id) ON DELETE SET NULL,
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_orders_review_priority_01561 ON shifttime_orders_review_priority_01561(store_id,priority,updated_at DESC);
CREATE TABLE IF NOT EXISTS shifttime_orders_review_notes_01561 (
 id bigserial PRIMARY KEY,
 draft_id text NOT NULL REFERENCES shifttime_checkout_review_queue_01556(draft_id) ON DELETE CASCADE,
 store_id text NOT NULL REFERENCES platform_stores(id) ON DELETE CASCADE,
 author_user_id text REFERENCES platform_users(id) ON DELETE SET NULL,
 iv_b64 text NOT NULL,
 ciphertext_b64 text NOT NULL,
 tag_b64 text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_orders_review_notes_01561 ON shifttime_orders_review_notes_01561(store_id,draft_id,id DESC);
CREATE TABLE IF NOT EXISTS shifttime_orders_review_priority_audit_01561 (
 id bigserial PRIMARY KEY,
 draft_id text NOT NULL REFERENCES shifttime_checkout_review_queue_01556(draft_id) ON DELETE CASCADE,
 store_id text NOT NULL REFERENCES platform_stores(id) ON DELETE CASCADE,
 actor_user_id text REFERENCES platform_users(id) ON DELETE SET NULL,
 previous_priority text NOT NULL,
 next_priority text NOT NULL,
 version bigint NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_orders_review_priority_audit_01561 ON shifttime_orders_review_priority_audit_01561(store_id,draft_id,id DESC);
COMMIT;
