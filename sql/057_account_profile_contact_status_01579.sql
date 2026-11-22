-- 01579 · Persist real account contact verification authority.
-- Historical registration email/password is NOT proof of email ownership.
-- No API in this release can set verification timestamps; they require a future OTP proof flow.
BEGIN;
ALTER TABLE platform_users
  ADD COLUMN IF NOT EXISTS phone_e164 text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS email_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS phone_verified_at timestamptz;
COMMIT;
