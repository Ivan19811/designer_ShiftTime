BEGIN;

CREATE TABLE IF NOT EXISTS platform_deployment_state (
  id text PRIMARY KEY,
  schema_stage text NOT NULL DEFAULT '01080',
  repository_mode text NOT NULL DEFAULT 'api-postgresql',
  database_provider text NOT NULL DEFAULT 'postgresql',
  last_migration_at timestamptz,
  last_import_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS commerce_store_imports (
  id text PRIMARY KEY,
  account_id text NOT NULL REFERENCES platform_accounts(id) ON DELETE CASCADE,
  workspace_id text NOT NULL REFERENCES platform_workspaces(id) ON DELETE CASCADE,
  store_id text NOT NULL REFERENCES platform_stores(id) ON DELETE CASCADE,
  imported_by_user_id text REFERENCES platform_users(id) ON DELETE SET NULL,
  source_kind text NOT NULL DEFAULT 'api-snapshot-replace',
  source_revision bigint NOT NULL DEFAULT 0,
  imported_revision bigint NOT NULL DEFAULT 0,
  snapshot_sha256 text NOT NULL DEFAULT '',
  entity_counts jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_store_imports_store_01080 ON commerce_store_imports(store_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_store_imports_hash_01080 ON commerce_store_imports(store_id,snapshot_sha256);

INSERT INTO platform_deployment_state(id,schema_stage,repository_mode,database_provider,last_migration_at,metadata)
VALUES('primary','01080','api-postgresql','postgresql',now(),'{}'::jsonb)
ON CONFLICT(id) DO UPDATE SET schema_stage='01080',repository_mode='api-postgresql',database_provider='postgresql',last_migration_at=now(),updated_at=now();

COMMIT;
