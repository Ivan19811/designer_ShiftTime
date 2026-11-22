BEGIN;
-- 01076 · Provider-neutral payment ledger, marketplace commission and seller payout allocation.
CREATE TABLE IF NOT EXISTS marketplace_payments (
  id text PRIMARY KEY,
  marketplace_id text NOT NULL REFERENCES marketplace_networks(id) ON DELETE RESTRICT,
  marketplace_order_id text NOT NULL UNIQUE REFERENCES marketplace_orders(id) ON DELETE RESTRICT,
  provider text NOT NULL DEFAULT 'manual-dev',
  provider_payment_id text,
  method text NOT NULL DEFAULT 'card' CHECK (method IN ('cod','card','bank-transfer')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','authorized','paid','failed','partially-refunded','refunded','cancelled')),
  currency text NOT NULL DEFAULT 'UAH',
  amount numeric(14,2) NOT NULL DEFAULT 0,
  refunded_amount numeric(14,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS marketplace_payment_allocations (
  id text PRIMARY KEY,
  payment_id text NOT NULL REFERENCES marketplace_payments(id) ON DELETE RESTRICT,
  marketplace_order_id text NOT NULL REFERENCES marketplace_orders(id) ON DELETE RESTRICT,
  seller_order_id text NOT NULL UNIQUE REFERENCES marketplace_seller_orders(id) ON DELETE RESTRICT,
  seller_profile_id text NOT NULL REFERENCES marketplace_seller_profiles(id) ON DELETE RESTRICT,
  store_id text NOT NULL REFERENCES platform_stores(id) ON DELETE RESTRICT,
  seller_name text NOT NULL DEFAULT '',
  currency text NOT NULL DEFAULT 'UAH',
  gross numeric(14,2) NOT NULL DEFAULT 0,
  commission_rate numeric(7,4) NOT NULL DEFAULT 0,
  commission numeric(14,2) NOT NULL DEFAULT 0,
  seller_net numeric(14,2) NOT NULL DEFAULT 0,
  refunded_gross numeric(14,2) NOT NULL DEFAULT 0,
  payout_status text NOT NULL DEFAULT 'held' CHECK (payout_status IN ('held','eligible','paid','reversed')),
  payout_reference text,
  paid_out_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS marketplace_payment_events (
  id text PRIMARY KEY,
  payment_id text NOT NULL REFERENCES marketplace_payments(id) ON DELETE RESTRICT,
  event_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS marketplace_payout_ledger (
  id text PRIMARY KEY,
  payment_allocation_id text NOT NULL REFERENCES marketplace_payment_allocations(id) ON DELETE RESTRICT,
  store_id text NOT NULL REFERENCES platform_stores(id) ON DELETE RESTRICT,
  entry_type text NOT NULL CHECK (entry_type IN ('eligible','paid','reversed','adjustment')),
  amount numeric(14,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'UAH',
  reference text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_payments_order_01076 ON marketplace_payments(marketplace_order_id,status);
CREATE INDEX IF NOT EXISTS idx_payment_alloc_store_01076 ON marketplace_payment_allocations(store_id,payout_status,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_events_payment_01076 ON marketplace_payment_events(payment_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payout_ledger_store_01076 ON marketplace_payout_ledger(store_id,created_at DESC);
COMMIT;
