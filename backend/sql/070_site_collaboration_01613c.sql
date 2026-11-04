-- 01613C: user-accepted, site-scoped collaboration invitations. Token hashes only.
BEGIN;
CREATE TABLE IF NOT EXISTS platform_site_collaboration_invites_01613c (
  id text PRIMARY KEY,
  account_id text NOT NULL REFERENCES platform_accounts(id) ON DELETE CASCADE,
  workspace_id text NOT NULL REFERENCES platform_workspaces(id) ON DELETE CASCADE,
  store_id text NOT NULL REFERENCES platform_stores(id) ON DELETE CASCADE,
  site_id text NOT NULL REFERENCES shifttime_builder_sites(id) ON DELETE CASCADE,
  recipient_email text NOT NULL,
  access_level text NOT NULL CHECK(access_level IN ('editor','viewer')),
  token_hash text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','accepted','revoked')),
  assignment_id text REFERENCES platform_role_assignments_01597(id) ON DELETE SET NULL,
  invited_by_user_id text REFERENCES platform_users(id) ON DELETE SET NULL,
  accepted_by_user_id text REFERENCES platform_users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  accepted_at timestamptz,
  revoked_at timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_site_collab_pending_01613c ON platform_site_collaboration_invites_01613c(account_id,site_id,lower(recipient_email)) WHERE status='pending';
CREATE INDEX IF NOT EXISTS idx_site_collab_store_01613c ON platform_site_collaboration_invites_01613c(account_id,store_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_site_collab_recipient_01613c ON platform_site_collaboration_invites_01613c(lower(recipient_email),status,expires_at);
-- Site-only collaborators cannot inherit viewer/legacy account-wide reads.
CREATE TABLE IF NOT EXISTS platform_site_collaboration_only_01613c (
  account_id text NOT NULL REFERENCES platform_accounts(id) ON DELETE CASCADE,
  store_id text NOT NULL REFERENCES platform_stores(id) ON DELETE CASCADE,
  user_id text NOT NULL REFERENCES platform_users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(account_id,store_id,user_id)
);
COMMIT;
