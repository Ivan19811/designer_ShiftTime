BEGIN;

CREATE TABLE IF NOT EXISTS shifttime_site_notification_events (
  id text PRIMARY KEY,
  account_id text NOT NULL REFERENCES platform_accounts(id) ON DELETE CASCADE,
  workspace_id text NOT NULL REFERENCES platform_workspaces(id) ON DELETE CASCADE,
  store_id text NOT NULL REFERENCES platform_stores(id) ON DELETE CASCADE,
  builder_site_id text NOT NULL,
  published_site_id text REFERENCES shifttime_published_sites(id) ON DELETE CASCADE,
  event_key text NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('site.published','site.publish_failed','site.domain_failed','site.ssl_failed')),
  severity text NOT NULL CHECK (severity IN ('low','medium','high','critical')),
  kind text NOT NULL,
  site_name text NOT NULL DEFAULT '',
  site_slug text NOT NULL DEFAULT '',
  site_provider text NOT NULL DEFAULT 'netlify',
  site_url text NOT NULL DEFAULT '',
  admin_url text NOT NULL DEFAULT '',
  netlify_site_id text,
  deploy_id text,
  deploy_state text NOT NULL DEFAULT '',
  revision text NOT NULL DEFAULT '',
  requested_revision text NOT NULL DEFAULT '',
  published_revision text NOT NULL DEFAULT '',
  error text NOT NULL DEFAULT '',
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(store_id,event_key)
);
CREATE INDEX IF NOT EXISTS idx_site_notification_events_store_01414 ON shifttime_site_notification_events(store_id,occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_site_notification_events_site_01414 ON shifttime_site_notification_events(builder_site_id,occurred_at DESC);

WITH site_defaults(event_type,severity) AS (
  VALUES ('site.published','low'),('site.publish_failed','critical'),('site.domain_failed','critical'),('site.ssl_failed','critical')
)
INSERT INTO shifttime_notification_rules(id,account_id,workspace_id,store_id,name,enabled,provider,event_type,severity,conditions,actions,scope)
SELECT 'nrule_01414_'||substr(md5(s.id||':'||d.event_type),1,24),w.account_id,s.workspace_id,s.id,'',true,'sites',d.event_type,d.severity,
       '{"mode":"all","items":[]}'::jsonb,'{"notify":true,"channels":["inApp"],"delivery":"immediate"}'::jsonb,jsonb_build_object('type','store','id',s.id)
FROM platform_stores s JOIN platform_workspaces w ON w.id=s.workspace_id CROSS JOIN site_defaults d
WHERE s.status<>'archived' AND NOT EXISTS (SELECT 1 FROM shifttime_notification_rules r WHERE r.store_id=s.id AND r.provider='sites' AND r.event_type=d.event_type);

-- Backfill terminal historical deployments as already-read site notifications.
WITH history AS (
  SELECT ps.account_id,ps.workspace_id,ps.store_id,ps.builder_site_id,ps.id published_site_id,ps.site_name,ps.site_slug,ps.provider,COALESCE(ps.netlify_ssl_url,ps.netlify_url,'') site_url,ps.netlify_admin_url,ps.netlify_site_id,
         d.netlify_deploy_id deploy_id,d.state deploy_state,d.revision,ps.requested_revision,CASE WHEN d.state='ready' THEN d.revision ELSE ps.published_revision END published_revision,COALESCE(d.error,'') error,COALESCE(d.published_at,d.updated_at,d.created_at) occurred_at,
         CASE WHEN d.state='ready' THEN 'site.published' WHEN lower(COALESCE(d.error,'')) ~ '(ssl|tls|certificate|cert|https)' THEN 'site.ssl_failed' WHEN lower(COALESCE(d.error,'')) ~ '(domain|dns|hostname|cname|nameserver)' THEN 'site.domain_failed' ELSE 'site.publish_failed' END event_type
  FROM shifttime_site_deployments d JOIN shifttime_published_sites ps ON ps.id=d.published_site_id
  WHERE d.state IN ('ready','error','failed')
), inserted AS (
  INSERT INTO shifttime_site_notification_events(id,account_id,workspace_id,store_id,builder_site_id,published_site_id,event_key,event_type,severity,kind,site_name,site_slug,site_provider,site_url,admin_url,netlify_site_id,deploy_id,deploy_state,revision,requested_revision,published_revision,error,payload,occurred_at)
  SELECT 'snev_'||substr(md5(h.store_id||':'||h.builder_site_id||':'||h.deploy_id||':'||h.event_type),1,28),h.account_id,h.workspace_id,h.store_id,h.builder_site_id,h.published_site_id,h.builder_site_id||':'||h.deploy_id||':'||h.event_type,h.event_type,
         CASE WHEN h.event_type='site.published' THEN 'low' ELSE 'critical' END,
         CASE h.event_type WHEN 'site.published' THEN 'site-published' WHEN 'site.domain_failed' THEN 'site-domain-failed' WHEN 'site.ssl_failed' THEN 'site-ssl-failed' ELSE 'site-publish-failed' END,
         h.site_name,h.site_slug,h.provider,h.site_url,h.netlify_admin_url,h.netlify_site_id,h.deploy_id,h.deploy_state,h.revision,h.requested_revision,h.published_revision,h.error,
         jsonb_build_object('site',jsonb_build_object('id',h.builder_site_id,'publishedSiteId',h.published_site_id,'name',h.site_name,'slug',h.site_slug,'provider',h.provider,'url',h.site_url,'adminUrl',h.netlify_admin_url,'netlifySiteId',h.netlify_site_id,'deployId',h.deploy_id,'state',h.deploy_state,'revision',h.revision,'requestedRevision',h.requested_revision,'publishedRevision',h.published_revision,'error',h.error)),h.occurred_at
  FROM history h ON CONFLICT(store_id,event_key) DO NOTHING RETURNING store_id,event_key
)
INSERT INTO shifttime_notification_receipts(store_id,provider,event_key,status)
SELECT store_id,'sites',event_key,'read' FROM inserted
ON CONFLICT(store_id,provider,event_key) DO NOTHING;

COMMIT;
