BEGIN;

CREATE TABLE IF NOT EXISTS commerce_import_rollbacks (
  id text NOT NULL,
  account_id text NOT NULL REFERENCES platform_accounts(id) ON DELETE CASCADE,
  workspace_id text NOT NULL REFERENCES platform_workspaces(id) ON DELETE CASCADE,
  store_id text NOT NULL REFERENCES platform_stores(id) ON DELETE CASCADE,
  created_by_user_id text REFERENCES platform_users(id) ON DELETE SET NULL,
  source_kind text NOT NULL DEFAULT '',
  pre_revision bigint NOT NULL DEFAULT 0,
  post_revision bigint NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'available' CHECK(status IN ('available','restored')),
  rollback_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  restored_at timestamptz,
  restored_by_user_id text REFERENCES platform_users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(store_id,id)
);
CREATE INDEX IF NOT EXISTS idx_commerce_import_rollbacks_store_01397 ON commerce_import_rollbacks(store_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_commerce_import_rollbacks_status_01397 ON commerce_import_rollbacks(store_id,status,created_at DESC);

COMMIT;
