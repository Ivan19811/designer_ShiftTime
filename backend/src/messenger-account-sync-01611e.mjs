// 01611E — Site-scoped account history. Uses existing 01595 customer sessions and 01611A explicit links.
// No phone/email/name lookup, never accepts a client-supplied user, tenant, store, or site ID.
import crypto from 'node:crypto';
import {withClient} from './db.mjs';
import {messengerError01609,cleanMessengerBody01609,publicMessengerThread01609} from './messenger-core-01609.mjs';
import {messengerAccountScope01611E,chatPattern01611E,scopedChat01611E,linkedFrom01611E} from './messenger-account-core-01611e.mjs';

export async function listMessengerAccountThreads01611E(identity,userId,{query=withClient}={}){
  const scope=messengerAccountScope01611E(identity,userId);
  return query(async db=>{
    const q=await db.query(`SELECT m.id,m.subject,m.status,m.last_activity_at "lastActivityAt",
      m.created_at "createdAt"
      FROM ${linkedFrom01611E} WHERE ${scopedChat01611E} AND m.status<>'spam'
      ORDER BY m.last_activity_at DESC,m.id DESC LIMIT 100`,scope);
    return {stage:'01611E',threads:q.rows};
  });
}
async function linkedChat(db,scope,threadId,{lock=false}={}){
  if(!chatPattern01611E.test(String(threadId||'')))throw messengerError01609('MESSENGER_ACCOUNT_THREAD_NOT_FOUND_01611E',404);
  const q=await db.query(`SELECT m.id,m.status,m.subject
      FROM ${linkedFrom01611E} WHERE ${scopedChat01611E} AND m.id=$6 AND m.status<>'spam'
      ${lock?'FOR UPDATE OF m':''} LIMIT 1`,[...scope,threadId]);
  if(!q.rowCount)throw messengerError01609('MESSENGER_ACCOUNT_THREAD_NOT_FOUND_01611E',404);
  return q.rows[0];
}
async function turns(db,scope,threadId){
  const q=await db.query(`SELECT t.id,t.kind,t.body,t.visibility,t.created_at "createdAt"
    FROM shifttime_customer_message_thread t
    JOIN shifttime_customer_messages m ON m.id=t.message_id AND m.store_id=t.store_id
    JOIN shifttime_messenger_contacts_01611a c ON c.id=m.messenger_contact_id
    WHERE ${scopedChat01611E} AND m.id=$6 AND m.status<>'spam'
    ORDER BY t.created_at,t.id LIMIT 250`,[...scope,threadId]);
  return publicMessengerThread01609(q.rows);
}
export async function getMessengerAccountThread01611E(identity,userId,threadId,{query=withClient}={}){
  const scope=messengerAccountScope01611E(identity,userId);
  return query(async db=>{
    const chat=await linkedChat(db,scope,threadId);
    return {stage:'01611E',id:chat.id,status:chat.status,turns:await turns(db,scope,threadId)};
  });
}
export async function replyMessengerAccountThread01611E(identity,userId,threadId,body,{query=withClient}={}){
  const scope=messengerAccountScope01611E(identity,userId),message=cleanMessengerBody01609(body);
  return query(async db=>{
    await db.query('BEGIN');
    try{
      const chat=await linkedChat(db,scope,threadId,{lock:true});
      if(chat.status==='closed')throw messengerError01609('MESSENGER_THREAD_CLOSED_01609',409);
      const limiter=await db.query(`SELECT COUNT(*)::int count FROM shifttime_customer_message_thread
        WHERE message_id=$1 AND kind='customer' AND created_at>now()-interval '10 minutes'`,[threadId]);
      if(Number(limiter.rows[0]?.count||0)>=20)throw messengerError01609('MESSENGER_RATE_LIMIT_01609',429);
      const id='msgthread_'+crypto.randomUUID().replaceAll('-','');
      await db.query(`INSERT INTO shifttime_customer_message_thread
        (id,message_id,store_id,kind,body,actor_user_id,actor_name,visibility,delivery_status)
        VALUES($1,$2,$3,'customer',$4,$5,'','customer','none')`,[id,threadId,scope[2],message,userId]);
      await db.query(`UPDATE shifttime_customer_messages SET last_activity_at=now(),updated_at=now(),status='new'
        WHERE id=$1 AND account_id=$2 AND workspace_id=$3 AND store_id=$4 AND builder_site_id=$5`,
        [threadId,...scope.slice(0,4)]);
      await db.query('COMMIT');
      return {stage:'01611E',id:threadId,status:'new',turns:await turns(db,scope,threadId)};
    }catch(e){await db.query('ROLLBACK').catch(()=>{});throw e;}
  });
}
