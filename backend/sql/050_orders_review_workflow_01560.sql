BEGIN;
-- 01560 · Internal state for preview-only manual-review drafts.
-- Not an order, payment, inventory reservation, shipment or CRM outbox.
CREATE TABLE IF NOT EXISTS shifttime_orders_review_workflow_01560 (
  draft_id text PRIMARY KEY REFERENCES shifttime_checkout_review_queue_01556(draft_id) ON DELETE CASCADE,
  store_id text NOT NULL REFERENCES platform_stores(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'awaiting_review' CHECK(status IN ('awaiting_review','in_review','needs_information','on_hold','ready_for_manual_followup')),
  assigned_user_id text REFERENCES platform_users(id) ON DELETE SET NULL,
  version bigint NOT NULL DEFAULT 0 CHECK(version >= 0),
  changed_by_user_id text REFERENCES platform_users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_orders_review_workflow_store_01560 ON shifttime_orders_review_workflow_01560(store_id,status,updated_at DESC);
CREATE TABLE IF NOT EXISTS shifttime_orders_review_audit_01560 (
  id bigserial PRIMARY KEY,
  draft_id text NOT NULL REFERENCES shifttime_checkout_review_queue_01556(draft_id) ON DELETE CASCADE,
  store_id text NOT NULL REFERENCES platform_stores(id) ON DELETE CASCADE,
  actor_user_id text NOT NULL REFERENCES platform_users(id),
  previous_status text NOT NULL,
  next_status text NOT NULL,
  previous_assignee_user_id text,
  next_assignee_user_id text,
  revision bigint NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_orders_review_audit_draft_01560 ON shifttime_orders_review_audit_01560(store_id,draft_id,id DESC);
COMMIT;
