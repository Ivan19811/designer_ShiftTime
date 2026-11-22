-- 01615A · Independent owner approvals and immutable action history.
-- No changes to shifttime_builder_site_projects or Netlify production deploys.
BEGIN;
ALTER TABLE shifttime_site_test_branches_01613d
 ADD COLUMN IF NOT EXISTS review_snapshot_sha text,
 ADD COLUMN IF NOT EXISTS review_cycle integer NOT NULL DEFAULT 0;
ALTER TABLE shifttime_site_test_branches_01613d
 DROP CONSTRAINT IF EXISTS shifttime_site_test_branches_01613d_state_check;
ALTER TABLE shifttime_site_test_branches_01613d
 ADD CONSTRAINT shifttime_site_test_branches_01613d_state_check
 CHECK(state IN ('editing','processing','preview','in_review','approved','rejected','published'));
CREATE TABLE IF NOT EXISTS shifttime_site_test_review_events_01615a (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 test_id text NOT NULL REFERENCES shifttime_site_test_branches_01613d(id) ON DELETE CASCADE,
 site_id text NOT NULL REFERENCES shifttime_builder_sites(id) ON DELETE CASCADE,
 actor_user_id text NOT NULL REFERENCES platform_users(id) ON DELETE CASCADE,
 revision_id text NOT NULL,
 review_cycle integer NOT NULL,
 action text NOT NULL CHECK(action IN ('submitted','approved','changes_requested','rejected')),
 project_sha text NOT NULL,
 note text NOT NULL DEFAULT '',
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_site_test_review_history_01615a
 ON shifttime_site_test_review_events_01615a(test_id,created_at DESC,id DESC);
COMMIT;
