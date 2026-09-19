// 01228 · Site growth and business analytics. Storage history is snapshot based;
// traffic/page views/orders are aggregated from canonical event/order tables.
import {pool} from './db.mjs';
import {getAuthorizedSiteResourceInventory01213} from './site-resource-inventory-01213.mjs';

const str=value=>String(value??'').trim();
const n=value=>{const out=Number(value);return Number.isFinite(out)&&out>0?out:0;};
const int=value=>Math.max(0,Math.trunc(Number(value)||0));
const PERIOD_DAYS_01228=Object.freeze({'7d':7,'30d':30,'90d':90,'180d':180,'365d':365,all:36500});

export function normalizeSiteGrowthPeriod01228(value='30d'){
  const key=str(value).toLowerCase();
  return Object.prototype.hasOwnProperty.call(PERIOD_DAYS_01228,key)?key:'30d';
}

function startIso01228(period='30d',now=new Date()){
  const key=normalizeSiteGrowthPeriod01228(period),days=PERIOD_DAYS_01228[key],start=new Date(now);
  start.setUTCHours(0,0,0,0);start.setUTCDate(start.getUTCDate()-Math.max(0,days-1));
  return start.toISOString();
}

function normalizeSnapshotRow01228(row={}){
  const date=row.snapshot_date instanceof Date?row.snapshot_date.toISOString().slice(0,10):str(row.snapshot_date).slice(0,10);
  return Object.freeze({date,capturedAt:row.captured_at instanceof Date?row.captured_at.toISOString():str(row.captured_at),r2PhysicalBytes:n(row.r2_physical_bytes),logicalReferencedBytes:n(row.logical_referenced_bytes),resourceCount:int(row.resource_count),sharedResourceCount:int(row.shared_resource_count),brokenReferenceCount:int(row.broken_reference_count)});
}

function normalizeTrafficDay01228(row={}){
  const date=row.day instanceof Date?row.day.toISOString().slice(0,10):str(row.day).slice(0,10);
  return Object.freeze({date,inboundBytes:n(row.inbound_bytes),outboundBytes:n(row.outbound_bytes),renderBillableBytes:n(row.render_billable_bytes),directR2Bytes:n(row.direct_r2_bytes),proxyR2Bytes:n(row.proxy_r2_bytes),pageViews:int(row.page_views),visits:int(row.visits),failed:int(row.failed)});
}

function normalizeOrderDay01228(row={}){
  const date=row.day instanceof Date?row.day.toISOString().slice(0,10):str(row.day).slice(0,10);
  return Object.freeze({date,orders:int(row.orders),completedOrders:int(row.completed_orders),cancelledOrders:int(row.cancelled_orders),orderTotal:n(row.order_total),currency:str(row.currency)||'UAH'});
}

export async function captureSiteMetricSnapshot01228(scope={},userId='',siteId='',options={}){
  const id=str(siteId);if(!id)return null;
  const detail=options.detail||await getAuthorizedSiteResourceInventory01213(scope,userId,id,{limit:1},{inventoryOptions:options.forceRefresh?{forceRefresh:true}:{}});
  const site=detail?.site||{},summary=detail?.summary||{};
  const q=await pool.query(`INSERT INTO shifttime_site_metric_snapshots(
      account_id,workspace_id,store_id,site_id,r2_physical_bytes,logical_referenced_bytes,resource_count,shared_resource_count,broken_reference_count,source,metadata
    ) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,'site-resource-inventory',$10::jsonb)
    ON CONFLICT(account_id,site_id,snapshot_date) DO UPDATE SET
      captured_at=now(),workspace_id=EXCLUDED.workspace_id,store_id=EXCLUDED.store_id,
      r2_physical_bytes=EXCLUDED.r2_physical_bytes,logical_referenced_bytes=EXCLUDED.logical_referenced_bytes,
      resource_count=EXCLUDED.resource_count,shared_resource_count=EXCLUDED.shared_resource_count,
      broken_reference_count=EXCLUDED.broken_reference_count,source=EXCLUDED.source,metadata=EXCLUDED.metadata
    RETURNING *`,[str(scope.accountId),str(site.workspaceId)||null,str(site.storeId)||null,id,int(summary.uniquePhysicalBytes),int(summary.referencedBytes),int(summary.resourceCount),int(summary.sharedResourceCount),int(summary.brokenReferenceCount),JSON.stringify({inventoryMeasuredAt:str(detail?.measuredAt),available:Boolean(detail?.available)})]);
  return normalizeSnapshotRow01228(q.rows[0]||{});
}

async function siteMeta01228(scope={},siteId=''){
  const q=await pool.query(`SELECT s.id,s.name,s.workspace_id,s.store_id,s.created_at,st.currency
    FROM shifttime_builder_sites s
    LEFT JOIN platform_stores st ON st.id=s.store_id
    WHERE s.id=$1 AND s.account_id=$2 AND s.status<>'archived' LIMIT 1`,[str(siteId),str(scope.accountId)]);
  return q.rows[0]||null;
}

export async function getSiteGrowthAnalytics01228(scope={},userId='',siteId='',input={}){
  const id=str(siteId),period=normalizeSiteGrowthPeriod01228(input.period),start=startIso01228(period),current=await getAuthorizedSiteResourceInventory01213(scope,userId,id,{limit:1});
  await captureSiteMetricSnapshot01228(scope,userId,id,{detail:current});
  const site=await siteMeta01228(scope,id);if(!site)throw Object.assign(new Error('ST_SITE_GROWTH_NOT_FOUND'),{statusCode:404,code:'ST_SITE_GROWTH_NOT_FOUND'});
  const [snapshotsQ,trafficQ,ordersQ]=await Promise.all([
    pool.query(`SELECT snapshot_date,captured_at,r2_physical_bytes,logical_referenced_bytes,resource_count,shared_resource_count,broken_reference_count
      FROM shifttime_site_metric_snapshots WHERE account_id=$1 AND site_id=$2 AND snapshot_date >= $3::timestamptz::date ORDER BY snapshot_date ASC`,[str(scope.accountId),id,start]),
    pool.query(`SELECT date_trunc('day',occurred_at) AS day,
      COALESCE(SUM(inbound_bytes),0)::text AS inbound_bytes,COALESCE(SUM(outbound_bytes),0)::text AS outbound_bytes,
      COALESCE(SUM(render_billable_outbound_bytes),0)::text AS render_billable_bytes,
      COALESCE(SUM(storage_bytes) FILTER (WHERE traffic_class='direct-storage' AND result='success'),0)::text AS direct_r2_bytes,
      COALESCE(SUM(storage_bytes) FILTER (WHERE traffic_class='proxy-storage' AND result='success'),0)::text AS proxy_r2_bytes,
      COUNT(*) FILTER (WHERE operation='published-site.page-open' AND result='success')::text AS page_views,
      COUNT(DISTINCT NULLIF(metadata->>'sessionId','')) FILTER (WHERE operation='published-site.page-open' AND result='success')::text AS visits,
      COUNT(*) FILTER (WHERE result='failed')::text AS failed
      FROM shifttime_traffic_events WHERE account_id=$1 AND site_id=$2 AND occurred_at >= $3::timestamptz
      GROUP BY date_trunc('day',occurred_at) ORDER BY day ASC`,[str(scope.accountId),id,start]),
    pool.query(`SELECT date_trunc('day',so.created_at) AS day,so.currency,COUNT(*)::text AS orders,
      COUNT(*) FILTER (WHERE so.status='completed')::text AS completed_orders,
      COUNT(*) FILTER (WHERE so.status='cancelled')::text AS cancelled_orders,
      COALESCE(SUM(so.total) FILTER (WHERE so.status<>'cancelled'),0)::text AS order_total
      FROM marketplace_seller_orders so JOIN platform_stores st ON st.id=so.store_id JOIN platform_workspaces w ON w.id=st.workspace_id
      WHERE w.account_id=$1 AND so.store_id=$2 AND so.created_at >= $3::timestamptz
      GROUP BY date_trunc('day',so.created_at),so.currency ORDER BY day ASC`,[str(scope.accountId),str(site.store_id),start]),
  ]);
  const snapshots=snapshotsQ.rows.map(normalizeSnapshotRow01228),traffic=trafficQ.rows.map(normalizeTrafficDay01228),orders=ordersQ.rows.map(normalizeOrderDay01228);
  const totals=Object.freeze({renderBillableBytes:traffic.reduce((sum,row)=>sum+row.renderBillableBytes,0),directR2Bytes:traffic.reduce((sum,row)=>sum+row.directR2Bytes,0),pageViews:traffic.reduce((sum,row)=>sum+row.pageViews,0),visits:traffic.reduce((sum,row)=>sum+row.visits,0),orders:orders.reduce((sum,row)=>sum+row.orders,0),completedOrders:orders.reduce((sum,row)=>sum+row.completedOrders,0)});
  return Object.freeze({stage:'01228',period,startAt:start,generatedAt:new Date().toISOString(),site:Object.freeze({id,name:str(site.name),workspaceId:str(site.workspace_id),storeId:str(site.store_id),createdAt:site.created_at instanceof Date?site.created_at.toISOString():str(site.created_at),currency:str(site.currency)||'UAH'}),current:Object.freeze({r2PhysicalBytes:n(current?.summary?.uniquePhysicalBytes),logicalReferencedBytes:n(current?.summary?.referencedBytes),resourceCount:int(current?.summary?.resourceCount)}),snapshots:Object.freeze(snapshots),traffic:Object.freeze(traffic),orders:Object.freeze(orders),totals,visitsAvailableFrom01228:true,ordersScope:'store'});
}

export const SITE_GROWTH_PERIODS_01228=PERIOD_DAYS_01228;
