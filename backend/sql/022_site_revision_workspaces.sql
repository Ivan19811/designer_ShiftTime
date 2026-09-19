BEGIN;

CREATE TABLE IF NOT EXISTS shifttime_builder_site_revisions (
  id text PRIMARY KEY,
  site_id text NOT NULL REFERENCES shifttime_builder_sites(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('draft','published','archived')),
  slot smallint NOT NULL DEFAULT 0 CHECK (slot BETWEEN 0 AND 5),
  label text NOT NULL DEFAULT '',
  schema_version text NOT NULL DEFAULT '01231',
  project_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  dirty boolean NOT NULL DEFAULT false,
  source_revision_id text,
  created_by_user_id text REFERENCES platform_users(id) ON DELETE SET NULL,
  updated_by_user_id text REFERENCES platform_users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_shifttime_site_revision_draft_slot_01231
  ON shifttime_builder_site_revisions(site_id, slot)
  WHERE kind='draft';

CREATE UNIQUE INDEX IF NOT EXISTS uq_shifttime_site_revision_published_01231
  ON shifttime_builder_site_revisions(site_id)
  WHERE kind='published';

CREATE INDEX IF NOT EXISTS idx_shifttime_site_revisions_site_01231
  ON shifttime_builder_site_revisions(site_id, kind, updated_at DESC);

COMMIT;
