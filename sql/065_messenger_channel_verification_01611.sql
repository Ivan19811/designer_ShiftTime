-- 01611. Verified external reply channel is bound to a particular site+visitor capability.
-- It is NOT a global authenticated ShiftTime user or proof of prior account ownership.
BEGIN;
CREATE TABLE IF NOT EXISTS shifttime_messenger_verification_challenges_01611 (
  id uuid PRIMARY KEY,
  account_id text NOT NULL REFERENCES platform_accounts(id) ON DELETE CASCADE,
  workspace_id text NOT NULL REFERENCES platform_workspaces(id) ON DELETE CASCADE,
  store_id text NOT NULL REFERENCES platform_stores(id) ON DELETE CASCADE,
  builder_site_id text NOT NULL,
  visitor_hash char(64) NOT NULL,
  ip_hash char(64) NOT NULL,
  channel text NOT NULL CHECK (channel IN ('sms','telegram','viber','whatsapp')),
  phone_hash char(64) NOT NULL,
  phone_sealed text NOT NULL,
  provider text NOT NULL,
  provider_request_id text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','verified','expired','failed')),
  attempts integer NOT NULL DEFAULT 0,
  consent_fallback boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  verified_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_messenger_challenges_visitor_01611 ON shifttime_messenger_verification_challenges_01611 (store_id,builder_site_id,visitor_hash,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messenger_challenges_ip_01611 ON shifttime_messenger_verification_challenges_01611 (ip_hash,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messenger_challenges_phone_01611 ON shifttime_messenger_verification_challenges_01611 (phone_hash,created_at DESC);
CREATE TABLE IF NOT EXISTS shifttime_messenger_verified_channels_01611 (
  id uuid PRIMARY KEY,
  account_id text NOT NULL REFERENCES platform_accounts(id) ON DELETE CASCADE,
  workspace_id text NOT NULL REFERENCES platform_workspaces(id) ON DELETE CASCADE,
  store_id text NOT NULL REFERENCES platform_stores(id) ON DELETE CASCADE,
  builder_site_id text NOT NULL,
  visitor_hash char(64) NOT NULL,
  channel text NOT NULL CHECK (channel IN ('sms','telegram','viber','whatsapp')),
  phone_hash char(64) NOT NULL,
  phone_sealed text NOT NULL,
  consent_fallback boolean NOT NULL DEFAULT false,
  verified_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (store_id,builder_site_id,visitor_hash,channel,phone_hash)
);
CREATE INDEX IF NOT EXISTS idx_messenger_verified_visitor_01611 ON shifttime_messenger_verified_channels_01611 (store_id,builder_site_id,visitor_hash,verified_at DESC);
COMMIT;
