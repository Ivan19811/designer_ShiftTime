BEGIN;

-- 01409 · Music School repository. Shared curriculum content is stored once.
-- Student progress remains in Music Project settings and is never duplicated here.
CREATE TABLE IF NOT EXISTS music_school_folders (
  id text PRIMARY KEY,
  parent_id text REFERENCES music_school_folders(id) ON DELETE CASCADE,
  node_type text NOT NULL CHECK (node_type IN ('root','school','instrument','level','lesson')),
  slug text NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  name_key text NOT NULL DEFAULT '',
  name_i18n jsonb NOT NULL DEFAULT '{}'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_music_school_folder_path ON music_school_folders(COALESCE(parent_id,''),slug);
CREATE INDEX IF NOT EXISTS idx_music_school_folders_parent ON music_school_folders(parent_id,order_index,id);

CREATE TABLE IF NOT EXISTS music_school_lessons (
  id text PRIMARY KEY,
  folder_id text NOT NULL UNIQUE REFERENCES music_school_folders(id) ON DELETE CASCADE,
  instrument text NOT NULL DEFAULT 'guitar',
  level_id text NOT NULL,
  level_order integer NOT NULL DEFAULT 1,
  lesson_order integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'structure-ready',
  title_key text NOT NULL DEFAULT '',
  title_i18n jsonb NOT NULL DEFAULT '{}'::jsonb,
  description_key text NOT NULL DEFAULT '',
  description_i18n jsonb NOT NULL DEFAULT '{}'::jsonb,
  definition jsonb NOT NULL DEFAULT '{}'::jsonb,
  school_content jsonb NOT NULL DEFAULT '{}'::jsonb,
  latest_version integer NOT NULL DEFAULT 1 CHECK (latest_version >= 1),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(instrument,level_id,lesson_order)
);
CREATE INDEX IF NOT EXISTS idx_music_school_lessons_order ON music_school_lessons(instrument,level_order,lesson_order);
CREATE INDEX IF NOT EXISTS idx_music_school_lessons_status ON music_school_lessons(status,updated_at DESC);

CREATE TABLE IF NOT EXISTS music_school_lesson_versions (
  lesson_id text NOT NULL REFERENCES music_school_lessons(id) ON DELETE CASCADE,
  version integer NOT NULL CHECK (version >= 1),
  source_stage text NOT NULL DEFAULT '01409',
  snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(lesson_id,version)
);
CREATE INDEX IF NOT EXISTS idx_music_school_versions_created ON music_school_lesson_versions(lesson_id,created_at DESC);

COMMIT;
