-- 01611C: Manual phone reveal audit, no raw numbers and no phone hashes.
BEGIN;
CREATE TABLE IF NOT EXISTS shifttime_messenger_phone_reveal_audit_01611c (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id text NOT NULL,
  workspace_id text NOT NULL,
  store_id text NOT NULL REFERENCES platform_stores(id) ON DELETE CASCADE,
  builder_site_id text NOT NULL,
  message_id text NOT NULL,
  contact_id uuid NOT NULL,
  actor_user_id text NOT NULL REFERENCES platform_users(id) ON DELETE CASCADE,
  channel text NOT NULL CHECK (channel IN ('sms','telegram','viber','whatsapp')),
  purpose text NOT NULL CHECK (purpose IN ('reply','call')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_messenger_phone_reveal_user_01611c
 ON shifttime_messenger_phone_reveal_audit_01611c(store_id,actor_user_id,created_at DESC);
COMMIT;
