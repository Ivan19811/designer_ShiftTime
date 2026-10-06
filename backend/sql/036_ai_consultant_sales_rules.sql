BEGIN;

CREATE TABLE IF NOT EXISTS shifttime_ai_consultant_sales_rules (
  id text PRIMARY KEY,
  consultant_id text NOT NULL REFERENCES shifttime_ai_consultants(id) ON DELETE CASCADE,
  account_id text NOT NULL REFERENCES platform_accounts(id) ON DELETE CASCADE,
  workspace_id text NOT NULL REFERENCES platform_workspaces(id) ON DELETE CASCADE,
  store_id text NOT NULL REFERENCES platform_stores(id) ON DELETE CASCADE,
  site_id text NOT NULL REFERENCES shifttime_builder_sites(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  enabled boolean NOT NULL DEFAULT true,
  priority integer NOT NULL DEFAULT 100 CHECK (priority BETWEEN 0 AND 10000),
  min_product_price numeric(14,2) NOT NULL DEFAULT 0 CHECK (min_product_price >= 0),
  max_product_price numeric(14,2) CHECK (max_product_price IS NULL OR max_product_price >= 0),
  min_price_exclusive boolean NOT NULL DEFAULT true,
  exclude_discounted_products boolean NOT NULL DEFAULT true,
  discount_type text NOT NULL DEFAULT 'fixed' CHECK (discount_type IN ('fixed','percent')),
  discount_value numeric(14,4) NOT NULL CHECK (discount_value > 0),
  max_discount numeric(14,2) NOT NULL CHECK (max_discount > 0),
  currency text NOT NULL DEFAULT 'UAH',
  product_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  categories jsonb NOT NULL DEFAULT '[]'::jsonb,
  starts_at timestamptz,
  ends_at timestamptz,
  created_by text REFERENCES platform_users(id) ON DELETE SET NULL,
  updated_by text REFERENCES platform_users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (max_product_price IS NULL OR max_product_price >= min_product_price),
  CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at > starts_at)
);

CREATE INDEX IF NOT EXISTS idx_ai_consultant_sales_rules_scope_01415
  ON shifttime_ai_consultant_sales_rules(account_id,workspace_id,store_id,site_id,enabled,priority DESC,updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_consultant_sales_rules_consultant_01415
  ON shifttime_ai_consultant_sales_rules(consultant_id,enabled,priority DESC,updated_at DESC);

COMMIT;
