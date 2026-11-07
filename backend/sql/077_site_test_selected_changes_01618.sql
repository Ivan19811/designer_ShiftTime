-- 01618: audit and safe rollback for individually selected visual changes
BEGIN;
CREATE TABLE IF NOT EXISTS shifttime_site_test_change_batches_01618 (
  id text PRIMARY KEY,
  site_id text NOT NULL REFERENCES shifttime_builder_sites(id) ON DELETE CASCADE,
  actor_user_id text NOT NULL REFERENCES platform_users(id),
  backup_revision_id text NOT NULL,
  choices_json jsonb NOT NULL,
  before_sha text NOT NULL,
  after_sha text NOT NULL,
  original_revision_before bigint NOT NULL,
  original_revision_after bigint NOT NULL,
  status text NOT NULL DEFAULT 'applied' CHECK (status IN ('applied','rolled_back')),
  created_at timestamptz NOT NULL DEFAULT now(),
  rolled_back_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_st_change_batches_site_01618
  ON shifttime_site_test_change_batches_01618(site_id,created_at DESC);
COMMIT;
