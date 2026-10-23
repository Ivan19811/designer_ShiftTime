// 01555 · Merchant-authenticated contact binding for already validated draft.
// Encrypted at rest (AES-256-GCM); no buyer PII returned, logged, or stored in the cart.
import {createCipheriv,createHmac,randomBytes,timingSafeEqual} from 'node:crypto';
const withTransaction=async (...args)=>(await import('./db.mjs')).withTransaction(...args);
const clean=v=>String(v??'').trim();
const failure=(code,statusCode=409)=>Object.assign(new Error(code),{code,statusCode});
const draftPattern=/^orderdraft_[a-f0-9]{32}$/i;
const allowed=new Set(['draftId','siteId','firstName','phone','email','comment','confirmed']);
export function validateCheckoutContacts01555(value){
  if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).some(k=>!allowed.has(k)))throw failure('NP_CONTACT_INPUT_INVALID_01555',400);
  const draftId=clean(value.draftId),siteId=clean(value.siteId);
  if(!draftPattern.test(draftId)||!/^[-\w:]{1,160}$/.test(siteId)||value.confirmed!==true)throw failure('NP_CONTACT_CONFIRMATION_REQUIRED_01555',400);
  for(const k of ['firstName','phone','email','comment'])if(value[k]!==undefined&&typeof value[k]!=='string')throw failure('NP_CONTACT_INPUT_INVALID_01555',400);
  const firstName=clean(value.firstName),phone=clean(value.phone),email=clean(value.email),comment=clean(value.comment);
  const digits=phone.replace(/\D/g,'');
  if(firstName.length<2||firstName.length>120||/[\x00-\x1f]/.test(firstName)||phone.length>24||!/^[+\d\s().-]+$/.test(phone)||digits.length<9||digits.length>15||email.length>180||(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))||comment.length>1000)throw failure('NP_CONTACT_FIELDS_INVALID_01555',400);
  return {draftId,siteId,contacts:{firstName,phone,email,comment}};
}
export function contactEncryptionKey01555(env=process.env){
  const hex=clean(env.SHIFTTIME_CHECKOUT_PII_KEY);
  if(!/^[0-9a-fA-F]{64}$/.test(hex))throw failure('NP_CONTACT_KEY_NOT_CONFIGURED_01555',503);
  return Buffer.from(hex,'hex');
}
export function sealCheckoutContacts01555(contacts,scope,key,{iv=randomBytes(12)}={}){
  if(!Buffer.isBuffer(key)||key.length!==32||iv.length!==12)throw failure('NP_CONTACT_KEY_NOT_CONFIGURED_01555',503);
  const aad=Buffer.from([scope.storeId,scope.siteId,scope.draftId].join(':'),'utf8');
  const serialized=Buffer.from(JSON.stringify(contacts),'utf8');
  const cipher=createCipheriv('aes-256-gcm',key,iv);cipher.setAAD(aad);
  const encrypted=Buffer.concat([cipher.update(serialized),cipher.final()]);
  const tag=cipher.getAuthTag();
  const digest=createHmac('sha256',key).update(aad).update(serialized).digest('hex');
  serialized.fill(0);
  return {iv:iv.toString('base64'),data:encrypted.toString('base64'),tag:tag.toString('base64'),digest};
}
const constantEqual=(a,b)=>{
  if(!/^[0-9a-f]{64}$/i.test(clean(a))||!/^[0-9a-f]{64}$/i.test(clean(b)))return false;
  return timingSafeEqual(Buffer.from(a,'hex'),Buffer.from(b,'hex'));
};
export async function bindCheckoutContacts01555(scope,input,{transaction=withTransaction,keyProvider=contactEncryptionKey01555}={}){
  if(!scope?.storeId||!scope?.userId||!scope?.accountId||!scope?.workspaceId)throw failure('NP_CONTACT_SCOPE_REQUIRED_01555',403);
  const data=validateCheckoutContacts01555(input),key=keyProvider();
  return transaction(async client=>{
    const q=await client.query(`SELECT id,site_id,cart_id,state,created_at FROM shifttime_checkout_drafts_01554
      WHERE id=$1 AND store_id=$2 AND account_id=$3 AND workspace_id=$4 AND created_by_user_id=$5 AND site_id=$6 FOR UPDATE`,
      [data.draftId,scope.storeId,scope.accountId,scope.workspaceId,scope.userId,data.siteId]);
    if(!q.rowCount||q.rows[0].state!=='draft')throw failure('NP_CONTACT_DRAFT_NOT_FOUND_01555',404);
    // Time-bound consent: expired draft cannot accept new personal data.
    if(Date.now()-new Date(q.rows[0].created_at).getTime()>24*60*60*1000)throw failure('NP_CONTACT_DRAFT_EXPIRED_01555');
    const seal=sealCheckoutContacts01555(data.contacts,{storeId:scope.storeId,siteId:data.siteId,draftId:data.draftId},key);
    const existing=await client.query(`SELECT contacts_digest FROM shifttime_checkout_contacts_01555 WHERE draft_id=$1 AND store_id=$2 FOR UPDATE`,[data.draftId,scope.storeId]);
    if(existing.rowCount){if(!constantEqual(existing.rows[0].contacts_digest,seal.digest))throw failure('NP_CONTACT_ALREADY_BOUND_01555');return {stage:'01555',draftId:data.draftId,contactState:'bound',replayed:true,previewOnly:true,canPlaceOrder:false,canPay:false,crmSynced:false,waybillCreated:false};}
    await client.query(`INSERT INTO shifttime_checkout_contacts_01555 (draft_id,store_id,site_id,created_by_user_id,iv_b64,ciphertext_b64,tag_b64,contacts_digest,expires_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,now()+interval '30 days')`,[data.draftId,scope.storeId,data.siteId,scope.userId,seal.iv,seal.data,seal.tag,seal.digest]);
    return {stage:'01555',draftId:data.draftId,contactState:'bound',replayed:false,previewOnly:true,canPlaceOrder:false,canPay:false,crmSynced:false,waybillCreated:false};
  });
}
export async function eraseCheckoutContacts01555(scope,{draftId,siteId},{transaction=withTransaction}={}){
  if(!scope?.storeId||!scope?.userId||!scope?.accountId||!scope?.workspaceId)throw failure('NP_CONTACT_SCOPE_REQUIRED_01555',403);
  if(!draftPattern.test(clean(draftId))||!/^[-\w:]{1,160}$/.test(clean(siteId)))throw failure('NP_CONTACT_INPUT_INVALID_01555',400);
  return transaction(async client=>{
    const owned=await client.query(`SELECT id FROM shifttime_checkout_drafts_01554 WHERE id=$1 AND store_id=$2 AND account_id=$3 AND workspace_id=$4 AND created_by_user_id=$5 AND site_id=$6 FOR UPDATE`,[draftId,scope.storeId,scope.accountId,scope.workspaceId,scope.userId,siteId]);
    if(!owned.rowCount)throw failure('NP_CONTACT_DRAFT_NOT_FOUND_01555',404);
    const deleted=await client.query(`DELETE FROM shifttime_checkout_contacts_01555 WHERE draft_id=$1 AND store_id=$2`,[draftId,scope.storeId]);
    return {stage:'01555',draftId,contactState:'not_bound',erased:Boolean(deleted.rowCount),previewOnly:true,canPlaceOrder:false};
  });
}
