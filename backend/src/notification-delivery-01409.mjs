import crypto from 'node:crypto';
import {withClient} from './db.mjs';
import {listNotificationRules01408,evaluateNotificationRules01408} from './notification-rule-engine-01408.mjs';
import {normalizeNotificationDeliveryEvent01409,publicNotificationDeliveryRow01409,NOTIFICATION_DELIVERY_STAGE_01409} from './notification-delivery-core-01409.mjs';
import {getNotificationTransportStatus01409,sendNotificationTransport01409} from './notification-transports-01409.mjs';
const str=value=>String(value??'').trim();
const idFor=(storeId,eventKey,channel)=>`ndel_${crypto.createHash('sha256').update(`${storeId}:${eventKey}:${channel}`).digest('hex').slice(0,28)}`;
const externalChannels=new Set(['email','telegram','webhook','slack']);

export async function resolveNotificationScopeForStore01409(storeId){
  return withClient(async client=>{const q=await client.query(`SELECT s.id "storeId",s.name "storeName",s.workspace_id "workspaceId",w.account_id "accountId" FROM platform_stores s JOIN platform_workspaces w ON w.id=s.workspace_id WHERE s.id=$1 AND s.status<>'archived' LIMIT 1`,[str(storeId)]);if(!q.rowCount)return null;return q.rows[0];});
}

async function ensureDeliveryRow01409(scope,event,channel){
  const normalized=normalizeNotificationDeliveryEvent01409(event),id=idFor(scope.storeId,normalized.eventKey,channel),notification=normalized.notification||{};
  return withClient(async client=>{const q=await client.query(`INSERT INTO shifttime_notification_deliveries(id,account_id,workspace_id,store_id,event_key,event_type,provider,channel,severity,status,notification,event_payload) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,'pending',$10::jsonb,$11::jsonb) ON CONFLICT(store_id,event_key,channel) DO NOTHING RETURNING *`,[id,scope.accountId,scope.workspaceId,scope.storeId,normalized.eventKey,normalized.type,normalized.provider,channel,normalized.severity,JSON.stringify(notification),JSON.stringify(normalized.data||{})]);if(q.rowCount)return {created:true,row:q.rows[0]};const existing=await client.query(`SELECT * FROM shifttime_notification_deliveries WHERE store_id=$1 AND event_key=$2 AND channel=$3 LIMIT 1`,[scope.storeId,normalized.eventKey,channel]);return {created:false,row:existing.rows[0]||null};});
}

async function updateAttempt01409(scope,id,status,result={},error=null){
  return withClient(async client=>{const q=await client.query(`UPDATE shifttime_notification_deliveries SET status=$3,attempt_count=attempt_count+1,response_code=$4,error_code=$5,error_detail=$6,external_id=$7,last_attempt_at=now(),sent_at=CASE WHEN $3='sent' THEN now() ELSE sent_at END,updated_at=now() WHERE store_id=$1 AND id=$2 RETURNING *`,[scope.storeId,str(id),status,Number(result?.responseCode)||null,str(error?.code),str(error?.detail||error?.message).slice(0,500),str(result?.externalId)]);return q.rowCount?publicNotificationDeliveryRow01409(q.rows[0]):null;});
}

async function attemptDelivery01409(scope,row,event,options={}){
  if(!row)return null;
  if(row.status==='sent'&&!options.force)return publicNotificationDeliveryRow01409(row);
  const status=getNotificationTransportStatus01409(options.settings),channel=row.channel,channelState=status.channels?.[channel];
  if(!channelState?.configured){const error=Object.assign(new Error(`NOTIFICATION_${String(channel).toUpperCase()}_NOT_CONFIGURED_01409`),{code:`NOTIFICATION_${String(channel).toUpperCase()}_NOT_CONFIGURED_01409`});return updateAttempt01409(scope,row.id,channel==='slack'?'skipped':'failed',{},error);}
  try{const result=await sendNotificationTransport01409(channel,scope,event,options);return updateAttempt01409(scope,row.id,'sent',result,null);}catch(error){return updateAttempt01409(scope,row.id,'failed',{},error);}
}

export async function dispatchNotificationEvent01409(scope,eventInput={},options={}){
  const event=normalizeNotificationDeliveryEvent01409(eventInput);if(!scope?.storeId||!event.eventKey||!event.type)return {stage:NOTIFICATION_DELIVERY_STAGE_01409,allowed:false,deliveries:[]};
  const rules=(await listNotificationRules01408(scope)).items,decision=evaluateNotificationRules01408(rules,event),channels=decision.channels.filter(channel=>externalChannels.has(channel));
  if(!decision.allowed||!channels.length)return {stage:NOTIFICATION_DELIVERY_STAGE_01409,allowed:decision.allowed,channels:decision.channels,deliveries:[]};
  const effectiveEvent={...event,severity:decision.effectiveSeverity},deliveries=[];
  for(const channel of channels){const saved=await ensureDeliveryRow01409(scope,effectiveEvent,channel);if(!saved.row)continue;if(!saved.created&&saved.row.status==='sent'){deliveries.push(publicNotificationDeliveryRow01409(saved.row));continue;}if(!saved.created&&!options.retryExisting){deliveries.push(publicNotificationDeliveryRow01409(saved.row));continue;}deliveries.push(await attemptDelivery01409(scope,saved.row,effectiveEvent,options));}
  return {stage:NOTIFICATION_DELIVERY_STAGE_01409,allowed:true,channels:decision.channels,effectiveSeverity:decision.effectiveSeverity,matchedRuleIds:decision.matched.map(x=>x.id),deliveries:deliveries.filter(Boolean)};
}

export async function listNotificationDeliveries01409(scope,{limit=80,status='',channel=''}={}){
  const safeLimit=Math.max(1,Math.min(200,Number(limit)||80)),values=[scope.storeId];let where='store_id=$1';
  if(['pending','sent','failed','skipped'].includes(str(status))){values.push(str(status));where+=` AND status=$${values.length}`;}
  if(externalChannels.has(str(channel))){values.push(str(channel));where+=` AND channel=$${values.length}`;}
  values.push(safeLimit);
  return withClient(async client=>{const q=await client.query(`SELECT * FROM shifttime_notification_deliveries WHERE ${where} ORDER BY updated_at DESC,id DESC LIMIT $${values.length}`,values);return {stage:NOTIFICATION_DELIVERY_STAGE_01409,items:q.rows.map(publicNotificationDeliveryRow01409)};});
}

export async function retryNotificationDelivery01409(scope,deliveryId,options={}){
  const row=await withClient(async client=>{const q=await client.query(`SELECT * FROM shifttime_notification_deliveries WHERE store_id=$1 AND id=$2 LIMIT 1`,[scope.storeId,str(deliveryId)]);return q.rows[0]||null;});
  if(!row)throw Object.assign(new Error('NOTIFICATION_DELIVERY_NOT_FOUND_01409'),{code:'NOTIFICATION_DELIVERY_NOT_FOUND_01409',statusCode:404});
  const event={eventKey:row.event_key,type:row.event_type,provider:row.provider,severity:row.severity,notification:row.notification||{},data:row.event_payload||{},occurredAt:row.created_at};
  return attemptDelivery01409(scope,row,event,{...options,force:true});
}

export async function sendNotificationTransportTest01409(scope,channel,options={}){
  const ch=str(channel);if(!['email','telegram','webhook'].includes(ch))throw Object.assign(new Error('NOTIFICATION_TRANSPORT_TEST_UNSUPPORTED_01409'),{code:'NOTIFICATION_TRANSPORT_TEST_UNSUPPORTED_01409',statusCode:400});
  const event={eventKey:`test:${ch}:${Date.now()}`,type:'system.warning',provider:'system',severity:'low',notification:{title:'ShiftTime transport test',body:`Transport ${ch} is connected to ShiftTime Notification Core 01409.`},data:{test:true,channel:ch,stage:NOTIFICATION_DELIVERY_STAGE_01409}};
  return sendNotificationTransport01409(ch,scope,event,options);
}
