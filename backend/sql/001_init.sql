BEGIN;

CREATE TABLE IF NOT EXISTS platform_users (
  id text PRIMARY KEY,
  email text NOT NULL UNIQUE,
  name text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','invited','disabled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS platform_accounts (
  id text PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended','archived')),
  owner_user_id text REFERENCES platform_users(id),
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS platform_workspaces (
  id text PRIMARY KEY,
  account_id text NOT NULL REFERENCES platform_accounts(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','archived')),
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(account_id, slug)
);

CREATE TABLE IF NOT EXISTS platform_stores (
  id text PRIMARY KEY,
  workspace_id text NOT NULL REFERENCES platform_workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('draft','active','archived')),
  domain text NOT NULL DEFAULT '',
  locale text NOT NULL DEFAULT 'uk-UA',
  currency text NOT NULL DEFAULT 'UAH',
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, slug)
);

CREATE TABLE IF NOT EXISTS platform_memberships (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES platform_users(id) ON DELETE CASCADE,
  account_id text NOT NULL REFERENCES platform_accounts(id) ON DELETE CASCADE,
  workspace_id text REFERENCES platform_workspaces(id) ON DELETE CASCADE,
  store_id text REFERENCES platform_stores(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner','admin','editor','catalog-manager','order-manager','viewer')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','invited','disabled')),
  permissions jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_memberships_user ON platform_memberships(user_id, status);
CREATE INDEX IF NOT EXISTS idx_memberships_scope ON platform_memberships(account_id, workspace_id, store_id, status);

CREATE TABLE IF NOT EXISTS api_sessions (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES platform_users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','revoked')),
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz
);

-- 01071 deliberately stores the frozen 01052 commerce contract as one store-scoped JSONB snapshot.
-- This keeps Product/Category frontend models clean and makes LocalRepository -> ApiRepository migration lossless.
CREATE TABLE IF NOT EXISTS commerce_store_snapshots (
  store_id text PRIMARY KEY REFERENCES platform_stores(id) ON DELETE CASCADE,
  schema_version integer NOT NULL DEFAULT 1,
  revision bigint NOT NULL DEFAULT 0,
  snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Reliable future bridge: Product changed -> MarketplaceListing/search/feed projections.
CREATE TABLE IF NOT EXISTS commerce_outbox (
  id bigserial PRIMARY KEY,
  account_id text NOT NULL REFERENCES platform_accounts(id) ON DELETE CASCADE,
  workspace_id text NOT NULL REFERENCES platform_workspaces(id) ON DELETE CASCADE,
  store_id text NOT NULL REFERENCES platform_stores(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  aggregate_type text NOT NULL DEFAULT 'commerce-snapshot',
  aggregate_id text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_outbox_pending ON commerce_outbox(processed_at, id) WHERE processed_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_outbox_store ON commerce_outbox(store_id, id);

COMMIT;
