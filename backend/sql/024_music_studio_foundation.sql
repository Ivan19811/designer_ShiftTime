BEGIN;

-- 01360 · Independent Music Studio persistence foundation.
CREATE TABLE IF NOT EXISTS music_projects (
  id text PRIMARY KEY,
  account_id text NOT NULL REFERENCES platform_accounts(id) ON DELETE CASCADE,
  workspace_id text NOT NULL REFERENCES platform_workspaces(id) ON DELETE CASCADE,
  store_id text NOT NULL REFERENCES platform_stores(id) ON DELETE CASCADE,
  owner_user_id text NOT NULL REFERENCES platform_users(id) ON DELETE RESTRICT,
  name text NOT NULL DEFAULT '',
  tempo numeric(7,3) NOT NULL DEFAULT 120 CHECK (tempo >= 20 AND tempo <= 400),
  time_signature_numerator integer NOT NULL DEFAULT 4 CHECK (time_signature_numerator BETWEEN 1 AND 32),
  time_signature_denominator integer NOT NULL DEFAULT 4 CHECK (time_signature_denominator IN (1,2,4,8,16,32)),
  key_signature text NOT NULL DEFAULT 'C',
  scale text NOT NULL DEFAULT 'major',
  duration_beats numeric(14,4) NOT NULL DEFAULT 64 CHECK (duration_beats >= 0),
  playhead_beat numeric(14,4) NOT NULL DEFAULT 0 CHECK (playhead_beat >= 0),
  loop_enabled boolean NOT NULL DEFAULT false,
  loop_start_beat numeric(14,4) NOT NULL DEFAULT 0 CHECK (loop_start_beat >= 0),
  loop_end_beat numeric(14,4) NOT NULL DEFAULT 16 CHECK (loop_end_beat >= 0),
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  revision bigint NOT NULL DEFAULT 1 CHECK (revision >= 1),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_music_projects_scope ON music_projects(account_id,workspace_id,store_id,updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_music_projects_owner ON music_projects(owner_user_id,updated_at DESC);

CREATE TABLE IF NOT EXISTS music_tracks (
  id text PRIMARY KEY,
  project_id text NOT NULL REFERENCES music_projects(id) ON DELETE CASCADE,
  order_index integer NOT NULL DEFAULT 0,
  type text NOT NULL DEFAULT 'instrument',
  name text NOT NULL DEFAULT '',
  instrument text NOT NULL DEFAULT 'piano',
  mute boolean NOT NULL DEFAULT false,
  solo boolean NOT NULL DEFAULT false,
  volume numeric(6,4) NOT NULL DEFAULT 1 CHECK (volume >= 0 AND volume <= 2),
  pan numeric(6,4) NOT NULL DEFAULT 0 CHECK (pan >= -1 AND pan <= 1),
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(project_id,order_index)
);
CREATE INDEX IF NOT EXISTS idx_music_tracks_project ON music_tracks(project_id,order_index);

CREATE TABLE IF NOT EXISTS music_clips (
  id text PRIMARY KEY,
  project_id text NOT NULL REFERENCES music_projects(id) ON DELETE CASCADE,
  track_id text NOT NULL REFERENCES music_tracks(id) ON DELETE CASCADE,
  start_beat numeric(14,4) NOT NULL DEFAULT 0 CHECK (start_beat >= 0),
  duration_beats numeric(14,4) NOT NULL DEFAULT 4 CHECK (duration_beats >= 0),
  clip_type text NOT NULL DEFAULT 'notes',
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_music_clips_track ON music_clips(track_id,start_beat);

CREATE TABLE IF NOT EXISTS music_note_events (
  id text PRIMARY KEY,
  project_id text NOT NULL REFERENCES music_projects(id) ON DELETE CASCADE,
  track_id text NOT NULL REFERENCES music_tracks(id) ON DELETE CASCADE,
  clip_id text REFERENCES music_clips(id) ON DELETE CASCADE,
  pitch integer NOT NULL CHECK (pitch BETWEEN 0 AND 127),
  start_beat numeric(14,4) NOT NULL CHECK (start_beat >= 0),
  duration_beats numeric(14,4) NOT NULL CHECK (duration_beats > 0),
  velocity integer NOT NULL DEFAULT 100 CHECK (velocity BETWEEN 1 AND 127),
  channel integer NOT NULL DEFAULT 1 CHECK (channel BETWEEN 1 AND 16),
  instrument_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_music_note_events_project_time ON music_note_events(project_id,start_beat);
CREATE INDEX IF NOT EXISTS idx_music_note_events_track_time ON music_note_events(track_id,start_beat);

-- System-file registry for Gallery → System folders → Music.
-- Binary audio remains in media_cloud_assets/R2 and is linked by media_asset_id.
CREATE TABLE IF NOT EXISTS music_assets (
  id text PRIMARY KEY,
  account_id text NOT NULL REFERENCES platform_accounts(id) ON DELETE CASCADE,
  workspace_id text NOT NULL REFERENCES platform_workspaces(id) ON DELETE CASCADE,
  store_id text NOT NULL REFERENCES platform_stores(id) ON DELETE CASCADE,
  project_id text REFERENCES music_projects(id) ON DELETE CASCADE,
  media_asset_id text REFERENCES media_cloud_assets(id) ON DELETE SET NULL,
  asset_type text NOT NULL,
  gallery_folder_id text NOT NULL DEFAULT 'sys_music',
  file_name text NOT NULL DEFAULT '',
  mime_type text NOT NULL DEFAULT 'application/octet-stream',
  size_bytes bigint NOT NULL DEFAULT 0 CHECK (size_bytes >= 0),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_music_assets_scope ON music_assets(account_id,workspace_id,store_id,updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_music_assets_project ON music_assets(project_id,updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_music_assets_folder ON music_assets(store_id,gallery_folder_id,updated_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS uq_music_project_manifest_asset ON music_assets(project_id,asset_type) WHERE asset_type='music.project';

COMMIT;
