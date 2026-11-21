-- 01611A: Scoped verified contact profiles. No merging by phone, Telegram, name or email.
BEGIN;
CREATE TABLE IF NOT EXISTS shifttime_messenger_contacts_01611a (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id text NOT NULL REFERENCES platform_accounts(id) ON DELETE CASCADE,
  workspace_id text NOT NULL REFERENCES platform_workspaces(id) ON DELETE CASCADE,
  store_id text NOT NULL REFERENCES platform_stores(id) ON DELETE CASCADE,
  builder_site_id text NOT NULL,
  visitor_hash char(64) NOT NULL,
  customer_user_id text REFERENCES platform_users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(store_id,builder_site_id,visitor_hash)
);
CREATE INDEX IF NOT EXISTS idx_messenger_contact_customer_01611a
  ON shifttime_messenger_contacts_01611a(store_id,customer_user_id) WHERE customer_user_id IS NOT NULL;
ALTER TABLE shifttime_messenger_verified_channels_01611
  ADD COLUMN IF NOT EXISTS contact_id uuid REFERENCES shifttime_messenger_contacts_01611a(id) ON DELETE SET NULL;
ALTER TABLE shifttime_customer_messages
  ADD COLUMN IF NOT EXISTS messenger_contact_id uuid REFERENCES shifttime_messenger_contacts_01611a(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_messenger_messages_contact_01611a
  ON shifttime_customer_messages(store_id,messenger_contact_id,last_activity_at DESC)
  WHERE messenger_contact_id IS NOT NULL;
-- Idempotent historical backfill: only real verified visitor capabilities can establish contacts.
INSERT INTO shifttime_messenger_contacts_01611a
  (account_id,workspace_id,store_id,builder_site_id,visitor_hash)
SELECT DISTINCT account_id,workspace_id,store_id,builder_site_id,visitor_hash
FROM shifttime_messenger_verified_channels_01611
ON CONFLICT(store_id,builder_site_id,visitor_hash) DO NOTHING;
UPDATE shifttime_messenger_verified_channels_01611 vc
SET contact_id=c.id
FROM shifttime_messenger_contacts_01611a c
WHERE vc.contact_id IS DISTINCT FROM c.id
  AND vc.account_id=c.account_id AND vc.workspace_id=c.workspace_id
  AND vc.store_id=c.store_id AND vc.builder_site_id=c.builder_site_id
  AND vc.visitor_hash=c.visitor_hash;
UPDATE shifttime_customer_messages m
SET messenger_contact_id=c.id
FROM shifttime_messenger_contacts_01611a c
WHERE m.channel='chat' AND m.messenger_contact_id IS DISTINCT FROM c.id
  AND m.account_id=c.account_id AND m.workspace_id=c.workspace_id
  AND m.store_id=c.store_id AND m.builder_site_id=c.builder_site_id
  AND m.messenger_visitor_hash=c.visitor_hash;
COMMIT;
