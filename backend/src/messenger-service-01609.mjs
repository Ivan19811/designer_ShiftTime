// 01609: Store-scoped persistent guest/verified-customer chat over canonical messages.
import crypto from 'node:crypto';
import {withClient} from './db.mjs';
import {createPublicCustomerMessage01404} from './notification-inbox-01404.mjs';
import {hashMessengerVisitor01609,cleanMessengerBody01609,messengerError01609,publicMessengerThread01609} from './messenger-core-01609.mjs';
const str=value=>String(value??'').trim();
const guestScope=(identity,visitorKey)=>{
  if(!identity?.siteId||!identity?.storeId||!identity?.accountId||!identity?.workspaceId)throw messengerError01609('MESSENGER_SITE_REQUIRED_01609',401);
  return {hash:hashMessengerVisitor01609(visitorKey),siteId:identity.siteId,storeId:identity.storeId,accountId:identity.accountId,workspaceId:identity.workspaceId};
};
async function findChat(db,identity,messageId,hash,{lock=false}={}){
  if(!/^custmsg_[a-f0-9]{32}$/.test(str(messageId)))throw messengerError01609('MESSENGER_THREAD_NOT_FOUND_01609',404);
  const query=await db.query(`SELECT id,status,customer_user_id "customerUserId",production_order_id "productionOrderId" FROM shifttime_customer_messages WHERE id=$1 AND account_id=$2 AND workspace_id=$3 AND store_id=$4 AND builder_site_id=$5 AND channel='chat' AND messenger_visitor_hash=$6 ${lock?'FOR UPDATE':''}`,[messageId,identity.accountId,identity.workspaceId,identity.storeId,identity.siteId,hash]);
  if(!query.rowCount)throw messengerError01609('MESSENGER_THREAD_NOT_FOUND_01609',404);
  return query.rows[0];
}
async function getTurns(db,identity,messageId){
  const q=await db.query(`SELECT t.id,t.kind,t.body,t.visibility,t.created_at "createdAt" FROM shifttime_customer_message_thread t JOIN shifttime_customer_messages m ON m.id=t.message_id AND m.store_id=t.store_id WHERE t.message_id=$1 AND t.store_id=$2 AND m.builder_site_id=$3 ORDER BY t.created_at,t.id LIMIT 250`,[messageId,identity.storeId,identity.siteId]);
  return publicMessengerThread01609(q.rows);
}
export async function createPublicMessengerChat01609(identity,input={},meta={}){
  const scope=guestScope(identity,input.visitorKey),body=cleanMessengerBody01609(input.body);
  const item=await createPublicCustomerMessage01404(identity,{channel:'chat',body,subject:input.subject,customer:meta.customerUserId?{name:meta.customerName,email:meta.customerEmail}:input.customer,context:input.context},{remoteAddress:meta.remoteAddress,userAgent:meta.userAgent,visitorHash:scope.hash,customerUserId:meta.customerUserId||null});
  return {stage:'01609',id:item.id,customerUserId:meta.customerUserId||null,turns:[],created:true};
}
export async function getPublicMessengerChat01609(identity,messageId,visitorKey,{customerUserId=null}={}){
  const scope=guestScope(identity,visitorKey);
  return withClient(async db=>{
    const chat=await findChat(db,scope,messageId,scope.hash);
    if(customerUserId&&!chat.customerUserId){await db.query(`UPDATE shifttime_customer_messages SET customer_user_id=$3,updated_at=now() WHERE id=$1 AND store_id=$2 AND customer_user_id IS NULL`,[messageId,scope.storeId,customerUserId]);chat.customerUserId=customerUserId;}
    return {stage:'01609',id:chat.id,status:chat.status,customerUserId:chat.customerUserId||null,productionOrderId:chat.productionOrderId||null,turns:await getTurns(db,scope,chat.id)};
  });
}
export async function replyPublicMessengerChat01609(identity,messageId,input={},meta={}){
  const scope=guestScope(identity,input.visitorKey),body=cleanMessengerBody01609(input.body);
  return withClient(async db=>{
    await db.query('BEGIN');
    try{
      const chat=await findChat(db,scope,messageId,scope.hash,{lock:true});
      if(['closed','spam'].includes(chat.status))throw messengerError01609('MESSENGER_THREAD_CLOSED_01609',409);
      const q=await db.query(`SELECT COUNT(*)::int count FROM shifttime_customer_message_thread WHERE message_id=$1 AND kind='customer' AND created_at>now()-interval '10 minutes'`,[chat.id]);
      if(Number(q.rows[0]?.count||0)>=20)throw messengerError01609('MESSENGER_RATE_LIMIT_01609',429);
      const id='msgthread_'+crypto.randomUUID().replaceAll('-','');
      await db.query(`INSERT INTO shifttime_customer_message_thread(id,message_id,store_id,kind,body,actor_user_id,actor_name,visibility,delivery_status) VALUES($1,$2,$3,'customer',$4,$5,'','customer','none')`,[id,chat.id,scope.storeId,body,meta.customerUserId||null]);
      await db.query(`UPDATE shifttime_customer_messages SET customer_user_id=COALESCE(customer_user_id,$3),last_activity_at=now(),updated_at=now(),status='new' WHERE id=$1 AND store_id=$2`,[chat.id,scope.storeId,meta.customerUserId||null]);
      await db.query('COMMIT');
      return {stage:'01609',id:chat.id,turns:await getTurns(db,scope,chat.id)};
    }catch(error){await db.query('ROLLBACK');throw error;}
  });
}
export async function linkMessengerProductionOrder01609(scope,messageId,orderId){
  const id=str(orderId);
  if(!/^[a-f0-9-]{36}$/i.test(id))throw messengerError01609('MESSENGER_ORDER_INVALID_01609');
  return withClient(async db=>{
    await db.query('BEGIN');
    try{
      const result=await db.query(`UPDATE shifttime_customer_messages m SET production_order_id=o.id,updated_at=now()
        FROM shifttime_production_orders_01566 o
        WHERE m.id=$1 AND m.store_id=$2 AND m.account_id=$3 AND m.workspace_id=$4
          AND o.id=$5::uuid AND o.store_id=m.store_id AND o.site_id=m.builder_site_id
        RETURNING m.id,m.production_order_id "productionOrderId"`,[messageId,scope.storeId,scope.accountId,scope.workspaceId,id]);
      if(!result.rowCount)throw messengerError01609('MESSENGER_ORDER_LINK_NOT_ALLOWED_01609',404);
      await db.query('COMMIT');
      return {stage:'01609',ok:true,...result.rows[0]};
    }catch(error){await db.query('ROLLBACK');throw error;}
  });
}
