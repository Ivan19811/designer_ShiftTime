-- 01615B · Owner-authorized selective merge into original Render project.
-- Netlify LIVE publication remains a distinct, manual operation.
BEGIN;
ALTER TABLE shifttime_site_test_branches_01613d
 DROP CONSTRAINT IF EXISTS shifttime_site_test_branches_01613d_state_check;
ALTER TABLE shifttime_site_test_branches_01613d
 ADD CONSTRAINT shifttime_site_test_branches_01613d_state_check
 CHECK(state IN ('editing','processing','preview','in_review','approved','rejected','published','applied','rolled_back'));
ALTER TABLE shifttime_site_test_branches_01613d
 ADD COLUMN IF NOT EXISTS applied_at timestamptz,
 ADD COLUMN IF NOT EXISTS rolled_back_at timestamptz,
 ADD COLUMN IF NOT EXISTS applied_project_revision bigint,
 ADD COLUMN IF NOT EXISTS applied_project_sha text,
 ADD COLUMN IF NOT EXISTS backup_revision_id text;
CREATE TABLE IF NOT EXISTS shifttime_site_test_apply_events_01615b (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 test_id text NOT NULL REFERENCES shifttime_site_test_branches_01613d(id) ON DELETE CASCADE,
 site_id text NOT NULL REFERENCES shifttime_builder_sites(id) ON DELETE CASCADE,
 actor_user_id text NOT NULL REFERENCES platform_users(id) ON DELETE CASCADE,
 action text NOT NULL CHECK(action IN ('applied','rolled_back')),
 backup_revision_id text NOT NULL,
 selected_json jsonb NOT NULL DEFAULT '{}'::jsonb,
 before_sha text NOT NULL,
 after_sha text NOT NULL,
 original_revision_before bigint NOT NULL,
 original_revision_after bigint NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_site_test_apply_once_01615b
 ON shifttime_site_test_apply_events_01615b(test_id) WHERE action='applied';
CREATE INDEX IF NOT EXISTS idx_site_test_apply_history_01615b ON shifttime_site_test_apply_events_01615b(site_id,created_at DESC);
COMMIT;
