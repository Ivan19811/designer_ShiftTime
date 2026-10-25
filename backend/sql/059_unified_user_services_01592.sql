-- 01592 · ShiftTime ID central directory. Additive, no changes to credentials or sessions.
-- Only events observed by trusted backend integrations become confirmed usage.
BEGIN;

CREATE TABLE IF NOT EXISTS platform_user_services_01592 (
  user_id text NOT NULL REFERENCES platform_users(id) ON DELETE CASCADE,
  service_code text NOT NULL CHECK (service_code IN ('builder','crm','messenger','site','shop')),
  evidence text NOT NULL DEFAULT 'inferred' CHECK (evidence IN ('inferred','confirmed')),
  evidence_source text NOT NULL DEFAULT 'legacy_membership',
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(user_id,service_code)
);
CREATE INDEX IF NOT EXISTS idx_user_services_service_01592
  ON platform_user_services_01592(service_code,evidence,last_seen_at DESC);

-- Relationships for future customer registrations on published sites and shops.
-- No guest checkout is converted into an authenticated user by this migration.
CREATE TABLE IF NOT EXISTS platform_user_site_memberships_01592 (
  user_id text NOT NULL REFERENCES platform_users(id) ON DELETE CASCADE,
  site_id text NOT NULL REFERENCES shifttime_builder_sites(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('customer','member','staff')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','disabled')),
  registered_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id,site_id)
);
CREATE INDEX IF NOT EXISTS idx_site_memberships_site_01592 ON platform_user_site_memberships_01592(site_id,status);

CREATE TABLE IF NOT EXISTS platform_user_shop_customers_01592 (
  user_id text NOT NULL REFERENCES platform_users(id) ON DELETE CASCADE,
  store_id text NOT NULL REFERENCES platform_stores(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','disabled')),
  registered_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id,store_id)
);
CREATE INDEX IF NOT EXISTS idx_shop_customers_store_01592 ON platform_user_shop_customers_01592(store_id,status);

-- Historical account membership suggests availability of Builder, NOT proven sign-in.
-- No CRM, Messenger or shop usage is inferred from a generic membership.
INSERT INTO platform_user_services_01592(user_id,service_code,evidence,evidence_source,first_seen_at)
SELECT DISTINCT m.user_id,'builder','inferred','legacy_membership',MIN(m.created_at)
FROM platform_memberships m
WHERE m.status='active'
GROUP BY m.user_id
ON CONFLICT (user_id,service_code) DO NOTHING;

COMMIT;
