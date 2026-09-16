import {getTrafficRecorderStats01194,flushTrafficRecorder01194} from './traffic-recorder-01194.mjs';

const n=value=>{const out=Number(value);return Number.isFinite(out)&&out>0?out:0;};
export const RENDER_REFERENCE_01194=Object.freeze({provider:'render',includedBytes:5_000_000_000,overageUsdPerGb:0.15});

export function normalizeTrafficSummary01194(row={}){
  return Object.freeze({
    today:Object.freeze({inboundBytes:n(row.today_inbound),outboundBytes:n(row.today_outbound),renderBillableOutboundBytes:n(row.today_billable??row.today_outbound),requests:n(row.today_requests),failed:n(row.today_failed)}),
    month:Object.freeze({inboundBytes:n(row.month_inbound),outboundBytes:n(row.month_outbound),renderBillableOutboundBytes:n(row.month_billable??row.month_outbound),requests:n(row.month_requests),failed:n(row.month_failed)}),
  });
}

export function normalizeTrafficEventRow01194(row={}){
  const occurred=row.occurred_at instanceof Date?row.occurred_at:new Date(row.occurred_at||0);
  return Object.freeze({
    id:String(row.id??''),occurredAt:Number.isNaN(occurred.getTime())?'':occurred.toISOString(),requestId:String(row.request_id||''),eventType:String(row.event_type||''),integration:String(row.integration||''),module:String(row.module||''),operation:String(row.operation||''),routeKey:String(row.route_key||''),siteId:row.site_id?String(row.site_id):null,
    inboundBytes:n(row.inbound_bytes),outboundBytes:n(row.outbound_bytes),renderBillableOutboundBytes:n(row.render_billable_outbound_bytes),statusCode:n(row.status_code),result:String(row.result||''),durationMs:n(row.duration_ms)
  });
}


export function normalizeTrafficSiteRow01203(row={}){return {
  siteId:String(row.site_id||''),siteName:String(row.site_name||row.site_id||''),siteSlug:String(row.site_slug||''),workspaceId:String(row.workspace_id||''),storeId:String(row.store_id||''),
  todayInboundBytes:n(row.today_inbound),todayOutboundBytes:n(row.today_outbound),todayBillableOutboundBytes:n(row.today_billable),monthInboundBytes:n(row.month_inbound),monthOutboundBytes:n(row.month_outbound),monthBillableOutboundBytes:n(row.month_billable),events:n(row.events),failed:n(row.failed)
};}

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
    COALESCE(SUM(e.inbound_bytes),0)::text AS month_inbound,
    COALESCE(SUM(e.outbound_bytes),0)::text AS month_outbound,
    COALESCE(SUM(e.render_billable_outbound_bytes),0)::text AS month_billable,
    COUNT(*)::text AS events,COUNT(*) FILTER (WHERE e.result='failed')::text AS failed
    FROM shifttime_traffic_events e
    LEFT JOIN shifttime_published_sites ps ON ps.account_id=e.account_id AND ps.builder_site_id=e.site_id
    LEFT JOIN shifttime_builder_sites bs ON bs.account_id=e.account_id AND bs.id=e.site_id
    WHERE e.account_id=$1 AND e.site_id IS NOT NULL AND e.site_id<>'' AND e.occurred_at>=date_trunc('month',now())
    GROUP BY e.site_id
    ORDER BY SUM(e.render_billable_outbound_bytes) DESC,SUM(e.outbound_bytes) DESC
    LIMIT $2`,[scope.accountId,limit]);
  return Object.freeze({stage:'01203',sites:q.rows.map(normalizeTrafficSiteRow01203)});
}

export function normalizeTrafficIntegrationRows01201(rows=[]){return rows.map(row=>Object.freeze({integration:String(row.integration||'external'),todayInboundBytes:n(row.today_inbound),todayOutboundBytes:n(row.today_outbound),todayBillableOutboundBytes:n(row.today_billable),monthInboundBytes:n(row.month_inbound),monthOutboundBytes:n(row.month_outbound),monthBillableOutboundBytes:n(row.month_billable),events:n(row.events),failed:n(row.failed)}));}

export async function getTrafficSummary01194(scope={}){
  await flushTrafficRecorder01194();
  const {pool}=await import('./db.mjs');
  const [q,iq]=await Promise.all([
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
      FROM shifttime_traffic_events WHERE account_id=$1 AND event_type='integration' AND occurred_at>=date_trunc('month',now()) GROUP BY integration ORDER BY SUM(render_billable_outbound_bytes) DESC`,[scope.accountId])
  ]);
  return Object.freeze({stage:'01203',meterMode:'http+service-payload-v3-site',billingReference:RENDER_REFERENCE_01194,...normalizeTrafficSummary01194(q.rows[0]||{}),integrations:normalizeTrafficIntegrationRows01201(iq.rows||[]),recorder:getTrafficRecorderStats01194()});
}

async function listTrafficByType(scope={},input={},eventType=''){
  await flushTrafficRecorder01194();
  const {pool}=await import('./db.mjs');
  const limit=Math.max(1,Math.min(200,Number(input.limit)||50));
  const args=[scope.accountId,limit],type=String(eventType||'').trim();
  const where=type?`account_id=$1 AND event_type=$3`:`account_id=$1`;if(type)args.push(type);
  const q=await pool.query(`SELECT id,occurred_at,request_id,event_type,integration,module,operation,route_key,site_id,inbound_bytes,outbound_bytes,render_billable_outbound_bytes,status_code,result,duration_ms FROM shifttime_traffic_events WHERE ${where} ORDER BY occurred_at DESC,id DESC LIMIT $2`,args);
  return Object.freeze({stage:'01203',events:q.rows.map(normalizeTrafficEventRow01194)});
}

export const listTrafficEvents01194=(scope={},input={})=>listTrafficByType(scope,input,'http');
export const listTrafficIntegrationEvents01201=(scope={},input={})=>listTrafficByType(scope,input,'integration');
