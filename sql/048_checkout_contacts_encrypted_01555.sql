BEGIN;
-- 01555 · Contact data is never copied to cart or draft JSON and remains encrypted.
CREATE TABLE IF NOT EXISTS shifttime_checkout_contacts_01555 (
  draft_id text PRIMARY KEY REFERENCES shifttime_checkout_drafts_01554(id) ON DELETE CASCADE,
  store_id text NOT NULL REFERENCES platform_stores(id) ON DELETE CASCADE,
  site_id text NOT NULL,
  created_by_user_id text NOT NULL REFERENCES platform_users(id) ON DELETE CASCADE,
  iv_b64 text NOT NULL,
  ciphertext_b64 text NOT NULL,
  tag_b64 text NOT NULL,
  contacts_digest char(64) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  CHECK (length(iv_b64)=16),
  CHECK (length(tag_b64)=24),
  CHECK (length(ciphertext_b64)>20),
  CHECK (expires_at>created_at)
);
CREATE INDEX IF NOT EXISTS idx_checkout_contact_expiry_01555 ON shifttime_checkout_contacts_01555(expires_at);
COMMIT;
