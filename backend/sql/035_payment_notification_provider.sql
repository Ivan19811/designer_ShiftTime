BEGIN;

WITH payment_defaults(event_type,severity) AS (
  VALUES ('payment.succeeded','medium'),('payment.failed','critical'),('payment.refunded','high')
)
INSERT INTO shifttime_notification_rules(id,account_id,workspace_id,store_id,name,enabled,provider,event_type,severity,conditions,actions,scope)
SELECT 'nrule_01413_'||substr(md5(s.id||':'||d.event_type),1,24),w.account_id,s.workspace_id,s.id,'',true,'payments',d.event_type,d.severity,
       '{"mode":"all","items":[]}'::jsonb,'{"notify":true,"channels":["inApp"],"delivery":"immediate"}'::jsonb,jsonb_build_object('type','store','id',s.id)
FROM platform_stores s JOIN platform_workspaces w ON w.id=s.workspace_id CROSS JOIN payment_defaults d
WHERE s.status<>'archived' AND NOT EXISTS (SELECT 1 FROM shifttime_notification_rules r WHERE r.store_id=s.id AND r.provider='payments' AND r.event_type=d.event_type);

-- Historical payment ledger entries existed before the Payments Notification Provider.
-- Keep them visible in the category without flooding the first unread badge after rollout.
INSERT INTO shifttime_notification_receipts(store_id,provider,event_key,status)
SELECT DISTINCT a.store_id,'payments',pe.id,'read'
FROM marketplace_payment_events pe
JOIN marketplace_payment_allocations a ON a.payment_id=pe.payment_id
WHERE pe.event_type IN ('payment-paid','payment-failed','payment-partially-refunded','payment-refunded')
ON CONFLICT(store_id,provider,event_key) DO NOTHING;

COMMIT;
