// 01611A. Verified contact profiles: per-tenant/per-site visitor proof, no phone-based identity merge.
import {withClient} from './db.mjs';
import {messengerError01609} from './messenger-core-01609.mjs';
import {verificationScope01611,verificationKey01611,openPhone01611,maskPhone01611} from './messenger-verification-core-01611.mjs';
const params=s=>[s.accountId,s.workspaceId,s.storeId,s.siteId,s.visitorHash];
const scoped='account_id=$1 AND workspace_id=$2 AND store_id=$3 AND builder_site_id=$4 AND visitor_hash=$5';
export async function ensureVerifiedContact01611A(db,s){
  const out=await db.query(`INSERT INTO shifttime_messenger_contacts_01611a(account_id,workspace_id,store_id,builder_site_id,visitor_hash)
    VALUES($1,$2,$3,$4,$5)
    ON CONFLICT(store_id,builder_site_id,visitor_hash) DO UPDATE SET updated_at=now()
    RETURNING id,customer_user_id "customerUserId"`,params(s));
  return out.rows[0];
}
export async function attachExistingMessengerMessages01611A(db,s,contactId){
  await db.query(`UPDATE shifttime_customer_messages SET messenger_contact_id=$6
     WHERE account_id=$1 AND workspace_id=$2 AND store_id=$3 AND builder_site_id=$4 AND messenger_visitor_hash=$5 AND channel='chat' AND messenger_contact_id IS NULL`,[...params(s),contactId]);
}
export async function associateChatContact01611A(identity,visitorKey,messageId){
  const s=verificationScope01611(identity,visitorKey);
  return withClient(async db=>{
    const q=await db.query(`UPDATE shifttime_customer_messages m SET messenger_contact_id=c.id
      FROM shifttime_messenger_contacts_01611a c
      WHERE m.id=$1 AND m.account_id=$2 AND m.workspace_id=$3 AND m.store_id=$4 AND m.builder_site_id=$5
      AND m.messenger_visitor_hash=$6 AND c.account_id=m.account_id AND c.workspace_id=m.workspace_id
      AND c.store_id=m.store_id AND c.builder_site_id=m.builder_site_id AND c.visitor_hash=m.messenger_visitor_hash
      AND m.channel='chat' RETURNING c.id`,[messageId,...params(s)]);
    return q.rows[0]?.id||null;
  });
}
export async function getVisitorContact01611A(identity,visitorKey){
  const s=verificationScope01611(identity,visitorKey);
  return withClient(async db=>{
    const q=await db.query(`SELECT id,customer_user_id "customerUserId" FROM shifttime_messenger_contacts_01611a WHERE ${scoped}`,params(s));
    if(!q.rowCount)return {stage:'01611A',contact:null};
    const c=q.rows[0];
    const channels=await db.query(`SELECT channel,phone_sealed "sealed",verified_at "verifiedAt",consent_fallback "fallbackAllowed"
       FROM shifttime_messenger_verified_channels_01611 WHERE contact_id=$1 AND account_id=$2 AND workspace_id=$3 AND store_id=$4 AND builder_site_id=$5 AND visitor_hash=$6 ORDER BY verified_at DESC`,[c.id,...params(s)]);
    const key=verificationKey01611();
    return {stage:'01611A',contact:{id:c.id,linked:Boolean(c.customerUserId),channels:channels.rows.map(x=>({channel:x.channel,maskedPhone:maskPhone01611(openPhone01611(key,x.sealed)),verifiedAt:x.verifiedAt,fallbackAllowed:x.fallbackAllowed}))}};
  });
}
// Explicit account attachment requires BOTH a trusted customer session AND possession of original guest capability.
export async function linkVisitorContactToAuthenticatedUser01611A(identity,visitorKey,customerUserId){
  if(!customerUserId)throw messengerError01609('MESSENGER_LOGIN_REQUIRED_01611A',401);
  const s=verificationScope01611(identity,visitorKey);
  return withClient(async db=>{
    await db.query('BEGIN');
    try{
      const proof=await db.query(`SELECT 1 FROM shifttime_messenger_verified_channels_01611 WHERE ${scoped} LIMIT 1`,params(s));
      if(!proof.rowCount)throw messengerError01609('MESSENGER_VERIFICATION_REQUIRED_01611',403);
      const contact=await db.query(`SELECT id,customer_user_id "customerUserId" FROM shifttime_messenger_contacts_01611a WHERE ${scoped} FOR UPDATE`,params(s));
      if(!contact.rowCount)throw messengerError01609('MESSENGER_CONTACT_NOT_FOUND_01611A',404);
      if(contact.rows[0].customerUserId&&contact.rows[0].customerUserId!==customerUserId)throw messengerError01609('MESSENGER_CONTACT_ALREADY_LINKED_01611A',409);
      const conflict=await db.query(`SELECT 1 FROM shifttime_customer_messages WHERE account_id=$1 AND workspace_id=$2 AND store_id=$3 AND builder_site_id=$4 AND messenger_visitor_hash=$5 AND channel='chat' AND customer_user_id IS NOT NULL AND customer_user_id<>$6 LIMIT 1`,[...params(s),customerUserId]);
      if(conflict.rowCount)throw messengerError01609('MESSENGER_CONTACT_OWNER_CONFLICT_01611A',409);
      await db.query(`UPDATE shifttime_messenger_contacts_01611a SET customer_user_id=$6,updated_at=now() WHERE ${scoped}`,[...params(s),customerUserId]);
      await db.query(`UPDATE shifttime_customer_messages SET customer_user_id=$6,messenger_contact_id=$7
         WHERE account_id=$1 AND workspace_id=$2 AND store_id=$3 AND builder_site_id=$4 AND messenger_visitor_hash=$5
           AND channel='chat' AND (customer_user_id IS NULL OR customer_user_id=$6)`,[...params(s),customerUserId,contact.rows[0].id]);
      await db.query('COMMIT');
      return {stage:'01611A',linked:true,contactId:contact.rows[0].id};
    }catch(e){await db.query('ROLLBACK');throw e;}
  });
}
