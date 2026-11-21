-- 01612C · Platform-wide, recipient-free transactional email accounting.
BEGIN;
CREATE TABLE IF NOT EXISTS platform_email_usage_01612c (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 created_at timestamptz NOT NULL DEFAULT now(),
 finished_at timestamptz,
 provider text NOT NULL DEFAULT 'brevo',
 module text NOT NULL DEFAULT 'system',
 site_id text NOT NULL DEFAULT '',
 status text NOT NULL CHECK(status IN ('pending','accepted','failed','blocked')),
 response_code integer,
 error_code text NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_email_usage_date_01612c ON platform_email_usage_01612c(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_usage_status_01612c ON platform_email_usage_01612c(status,created_at DESC);
COMMIT;
