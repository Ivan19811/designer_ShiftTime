BEGIN;

ALTER TABLE platform_memberships DROP CONSTRAINT IF EXISTS platform_memberships_role_check;
ALTER TABLE platform_memberships
  ADD CONSTRAINT platform_memberships_role_check
  CHECK (role IN ('owner','admin','manager','editor','viewer','catalog-manager','order-manager'));

CREATE TABLE IF NOT EXISTS platform_invitations (
  id text PRIMARY KEY,
  account_id text NOT NULL REFERENCES platform_accounts(id) ON DELETE CASCADE,
  workspace_id text REFERENCES platform_workspaces(id) ON DELETE CASCADE,
  store_id text REFERENCES platform_stores(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL CHECK (role IN ('owner','admin','manager','editor','viewer','catalog-manager','order-manager')),
  permissions jsonb NOT NULL DEFAULT '[]'::jsonb,
  token_hash text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','revoked','expired')),
  invited_by_user_id text NOT NULL REFERENCES platform_users(id),
  accepted_by_user_id text REFERENCES platform_users(id),
  expires_at timestamptz NOT NULL,
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_platform_invitations_account_status ON platform_invitations(account_id,status,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_platform_invitations_token_hash ON platform_invitations(token_hash);
CREATE UNIQUE INDEX IF NOT EXISTS uq_platform_invitations_pending_email
  ON platform_invitations(account_id,lower(email)) WHERE status='pending';

CREATE TABLE IF NOT EXISTS platform_admin_audit_log (
  id bigserial PRIMARY KEY,
  account_id text NOT NULL REFERENCES platform_accounts(id) ON DELETE CASCADE,
  workspace_id text REFERENCES platform_workspaces(id) ON DELETE SET NULL,
  store_id text REFERENCES platform_stores(id) ON DELETE SET NULL,
  actor_user_id text NOT NULL REFERENCES platform_users(id),
  action text NOT NULL,
  target_type text NOT NULL,
  target_id text NOT NULL DEFAULT '',
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_platform_admin_audit_account ON platform_admin_audit_log(account_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_platform_admin_audit_actor ON platform_admin_audit_log(actor_user_id,created_at DESC);

COMMIT;
