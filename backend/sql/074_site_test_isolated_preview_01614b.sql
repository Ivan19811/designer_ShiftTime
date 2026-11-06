-- 01614B · isolated Netlify test site ID; never reuse LIVE site for visual preview.
BEGIN;
ALTER TABLE shifttime_site_test_branches_01613d ADD COLUMN IF NOT EXISTS preview_netlify_site_id text;
COMMIT;
