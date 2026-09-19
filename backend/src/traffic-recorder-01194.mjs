import {buildHttpTrafficEvent01194,shouldRecordTrafficRequest01194} from './traffic-control-core-01194.mjs';
const DEFAULT_MAX_QUEUE=5000,DEFAULT_BATCH_SIZE=200,DEFAULT_FLUSH_MS=2000;

export function createTrafficRecorder01194({writeBatch,maxQueue=DEFAULT_MAX_QUEUE,batchSize=DEFAULT_BATCH_SIZE,flushIntervalMs=DEFAULT_FLUSH_MS,setTimer=setTimeout,clearTimer=clearTimeout}={}){
  if(typeof writeBatch!=='function')throw new Error('01194 Traffic recorder requires writeBatch');
  const queue=[];let timer=null,flushing=null,written=0,dropped=0,lastError='',lastFlushAt='';
  const schedule=()=>{if(timer!==null||!queue.length)return;timer=setTimer(()=>{timer=null;flush().catch(()=>{});},flushIntervalMs);try{timer?.unref?.();}catch{}};
  const enqueue=event=>{if(!event?.dedupeKey)return false;if(queue.length>=maxQueue){dropped++;return false;}queue.push(event);schedule();return true;};
  const flush=async()=>{
    if(flushing)return flushing;
    if(timer!==null){try{clearTimer(timer);}catch{}timer=null;}
    if(!queue.length){lastFlushAt=new Date().toISOString();return true;}
    flushing=(async()=>{let ok=true;while(queue.length){const batch=queue.splice(0,batchSize);try{await writeBatch(batch);written+=batch.length;lastError='';lastFlushAt=new Date().toISOString();}catch(error){dropped+=batch.length;lastError=String(error?.message||error||'Traffic telemetry write failed');lastFlushAt=new Date().toISOString();ok=false;break;}}return ok;})().finally(()=>{flushing=null;if(queue.length)schedule();});
    return flushing;
  };
  const close=async()=>{if(timer!==null){try{clearTimer(timer);}catch{}timer=null;}return flush();};
  const getStats=()=>Object.freeze({queued:queue.length,written,dropped,lastError,lastFlushAt,maxQueue,batchSize,flushIntervalMs});
  return Object.freeze({enqueue,flush,close,getStats});
}

export async function writeTrafficBatch01194(rows=[]){
  if(!rows.length)return 0;
  const {pool}=await import('./db.mjs');
  const payload=rows.map(r=>({
    occurred_at:r.occurredAt,request_id:r.requestId,dedupe_key:r.dedupeKey,account_id:r.accountId,workspace_id:r.workspaceId,store_id:r.storeId,actor_user_id:r.actorUserId,site_id:r.siteId,
    module:r.module,operation:r.operation,route_key:r.routeKey,event_type:r.eventType,integration:r.integration,
    inbound_bytes:r.inboundBytes,outbound_bytes:r.outboundBytes,render_billable_outbound_bytes:r.renderBillableOutboundBytes,storage_bytes:r.storageBytes||0,traffic_class:r.trafficClass||'render',metadata:r.metadata||{},status_code:r.statusCode,result:r.result,duration_ms:r.durationMs
  }));
  const q=await pool.query(`
    INSERT INTO shifttime_traffic_events(
      occurred_at,request_id,dedupe_key,account_id,workspace_id,store_id,actor_user_id,site_id,module,operation,route_key,event_type,integration,
      inbound_bytes,outbound_bytes,render_billable_outbound_bytes,storage_bytes,traffic_class,metadata,status_code,result,duration_ms
    )
    SELECT x.occurred_at,x.request_id,x.dedupe_key,x.account_id,x.workspace_id,x.store_id,x.actor_user_id,x.site_id,x.module,x.operation,x.route_key,x.event_type,x.integration,
      x.inbound_bytes,x.outbound_bytes,x.render_billable_outbound_bytes,x.storage_bytes,x.traffic_class,x.metadata,x.status_code,x.result,x.duration_ms
    FROM jsonb_to_recordset($1::jsonb) AS x(
      occurred_at timestamptz,request_id text,dedupe_key text,account_id text,workspace_id text,store_id text,actor_user_id text,site_id text,module text,operation text,route_key text,event_type text,integration text,
      inbound_bytes bigint,outbound_bytes bigint,render_billable_outbound_bytes bigint,storage_bytes bigint,traffic_class text,metadata jsonb,status_code integer,result text,duration_ms integer
    )
    ON CONFLICT (dedupe_key) DO NOTHING`,[JSON.stringify(payload)]);
  return q.rowCount||0;
}

export const trafficRecorder01194=createTrafficRecorder01194({writeBatch:writeTrafficBatch01194});
export const enqueueTrafficEvent01194=event=>trafficRecorder01194.enqueue(event);
export const getTrafficRecorderStats01194=()=>trafficRecorder01194.getStats();
export const flushTrafficRecorder01194=()=>trafficRecorder01194.flush();
export const closeTrafficRecorder01194=()=>trafficRecorder01194.close();


export function setTrafficScope01194(res,scope={}){
  if(!res)return false;
  res.__stTrafficScope01194={accountId:String(scope.accountId||''),workspaceId:String(scope.workspaceId||''),storeId:String(scope.storeId||''),actorUserId:String(scope.actorUserId||scope.userId||''),siteId:String(scope.siteId||'')};
  return true;
}
export function setTrafficMetadata01228(res,metadata={}){
  if(!res)return false;
  res.__stTrafficMetadata01228=metadata&&typeof metadata==='object'?metadata:{};
  return true;
}

export function attachHttpTrafficMeter01194(req,res){
  const startedAtMs=Date.now();
  if(!req||!res||typeof res.once!=='function')return false;
  res.once('finish',()=>{
    try{
      const pathname=new URL(req.url||'/','http://localhost').pathname,scope=res.__stTrafficScope01194;
      if(!scope?.accountId)return;
      if(!shouldRecordTrafficRequest01194(req.method,pathname))return;
      const requestId=String(res.getHeader?.('x-st-request-id')||req.headers?.['x-st-request-id']||'');
      enqueueTrafficEvent01194(buildHttpTrafficEvent01194({method:req.method,pathname,requestId,startedAtMs,finishedAtMs:Date.now(),statusCode:res.statusCode,inboundBytes:req.__stTrafficInboundBytes01194||0,outboundBytes:res.__stTrafficOutboundBytes01194||0,scope,metadata:res.__stTrafficMetadata01228||{}}));
    }catch{}
  });
  return true;
}
