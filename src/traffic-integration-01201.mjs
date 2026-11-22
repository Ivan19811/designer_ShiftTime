import {AsyncLocalStorage} from 'node:async_hooks';
import {classifyTrafficRoute01194} from './traffic-control-core-01194.mjs';
import {enqueueTrafficEvent01194} from './traffic-recorder-01194.mjs';

const storage=new AsyncLocalStorage();
const clean=value=>String(value??'').trim();
const bytes=value=>{const n=Number(value);return Number.isFinite(n)&&n>0?Math.floor(n):0;};
const safeTrafficMetadata01206=input=>Object.freeze({
  assetId:clean(input.assetId),
  objectKey:clean(input.objectKey),
  contentType:clean(input.contentType),
  fileName:clean(input.fileName),
  provider:clean(input.integration)||'r2',
  uploadMode:clean(input.trafficClass),
});

export function bodyBytes01201(body){
  if(body==null)return 0;
  if(Buffer.isBuffer(body))return body.length;
  if(body instanceof Uint8Array)return body.byteLength;
  if(body instanceof ArrayBuffer)return body.byteLength;
  if(ArrayBuffer.isView(body))return body.byteLength;
  return Buffer.byteLength(String(body));
}

export function runTrafficContext01201(seed={},fn){
  const route=classifyTrafficRoute01194(seed.method,seed.pathname);
  const context={
    requestId:clean(seed.requestId),accountId:clean(seed.accountId),workspaceId:clean(seed.workspaceId),storeId:clean(seed.storeId),actorUserId:clean(seed.actorUserId),
    module:clean(seed.module)||route.module,operation:clean(seed.operation)||route.operation,siteId:clean(seed.siteId)||route.siteId,
    integrationSequence:0,
  };
  return storage.run(context,fn);
}

export function updateTrafficContext01201(patch={}){
  const context=storage.getStore();if(!context)return false;
  for(const key of ['requestId','accountId','workspaceId','storeId','actorUserId','module','operation','siteId'])if(Object.prototype.hasOwnProperty.call(patch,key))context[key]=clean(patch[key]);
  return true;
}

export function getTrafficContext01201(){const context=storage.getStore();return context?{...context}:{};}

export function updateAuthenticatedTrafficContext01204({scope={},actorUserId='',publishedSiteId=''}={}){
  const patch={accountId:clean(scope.accountId),workspaceId:clean(scope.workspaceId),storeId:clean(scope.storeId),actorUserId:clean(actorUserId)};
  if(clean(publishedSiteId))patch.siteId=clean(publishedSiteId);
  return updateTrafficContext01201(patch);
}

export function buildIntegrationTrafficEvent01201(input={}){
  const context=input.context||{},startedAtMs=Math.max(0,Number(input.startedAtMs)||Date.now()),finishedAtMs=Math.max(startedAtMs,Number(input.finishedAtMs)||startedAtMs),statusCode=Math.max(0,Number(input.statusCode)||0),integration=clean(input.integration)||'external',sequence=Math.max(1,Number(input.sequence)||1),requestId=clean(context.requestId)||`req_${startedAtMs}`;
  const failed=input.result==='failed'||statusCode>=400||statusCode===0;
  return Object.freeze({
    occurredAt:new Date(startedAtMs).toISOString(),requestId,dedupeKey:`${requestId}:integration:${integration}:${sequence}`,
    accountId:clean(context.accountId)||null,workspaceId:clean(context.workspaceId)||null,storeId:clean(context.storeId)||null,actorUserId:clean(context.actorUserId)||null,siteId:clean(context.siteId)||null,
    module:clean(context.module)||'integration',operation:clean(context.operation)||`integration.${integration}`,routeKey:clean(input.routeKey)||`${clean(input.method||'GET').toUpperCase()} external`,eventType:'integration',integration,
    inboundBytes:bytes(input.inboundBytes),outboundBytes:bytes(input.outboundBytes),renderBillableOutboundBytes:bytes(input.outboundBytes),storageBytes:0,trafficClass:'render-service',metadata:{},statusCode,result:failed?'failed':'success',durationMs:Math.max(0,Math.round(finishedAtMs-startedAtMs)),
  });
}

export function recordIntegrationTraffic01201(input={}){
  const context=storage.getStore();
  if(!context?.accountId)return false;
  const sequence=++context.integrationSequence;
  return enqueueTrafficEvent01194(buildIntegrationTrafficEvent01201({...input,context,sequence}));
}

export function buildStorageTrafficEvent01206(input={}){
  const context=input.context||{},startedAtMs=Math.max(0,Number(input.startedAtMs)||Date.now()),finishedAtMs=Math.max(startedAtMs,Number(input.finishedAtMs)||startedAtMs),statusCode=Math.max(0,Number(input.statusCode)||0),integration=clean(input.integration)||'r2',operation=clean(input.operation)||'media.direct-upload',trafficClass=clean(input.trafficClass)||'direct-storage',assetId=clean(input.assetId),requestId=clean(context.requestId)||`storage_${assetId||startedAtMs}`;
  const failed=input.result==='failed'||statusCode>=400||statusCode===0;
  return Object.freeze({
    occurredAt:new Date(startedAtMs).toISOString(),requestId,dedupeKey:clean(input.dedupeKey)||`storage:${integration}:${operation}:${assetId||requestId}:${failed?'failed':'success'}`,
    accountId:clean(context.accountId)||null,workspaceId:clean(context.workspaceId)||null,storeId:clean(context.storeId)||null,actorUserId:clean(context.actorUserId)||null,siteId:clean(input.siteId)||clean(context.siteId)||null,
    module:'media',operation,routeKey:clean(input.routeKey)||`${integration.toUpperCase()} verified object`,eventType:'storage',integration,
    inboundBytes:0,outboundBytes:0,renderBillableOutboundBytes:0,storageBytes:bytes(input.storageBytes),trafficClass,metadata:safeTrafficMetadata01206({...input,integration,trafficClass}),statusCode,result:failed?'failed':'success',durationMs:Math.max(0,Math.round(finishedAtMs-startedAtMs)),
  });
}

export function recordStorageTraffic01206(input={}){
  const active=storage.getStore()||{};
  const context={...active,accountId:clean(input.accountId)||clean(active.accountId),workspaceId:clean(input.workspaceId)||clean(active.workspaceId),storeId:clean(input.storeId)||clean(active.storeId),actorUserId:clean(input.actorUserId)||clean(active.actorUserId),siteId:clean(input.siteId)||clean(active.siteId)};
  if(!context.accountId)return false;
  return enqueueTrafficEvent01194(buildStorageTrafficEvent01206({...input,context}));
}
