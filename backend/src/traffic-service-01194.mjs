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
    id:String(row.id??''),occurredAt:Number.isNaN(occurred.getTime())?'':occurred.toISOString(),module:String(row.module||''),operation:String(row.operation||''),routeKey:String(row.route_key||''),siteId:row.site_id?String(row.site_id):null,
    inboundBytes:n(row.inbound_bytes),outboundBytes:n(row.outbound_bytes),renderBillableOutboundBytes:n(row.render_billable_outbound_bytes),statusCode:n(row.status_code),result:String(row.result||''),durationMs:n(row.duration_ms)
  });
}

export async function getTrafficSummary01194(scope={}){
  await flushTrafficRecorder01194();
  const {pool}=await import('./db.mjs');
  const q=await pool.query(`SELECT
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
    FROM shifttime_traffic_events
    WHERE account_id=$1 AND occurred_at>=date_trunc('month',now())`,[scope.accountId]);
  return Object.freeze({stage:'01194',meterMode:'http-payload-v1',billingReference:RENDER_REFERENCE_01194,...normalizeTrafficSummary01194(q.rows[0]||{}),recorder:getTrafficRecorderStats01194()});
}

export async function listTrafficEvents01194(scope={},input={}){
  await flushTrafficRecorder01194();
  const {pool}=await import('./db.mjs');
  const limit=Math.max(1,Math.min(200,Number(input.limit)||50));
  const q=await pool.query(`SELECT id,occurred_at,module,operation,route_key,site_id,inbound_bytes,outbound_bytes,render_billable_outbound_bytes,status_code,result,duration_ms
    FROM shifttime_traffic_events WHERE account_id=$1 ORDER BY occurred_at DESC,id DESC LIMIT $2`,[scope.accountId,limit]);
  return Object.freeze({stage:'01194',events:q.rows.map(normalizeTrafficEventRow01194)});
}
