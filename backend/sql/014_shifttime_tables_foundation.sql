BEGIN;

CREATE TABLE IF NOT EXISTS shifttime_tables (
  id text PRIMARY KEY,
  owner_user_id text NOT NULL REFERENCES platform_users(id),
  account_id text REFERENCES platform_accounts(id) ON DELETE CASCADE,
  workspace_id text REFERENCES platform_workspaces(id) ON DELETE CASCADE,
  store_id text REFERENCES platform_stores(id) ON DELETE CASCADE,
  scope_type text NOT NULL CHECK (scope_type IN ('personal','account','workspace','store')),
  name text NOT NULL,
  icon text NOT NULL DEFAULT '▦',
  description text NOT NULL DEFAULT '',
  source_type text NOT NULL DEFAULT 'dynamic' CHECK (source_type IN ('dynamic','connected-marketplace','external')),
  template_id text NOT NULL DEFAULT '',
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','archived','deleted')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (
    (scope_type='personal' AND account_id IS NULL AND workspace_id IS NULL AND store_id IS NULL) OR
    (scope_type='account' AND account_id IS NOT NULL AND workspace_id IS NULL AND store_id IS NULL) OR
    (scope_type='workspace' AND account_id IS NOT NULL AND workspace_id IS NOT NULL AND store_id IS NULL) OR
    (scope_type='store' AND account_id IS NOT NULL AND workspace_id IS NOT NULL AND store_id IS NOT NULL)
  )
);
CREATE INDEX IF NOT EXISTS idx_shifttime_tables_owner ON shifttime_tables(owner_user_id,status,updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_shifttime_tables_account ON shifttime_tables(account_id,status,updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_shifttime_tables_workspace ON shifttime_tables(workspace_id,status,updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_shifttime_tables_store ON shifttime_tables(store_id,status,updated_at DESC);

CREATE TABLE IF NOT EXISTS shifttime_table_fields (
  id text PRIMARY KEY,
  table_id text NOT NULL REFERENCES shifttime_tables(id) ON DELETE CASCADE,
  field_key text NOT NULL,
  name text NOT NULL,
  field_type text NOT NULL CHECK (field_type IN ('text','long-text','number','currency','percent','checkbox','select','multi-select','status','date','date-time','email','phone','url','image-file','user','created-time','created-by','updated-time')),
  position numeric(20,6) NOT NULL DEFAULT 0,
  required boolean NOT NULL DEFAULT false,
  unique_value boolean NOT NULL DEFAULT false,
  default_value jsonb,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(table_id,field_key)
);
CREATE INDEX IF NOT EXISTS idx_shifttime_table_fields_order ON shifttime_table_fields(table_id,position,id);

CREATE TABLE IF NOT EXISTS shifttime_table_records (
  id text PRIMARY KEY,
  table_id text NOT NULL REFERENCES shifttime_tables(id) ON DELETE CASCADE,
  values jsonb NOT NULL DEFAULT '{}'::jsonb,
  position numeric(20,6) NOT NULL DEFAULT 0,
  created_by_user_id text NOT NULL REFERENCES platform_users(id),
  updated_by_user_id text NOT NULL REFERENCES platform_users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (jsonb_typeof(values)='object')
);
CREATE INDEX IF NOT EXISTS idx_shifttime_table_records_order ON shifttime_table_records(table_id,position,id);
CREATE INDEX IF NOT EXISTS idx_shifttime_table_records_values ON shifttime_table_records USING gin(values);

CREATE TABLE IF NOT EXISTS shifttime_table_views (
  id text PRIMARY KEY,
  table_id text NOT NULL REFERENCES shifttime_tables(id) ON DELETE CASCADE,
  name text NOT NULL,
  view_type text NOT NULL DEFAULT 'table' CHECK (view_type IN ('table','board','gallery','list','calendar','timeline')),
  position numeric(20,6) NOT NULL DEFAULT 0,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by_user_id text NOT NULL REFERENCES platform_users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_shifttime_table_views_order ON shifttime_table_views(table_id,position,id);

CREATE TABLE IF NOT EXISTS shifttime_table_permissions (
  id text PRIMARY KEY,
  table_id text NOT NULL REFERENCES shifttime_tables(id) ON DELETE CASCADE,
  principal_type text NOT NULL CHECK (principal_type IN ('user','membership')),
  principal_id text NOT NULL,
  permission_role text NOT NULL CHECK (permission_role IN ('owner','editor','commenter','viewer')),
  granted_by_user_id text NOT NULL REFERENCES platform_users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(table_id,principal_type,principal_id)
);
CREATE INDEX IF NOT EXISTS idx_shifttime_table_permissions_principal ON shifttime_table_permissions(principal_type,principal_id,table_id);

CREATE TABLE IF NOT EXISTS shifttime_table_templates (
  id text PRIMARY KEY,
  owner_user_id text REFERENCES platform_users(id) ON DELETE CASCADE,
  account_id text REFERENCES platform_accounts(id) ON DELETE CASCADE,
  workspace_id text REFERENCES platform_workspaces(id) ON DELETE CASCADE,
  scope_type text NOT NULL CHECK (scope_type IN ('built-in','personal','account','workspace')),
  name text NOT NULL,
  category text NOT NULL DEFAULT 'Custom',
  icon text NOT NULL DEFAULT '✦',
  description text NOT NULL DEFAULT '',
  definition jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','archived')),
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_shifttime_table_templates_scope ON shifttime_table_templates(scope_type,account_id,workspace_id,status,updated_at DESC);

COMMIT;

