BEGIN;

ALTER TABLE shifttime_customer_messages
  ADD COLUMN IF NOT EXISTS assigned_user_id text REFERENCES platform_users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS closed_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_activity_at timestamptz;

UPDATE shifttime_customer_messages
SET last_activity_at=GREATEST(created_at,updated_at)
WHERE last_activity_at IS NULL;
ALTER TABLE shifttime_customer_messages ALTER COLUMN last_activity_at SET DEFAULT now();
ALTER TABLE shifttime_customer_messages ALTER COLUMN last_activity_at SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_customer_messages_store_activity_01410
  ON shifttime_customer_messages(store_id,last_activity_at DESC);
CREATE INDEX IF NOT EXISTS idx_customer_messages_store_assignee_01410
  ON shifttime_customer_messages(store_id,assigned_user_id,last_activity_at DESC);

CREATE TABLE IF NOT EXISTS shifttime_customer_message_thread (
  id text PRIMARY KEY,
  message_id text NOT NULL REFERENCES shifttime_customer_messages(id) ON DELETE CASCADE,
  store_id text NOT NULL REFERENCES platform_stores(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('customer','reply','note','status','assignment')),
  body text NOT NULL DEFAULT '',
  actor_user_id text REFERENCES platform_users(id) ON DELETE SET NULL,
  actor_name text NOT NULL DEFAULT '',
  visibility text NOT NULL DEFAULT 'internal' CHECK (visibility IN ('customer','internal')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  delivery_status text NOT NULL DEFAULT 'none' CHECK (delivery_status IN ('none','pending','sent','failed')),
  delivery_error text NOT NULL DEFAULT '',
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_customer_message_thread_message_01410
  ON shifttime_customer_message_thread(message_id,created_at,id);
CREATE INDEX IF NOT EXISTS idx_customer_message_thread_store_01410
  ON shifttime_customer_message_thread(store_id,created_at DESC);

INSERT INTO shifttime_customer_message_thread(id,message_id,store_id,kind,body,actor_name,visibility,metadata,delivery_status,created_at)
SELECT 'thread_customer_'||m.id,m.id,m.store_id,'customer',m.body,COALESCE(NULLIF(m.customer->>'name',''),'Customer'),'customer',
       jsonb_build_object('subject',m.subject,'channel',m.channel,'customer',m.customer,'context',m.context),'none',m.created_at
FROM shifttime_customer_messages m
WHERE NOT EXISTS (
  SELECT 1 FROM shifttime_customer_message_thread t WHERE t.message_id=m.id AND t.kind='customer'
);

COMMIT;
