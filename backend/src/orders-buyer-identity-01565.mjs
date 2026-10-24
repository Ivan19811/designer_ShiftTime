// 01565 · Email possession proof for acknowledged store proposals. Never creates an order.
// Code delivery uses existing configured TLS SMTP. No browser/dev-mode OTP bypass.
import {createDecipheriv,createHmac,randomInt,randomUUID,timingSafeEqual} from 'node:crypto';
import {config} from './config.mjs';
import {sendSmtpMail01409} from './smtp-send-01409.mjs';
import {BUYER_EMAIL_UK_01565} from './locales/orders-buyer-email-01565.uk.mjs';
import {contactEncryptionKey01555} from './shipping-checkout-contacts-01555.mjs';
import {isReviewManager01560} from './orders-review-workflow-01560.mjs';
import {buyerSelect01564,digestOffer01564,buyerBasis01564,assertOfferMatches01564} from './orders-buyer-offer-01564.mjs';
const withTransaction=async (...a)=>(await import('./db.mjs')).withTransaction(...a);
const withClient=async (...a)=>(await import('./db.mjs')).withClient(...a);
const fail=(code,statusCode=409)=>Object.assign(new Error(code),{code,statusCode});
const draftRE=/^orderdraft_[a-f0-9]{32}$/i,tokenRE=/^[A-Za-z0-9_-]{43}$/;
const tokenHash=token=>{if(typeof token!=='string'||!tokenRE.test(token))throw fail('ORDERS_IDENTITY_LINK_INVALID_01565',404);return digestOffer01564(token);};
const select=buyerSelect01564+` JOIN shifttime_checkout_contacts_01555 c ON c.draft_id=d.id AND c.store_id=d.store_id AND c.site_id=d.site_id AND c.created_by_user_id=d.created_by_user_id`;
// No plaintext email is selected except in the challenge sender transaction.
const contactSelect=select.replace('SELECT o.*,','SELECT c.iv_b64 AS identity_iv,c.ciphertext_b64 AS identity_ciphertext,c.tag_b64 AS identity_tag,c.expires_at AS identity_contacts_expires,o.*,');
const challengeSQL='SELECT * FROM shifttime_order_buyer_email_challenges_01565 WHERE offer_id=$1 FOR UPDATE';
function eligible(row,now){if(row.revoked_at||!row.accepted_at||new Date(row.expires_at).getTime()<=now)throw fail('ORDERS_IDENTITY_OFFER_INVALID_01565',410);assertOfferMatches01564(row,buyerBasis01564(row),now);if(!row.contacts_current)throw fail('ORDERS_IDENTITY_CONTACTS_EXPIRED_01565',410);}
export function openBoundContactEmail01565(row,key){
 if(!Buffer.isBuffer(key)||key.length!==32)throw fail('ORDERS_IDENTITY_KEY_UNAVAILABLE_01565',503);
 const iv=Buffer.from(row.identity_iv||'','base64'),tag=Buffer.from(row.identity_tag||'','base64'),body=Buffer.from(row.identity_ciphertext||'','base64');
 if(iv.length!==12||tag.length!==16||!body.length)throw fail('ORDERS_IDENTITY_CONTACT_INVALID_01565',409);
 const aad=Buffer.from([row.store_id,row.site_id,row.draft_id].join(':'),'utf8');
 const cipher=createDecipheriv('aes-256-gcm',key,iv);cipher.setAAD(aad);cipher.setAuthTag(tag);
 const decrypted=Buffer.concat([cipher.update(body),cipher.final()]);
 try{const obj=JSON.parse(decrypted.toString('utf8'));const email=String(obj?.email||'').trim();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>180)throw fail('ORDERS_IDENTITY_EMAIL_REQUIRED_01565',409);return email;}finally{decrypted.fill(0);}
}
export const hashEmailCode01565=(key,id,code)=>createHmac('sha256',key).update('ST-ORDERS-BUYER-EMAIL-01565:').update(id).update(':').update(code).digest('hex');
const flags=(challenge,offer,now)=>({stage:'01565',verified:Boolean(challenge?.verified_at),verifiedAt:challenge?.verified_at||null,hasChallenge:Boolean(challenge),expiresAt:challenge?.expires_at||null,attemptsRemaining:challenge?Math.max(0,5-Number(challenge.attempt_count||0)):5,offerAcknowledged:Boolean(offer?.accepted_at),emailDelivery:'configured-smtp-only',emailPossessionOnly:true,identityDocumentVerified:false,orderCreated:false,previewOnly:true,canCreateOrder:false,canPay:false,canCreateWaybill:false,canSyncCrm:false});
const smtpConfigured=s=>Boolean(s.notificationSmtpHost&&s.notificationEmailFrom&&(s.notificationSmtpSecure===true||s.notificationSmtpStartTls===true));
function otpEmailSettings(settings=config){if(!smtpConfigured(settings))throw fail('ORDERS_IDENTITY_SMTP_NOT_CONFIGURED_01565',503);return {host:settings.notificationSmtpHost,port:settings.notificationSmtpPort,secure:settings.notificationSmtpSecure,startTls:settings.notificationSmtpStartTls,user:settings.notificationSmtpUser,pass:settings.notificationSmtpPass,timeoutMs:settings.notificationDeliveryTimeoutMs,helloName:settings.notificationSmtpHelloName};}
export async function startBuyerEmailProof01565(token,{transaction=withTransaction,clock=()=>Date.now(),keyProvider=contactEncryptionKey01555,sender=sendSmtpMail01409,settings=config,newCode=()=>String(randomInt(0,1000000)).padStart(6,'0')}={}){
 const digest=tokenHash(token),options=otpEmailSettings(settings),key=keyProvider();
 return transaction(async db=>{
  const q=await db.query(contactSelect+' WHERE o.token_hash=$1 LIMIT 1 FOR UPDATE OF o,d,r,q,c',[digest]);
  if(!q.rowCount)throw fail('ORDERS_IDENTITY_LINK_INVALID_01565',404);const row=q.rows[0],now=clock();eligible(row,now);
  const prev=await db.query(challengeSQL,[row.id]);const prior=prev.rows[0];
  if(prior?.verified_at)return flags(prior,row,now);
  if(prior&&Number(prior.send_count||0)>=3)throw fail('ORDERS_IDENTITY_SEND_LIMIT_01565',429);
  if(prior&&new Date(prior.sent_at||prior.created_at).getTime()>now-60_000)throw fail('ORDERS_IDENTITY_COOLDOWN_01565',429);
  const email=openBoundContactEmail01565(row,key),id=prior?.id||randomUUID(),code=newCode();
  if(!/^\d{6}$/.test(code))throw fail('ORDERS_IDENTITY_CODE_GENERATION_01565',500);
  const expires=new Date(Math.min(now+5*60_000,new Date(row.expires_at).getTime()));
  if(expires.getTime()<=now+30_000)throw fail('ORDERS_IDENTITY_OFFER_TOO_OLD_01565',409);
  // SMTP in transaction: failure rolls back challenge; avoid issuing a usable code that was not delivered.
  // No OTP, email or offer token in logs, URLs or responses.
  const delivery=await sender(options,{from:settings.notificationEmailFrom,to:email,subject:BUYER_EMAIL_UK_01565.subject,text:BUYER_EMAIL_UK_01565.body(code)});
  if(delivery?.ok!==true)throw fail('ORDERS_IDENTITY_DELIVERY_FAILED_01565',503);
  const codeHash=hashEmailCode01565(key,id,code);
  const saved=await db.query(`INSERT INTO shifttime_order_buyer_email_challenges_01565 (id,offer_id,draft_id,store_id,code_hash,expires_at,sent_at,send_count,attempt_count)
   VALUES($1,$2,$3,$4,$5,$6,now(),1,0) ON CONFLICT(offer_id) DO UPDATE SET code_hash=EXCLUDED.code_hash,expires_at=EXCLUDED.expires_at,sent_at=now(),send_count=shifttime_order_buyer_email_challenges_01565.send_count+1,attempt_count=0
   RETURNING *`,[id,row.id,row.draft_id,row.store_id,codeHash,expires]);
  return flags(saved.rows[0],row,now);
 });
}
export async function verifyBuyerEmailProof01565(token,code,{transaction=withTransaction,clock=()=>Date.now(),keyProvider=contactEncryptionKey01555}={}){
 const digest=tokenHash(token);if(typeof code!=='string'||!/^\d{6}$/.test(code))throw fail('ORDERS_IDENTITY_CODE_INVALID_01565',400);
 const result=await transaction(async db=>{
  const q=await db.query(select+' WHERE o.token_hash=$1 LIMIT 1 FOR UPDATE OF o,d,r,q,c',[digest]);
  if(!q.rowCount)throw fail('ORDERS_IDENTITY_LINK_INVALID_01565',404);const row=q.rows[0],now=clock();eligible(row,now);
  const x=await db.query(challengeSQL,[row.id]);if(!x.rowCount)throw fail('ORDERS_IDENTITY_CHALLENGE_REQUIRED_01565',409);
  const ch=x.rows[0];if(ch.verified_at)return flags(ch,row,now);
  if(new Date(ch.expires_at).getTime()<=now)throw fail('ORDERS_IDENTITY_CODE_EXPIRED_01565',410);
  if(Number(ch.attempt_count)>=5)throw fail('ORDERS_IDENTITY_ATTEMPTS_EXCEEDED_01565',429);
  const key=keyProvider();const correct=timingSafeEqual(Buffer.from(hashEmailCode01565(key,ch.id,code),'hex'),Buffer.from(ch.code_hash,'hex'));
  if(!correct){await db.query('UPDATE shifttime_order_buyer_email_challenges_01565 SET attempt_count=attempt_count+1 WHERE id=$1',[ch.id]);return {error:'ORDERS_IDENTITY_CODE_INCORRECT_01565',statusCode:400};}
  const updated=await db.query('UPDATE shifttime_order_buyer_email_challenges_01565 SET verified_at=now() WHERE id=$1 AND verified_at IS NULL RETURNING *',[ch.id]);
  if(!updated.rowCount)throw fail('ORDERS_IDENTITY_CONFLICT_01565');return flags(updated.rows[0],row,now);
 });
 if(result?.error)throw fail(result.error,result.statusCode);return result;
}
export async function buyerEmailProofStatus01565(token,{lookup=withClient,clock=()=>Date.now()}={}){
 const digest=tokenHash(token);return lookup(async db=>{const q=await db.query(select+' WHERE o.token_hash=$1 LIMIT 1',[digest]);if(!q.rowCount)throw fail('ORDERS_IDENTITY_LINK_INVALID_01565',404);const row=q.rows[0],now=clock();eligible(row,now);
 const proof=await db.query('SELECT verified_at,expires_at,attempt_count FROM shifttime_order_buyer_email_challenges_01565 WHERE offer_id=$1',[row.id]);return flags(proof.rows[0],row,now);
 });
}
export async function getManagerEmailProof01565(scope,draftId,{lookup=withClient}={}){
 if(!scope?.storeId||!scope?.accountId||!scope?.workspaceId||!scope?.userId||!isReviewManager01560(scope))throw fail('ORDERS_IDENTITY_FORBIDDEN_01565',403);
 if(!draftRE.test(String(draftId||'')))throw fail('ORDERS_IDENTITY_DRAFT_INVALID_01565',400);
 return lookup(async db=>{const res=await db.query(`SELECT o.id,o.accepted_at,o.revoked_at,o.expires_at,c.verified_at,c.expires_at AS code_expires_at,c.attempt_count FROM shifttime_order_buyer_offers_01564 o
 JOIN shifttime_checkout_drafts_01554 d ON d.id=o.draft_id AND d.store_id=o.store_id
 LEFT JOIN shifttime_order_buyer_email_challenges_01565 c ON c.offer_id=o.id
 WHERE d.id=$1 AND d.store_id=$2 AND d.account_id=$3 AND d.workspace_id=$4 ORDER BY o.created_at DESC LIMIT 1`,[draftId,scope.storeId,scope.accountId,scope.workspaceId]);
 const o=res.rows[0];return {stage:'01565',draftId,offerAvailable:Boolean(o),offerAcknowledged:Boolean(o?.accepted_at&&!o.revoked_at),verified:Boolean(o?.verified_at&&!o.revoked_at),verifiedAt:o?.verified_at||null,offerExpiresAt:o?.expires_at||null,identityDocumentVerified:false,emailPossessionOnly:true,previewOnly:true,canCreateOrder:false,canPay:false,canSyncCrm:false};});
}
