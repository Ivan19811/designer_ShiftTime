BEGIN;

CREATE TABLE IF NOT EXISTS shifttime_traffic_notification_events (
  id text PRIMARY KEY,
  account_id text NOT NULL REFERENCES platform_accounts(id) ON DELETE CASCADE,
  workspace_id text NOT NULL REFERENCES platform_workspaces(id) ON DELETE CASCADE,
  store_id text NOT NULL REFERENCES platform_stores(id) ON DELETE CASCADE,
  site_id text,
  event_key text NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('traffic.warning','traffic.limit','storage.warning')),
  severity text NOT NULL CHECK (severity IN ('low','medium','high','critical')),
  kind text NOT NULL,
  source_id text NOT NULL DEFAULT '',
  source_name text NOT NULL DEFAULT '',
  metric_value bigint NOT NULL DEFAULT 0 CHECK (metric_value >= 0),
  threshold_value bigint NOT NULL DEFAULT 0 CHECK (threshold_value >= 0),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(store_id,event_key)
);
CREATE INDEX IF NOT EXISTS idx_traffic_notification_events_store_01415 ON shifttime_traffic_notification_events(store_id,occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_traffic_notification_events_site_01415 ON shifttime_traffic_notification_events(site_id,occurred_at DESC) WHERE site_id IS NOT NULL;

WITH traffic_defaults(event_type,severity) AS (
  VALUES ('traffic.warning','high'),('traffic.limit','critical'),('storage.warning','high')
)
INSERT INTO shifttime_notification_rules(id,account_id,workspace_id,store_id,name,enabled,provider,event_type,severity,conditions,actions,scope)
SELECT 'nrule_01415_'||substr(md5(s.id||':'||d.event_type),1,24),w.account_id,s.workspace_id,s.id,'',true,'traffic',d.event_type,d.severity,
       '{"mode":"all","items":[]}'::jsonb,'{"notify":true,"channels":["inApp"],"delivery":"immediate"}'::jsonb,jsonb_build_object('type','store','id',s.id)
FROM platform_stores s JOIN platform_workspaces w ON w.id=s.workspace_id CROSS JOIN traffic_defaults d
WHERE s.status<>'archived' AND NOT EXISTS (SELECT 1 FROM shifttime_notification_rules r WHERE r.store_id=s.id AND r.provider='traffic' AND r.event_type=d.event_type);

-- Backfill the current account traffic threshold as already-read so deployment does not create an unread spike.
WITH account_usage AS (
  SELECT account_id,COALESCE(SUM(render_billable_outbound_bytes),0)::bigint used_bytes
  FROM shifttime_traffic_events WHERE occurred_at>=date_trunc('month',now()) GROUP BY account_id
), classified AS (
  SELECT account_id,used_bytes,
         CASE WHEN used_bytes>=5000000000 THEN 'traffic.limit' WHEN used_bytes>=4000000000 THEN 'traffic.warning' ELSE NULL END event_type,
         CASE WHEN used_bytes>=5000000000 THEN 'account-traffic-limit' WHEN used_bytes>=4000000000 THEN 'account-traffic-warning' ELSE NULL END kind,
         CASE WHEN used_bytes>=5000000000 THEN 'critical' ELSE 'high' END severity
  FROM account_usage WHERE used_bytes>=4000000000
), inserted AS (
  INSERT INTO shifttime_traffic_notification_events(id,account_id,workspace_id,store_id,event_key,event_type,severity,kind,source_id,source_name,metric_value,threshold_value,payload,occurred_at)
  SELECT 'tnev_'||substr(md5(s.id||':'||c.account_id||':'||to_char(now(),'YYYY-MM')||':'||c.event_type),1,28),c.account_id,s.workspace_id,s.id,
         'account:'||c.account_id||':'||to_char(now(),'YYYY-MM')||':'||c.event_type,c.event_type,c.severity,c.kind,c.account_id,c.account_id,c.used_bytes,5000000000,
         jsonb_build_object('traffic',jsonb_build_object('scope','account','accountId',c.account_id,'storeId',s.id,'usedBytes',c.used_bytes,'thresholdBytes',5000000000,'percent',round((c.used_bytes::numeric/5000000000::numeric)*100,2),'monthBytes',c.used_bytes,'monthKey',to_char(now(),'YYYY-MM')),'storage','{}'::jsonb,'sourceId',c.account_id,'sourceName',c.account_id),now()
  FROM classified c JOIN platform_workspaces w ON w.account_id=c.account_id JOIN platform_stores s ON s.workspace_id=w.id AND s.status<>'archived'
  ON CONFLICT(store_id,event_key) DO NOTHING RETURNING store_id,event_key
)
INSERT INTO shifttime_notification_receipts(store_id,provider,event_key,status)
SELECT store_id,'traffic',event_key,'read' FROM inserted
ON CONFLICT(store_id,provider,event_key) DO NOTHING;

COMMIT;
