BEGIN;

ALTER TABLE shifttime_published_sites
  ADD COLUMN IF NOT EXISTS traffic_identity_token text;

CREATE UNIQUE INDEX IF NOT EXISTS uq_shifttime_published_sites_traffic_identity_01203
  ON shifttime_published_sites(traffic_identity_token)
  WHERE traffic_identity_token IS NOT NULL AND traffic_identity_token<>'';

COMMIT;
