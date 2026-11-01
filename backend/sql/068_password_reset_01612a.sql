-- 01612A · One-use email password recovery for existing ShiftTime ID accounts.
BEGIN;
CREATE TABLE IF NOT EXISTS platform_password_resets_01612a (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id text NOT NULL REFERENCES platform_users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_password_resets_user_01612a
  ON platform_password_resets_01612a(user_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_password_resets_expiry_01612a
  ON platform_password_resets_01612a(expires_at);
COMMIT;
