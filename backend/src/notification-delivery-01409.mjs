import crypto from 'node:crypto';
import {withClient} from './db.mjs';
import {listNotificationRules01408,evaluateNotificationRules01408} from './notification-rule-engine-01408.mjs';
import {normalizeNotificationDeliveryEvent01409,publicNotificationDeliveryRow01409,NOTIFICATION_DELIVERY_STAGE_01409} from './notification-delivery-core-01409.mjs';
import {getNotificationTransportStatus01409,sendNotificationTransport01409} from './notification-transports-01409.mjs';
import {resolveNotificationRecipients01416} from './notification-recipient-routing-01416.mjs';
import {NOTIFICATION_RECIPIENT_ROUTING_STAGE_01416,notificationRecipientKey01416,notificationRecipientSelectorsForChannel01416} from './notification-recipient-routing-core-01416.mjs';
import {notificationPolicyForTarget01417,queueNotificationDelivery01417,claimImmediateNotificationDedupe01417,scheduleNotificationEscalation01417,registerNotificationPreferenceDispatcher01417} from './notification-preferences-01417.mjs';
const str=value=>String(value??'').trim();
const idFor=(storeId,eventKey,channel,recipientKey='default')=>`ndel_${crypto.createHash('sha256').update(`${storeId}:${eventKey}:${channel}:${recipientKey}`).digest('hex').slice(0,28)}`;
const externalChannels=new Set(['email','telegram','webhook','slack']);

export async function resolveNotificationScopeForStore01409(storeId){
  return withClient(async client=>{const q=await client.query(`SELECT s.id "storeId",s.name "storeName",s.workspace_id "workspaceId",w.account_id "accountId" FROM platform_stores s JOIN platform_workspaces w ON w.id=s.workspace_id WHERE s.id=$1 AND s.status<>'archived' LIMIT 1`,[str(storeId)]);if(!q.rowCount)return null;return q.rows[0];});
}

async function ensureDeliveryRow01409(scope,event,channel,{recipient=null,recipientKey='default',matchedRuleIds=[]}={}){
  const normalized=normalizeNotificationDeliveryEvent01409(event),key=str(recipientKey)||'default',id=idFor(scope.storeId,normalized.eventKey,channel,key),notification=normalized.notification||{},userId=str(recipient?.userId),role=str(recipient?.role),name=str(recipient?.name),email=str(recipient?.email),ruleIds=[...new Set((Array.isArray(matchedRuleIds)?matchedRuleIds:[]).map(str).filter(Boolean))];
  return withClient(async client=>{const q=await client.query(`INSERT INTO shifttime_notification_deliveries(id,account_id,workspace_id,store_id,event_key,event_type,provider,channel,severity,status,notification,event_payload,recipient_key,recipient_user_id,recipient_role,recipient_name,recipient_email,matched_rule_ids) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,'pending',$10::jsonb,$11::jsonb,$12,$13,$14,$15,$16,$17::jsonb) ON CONFLICT(store_id,event_key,channel,recipient_key) DO NOTHING RETURNING *`,[id,scope.accountId,scope.workspaceId,scope.storeId,normalized.eventKey,normalized.type,normalized.provider,channel,normalized.severity,JSON.stringify(notification),JSON.stringify(normalized.data||{}),key,userId||null,role,name,email,JSON.stringify(ruleIds)]);if(q.rowCount)return {created:true,row:q.rows[0]};const existing=await client.query(`SELECT * FROM shifttime_notification_deliveries WHERE store_id=$1 AND event_key=$2 AND channel=$3 AND recipient_key=$4 LIMIT 1`,[scope.storeId,normalized.eventKey,channel,key]);return {created:false,row:existing.rows[0]||null};});
}

async function updateAttempt01409(scope,id,status,result={},error=null){
  return withClient(async client=>{const q=await client.query(`UPDATE shifttime_notification_deliveries SET status=$3,attempt_count=attempt_count+1,response_code=$4,error_code=$5,error_detail=$6,external_id=$7,last_attempt_at=now(),sent_at=CASE WHEN $3='sent' THEN now() ELSE sent_at END,updated_at=now() WHERE store_id=$1 AND id=$2 RETURNING *`,[scope.storeId,str(id),status,Number(result?.responseCode)||null,str(error?.code),str(error?.detail||error?.message).slice(0,500),str(result?.externalId)]);return q.rowCount?publicNotificationDeliveryRow01409(q.rows[0]):null;});
}

async function attemptDelivery01409(scope,row,event,options={}){
  if(!row)return null;
  if(row.status==='sent'&&!options.force)return publicNotificationDeliveryRow01409(row);
  const channel=row.channel,recipient=row.recipient_user_id?{userId:row.recipient_user_id,role:row.recipient_role,name:row.recipient_name,email:row.recipient_email}:null;
  if(channel==='slack')return updateAttempt01409(scope,row.id,'skipped',{},Object.assign(new Error('NOTIFICATION_SLACK_NOT_CONFIGURED_01409'),{code:'NOTIFICATION_SLACK_NOT_CONFIGURED_01409'}));
  const status=getNotificationTransportStatus01409(options.settings),channelState=status.channels?.[channel];
  if(!channelState?.configured&&!(channel==='email'&&recipient?.email)){const error=Object.assign(new Error(`NOTIFICATION_${String(channel).toUpperCase()}_NOT_CONFIGURED_01409`),{code:`NOTIFICATION_${String(channel).toUpperCase()}_NOT_CONFIGURED_01409`});return updateAttempt01409(scope,row.id,'failed',{},error);}
  try{const result=await sendNotificationTransport01409(channel,scope,event,{...options,recipient});return updateAttempt01409(scope,row.id,'sent',result,null);}catch(error){return updateAttempt01409(scope,row.id,'failed',{},error);}
}

async function deliveryTargets01416(scope,decision,channel){
  const routing=notificationRecipientSelectorsForChannel01416(decision,channel);
  if(channel!=='email')return [{recipient:null,recipientKey:'default',matchedRuleIds:routing.matchedRuleIds}];
  const targets=[];
  if(routing.hasDefault||!routing.selectors.length)targets.push({recipient:null,recipientKey:'default',matchedRuleIds:routing.matchedRuleIds});
  if(routing.selectors.length){const recipients=await resolveNotificationRecipients01416(scope,routing.selectors);for(const recipient of recipients)targets.push({recipient,recipientKey:notificationRecipientKey01416(recipient),matchedRuleIds:routing.matchedRuleIds});}
  const byKey=new Map();for(const target of targets)if(!byKey.has(target.recipientKey))byKey.set(target.recipientKey,target);return [...byKey.values()];
}

export async function dispatchNotificationEvent01409(scope,eventInput={},options={}){
  const event=normalizeNotificationDeliveryEvent01409(eventInput);if(!scope?.storeId||!event.eventKey||!event.type)return {stage:NOTIFICATION_DELIVERY_STAGE_01409,routingStage:NOTIFICATION_RECIPIENT_ROUTING_STAGE_01416,preferenceStage:'01417',allowed:false,deliveries:[],queued:[]};
  const decision=options.decisionOverride||evaluateNotificationRules01408((await listNotificationRules01408(scope)).items,event),channels=(decision.channels||[]).filter(channel=>externalChannels.has(channel)),effectiveEvent={...event,severity:decision.effectiveSeverity||event.severity},deliveries=[],queued=[];
  if(decision.allowed&&!options.preferenceBypass)await scheduleNotificationEscalation01417(scope,effectiveEvent,decision);
  if(!decision.allowed||!channels.length)return {stage:NOTIFICATION_DELIVERY_STAGE_01409,routingStage:NOTIFICATION_RECIPIENT_ROUTING_STAGE_01416,preferenceStage:'01417',allowed:decision.allowed,channels:decision.channels||[],deliveries,queued};
  for(const channel of channels){const targets=await deliveryTargets01416(scope,decision,channel);for(const target of targets){
    if(!options.preferenceBypass){const policy=await notificationPolicyForTarget01417(scope,effectiveEvent,decision,channel,target);if(policy.mode!=='immediate'){queued.push(await queueNotificationDelivery01417(scope,effectiveEvent,channel,target,policy));continue;}const dedupe=await claimImmediateNotificationDedupe01417(scope,effectiveEvent,channel,target,policy);if(!dedupe.allowed){deliveries.push({eventKey:effectiveEvent.eventKey,eventType:effectiveEvent.type,provider:effectiveEvent.provider,channel,severity:effectiveEvent.severity,status:'skipped',attemptCount:0,errorCode:'NOTIFICATION_DEDUPLICATED_01417',recipientKey:policy.recipientKey,duplicateCount:dedupe.duplicateCount,stage:'01417'});continue;}}
    const saved=await ensureDeliveryRow01409(scope,effectiveEvent,channel,target);if(!saved.row)continue;if(!saved.created&&saved.row.status==='sent'){deliveries.push(publicNotificationDeliveryRow01409(saved.row));continue;}if(!saved.created&&!options.retryExisting){deliveries.push(publicNotificationDeliveryRow01409(saved.row));continue;}deliveries.push(await attemptDelivery01409(scope,saved.row,effectiveEvent,options));
  }}
  return {stage:NOTIFICATION_DELIVERY_STAGE_01409,routingStage:NOTIFICATION_RECIPIENT_ROUTING_STAGE_01416,preferenceStage:'01417',allowed:true,channels:decision.channels||[],effectiveSeverity:decision.effectiveSeverity||event.severity,matchedRuleIds:(decision.matched||[]).map(x=>x.id),deliveries:deliveries.filter(Boolean),queued:queued.filter(Boolean)};
}
registerNotificationPreferenceDispatcher01417(dispatchNotificationEvent01409);

export async function listNotificationDeliveries01409(scope,{limit=80,status='',channel=''}={}){
  const safeLimit=Math.max(1,Math.min(200,Number(limit)||80)),values=[scope.storeId];let where='store_id=$1';
  if(['pending','sent','failed','skipped'].includes(str(status))){values.push(str(status));where+=` AND status=$${values.length}`;}
  if(externalChannels.has(str(channel))){values.push(str(channel));where+=` AND channel=$${values.length}`;}
  values.push(safeLimit);
  return withClient(async client=>{const q=await client.query(`SELECT * FROM shifttime_notification_deliveries WHERE ${where} ORDER BY updated_at DESC,id DESC LIMIT $${values.length}`,values);return {stage:NOTIFICATION_DELIVERY_STAGE_01409,routingStage:NOTIFICATION_RECIPIENT_ROUTING_STAGE_01416,items:q.rows.map(publicNotificationDeliveryRow01409)};});
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
