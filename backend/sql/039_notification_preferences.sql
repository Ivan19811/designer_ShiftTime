BEGIN;

CREATE TABLE IF NOT EXISTS shifttime_notification_preferences (
  store_id text NOT NULL REFERENCES platform_stores(id) ON DELETE CASCADE,
  recipient_key text NOT NULL DEFAULT 'default',
  user_id text REFERENCES platform_users(id) ON DELETE CASCADE,
  preferences jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(store_id,recipient_key)
);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_01417
  ON shifttime_notification_preferences(user_id,store_id)
  WHERE user_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS shifttime_notification_digest_queue (
  id text PRIMARY KEY,
  account_id text NOT NULL,
  workspace_id text NOT NULL,
  store_id text NOT NULL REFERENCES platform_stores(id) ON DELETE CASCADE,
  event_key text NOT NULL,
  event_type text NOT NULL,
  provider text NOT NULL,
  channel text NOT NULL CHECK (channel IN ('email','telegram','webhook')),
  severity text NOT NULL CHECK (severity IN ('low','medium','high','critical')),
  recipient_key text NOT NULL DEFAULT 'default',
  recipient_user_id text REFERENCES platform_users(id) ON DELETE SET NULL,
  recipient_role text NOT NULL DEFAULT '',
  recipient_name text NOT NULL DEFAULT '',
  recipient_email text NOT NULL DEFAULT '',
  matched_rule_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  group_key text NOT NULL,
  fingerprint text NOT NULL,
  mode text NOT NULL CHECK (mode IN ('digest','deferred')),
  duplicate_count integer NOT NULL DEFAULT 1,
  notification jsonb NOT NULL DEFAULT '{}'::jsonb,
  event_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  due_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','sent','cancelled')),
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(store_id,event_key,channel,recipient_key)
);
CREATE INDEX IF NOT EXISTS idx_notification_digest_due_01417
  ON shifttime_notification_digest_queue(status,due_at,store_id);
CREATE INDEX IF NOT EXISTS idx_notification_digest_group_01417
  ON shifttime_notification_digest_queue(store_id,channel,recipient_key,group_key,status,due_at);

CREATE TABLE IF NOT EXISTS shifttime_notification_dedupe_state (
  store_id text NOT NULL REFERENCES platform_stores(id) ON DELETE CASCADE,
  channel text NOT NULL,
  recipient_key text NOT NULL DEFAULT 'default',
  fingerprint text NOT NULL,
  duplicate_count integer NOT NULL DEFAULT 1,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(store_id,channel,recipient_key,fingerprint)
);

CREATE TABLE IF NOT EXISTS shifttime_notification_escalations (
  id text PRIMARY KEY,
  account_id text NOT NULL,
  workspace_id text NOT NULL,
  store_id text NOT NULL REFERENCES platform_stores(id) ON DELETE CASCADE,
  provider text NOT NULL,
  event_key text NOT NULL,
  event_type text NOT NULL,
  severity text NOT NULL,
  notification jsonb NOT NULL DEFAULT '{}'::jsonb,
  event_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  roles jsonb NOT NULL DEFAULT '[]'::jsonb,
  channels jsonb NOT NULL DEFAULT '["email"]'::jsonb,
  due_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','sent','cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  UNIQUE(store_id,provider,event_key)
);
CREATE INDEX IF NOT EXISTS idx_notification_escalations_due_01417
  ON shifttime_notification_escalations(status,due_at,store_id);

COMMIT;
