import crypto from 'node:crypto';
import {withClient} from './db.mjs';
import {normalizeCustomerMessageInput01404,normalizeNotificationReceiptStatus01404,orderNotificationSeverity01404,customerMessageSeverity01404} from './notification-inbox-core-01404.mjs';
import {listNotificationRules01408,evaluateNotificationRules01408} from './notification-rule-engine-01408.mjs';
import {dispatchNotificationEvent01409} from './notification-delivery-01409.mjs';
export const NOTIFICATION_INBOX_STAGE_01404='01408';
const str=v=>String(v??'').trim();
const PROVIDERS=new Set(['orders','messages']);
const id=prefix=>`${prefix}_${crypto.randomUUID().replace(/-/g,'')}`;
const hashIp=value=>crypto.createHash('sha256').update(str(value)||'unknown').digest('hex');

function receiptStatus(row){return normalizeNotificationReceiptStatus01404(row?.receiptStatus||'');}
function orderRuleDecision(row,rules){return evaluateNotificationRules01408(rules,{type:'order.created',provider:'orders',severity:orderNotificationSeverity01404(row),data:{order:{id:row.id,total:Number(row.total)||0,itemsCount:Number(row.itemsCount)||0,status:str(row.status),paymentStatus:str(row.payment?.status),currency:str(row.currency)||'UAH',sellerName:str(row.sellerName)}}});}
function messageRuleDecision(row,rules){return evaluateNotificationRules01408(rules,{type:'customer.message.created',provider:'messages',severity:customerMessageSeverity01404(row),data:{message:{id:row.id,status:str(row.messageStatus),channel:str(row.channel),siteId:str(row.builderSiteId)},customer:row.customer||{},context:row.context||{}}});}
function orderView(row,scope,decision){
  return {
    id:`order:${row.id}`,eventKey:row.id,provider:'orders',category:'orders',kind:'order-created',status:receiptStatus(row),severity:decision.effectiveSeverity,
    sourceId:row.id,sourceName:str(scope.storeName||row.sellerName),createdAt:row.createdAt,updatedAt:row.updatedAt,
    payload:{orderId:row.id,marketplaceOrderId:row.marketplaceOrderId,orderNumber:row.orderNumber,buyerName:str(row.buyer?.name),total:Number(row.total)||0,currency:str(row.currency)||'UAH',itemsCount:Number(row.itemsCount)||0,orderStatus:str(row.status),paymentStatus:str(row.payment?.status),notificationRuleStage:'01408',matchedRuleIds:decision.matched.map(x=>x.id)}
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
    await client.query(`INSERT INTO shifttime_customer_messages(id,account_id,workspace_id,store_id,builder_site_id,published_site_id,site_name,channel,subject,body,customer,context,ip_hash) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,$12::jsonb,$13)`,[messageId,identity.accountId,identity.workspaceId,identity.storeId,identity.siteId,identity.publishedSiteId||'',identity.siteName||'',message.channel,message.subject,message.body,JSON.stringify(message.customer),JSON.stringify(context),ipHash]);
    return {ok:true,stage:NOTIFICATION_INBOX_STAGE_01404,id:messageId,context};
  });
  try{await dispatchNotificationEvent01409(identity,{eventKey:saved.id,type:'customer.message.created',provider:'messages',severity:customerMessageSeverity01404({...message,id:saved.id,messageStatus:'new',builderSiteId:identity.siteId,customer:message.customer,context:saved.context}),notification:{title:message.subject||'Customer message',body:message.body},data:{message:{id:saved.id,status:'new',channel:message.channel,siteId:identity.siteId},customer:message.customer||{},context:saved.context||{}}});}catch{}
  return {ok:true,stage:NOTIFICATION_INBOX_STAGE_01404,id:saved.id};
}

export async function listOrderNotifications01404(scope){
  const rules=(await listNotificationRules01408(scope)).items;
  return withClient(async client=>{
    const q=await client.query(`SELECT so.id,so.marketplace_order_id "marketplaceOrderId",so.order_number "orderNumber",so.seller_name "sellerName",so.status,so.currency,so.total::float8 total,so.buyer,so.payment,so.created_at "createdAt",so.updated_at "updatedAt",(SELECT COUNT(*)::int FROM marketplace_order_items oi WHERE oi.seller_order_id=so.id) "itemsCount",nr.status "receiptStatus" FROM marketplace_seller_orders so LEFT JOIN shifttime_notification_receipts nr ON nr.store_id=so.store_id AND nr.provider='orders' AND nr.event_key=so.id WHERE so.store_id=$1 ORDER BY so.created_at DESC LIMIT 200`,[scope.storeId]);
    const items=[];for(const row of q.rows){const decision=orderRuleDecision(row,rules);if(decision.allowed&&decision.channels.includes('inApp'))items.push(orderView(row,scope,decision));}return {stage:NOTIFICATION_INBOX_STAGE_01404,items};
  });
}

export async function listCustomerMessageNotifications01404(scope){
  const rules=(await listNotificationRules01408(scope)).items;
  return withClient(async client=>{
    const q=await client.query(`SELECT m.id,m.builder_site_id "builderSiteId",m.site_name "siteName",m.channel,m.subject,m.body,m.customer,m.context,m.status "messageStatus",m.created_at "createdAt",m.updated_at "updatedAt",nr.status "receiptStatus" FROM shifttime_customer_messages m LEFT JOIN shifttime_notification_receipts nr ON nr.store_id=m.store_id AND nr.provider='messages' AND nr.event_key=m.id WHERE m.store_id=$1 ORDER BY m.created_at DESC LIMIT 200`,[scope.storeId]);
    const items=[];for(const row of q.rows){const decision=messageRuleDecision(row,rules);if(decision.allowed&&decision.channels.includes('inApp'))items.push(messageView(row,decision));}return {stage:NOTIFICATION_INBOX_STAGE_01404,items};
  });
}

async function assertEventBelongsToStore(client,scope,provider,eventKey){
  if(provider==='orders'){const q=await client.query(`SELECT 1 FROM marketplace_seller_orders WHERE id=$1 AND store_id=$2 LIMIT 1`,[eventKey,scope.storeId]);return !!q.rowCount;}
  if(provider==='messages'){const q=await client.query(`SELECT 1 FROM shifttime_customer_messages WHERE id=$1 AND store_id=$2 LIMIT 1`,[eventKey,scope.storeId]);return !!q.rowCount;}
  return false;
}

export async function setNotificationReceipt01404(scope,provider,eventKey,status,actorUserId=''){
  const p=str(provider),key=str(eventKey),next=normalizeNotificationReceiptStatus01404(status);
  if(!PROVIDERS.has(p)||!key||next==='unread'){const e=new Error('NOTIFICATION_RECEIPT_INVALID_01404');e.code='NOTIFICATION_RECEIPT_INVALID_01404';e.statusCode=400;throw e;}
  return withClient(async client=>{
    if(!await assertEventBelongsToStore(client,scope,p,key)){const e=new Error('NOTIFICATION_EVENT_NOT_FOUND_01404');e.code='NOTIFICATION_EVENT_NOT_FOUND_01404';e.statusCode=404;throw e;}
    await client.query(`INSERT INTO shifttime_notification_receipts(store_id,provider,event_key,status,actor_user_id) VALUES($1,$2,$3,$4,$5) ON CONFLICT(store_id,provider,event_key) DO UPDATE SET status=EXCLUDED.status,actor_user_id=EXCLUDED.actor_user_id,updated_at=now()`,[scope.storeId,p,key,next,str(actorUserId)||null]);
    if(p==='messages'&&next==='read')await client.query(`UPDATE shifttime_customer_messages SET status=CASE WHEN status='new' THEN 'read' ELSE status END,updated_at=now() WHERE id=$1 AND store_id=$2`,[key,scope.storeId]);
    return {ok:true,stage:NOTIFICATION_INBOX_STAGE_01404,provider:p,eventKey:key,status:next};
  });
}
