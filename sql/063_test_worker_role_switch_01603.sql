-- 01603 · Single, explicitly enrolled test worker per Store, with an atomic grant pointer.
-- Does not modify existing memberships, authentication sessions or normal role assignments.
BEGIN;
CREATE TABLE IF NOT EXISTS platform_test_workers_01603 (
  account_id text NOT NULL REFERENCES platform_accounts(id) ON DELETE CASCADE,
  store_id text NOT NULL REFERENCES platform_stores(id) ON DELETE CASCADE,
  membership_id text NOT NULL REFERENCES platform_memberships(id) ON DELETE CASCADE,
  user_id text NOT NULL REFERENCES platform_users(id) ON DELETE CASCADE,
  assignment_id text REFERENCES platform_role_assignments_01597(id) ON DELETE SET NULL,
  enrolled_by_user_id text REFERENCES platform_users(id) ON DELETE SET NULL,
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(account_id,store_id),
  UNIQUE(store_id,membership_id)
);
COMMIT;
