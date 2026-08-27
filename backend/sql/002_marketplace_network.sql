BEGIN;

CREATE TABLE IF NOT EXISTS marketplace_networks (
  id text PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('draft','active','paused','archived')),
  default_locale text NOT NULL DEFAULT 'uk-UA',
  default_currency text NOT NULL DEFAULT 'UAH',
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS marketplace_categories (
  id text PRIMARY KEY,
  marketplace_id text NOT NULL REFERENCES marketplace_networks(id) ON DELETE CASCADE,
  parent_id text REFERENCES marketplace_categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  slug text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','hidden','archived')),
  mapping_rules jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(marketplace_id, slug)
);

CREATE TABLE IF NOT EXISTS marketplace_seller_profiles (
  id text PRIMARY KEY,
  marketplace_id text NOT NULL REFERENCES marketplace_networks(id) ON DELETE CASCADE,
  account_id text NOT NULL REFERENCES platform_accounts(id) ON DELETE CASCADE,
  workspace_id text NOT NULL REFERENCES platform_workspaces(id) ON DELETE CASCADE,
  store_id text NOT NULL REFERENCES platform_stores(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  slug text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('draft','active','suspended','archived')),
  description text NOT NULL DEFAULT '',
  logo_media_id text NOT NULL DEFAULT '',
  contact jsonb NOT NULL DEFAULT '{}'::jsonb,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(marketplace_id, store_id),
  UNIQUE(marketplace_id, slug)
);

CREATE TABLE IF NOT EXISTS marketplace_seller_memberships (
  id text PRIMARY KEY,
  marketplace_id text NOT NULL REFERENCES marketplace_networks(id) ON DELETE CASCADE,
  seller_profile_id text NOT NULL REFERENCES marketplace_seller_profiles(id) ON DELETE CASCADE,
  store_id text NOT NULL REFERENCES platform_stores(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','paused','rejected')),
  terms_version text NOT NULL DEFAULT '',
  terms_accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(marketplace_id, store_id)
);

CREATE TABLE IF NOT EXISTS marketplace_publication_policies (
  id text PRIMARY KEY,
  marketplace_id text NOT NULL REFERENCES marketplace_networks(id) ON DELETE CASCADE,
  seller_profile_id text NOT NULL REFERENCES marketplace_seller_profiles(id) ON DELETE CASCADE,
  store_id text NOT NULL REFERENCES platform_stores(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Основна політика',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused')),
  config jsonb NOT NULL DEFAULT '{"syncPrice":true,"syncStock":true,"syncMedia":true,"syncTitle":true,"autoPauseOutOfStock":false}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(marketplace_id, store_id)
);

CREATE TABLE IF NOT EXISTS marketplace_catalog_products (
  id text PRIMARY KEY,
  marketplace_id text NOT NULL REFERENCES marketplace_networks(id) ON DELETE CASCADE,
  canonical_key text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','merged','archived')),
  title text NOT NULL DEFAULT '',
  brand text NOT NULL DEFAULT '',
  marketplace_category_id text REFERENCES marketplace_categories(id) ON DELETE SET NULL,
  attributes jsonb NOT NULL DEFAULT '{}'::jsonb,
  media jsonb NOT NULL DEFAULT '[]'::jsonb,
  source_fingerprint text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(marketplace_id, canonical_key)
);

CREATE TABLE IF NOT EXISTS marketplace_seller_offers (
  id text PRIMARY KEY,
  marketplace_id text NOT NULL REFERENCES marketplace_networks(id) ON DELETE CASCADE,
  seller_profile_id text NOT NULL REFERENCES marketplace_seller_profiles(id) ON DELETE CASCADE,
  store_id text NOT NULL REFERENCES platform_stores(id) ON DELETE CASCADE,
  source_product_id text NOT NULL,
  catalog_product_id text NOT NULL REFERENCES marketplace_catalog_products(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','archived')),
  sku text NOT NULL DEFAULT '',
  price numeric(18,4) NOT NULL DEFAULT 0,
  old_price numeric(18,4) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'UAH',
  stock numeric(18,4) NOT NULL DEFAULT 0,
  availability text NOT NULL DEFAULT 'in-stock' CHECK (availability IN ('in-stock','out-of-stock','preorder')),
  source_updated_at timestamptz,
  projection jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(marketplace_id, store_id, source_product_id)
);

CREATE TABLE IF NOT EXISTS marketplace_listings (
  id text PRIMARY KEY,
  marketplace_id text NOT NULL REFERENCES marketplace_networks(id) ON DELETE CASCADE,
  seller_profile_id text NOT NULL REFERENCES marketplace_seller_profiles(id) ON DELETE CASCADE,
  store_id text NOT NULL REFERENCES platform_stores(id) ON DELETE CASCADE,
  source_product_id text NOT NULL,
  catalog_product_id text NOT NULL REFERENCES marketplace_catalog_products(id) ON DELETE CASCADE,
  seller_offer_id text NOT NULL REFERENCES marketplace_seller_offers(id) ON DELETE CASCADE,
  marketplace_category_id text REFERENCES marketplace_categories(id) ON DELETE SET NULL,
  publication_status text NOT NULL DEFAULT 'pending' CHECK (publication_status IN ('draft','pending','published','paused','unpublished','rejected')),
  moderation_status text NOT NULL DEFAULT 'pending' CHECK (moderation_status IN ('not-submitted','pending','approved','rejected')),
  title text NOT NULL DEFAULT '',
  slug text NOT NULL DEFAULT '',
  public_projection jsonb NOT NULL DEFAULT '{}'::jsonb,
  rejection_reason text NOT NULL DEFAULT '',
  published_at timestamptz,
  last_synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(marketplace_id, store_id, source_product_id)
);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_public ON marketplace_listings(marketplace_id, publication_status, moderation_status, id);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_store ON marketplace_listings(store_id, id);

CREATE TABLE IF NOT EXISTS marketplace_moderation_cases (
  id text PRIMARY KEY,
  marketplace_id text NOT NULL REFERENCES marketplace_networks(id) ON DELETE CASCADE,
  listing_id text NOT NULL REFERENCES marketplace_listings(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','approved','rejected','closed')),
  reason text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_marketplace_moderation_open ON marketplace_moderation_cases(status, created_at) WHERE status='open';

COMMIT;
