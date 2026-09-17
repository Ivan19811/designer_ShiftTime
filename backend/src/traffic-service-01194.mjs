import {getTrafficRecorderStats01194,flushTrafficRecorder01194} from './traffic-recorder-01194.mjs';

const n=value=>{const out=Number(value);return Number.isFinite(out)&&out>0?out:0;};
export const RENDER_REFERENCE_01194=Object.freeze({provider:'render',includedBytes:5_000_000_000,overageUsdPerGb:0.15});

export function normalizeTrafficSummary01194(row={}){
  return Object.freeze({
    today:Object.freeze({inboundBytes:n(row.today_inbound),outboundBytes:n(row.today_outbound),renderBillableOutboundBytes:n(row.today_billable??row.today_outbound),requests:n(row.today_requests),failed:n(row.today_failed)}),
    month:Object.freeze({inboundBytes:n(row.month_inbound),outboundBytes:n(row.month_outbound),renderBillableOutboundBytes:n(row.month_billable??row.month_outbound),requests:n(row.month_requests),failed:n(row.month_failed)}),
  });
}

export function normalizeTrafficStorageSummary01206(row={}){
  return Object.freeze({
    todayDirectR2UploadBytes:n(row.today_direct_storage),todayProxyR2UploadBytes:n(row.today_proxy_storage),
    monthDirectR2UploadBytes:n(row.month_direct_storage),monthProxyR2UploadBytes:n(row.month_proxy_storage),
    fileCount:n(row.file_count),failed:n(row.failed),averageUploadBytes:n(row.average_upload),largestUploadBytes:n(row.largest_upload),
  });
}

export function normalizeTrafficEventRow01194(row={}){
  const occurred=row.occurred_at instanceof Date?row.occurred_at:new Date(row.occurred_at||0);
  return Object.freeze({
    id:String(row.id??''),occurredAt:Number.isNaN(occurred.getTime())?'':occurred.toISOString(),requestId:String(row.request_id||''),eventType:String(row.event_type||''),integration:String(row.integration||''),module:String(row.module||''),operation:String(row.operation||''),routeKey:String(row.route_key||''),siteId:row.site_id?String(row.site_id):null,workspaceId:row.workspace_id?String(row.workspace_id):null,storeId:row.store_id?String(row.store_id):null,
    inboundBytes:n(row.inbound_bytes),outboundBytes:n(row.outbound_bytes),renderBillableOutboundBytes:n(row.render_billable_outbound_bytes),storageBytes:n(row.storage_bytes),trafficClass:String(row.traffic_class||''),metadata:row.metadata&&typeof row.metadata==='object'?row.metadata:{},statusCode:n(row.status_code),result:String(row.result||''),durationMs:n(row.duration_ms)
  });
}

export function normalizeTrafficSiteRow01203(row={}){
  const out={
    siteId:String(row.site_id||''),siteName:String(row.site_name||row.site_id||''),siteSlug:String(row.site_slug||''),workspaceId:String(row.workspace_id||''),storeId:String(row.store_id||''),
    todayInboundBytes:n(row.today_inbound),todayOutboundBytes:n(row.today_outbound),todayBillableOutboundBytes:n(row.today_billable),monthInboundBytes:n(row.month_inbound),monthOutboundBytes:n(row.month_outbound),monthBillableOutboundBytes:n(row.month_billable),events:n(row.events),failed:n(row.failed)
  };
  if(row.today_direct_storage!=null)out.todayDirectStorageBytes=n(row.today_direct_storage);
  if(row.month_direct_storage!=null)out.monthDirectStorageBytes=n(row.month_direct_storage);
  if(row.today_proxy_storage!=null)out.todayProxyStorageBytes=n(row.today_proxy_storage);
  if(row.month_proxy_storage!=null)out.monthProxyStorageBytes=n(row.month_proxy_storage);
  if(row.today_cdn!=null)out.todayCdnBytes=n(row.today_cdn);
  if(row.month_cdn!=null)out.monthCdnBytes=n(row.month_cdn);
  if(row.today_total_platform!=null)out.todayTotalPlatformBytes=n(row.today_total_platform);
  if(row.month_total_platform!=null)out.monthTotalPlatformBytes=n(row.month_total_platform);
  return out;
}

export async function listTrafficSites01203(scope={},input={}){
  await flushTrafficRecorder01194();
  const {pool}=await import('./db.mjs');
  const limit=Math.max(1,Math.min(500,Number(input.limit)||100));
  const q=await pool.query(`SELECT e.site_id,
    COALESCE(MAX(NULLIF(ps.site_name,'')),MAX(NULLIF(bs.name,'')),e.site_id) AS site_name,
    COALESCE(MAX(NULLIF(ps.site_slug,'')),MAX(NULLIF(bs.slug,'')),'') AS site_slug,
    MAX(e.workspace_id) AS workspace_id,MAX(e.store_id) AS store_id,
    COALESCE(SUM(e.inbound_bytes) FILTER (WHERE e.occurred_at>=date_trunc('day',now())),0)::text AS today_inbound,
    COALESCE(SUM(e.outbound_bytes) FILTER (WHERE e.occurred_at>=date_trunc('day',now())),0)::text AS today_outbound,
    COALESCE(SUM(e.render_billable_outbound_bytes) FILTER (WHERE e.occurred_at>=date_trunc('day',now())),0)::text AS today_billable,
    COALESCE(SUM(e.storage_bytes) FILTER (WHERE e.occurred_at>=date_trunc('day',now()) AND e.traffic_class='direct-storage' AND e.result='success'),0)::text AS today_direct_storage,
    COALESCE(SUM(e.storage_bytes) FILTER (WHERE e.occurred_at>=date_trunc('day',now()) AND e.traffic_class='proxy-storage' AND e.result='success'),0)::text AS today_proxy_storage,
    0::text AS today_cdn,
    (COALESCE(SUM(e.render_billable_outbound_bytes) FILTER (WHERE e.occurred_at>=date_trunc('day',now())),0)+COALESCE(SUM(e.storage_bytes) FILTER (WHERE e.occurred_at>=date_trunc('day',now()) AND e.traffic_class='direct-storage' AND e.result='success'),0))::text AS today_total_platform,
    COALESCE(SUM(e.inbound_bytes),0)::text AS month_inbound,
    COALESCE(SUM(e.outbound_bytes),0)::text AS month_outbound,
    COALESCE(SUM(e.render_billable_outbound_bytes),0)::text AS month_billable,
    COALESCE(SUM(e.storage_bytes) FILTER (WHERE e.traffic_class='direct-storage' AND e.result='success'),0)::text AS month_direct_storage,
    COALESCE(SUM(e.storage_bytes) FILTER (WHERE e.traffic_class='proxy-storage' AND e.result='success'),0)::text AS month_proxy_storage,
    0::text AS month_cdn,
    (COALESCE(SUM(e.render_billable_outbound_bytes),0)+COALESCE(SUM(e.storage_bytes) FILTER (WHERE e.traffic_class='direct-storage' AND e.result='success'),0))::text AS month_total_platform,
    COUNT(*)::text AS events,COUNT(*) FILTER (WHERE e.result='failed')::text AS failed
    FROM shifttime_traffic_events e
    LEFT JOIN shifttime_published_sites ps ON ps.account_id=e.account_id AND ps.builder_site_id=e.site_id
    LEFT JOIN shifttime_builder_sites bs ON bs.account_id=e.account_id AND bs.id=e.site_id
    WHERE e.account_id=$1 AND e.site_id IS NOT NULL AND e.site_id<>'' AND e.occurred_at>=date_trunc('month',now())
    GROUP BY e.site_id
    ORDER BY (SUM(e.render_billable_outbound_bytes)+SUM(e.storage_bytes) FILTER (WHERE e.traffic_class='direct-storage' AND e.result='success')) DESC NULLS LAST
    LIMIT $2`,[scope.accountId,limit]);
  return Object.freeze({stage:'01206',sites:q.rows.map(normalizeTrafficSiteRow01203)});
}

export function normalizeTrafficIntegrationRows01201(rows=[]){return rows.map(row=>Object.freeze({integration:String(row.integration||'external'),todayInboundBytes:n(row.today_inbound),todayOutboundBytes:n(row.today_outbound),todayBillableOutboundBytes:n(row.today_billable),monthInboundBytes:n(row.month_inbound),monthOutboundBytes:n(row.month_outbound),monthBillableOutboundBytes:n(row.month_billable),events:n(row.events),failed:n(row.failed)}));}

export async function getTrafficSummary01194(scope={}){
  await flushTrafficRecorder01194();
  const {pool}=await import('./db.mjs');
  const [q,iq,sq]=await Promise.all([
    pool.query(`SELECT
      COALESCE(SUM(inbound_bytes) FILTER (WHERE occurred_at>=date_trunc('day',now())),0)::text AS today_inbound,
      COALESCE(SUM(outbound_bytes) FILTER (WHERE occurred_at>=date_trunc('day',now())),0)::text AS today_outbound,
      COALESCE(SUM(render_billable_outbound_bytes) FILTER (WHERE occurred_at>=date_trunc('day',now())),0)::text AS today_billable,
      COUNT(*) FILTER (WHERE occurred_at>=date_trunc('day',now()))::text AS today_requests,
      COUNT(*) FILTER (WHERE occurred_at>=date_trunc('day',now()) AND result='failed')::text AS today_failed,
      COALESCE(SUM(inbound_bytes),0)::text AS month_inbound,
      COALESCE(SUM(outbound_bytes),0)::text AS month_outbound,
      COALESCE(SUM(render_billable_outbound_bytes),0)::text AS month_billable,
      COUNT(*)::text AS month_requests,
      COUNT(*) FILTER (WHERE result='failed')::text AS month_failed
      FROM shifttime_traffic_events WHERE account_id=$1 AND occurred_at>=date_trunc('month',now())`,[scope.accountId]),
    pool.query(`SELECT integration,
      COALESCE(SUM(inbound_bytes) FILTER (WHERE occurred_at>=date_trunc('day',now())),0)::text AS today_inbound,
      COALESCE(SUM(outbound_bytes) FILTER (WHERE occurred_at>=date_trunc('day',now())),0)::text AS today_outbound,
      COALESCE(SUM(render_billable_outbound_bytes) FILTER (WHERE occurred_at>=date_trunc('day',now())),0)::text AS today_billable,
      COALESCE(SUM(inbound_bytes),0)::text AS month_inbound,
      COALESCE(SUM(outbound_bytes),0)::text AS month_outbound,
      COALESCE(SUM(render_billable_outbound_bytes),0)::text AS month_billable,
      COUNT(*)::text AS events,COUNT(*) FILTER (WHERE result='failed')::text AS failed
      FROM shifttime_traffic_events WHERE account_id=$1 AND event_type='integration' AND occurred_at>=date_trunc('month',now()) GROUP BY integration ORDER BY SUM(render_billable_outbound_bytes) DESC`,[scope.accountId]),
    pool.query(`SELECT
      COALESCE(SUM(storage_bytes) FILTER (WHERE occurred_at>=date_trunc('day',now()) AND traffic_class='direct-storage' AND result='success'),0)::text AS today_direct_storage,
      COALESCE(SUM(storage_bytes) FILTER (WHERE occurred_at>=date_trunc('day',now()) AND traffic_class='proxy-storage' AND result='success'),0)::text AS today_proxy_storage,
      COALESCE(SUM(storage_bytes) FILTER (WHERE traffic_class='direct-storage' AND result='success'),0)::text AS month_direct_storage,
      COALESCE(SUM(storage_bytes) FILTER (WHERE traffic_class='proxy-storage' AND result='success'),0)::text AS month_proxy_storage,
      COUNT(*) FILTER (WHERE result='success')::text AS file_count,
      COUNT(*) FILTER (WHERE result='failed')::text AS failed,
      COALESCE(AVG(storage_bytes) FILTER (WHERE result='success'),0)::text AS average_upload,
      COALESCE(MAX(storage_bytes) FILTER (WHERE result='success'),0)::text AS largest_upload
      FROM shifttime_traffic_events WHERE account_id=$1 AND event_type='storage' AND occurred_at>=date_trunc('month',now())`,[scope.accountId])
  ]);
  return Object.freeze({stage:'01206',meterMode:'http+service-payload-v5-storage-site',billingReference:RENDER_REFERENCE_01194,...normalizeTrafficSummary01194(q.rows[0]||{}),storage:normalizeTrafficStorageSummary01206(sq.rows[0]||{}),integrations:normalizeTrafficIntegrationRows01201(iq.rows||[]),recorder:getTrafficRecorderStats01194()});
}

async function listTrafficByType(scope={},input={},eventType=''){
  await flushTrafficRecorder01194();
  const {pool}=await import('./db.mjs');
  const limit=Math.max(1,Math.min(200,Number(input.limit)||50));
  const args=[scope.accountId,limit],type=String(eventType||'').trim();
  const where=type?`account_id=$1 AND event_type=$3`:`account_id=$1`;if(type)args.push(type);
  const q=await pool.query(`SELECT id,occurred_at,request_id,event_type,integration,module,operation,route_key,site_id,workspace_id,store_id,inbound_bytes,outbound_bytes,render_billable_outbound_bytes,storage_bytes,traffic_class,metadata,status_code,result,duration_ms FROM shifttime_traffic_events WHERE ${where} ORDER BY occurred_at DESC,id DESC LIMIT $2`,args);
  return Object.freeze({stage:'01206',events:q.rows.map(normalizeTrafficEventRow01194)});
}

export async function listTrafficStorage01206(scope={},input={}){
  await flushTrafficRecorder01194();
  const {pool}=await import('./db.mjs');
  const limit=Math.max(1,Math.min(200,Number(input.limit)||100));
  const [events,top]=await Promise.all([
    pool.query(`SELECT id,occurred_at,request_id,event_type,integration,module,operation,route_key,site_id,workspace_id,store_id,inbound_bytes,outbound_bytes,render_billable_outbound_bytes,storage_bytes,traffic_class,metadata,status_code,result,duration_ms FROM shifttime_traffic_events WHERE account_id=$1 AND event_type='storage' ORDER BY occurred_at DESC,id DESC LIMIT $2`,[scope.accountId,limit]),
    pool.query(`SELECT site_id,MAX(store_id) AS store_id,COALESCE(SUM(storage_bytes) FILTER (WHERE result='success'),0)::text AS storage_bytes,COUNT(*)::text AS events,COUNT(*) FILTER (WHERE result='failed')::text AS failed FROM shifttime_traffic_events WHERE account_id=$1 AND event_type='storage' AND occurred_at>=date_trunc('month',now()) AND site_id IS NOT NULL AND site_id<>'' GROUP BY site_id ORDER BY SUM(storage_bytes) FILTER (WHERE result='success') DESC NULLS LAST LIMIT 20`,[scope.accountId])
  ]);
  return Object.freeze({stage:'01206',events:events.rows.map(normalizeTrafficEventRow01194),topSites:top.rows.map(row=>({siteId:String(row.site_id||''),storeId:String(row.store_id||''),storageBytes:n(row.storage_bytes),events:n(row.events),failed:n(row.failed)}))});
}

export const listTrafficEvents01194=(scope={},input={})=>listTrafficByType(scope,input,'http');
export const listTrafficIntegrationEvents01201=(scope={},input={})=>listTrafficByType(scope,input,'integration');
