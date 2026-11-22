-- 01613D · ShiftTime Test: separate site draft workflow and Netlify draft deploys.
-- A test branch never changes shifttime_builder_site_projects or the published Netlify URL.
BEGIN;
CREATE TABLE IF NOT EXISTS shifttime_site_test_branches_01613d (
 id text PRIMARY KEY,
 account_id text NOT NULL REFERENCES platform_accounts(id) ON DELETE CASCADE,
 workspace_id text NOT NULL REFERENCES platform_workspaces(id) ON DELETE CASCADE,
 store_id text NOT NULL REFERENCES platform_stores(id) ON DELETE CASCADE,
 site_id text NOT NULL REFERENCES shifttime_builder_sites(id) ON DELETE CASCADE,
 revision_id text NOT NULL UNIQUE REFERENCES shifttime_builder_site_revisions(id) ON DELETE CASCADE,
 author_user_id text NOT NULL REFERENCES platform_users(id) ON DELETE CASCADE,
 base_project_revision bigint NOT NULL,
 state text NOT NULL DEFAULT 'editing' CHECK (state IN ('editing','processing','preview','in_review','approved','published')),
 preview_deploy_id text,
 candidate_deploy_id text,
 preview_url text,
 preview_snapshot_sha text,
 preview_created_at timestamptz,
 submitted_at timestamptz,
 approved_by_user_id text REFERENCES platform_users(id) ON DELETE SET NULL,
 approved_at timestamptz,
 published_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_site_test_branches_scope_01613d ON shifttime_site_test_branches_01613d(account_id,workspace_id,store_id,site_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_site_test_branches_author_01613d ON shifttime_site_test_branches_01613d(author_user_id,site_id,created_at DESC);
COMMIT;
