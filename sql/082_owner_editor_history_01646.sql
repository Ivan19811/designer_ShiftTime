BEGIN;
ALTER TABLE shifttime_builder_site_revisions
 ADD COLUMN IF NOT EXISTS base_original_project_json jsonb,
 ADD COLUMN IF NOT EXISTS base_original_revision bigint,
 ADD COLUMN IF NOT EXISTS prepared_original_revision bigint;
CREATE TABLE IF NOT EXISTS shifttime_builder_site_history_01646 (
 id bigserial PRIMARY KEY,
 site_id text NOT NULL REFERENCES shifttime_builder_sites(id) ON DELETE CASCADE,
 slot integer NOT NULL CHECK (slot BETWEEN 1 AND 50),
 label text NOT NULL DEFAULT '',
 reason text NOT NULL CHECK (reason IN ('original','saved','published')),
 source_revision_id text,
 project_json jsonb NOT NULL,
 saved_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE (site_id,slot)
);
CREATE INDEX IF NOT EXISTS idx_builder_site_history_saved_01646
 ON shifttime_builder_site_history_01646(site_id,saved_at DESC);
COMMIT;
