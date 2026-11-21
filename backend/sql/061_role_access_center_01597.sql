-- 01597 · additive role/access foundation; legacy membership grants remain unchanged.
BEGIN;
CREATE TABLE IF NOT EXISTS platform_custom_roles_01597 (
  id text PRIMARY KEY,
  account_id text NOT NULL REFERENCES platform_accounts(id) ON DELETE CASCADE,
  name text NOT NULL CHECK(length(name) BETWEEN 2 AND 80),
  description text NOT NULL DEFAULT '',
  permissions jsonb NOT NULL DEFAULT '[]'::jsonb CHECK(jsonb_typeof(permissions)='array'),
  status text NOT NULL DEFAULT 'active' CHECK(status IN('active','disabled')),
  created_by_user_id text REFERENCES platform_users(id) ON DELETE SET NULL,
  updated_by_user_id text REFERENCES platform_users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id,account_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_custom_roles_name_01597 ON platform_custom_roles_01597(account_id,lower(name));
CREATE INDEX IF NOT EXISTS idx_custom_roles_account_01597 ON platform_custom_roles_01597(account_id,status,created_at DESC);

CREATE TABLE IF NOT EXISTS platform_role_assignments_01597 (
  id text PRIMARY KEY,
  account_id text NOT NULL REFERENCES platform_accounts(id) ON DELETE CASCADE,
  role_id text NOT NULL,
  membership_id text NOT NULL REFERENCES platform_memberships(id) ON DELETE CASCADE,
  store_id text NOT NULL REFERENCES platform_stores(id) ON DELETE CASCADE,
  site_id text REFERENCES shifttime_builder_sites(id) ON DELETE CASCADE,
  scope_kind text NOT NULL CHECK(scope_kind IN('site','store')),
  status text NOT NULL DEFAULT 'active' CHECK(status IN('active','revoked')),
  assigned_by_user_id text REFERENCES platform_users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  CONSTRAINT fk_role_account_01597 FOREIGN KEY(role_id,account_id) REFERENCES platform_custom_roles_01597(id,account_id) ON DELETE CASCADE,
  CONSTRAINT ck_assignment_scope_01597 CHECK ((scope_kind='site' AND site_id IS NOT NULL) OR (scope_kind='store' AND site_id IS NULL))
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_role_assignment_active_01597 ON platform_role_assignments_01597(role_id,membership_id,store_id,COALESCE(site_id,'')) WHERE status='active';
CREATE INDEX IF NOT EXISTS idx_role_assignment_account_01597 ON platform_role_assignments_01597(account_id,store_id,status);
CREATE INDEX IF NOT EXISTS idx_role_assignment_member_01597 ON platform_role_assignments_01597(membership_id,store_id,status);
COMMIT;
