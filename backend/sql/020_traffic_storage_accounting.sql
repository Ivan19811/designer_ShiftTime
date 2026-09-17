BEGIN;

-- 01206 · Storage traffic is measured separately from Render HTTP/service bandwidth.
ALTER TABLE shifttime_traffic_events
  ADD COLUMN IF NOT EXISTS storage_bytes bigint NOT NULL DEFAULT 0;

ALTER TABLE shifttime_traffic_events
  ADD COLUMN IF NOT EXISTS traffic_class text NOT NULL DEFAULT 'render';

ALTER TABLE shifttime_traffic_events
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname='ck_shifttime_traffic_storage_bytes_01206'
  ) THEN
    ALTER TABLE shifttime_traffic_events
      ADD CONSTRAINT ck_shifttime_traffic_storage_bytes_01206 CHECK (storage_bytes >= 0);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_shifttime_traffic_storage_account_time_01206
  ON shifttime_traffic_events(account_id,event_type,traffic_class,occurred_at DESC);

COMMIT;
