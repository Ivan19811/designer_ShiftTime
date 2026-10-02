BEGIN;

-- 01422 · Shared training-exercise catalog for Music School.
-- Exercise definitions live once in PostgreSQL; per-student results remain in Music Project settings.
CREATE TABLE IF NOT EXISTS music_school_training_exercises (
  id text PRIMARY KEY,
  instrument text NOT NULL DEFAULT 'guitar',
  category text NOT NULL DEFAULT 'coordination',
  order_index integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'published',
  title_key text NOT NULL DEFAULT '',
  description_key text NOT NULL DEFAULT '',
  definition jsonb NOT NULL DEFAULT '{}'::jsonb,
  ui_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  source_stage text NOT NULL DEFAULT '01422',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_music_school_training_exercises_order
  ON music_school_training_exercises(instrument,category,order_index,id);

COMMIT;
