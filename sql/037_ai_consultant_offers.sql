BEGIN;

CREATE TABLE IF NOT EXISTS shifttime_ai_consultant_offers (
  id text PRIMARY KEY,
  token_hash text NOT NULL UNIQUE,
  consultant_id text NOT NULL REFERENCES shifttime_ai_consultants(id) ON DELETE CASCADE,
  rule_id text REFERENCES shifttime_ai_consultant_sales_rules(id) ON DELETE SET NULL,
  session_id text NOT NULL REFERENCES shifttime_ai_consultant_sessions(id) ON DELETE CASCADE,
  account_id text NOT NULL REFERENCES platform_accounts(id) ON DELETE CASCADE,
  workspace_id text NOT NULL REFERENCES platform_workspaces(id) ON DELETE CASCADE,
  store_id text NOT NULL REFERENCES platform_stores(id) ON DELETE CASCADE,
  site_id text NOT NULL REFERENCES shifttime_builder_sites(id) ON DELETE CASCADE,
  visitor_hash text NOT NULL,
  listing_id text NOT NULL REFERENCES marketplace_listings(id) ON DELETE CASCADE,
  seller_offer_id text NOT NULL REFERENCES marketplace_seller_offers(id) ON DELETE CASCADE,
  base_price numeric(14,2) NOT NULL CHECK (base_price >= 0),
  discount_amount numeric(14,2) NOT NULL CHECK (discount_amount > 0),
  final_price numeric(14,2) NOT NULL CHECK (final_price >= 0),
  currency text NOT NULL DEFAULT 'UAH',
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity = 1),
  status text NOT NULL DEFAULT 'accepted' CHECK (status IN ('accepted','cart-applied','consumed','expired','revoked')),
  cart_id text REFERENCES marketplace_carts(id) ON DELETE SET NULL,
  cart_item_id text REFERENCES marketplace_cart_items(id) ON DELETE SET NULL,
  marketplace_order_id text REFERENCES marketplace_orders(id) ON DELETE SET NULL,
  snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  expires_at timestamptz NOT NULL,
  accepted_at timestamptz NOT NULL DEFAULT now(),
  cart_applied_at timestamptz,
  consumed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_consultant_offers_scope_01416
  ON shifttime_ai_consultant_offers(account_id,workspace_id,store_id,site_id,status,expires_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_consultant_offers_session_01416
  ON shifttime_ai_consultant_offers(session_id,status,accepted_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_consultant_offers_cart_01416
  ON shifttime_ai_consultant_offers(cart_id,cart_item_id,status,expires_at DESC);

COMMIT;
