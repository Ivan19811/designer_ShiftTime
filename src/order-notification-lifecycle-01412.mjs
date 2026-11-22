import crypto from 'node:crypto';
import {withClient} from './db.mjs';
import {dispatchNotificationEvent01409,resolveNotificationScopeForStore01409} from './notification-delivery-01409.mjs';
import {buildOrderNotificationEvent01412,orderNotificationEventTypeForPaymentStatus01412,ORDER_NOTIFICATION_LIFECYCLE_STAGE_01412} from './order-notification-lifecycle-core-01412.mjs';
const str=value=>String(value??'').trim();
const rowId=eventKey=>`onev_${crypto.createHash('sha256').update(str(eventKey)).digest('hex').slice(0,28)}`;

async function sellerOrderSnapshot01412(sellerOrderId){
  return withClient(async client=>{
    const q=await client.query(`SELECT so.id,so.marketplace_order_id "marketplaceOrderId",so.order_number "orderNumber",so.seller_profile_id "sellerProfileId",so.store_id "storeId",so.seller_name "sellerName",so.status,so.currency,so.total::float8 total,so.buyer,so.payment,(SELECT COUNT(*)::int FROM marketplace_order_items oi WHERE oi.seller_order_id=so.id) "itemsCount" FROM marketplace_seller_orders so WHERE so.id=$1 LIMIT 1`,[str(sellerOrderId)]);
    if(!q.rowCount)return null;const order=q.rows[0];
    const source=await client.query(`SELECT payload->'order'->>'siteId' "siteId",payload->'order'->>'siteName' "siteName" FROM shifttime_order_notification_events WHERE seller_order_id=$1 AND event_type='order.created' ORDER BY created_at,id LIMIT 1`,[order.id]);
    return {...order,siteId:str(source.rows[0]?.siteId),siteName:str(source.rows[0]?.siteName)};
  });
}

async function persistEvent01412(scope,event){
  const order=event.data.order;
  return withClient(async client=>{const q=await client.query(`INSERT INTO shifttime_order_notification_events(id,account_id,workspace_id,store_id,seller_order_id,marketplace_order_id,event_key,event_type,severity,kind,payload,occurred_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,now()) ON CONFLICT(store_id,event_key) DO NOTHING RETURNING *`,[rowId(`${scope.storeId}:${event.eventKey}`),scope.accountId,scope.workspaceId,scope.storeId,order.id,order.marketplaceOrderId,event.eventKey,event.type,event.severity,event.kind,JSON.stringify(event.data)]);if(q.rowCount)return {created:true,row:q.rows[0]};const existing=await client.query(`SELECT * FROM shifttime_order_notification_events WHERE store_id=$1 AND event_key=$2 LIMIT 1`,[scope.storeId,event.eventKey]);return {created:false,row:existing.rows[0]||null};});
}

export async function emitSellerOrderLifecycleNotification01412({sellerOrderId,eventType,siteId='',siteName='',sourceType='',sourceKey=''}={}){
  const order=await sellerOrderSnapshot01412(sellerOrderId);if(!order)return {stage:ORDER_NOTIFICATION_LIFECYCLE_STAGE_01412,created:false,reason:'seller-order-not-found'};
  const scope=await resolveNotificationScopeForStore01409(order.storeId);if(!scope)return {stage:ORDER_NOTIFICATION_LIFECYCLE_STAGE_01412,created:false,reason:'store-scope-not-found'};
  const event=buildOrderNotificationEvent01412(order,eventType,{siteId:siteId||order.siteId,siteName:siteName||order.siteName,sourceType,sourceKey}),saved=await persistEvent01412(scope,event);
  if(saved.created){try{await dispatchNotificationEvent01409(scope,event);}catch{}}
  return {stage:ORDER_NOTIFICATION_LIFECYCLE_STAGE_01412,created:saved.created,eventKey:event.eventKey,eventType:event.type};
}

export async function emitMarketplaceOrderPaymentLifecycleNotifications01412({marketplaceOrderId,paymentId='',status='',refundedAmount=0}={}){
  const eventType=orderNotificationEventTypeForPaymentStatus01412(status);if(!eventType)return {stage:ORDER_NOTIFICATION_LIFECYCLE_STAGE_01412,eventType:'',items:[]};
  const ids=await withClient(async client=>(await client.query(`SELECT id FROM marketplace_seller_orders WHERE marketplace_order_id=$1 ORDER BY created_at,id`,[str(marketplaceOrderId)])).rows.map(x=>x.id));
  const items=[];for(const sellerOrderId of ids){try{items.push(await emitSellerOrderLifecycleNotification01412({sellerOrderId,eventType,sourceType:'payment',sourceKey:`${str(paymentId)}:${str(status)}:${Number(refundedAmount)||0}`}));}catch{}}
  return {stage:ORDER_NOTIFICATION_LIFECYCLE_STAGE_01412,eventType,items};
}
