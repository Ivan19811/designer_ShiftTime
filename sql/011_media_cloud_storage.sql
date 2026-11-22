BEGIN;

-- 01081 · Cloud media binary metadata. Binary bytes live in R2/S3, never PostgreSQL.
CREATE TABLE IF NOT EXISTS media_cloud_assets (
  id text PRIMARY KEY,
  account_id text NOT NULL REFERENCES platform_accounts(id) ON DELETE CASCADE,
  workspace_id text NOT NULL REFERENCES platform_workspaces(id) ON DELETE CASCADE,
  store_id text NOT NULL REFERENCES platform_stores(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 's3-compatible',
  bucket text NOT NULL,
  object_key text NOT NULL,
  kind text NOT NULL DEFAULT 'image' CHECK (kind IN ('image','video','document')),
  file_name text NOT NULL DEFAULT '',
  mime_type text NOT NULL DEFAULT 'application/octet-stream',
  size_bytes bigint NOT NULL DEFAULT 0 CHECK (size_bytes >= 0),
  width integer NOT NULL DEFAULT 0 CHECK (width >= 0),
  height integer NOT NULL DEFAULT 0 CHECK (height >= 0),
  sha256 text NOT NULL DEFAULT '',
  etag text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'uploading' CHECK (status IN ('uploading','ready','failed','deleted')),
  public_url text NOT NULL DEFAULT '',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  deleted_at timestamptz,
  UNIQUE(provider,bucket,object_key)
);
CREATE INDEX IF NOT EXISTS idx_media_cloud_assets_store_status ON media_cloud_assets(store_id,status,updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_media_cloud_assets_scope ON media_cloud_assets(account_id,workspace_id,store_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_media_cloud_assets_store_sha_size_ready
  ON media_cloud_assets(store_id,sha256,size_bytes)
  WHERE status='ready' AND sha256<>'';

-- Derivative foundation. A later image worker can claim pending rows and write thumbnail/WebP/AVIF variants.
CREATE TABLE IF NOT EXISTS media_asset_derivatives (
  id text PRIMARY KEY,
  media_asset_id text NOT NULL REFERENCES media_cloud_assets(id) ON DELETE CASCADE,
  derivative_kind text NOT NULL,
  width integer NOT NULL DEFAULT 0 CHECK (width >= 0),
  height integer NOT NULL DEFAULT 0 CHECK (height >= 0),
  mime_type text NOT NULL DEFAULT '',
  object_key text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','ready','failed')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(media_asset_id,derivative_kind,width,height)
);
CREATE INDEX IF NOT EXISTS idx_media_asset_derivatives_pending ON media_asset_derivatives(status,created_at) WHERE status IN ('pending','processing');

-- Audit lifecycle separately from the frozen 01052 commerce snapshot.
CREATE TABLE IF NOT EXISTS media_asset_events (
  id bigserial PRIMARY KEY,
  media_asset_id text NOT NULL REFERENCES media_cloud_assets(id) ON DELETE CASCADE,
  store_id text NOT NULL REFERENCES platform_stores(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_media_asset_events_asset ON media_asset_events(media_asset_id,id);
CREATE INDEX IF NOT EXISTS idx_media_asset_events_store ON media_asset_events(store_id,id DESC);

COMMIT;
