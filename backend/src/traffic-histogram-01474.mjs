import {flushTrafficRecorder01194} from './traffic-recorder-01194.mjs';
import {normalizeTrafficEventRow01194} from './traffic-service-01194.mjs';

// All histogram data is aggregated in PostgreSQL, never derived from the last N journal rows.
const units=new Set(['minute','hour','day','week','month']);
const number=v=>Math.max(0,Number(v)||0);
export function parseTrafficHistogramWindow01474(input={}){
  const from=new Date(input.from||''),to=new Date(input.to||''),unit=String(input.unit||'hour');
  if(!units.has(unit)||!Number.isFinite(from.getTime())||!Number.isFinite(to.getTime())||to<=from||to-from>370*86400000)throw Object.assign(new Error('TRAFFIC_HISTOGRAM_INVALID_RANGE'),{statusCode:400});
  const siteIds=String(input.siteIds||'').split(',').map(s=>s.trim()).filter(Boolean).slice(0,30);
  if(String(input.siteIds||'').split(',').filter(Boolean).length>30)throw Object.assign(new Error('TRAFFIC_HISTOGRAM_TOO_MANY_SITES'),{statusCode:400});
  if(siteIds.some(id=>id.length>160))throw Object.assign(new Error('TRAFFIC_HISTOGRAM_INVALID_SITE'),{statusCode:400});
  return {from:from.toISOString(),to:to.toISOString(),unit,siteIds};
}
function siteFilter(ids){return ids.length?'AND COALESCE(NULLIF(e.site_id,\'\'),\'__unassigned__\')=ANY($4::text[])':'';}
function totalFields(){return `COUNT(*)::text AS requests,
    COALESCE(SUM(e.inbound_bytes),0)::text AS inbound,
    COALESCE(SUM(e.render_billable_outbound_bytes),0)::text AS render_out,
    COALESCE(SUM(CASE WHEN e.event_type='integration' THEN e.render_billable_outbound_bytes ELSE 0 END),0)::text AS service,
    COALESCE(SUM(CASE WHEN e.traffic_class='direct-storage' AND e.result='success' THEN e.storage_bytes ELSE 0 END),0)::text AS r2_direct,
    COUNT(*) FILTER (WHERE e.result='failed')::text AS failed`;
}
function stats(row){return {requests:number(row.requests),inboundBytes:number(row.inbound),renderOutboundBytes:number(row.render_out),serviceOutboundBytes:number(row.service),directR2Bytes:number(row.r2_direct),failed:number(row.failed)};}
export async function listTrafficHistogram01474(scope={},input={},options={}){
  const range=parseTrafficHistogramWindow01474(input);
  await (options.flush||flushTrafficRecorder01194)();
  const query=options.query||((await import('./db.mjs')).pool.query.bind((await import('./db.mjs')).pool));
  const args=[scope.accountId,range.from,range.to,...(range.siteIds.length?[range.siteIds]:[])];
  const filter=siteFilter(range.siteIds);
  const [q,sites]=await Promise.all([
    query(`SELECT to_char(date_trunc('${range.unit}',e.occurred_at AT TIME ZONE 'Europe/Kyiv'),'YYYY-MM-DD"T"HH24:MI:SS') AS bucket,
    COALESCE(NULLIF(e.site_id,''),'__unassigned__') AS site_id,${totalFields()}
    FROM shifttime_traffic_events e WHERE e.account_id=$1 AND e.occurred_at >= $2::timestamptz AND e.occurred_at < $3::timestamptz ${filter}
    GROUP BY 1,2 ORDER BY 1,2`,args),
    query(`SELECT COALESCE(NULLIF(e.site_id,''),'__unassigned__') AS site_id,
    COALESCE((SELECT MAX(NULLIF(bs.name,'')) FROM shifttime_builder_sites bs WHERE bs.account_id=e.account_id AND bs.id=e.site_id),
    (SELECT MAX(NULLIF(ps.site_name,'')) FROM shifttime_published_sites ps WHERE ps.account_id=e.account_id AND ps.builder_site_id=e.site_id),
    NULLIF(e.site_id,''),'') AS site_name,
    COUNT(*)::text AS requests FROM shifttime_traffic_events e
    WHERE e.account_id=$1 AND e.occurred_at >= $2::timestamptz AND e.occurred_at < $3::timestamptz
    GROUP BY e.account_id,e.site_id ORDER BY COUNT(*) DESC LIMIT 100`,[scope.accountId,range.from,range.to])
  ]);
  return {stage:'01474',source:'postgresql-traffic-events-aggregate',timezone:'Europe/Kyiv',
    window:{from:range.from,to:range.to,unit:range.unit},selectedSiteIds:range.siteIds,
    sites:sites.rows.map(row=>({id:String(row.site_id),name:String(row.site_name||row.site_id),requests:number(row.requests)})),
    buckets:q.rows.map(row=>({bucket:String(row.bucket),siteId:String(row.site_id),...stats(row)}))};
}
export async function getTrafficHistogramDetails01474(scope={},input={},options={}){
  const range=parseTrafficHistogramWindow01474(input);
  // A bucket detail request may cover at most 1 month; a broader aggregate stays on the histogram endpoint.
  if(new Date(range.to)-new Date(range.from)>32*86400000)throw Object.assign(new Error('TRAFFIC_HISTOGRAM_DETAIL_TOO_LARGE'),{statusCode:400});
  await (options.flush||flushTrafficRecorder01194)();
  const query=options.query||((await import('./db.mjs')).pool.query.bind((await import('./db.mjs')).pool));
  const args=[scope.accountId,range.from,range.to,...(range.siteIds.length?[range.siteIds]:[])];
  const filter=siteFilter(range.siteIds);
  const where=`e.account_id=$1 AND e.occurred_at >= $2::timestamptz AND e.occurred_at < $3::timestamptz ${filter}`;
  const [totals,routes,events,bursts]=await Promise.all([
    query(`SELECT ${totalFields()} FROM shifttime_traffic_events e WHERE ${where}`,args),
    query(`SELECT e.route_key,e.operation,e.module,e.event_type,${totalFields()},MAX(e.occurred_at) AS last_at
      FROM shifttime_traffic_events e WHERE ${where}
      GROUP BY e.route_key,e.operation,e.module,e.event_type
      ORDER BY SUM(e.render_billable_outbound_bytes)+SUM(CASE WHEN e.traffic_class='direct-storage' AND e.result='success' THEN e.storage_bytes ELSE 0 END) DESC`,args),
    query(`SELECT id,occurred_at,request_id,event_type,integration,module,operation,route_key,site_id,workspace_id,store_id,inbound_bytes,outbound_bytes,render_billable_outbound_bytes,storage_bytes,traffic_class,metadata,status_code,result,duration_ms
      FROM shifttime_traffic_events e WHERE ${where} ORDER BY e.occurred_at DESC,e.id DESC LIMIT 100`,args),
    query(`SELECT route_key,operation,site_id, to_timestamp(floor(extract(epoch FROM occurred_at)/5)*5) AS burst_at,
      COUNT(*)::text AS requests,COALESCE(SUM(render_billable_outbound_bytes),0)::text AS render_out
      FROM shifttime_traffic_events e WHERE ${where} AND event_type='http'
      GROUP BY 1,2,3,4 HAVING COUNT(*) >= 5 ORDER BY COUNT(*) DESC, SUM(render_billable_outbound_bytes) DESC LIMIT 50`,args)
  ]);
  return {stage:'01474',source:'postgresql-traffic-events',window:{from:range.from,to:range.to},siteIds:range.siteIds,totals:stats(totals.rows[0]||{}),
    bursts:bursts.rows.map(row=>({routeKey:String(row.route_key||''),operation:String(row.operation||''),siteId:String(row.site_id||''),at:new Date(row.burst_at).toISOString(),requests:number(row.requests),renderOutboundBytes:number(row.render_out)})),
    routes:routes.rows.map(row=>({routeKey:String(row.route_key||''),operation:String(row.operation||''),module:String(row.module||''),eventType:String(row.event_type||''),lastAt:new Date(row.last_at).toISOString(),...stats(row)})),
    events:events.rows.map(normalizeTrafficEventRow01194),limit:100,eventsTruncated:number(totals.rows[0]?.requests)>events.rows.length};
}
