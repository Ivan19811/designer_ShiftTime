BEGIN;

CREATE TABLE IF NOT EXISTS shifttime_order_notification_events (
  id text PRIMARY KEY,
  account_id text NOT NULL,
  workspace_id text NOT NULL,
  store_id text NOT NULL REFERENCES platform_stores(id) ON DELETE CASCADE,
  seller_order_id text NOT NULL REFERENCES marketplace_seller_orders(id) ON DELETE CASCADE,
  marketplace_order_id text NOT NULL REFERENCES marketplace_orders(id) ON DELETE CASCADE,
  event_key text NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('order.created','order.confirmed','order.processing','order.paid','order.payment_failed','order.cancelled','order.shipped','order.delivered','order.refund')),
  severity text NOT NULL CHECK (severity IN ('low','medium','high','critical')),
  kind text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(store_id,event_key)
);
CREATE INDEX IF NOT EXISTS idx_order_notification_events_store_time_01412 ON shifttime_order_notification_events(store_id,occurred_at DESC,id DESC);
CREATE INDEX IF NOT EXISTS idx_order_notification_events_seller_01412 ON shifttime_order_notification_events(seller_order_id,occurred_at DESC,id DESC);
CREATE INDEX IF NOT EXISTS idx_order_notification_events_type_01412 ON shifttime_order_notification_events(store_id,event_type,occurred_at DESC);

INSERT INTO shifttime_order_notification_events(id,account_id,workspace_id,store_id,seller_order_id,marketplace_order_id,event_key,event_type,severity,kind,payload,occurred_at,created_at)
SELECT 'onev_'||substr(md5(so.store_id||':'||so.id),1,28),w.account_id,s.workspace_id,so.store_id,so.id,so.marketplace_order_id,so.id,'order.created','low','order-created',
       jsonb_build_object('order',jsonb_build_object('id',so.id,'marketplaceOrderId',so.marketplace_order_id,'orderNumber',so.order_number,'total',so.total::float8,'itemsCount',(SELECT COUNT(*)::int FROM marketplace_order_items oi WHERE oi.seller_order_id=so.id),'buyerName',COALESCE(so.buyer->>'name',''),'status','new','paymentStatus','pending','paymentMethod',COALESCE(so.payment->>'method',''),'currency',so.currency,'sellerId',so.seller_profile_id,'sellerName',so.seller_name,'storeId',so.store_id,'siteId','','siteName',''),'source',jsonb_build_object('type','migration','key','034-backfill')),
       so.created_at,so.created_at
FROM marketplace_seller_orders so
JOIN platform_stores s ON s.id=so.store_id
JOIN platform_workspaces w ON w.id=s.workspace_id
WHERE NOT EXISTS (SELECT 1 FROM shifttime_order_notification_events e WHERE e.store_id=so.store_id AND e.event_key=so.id);

WITH order_defaults(event_type,severity) AS (
  VALUES ('order.created','medium'),('order.confirmed','low'),('order.processing','low'),('order.paid','medium'),('order.payment_failed','critical'),('order.cancelled','high'),('order.shipped','medium'),('order.delivered','low'),('order.refund','high')
)
INSERT INTO shifttime_notification_rules(id,account_id,workspace_id,store_id,name,enabled,provider,event_type,severity,conditions,actions,scope)
SELECT 'nrule_01412_'||substr(md5(s.id||':'||d.event_type),1,24),w.account_id,s.workspace_id,s.id,'',true,'orders',d.event_type,d.severity,
       '{"mode":"all","items":[]}'::jsonb,'{"notify":true,"channels":["inApp"],"delivery":"immediate"}'::jsonb,jsonb_build_object('type','store','id',s.id)
FROM platform_stores s JOIN platform_workspaces w ON w.id=s.workspace_id CROSS JOIN order_defaults d
WHERE s.status<>'archived' AND NOT EXISTS (SELECT 1 FROM shifttime_notification_rules r WHERE r.store_id=s.id AND r.provider='orders' AND r.event_type=d.event_type);

COMMIT;
