import crypto from 'node:crypto';
import {withClient} from './db.mjs';
import {normalizeCustomerMessageInput01404,normalizeNotificationReceiptStatus01404,customerMessageSeverity01404} from './notification-inbox-core-01404.mjs';
import {listNotificationRules01408,evaluateNotificationRules01408} from './notification-rule-engine-01408.mjs';
import {dispatchNotificationEvent01409} from './notification-delivery-01409.mjs';
import {notificationDecisionAllowsInAppRecipient01416} from './notification-recipient-routing-core-01416.mjs';
export const NOTIFICATION_INBOX_STAGE_01404='01408';
const str=v=>String(v??'').trim();
const PROVIDERS=new Set(['orders','messages','payments','sites','traffic']);
const id=prefix=>`${prefix}_${crypto.randomUUID().replace(/-/g,'')}`;
const hashIp=value=>crypto.createHash('sha256').update(str(value)||'unknown').digest('hex');

function receiptStatus(row){return normalizeNotificationReceiptStatus01404(row?.receiptStatus||'');}
function orderRuleDecision(row,rules){const data=row.payload&&typeof row.payload==='object'?row.payload:{},order=data.order&&typeof data.order==='object'?data.order:{};return evaluateNotificationRules01408(rules,{type:str(row.eventType),provider:'orders',severity:str(row.severity)||'low',data:{...data,order}});}
function messageRuleDecision(row,rules){return evaluateNotificationRules01408(rules,{type:'customer.message.created',provider:'messages',severity:customerMessageSeverity01404(row),data:{message:{id:row.id,status:str(row.messageStatus),channel:str(row.channel),siteId:str(row.builderSiteId)},customer:row.customer||{},context:row.context||{}}});}
function orderView(row,scope,decision){
  const data=row.payload&&typeof row.payload==='object'?row.payload:{},order=data.order&&typeof data.order==='object'?data.order:{};
  return {
    id:`order:${row.eventKey}`,eventKey:row.eventKey,provider:'orders',category:'orders',kind:str(row.kind)||'order-created',status:receiptStatus(row),severity:decision.effectiveSeverity,
    sourceId:str(row.sellerOrderId||order.id),sourceName:str(scope.storeName||order.sellerName),createdAt:row.occurredAt||row.createdAt,updatedAt:row.occurredAt||row.createdAt,
    payload:{orderId:str(order.id||row.sellerOrderId),marketplaceOrderId:str(order.marketplaceOrderId||row.marketplaceOrderId),orderNumber:str(order.orderNumber),buyerName:str(order.buyerName),total:Number(order.total)||0,currency:str(order.currency)||'UAH',itemsCount:Number(order.itemsCount)||0,orderStatus:str(order.status),paymentStatus:str(order.paymentStatus),paymentMethod:str(order.paymentMethod),sellerId:str(order.sellerId),sellerName:str(order.sellerName),storeId:str(order.storeId||scope.storeId),siteId:str(order.siteId),siteName:str(order.siteName),eventType:str(row.eventType),notificationRuleStage:'01412',matchedRuleIds:decision.matched.map(x=>x.id)}
  };
}
function messageView(row,decision){
  return {
    id:`message:${row.id}`,eventKey:row.id,provider:'messages',category:'messages',kind:'customer-message-created',status:receiptStatus(row),severity:decision.effectiveSeverity,
    sourceId:row.id,sourceName:str(row.siteName||row.builderSiteId),createdAt:row.createdAt,updatedAt:row.updatedAt,
    payload:{messageId:row.id,siteId:row.builderSiteId,siteName:row.siteName,channel:row.channel,subject:row.subject,body:row.body,customer:row.customer||{},context:row.context||{},messageStatus:row.messageStatus,notificationRuleStage:'01408',matchedRuleIds:decision.matched.map(x=>x.id)}
  };
}

export async function createPublicCustomerMessage01404(identity,input={},meta={}){
  if(!identity?.storeId||!identity?.siteId){const e=new Error('PUBLISHED_SITE_IDENTITY_REQUIRED_01404');e.code='PUBLISHED_SITE_IDENTITY_REQUIRED_01404';e.statusCode=401;throw e;}
  const message=normalizeCustomerMessageInput01404(input),ipHash=hashIp(meta.remoteAddress);
  const saved=await withClient(async client=>{
    const recent=await client.query(`SELECT COUNT(*)::int AS count FROM shifttime_customer_messages WHERE builder_site_id=$1 AND ip_hash=$2 AND created_at>now()-interval '10 minutes'`,[identity.siteId,ipHash]);
    if(Number(recent.rows[0]?.count||0)>=12){const e=new Error('CUSTOMER_MESSAGE_RATE_LIMIT_01404');e.code='CUSTOMER_MESSAGE_RATE_LIMIT_01404';e.statusCode=429;throw e;}
    const messageId=id('custmsg');
    const context={...message.context,userAgent:str(meta.userAgent).slice(0,300)};
    await client.query('BEGIN');
    try{
      await client.query(`INSERT INTO shifttime_customer_messages(id,account_id,workspace_id,store_id,builder_site_id,published_site_id,site_name,channel,subject,body,customer,context,ip_hash,last_activity_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,$12::jsonb,$13,now())`,[messageId,identity.accountId,identity.workspaceId,identity.storeId,identity.siteId,identity.publishedSiteId||'',identity.siteName||'',message.channel,message.subject,message.body,JSON.stringify(message.customer),JSON.stringify(context),ipHash]);
      await client.query(`INSERT INTO shifttime_customer_message_thread(id,message_id,store_id,kind,body,actor_name,visibility,metadata,delivery_status) VALUES($1,$2,$3,'customer',$4,$5,'customer',$6::jsonb,'none')`,[`thread_customer_${messageId}`,messageId,identity.storeId,message.body,str(message.customer?.name)||'Customer',JSON.stringify({subject:message.subject,channel:message.channel,customer:message.customer,context})]);
      await client.query('COMMIT');
    }catch(error){await client.query('ROLLBACK');throw error;}
    return {ok:true,stage:NOTIFICATION_INBOX_STAGE_01404,id:messageId,context};
  });
  try{await dispatchNotificationEvent01409(identity,{eventKey:saved.id,type:'customer.message.created',provider:'messages',severity:customerMessageSeverity01404({...message,id:saved.id,messageStatus:'new',builderSiteId:identity.siteId,customer:message.customer,context:saved.context}),notification:{title:message.subject||'Customer message',body:message.body},data:{message:{id:saved.id,status:'new',channel:message.channel,siteId:identity.siteId},customer:message.customer||{},context:saved.context||{}}});}catch{}
  return {ok:true,stage:NOTIFICATION_INBOX_STAGE_01404,id:saved.id};
}

export async function listOrderNotifications01404(scope){
  const rules=(await listNotificationRules01408(scope)).items;
  return withClient(async client=>{
    const q=await client.query(`SELECT e.id,e.seller_order_id "sellerOrderId",e.marketplace_order_id "marketplaceOrderId",e.event_key "eventKey",e.event_type "eventType",e.severity,e.kind,e.payload,e.occurred_at "occurredAt",e.created_at "createdAt",COALESCE(ur.status,nr.status) "receiptStatus" FROM shifttime_order_notification_events e LEFT JOIN shifttime_notification_user_receipts ur ON ur.store_id=e.store_id AND ur.provider='orders' AND ur.event_key=e.event_key AND ur.user_id=$2 LEFT JOIN shifttime_notification_receipts nr ON nr.store_id=e.store_id AND nr.provider='orders' AND nr.event_key=e.event_key WHERE e.store_id=$1 ORDER BY e.occurred_at DESC,e.id DESC LIMIT 300`,[scope.storeId,scope.userId]);
    const items=[];for(const row of q.rows){const decision=orderRuleDecision(row,rules);if(decision.allowed&&notificationDecisionAllowsInAppRecipient01416(decision,scope))items.push(orderView(row,scope,decision));}return {stage:'01416',items};
  });
}

export async function listCustomerMessageNotifications01404(scope){
  const rules=(await listNotificationRules01408(scope)).items;
  return withClient(async client=>{
    const q=await client.query(`SELECT m.id,m.builder_site_id "builderSiteId",m.site_name "siteName",m.channel,m.subject,m.body,m.customer,m.context,m.status "messageStatus",m.created_at "createdAt",m.updated_at "updatedAt",COALESCE(ur.status,nr.status) "receiptStatus" FROM shifttime_customer_messages m LEFT JOIN shifttime_notification_user_receipts ur ON ur.store_id=m.store_id AND ur.provider='messages' AND ur.event_key=m.id AND ur.user_id=$2 LEFT JOIN shifttime_notification_receipts nr ON nr.store_id=m.store_id AND nr.provider='messages' AND nr.event_key=m.id WHERE m.store_id=$1 ORDER BY m.created_at DESC LIMIT 200`,[scope.storeId,scope.userId]);
    const items=[];for(const row of q.rows){const decision=messageRuleDecision(row,rules);if(decision.allowed&&notificationDecisionAllowsInAppRecipient01416(decision,scope))items.push(messageView(row,decision));}return {stage:'01416',items};
  });
}

async function assertEventBelongsToStore(client,scope,provider,eventKey){
  if(provider==='orders'){const q=await client.query(`SELECT 1 FROM shifttime_order_notification_events WHERE event_key=$1 AND store_id=$2 LIMIT 1`,[eventKey,scope.storeId]);return !!q.rowCount;}
  if(provider==='messages'){const q=await client.query(`SELECT 1 FROM shifttime_customer_messages WHERE id=$1 AND store_id=$2 LIMIT 1`,[eventKey,scope.storeId]);return !!q.rowCount;}
  if(provider==='payments'){const q=await client.query(`SELECT 1 FROM marketplace_payment_events pe JOIN marketplace_payment_allocations a ON a.payment_id=pe.payment_id WHERE pe.id=$1 AND a.store_id=$2 AND pe.event_type IN ('payment-paid','payment-failed','payment-partially-refunded','payment-refunded') LIMIT 1`,[eventKey,scope.storeId]);return !!q.rowCount;}
  if(provider==='sites'){const q=await client.query(`SELECT 1 FROM shifttime_site_notification_events WHERE event_key=$1 AND store_id=$2 LIMIT 1`,[eventKey,scope.storeId]);return !!q.rowCount;}
  if(provider==='traffic'){const q=await client.query(`SELECT 1 FROM shifttime_traffic_notification_events WHERE event_key=$1 AND store_id=$2 LIMIT 1`,[eventKey,scope.storeId]);return !!q.rowCount;}
  return false;
}

export async function setNotificationReceipt01404(scope,provider,eventKey,status,actorUserId=''){
  const p=str(provider),key=str(eventKey),next=normalizeNotificationReceiptStatus01404(status);
  if(!PROVIDERS.has(p)||!key||next==='unread'){const e=new Error('NOTIFICATION_RECEIPT_INVALID_01404');e.code='NOTIFICATION_RECEIPT_INVALID_01404';e.statusCode=400;throw e;}
  return withClient(async client=>{
    if(!await assertEventBelongsToStore(client,scope,p,key)){const e=new Error('NOTIFICATION_EVENT_NOT_FOUND_01404');e.code='NOTIFICATION_EVENT_NOT_FOUND_01404';e.statusCode=404;throw e;}
    const userId=str(actorUserId||scope.userId);
    if(userId)await client.query(`INSERT INTO shifttime_notification_user_receipts(store_id,provider,event_key,user_id,status) VALUES($1,$2,$3,$4,$5) ON CONFLICT(store_id,provider,event_key,user_id) DO UPDATE SET status=EXCLUDED.status,updated_at=now()`,[scope.storeId,p,key,userId,next]);
    else await client.query(`INSERT INTO shifttime_notification_receipts(store_id,provider,event_key,status,actor_user_id) VALUES($1,$2,$3,$4,NULL) ON CONFLICT(store_id,provider,event_key) DO UPDATE SET status=EXCLUDED.status,updated_at=now()`,[scope.storeId,p,key,next]);
    return {ok:true,stage:'01416',provider:p,eventKey:key,status:next,userId};
  });
}
