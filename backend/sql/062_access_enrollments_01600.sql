-- 01600 · Sticky, explicit-access enrollment. Revoking the last assignment must never restore broad legacy rights.
BEGIN;
CREATE TABLE IF NOT EXISTS platform_access_enrollments_01600 (
  account_id text NOT NULL REFERENCES platform_accounts(id) ON DELETE CASCADE,
  store_id text NOT NULL REFERENCES platform_stores(id) ON DELETE CASCADE,
  user_id text NOT NULL REFERENCES platform_users(id) ON DELETE CASCADE,
  mode text NOT NULL DEFAULT 'custom' CHECK (mode='custom'),
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(account_id,store_id,user_id)
);
INSERT INTO platform_access_enrollments_01600(account_id,store_id,user_id)
SELECT DISTINCT a.account_id,a.store_id,m.user_id
FROM platform_role_assignments_01597 a
JOIN platform_memberships m ON m.id=a.membership_id AND m.account_id=a.account_id
ON CONFLICT (account_id,store_id,user_id) DO NOTHING;
COMMIT;
