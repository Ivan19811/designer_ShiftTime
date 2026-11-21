BEGIN;
-- 01554 · Not a real customer order. Strict tenant/authored-cart isolation, no PII or tokens.
CREATE TABLE IF NOT EXISTS shifttime_checkout_drafts_01554 (
  id text PRIMARY KEY,
  account_id text NOT NULL REFERENCES platform_accounts(id) ON DELETE CASCADE,
  workspace_id text NOT NULL REFERENCES platform_workspaces(id) ON DELETE CASCADE,
  store_id text NOT NULL REFERENCES platform_stores(id) ON DELETE CASCADE,
  site_id text NOT NULL,
  cart_id text NOT NULL,
  created_by_user_id text NOT NULL REFERENCES platform_users(id) ON DELETE CASCADE,
  idempotency_key uuid NOT NULL,
  request_hash char(64) NOT NULL,
  cart_fingerprint char(64) NOT NULL,
  packing_fingerprint char(64) NOT NULL,
  packing_revision integer NOT NULL CHECK (packing_revision >= 1),
  recipient_city_ref text NOT NULL,
  recipient_warehouse_ref text NOT NULL,
  currency text NOT NULL DEFAULT 'UAH' CHECK (currency='UAH'),
  subtotal_cents bigint NOT NULL CHECK (subtotal_cents > 0),
  provisional_delivery_cents bigint NOT NULL CHECK (provisional_delivery_cents > 0),
  provisional_total_cents bigint NOT NULL CHECK (provisional_total_cents > 0),
  total_weight_grams integer NOT NULL CHECK (total_weight_grams > 0),
  number_of_packages integer NOT NULL CHECK (number_of_packages BETWEEN 1 AND 100),
  items jsonb NOT NULL CHECK (jsonb_typeof(items)='array'),
  packages jsonb NOT NULL CHECK (jsonb_typeof(packages)='array'),
  state text NOT NULL DEFAULT 'draft' CHECK (state='draft'),
  payment_state text NOT NULL DEFAULT 'not_started' CHECK (payment_state='not_started'),
  shipping_state text NOT NULL DEFAULT 'not_booked' CHECK (shipping_state='not_booked'),
  crm_sync_state text NOT NULL DEFAULT 'not_sent' CHECK (crm_sync_state='not_sent'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (store_id,created_by_user_id,idempotency_key)
);
CREATE INDEX IF NOT EXISTS idx_shifttime_checkout_drafts_01554_store
 ON shifttime_checkout_drafts_01554 (store_id,created_by_user_id,created_at DESC);
COMMIT;
