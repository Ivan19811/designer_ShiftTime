// 01611. Site/visitor-scoped contact proof: deliberately NOT global account enrollment.
import crypto from 'node:crypto';
import {withClient} from './db.mjs';
import {messengerError01609} from './messenger-core-01609.mjs';
import {verificationScope01611,verificationKey01611,normalizePhone01611,normalizeChannel01611,hmac01611,sealPhone01611,openPhone01611,maskPhone01611,assertCode01611,verificationEnforced01611} from './messenger-verification-core-01611.mjs';
import {providerStatus01611,startProviderVerification01611,checkProviderVerification01611} from './messenger-verification-providers-01611.mjs';
import {ensureVerifiedContact01611A,attachExistingMessengerMessages01611A} from './messenger-contact-profiles-01611a.mjs';
const limits={perIp:12,perVisitor:6,perPhone:5};
const columns='account_id,workspace_id,store_id,builder_site_id,visitor_hash';
const scopeArgs=s=>[s.accountId,s.workspaceId,s.storeId,s.siteId,s.visitorHash];
export async function listVerifiedMessengerChannels01611(identity,visitorKey){
  const s=verificationScope01611(identity,visitorKey),key=verificationKey01611();
  return withClient(async db=>{
    const rows=await db.query(`SELECT channel,phone_sealed "phoneSealed",consent_fallback "fallbackAllowed",verified_at "verifiedAt" FROM shifttime_messenger_verified_channels_01611 WHERE ${columns.split(',').map((c,i)=>c+'=$'+(i+1)).join(' AND ')} ORDER BY verified_at DESC`,scopeArgs(s));
    return {stage:'01611',providers:providerStatus01611(),verified:rows.rows.map(x=>({channel:x.channel,maskedPhone:maskPhone01611(openPhone01611(key,x.phoneSealed)),fallbackAllowed:x.fallbackAllowed,verifiedAt:x.verifiedAt})),enforced:verificationEnforced01611()};
  });
}
export async function assertMessengerChannelProof01611(identity,visitorKey){
  if(!verificationEnforced01611())return;
  const s=verificationScope01611(identity,visitorKey);
  await withClient(async db=>{
    const q=await db.query(`SELECT 1 FROM shifttime_messenger_verified_channels_01611 WHERE store_id=$1 AND builder_site_id=$2 AND visitor_hash=$3 LIMIT 1`,[s.storeId,s.siteId,s.visitorHash]);
    if(!q.rowCount)throw messengerError01609('MESSENGER_VERIFICATION_REQUIRED_01611',403);
  });
}
export async function startMessengerVerification01611(identity,visitorKey,input={},meta={}){
  const s=verificationScope01611(identity,visitorKey),key=verificationKey01611();
  const channel=normalizeChannel01611(input.channel),phone=normalizePhone01611(input.phone);
  if(!providerStatus01611()[channel])throw messengerError01609('MESSENGER_CHANNEL_NOT_CONFIGURED_01611',503);
  const phoneHash=hmac01611(key,'phone:'+phone),ipHash=hmac01611(key,'ip:'+String(meta.remoteAddress||'unknown'));
  const id=crypto.randomUUID(), sealed=sealPhone01611(key,phone);
  await withClient(async db=>{
    await db.query('BEGIN');
    try{
      // PostgreSQL advisory transaction locks prevent concurrent quota bypass for same phone / IP / guest.
      await db.query(`SELECT pg_advisory_xact_lock(hashtext($1),hashtext($2))`,['01611-ip',ipHash]);
      await db.query(`SELECT pg_advisory_xact_lock(hashtext($1),hashtext($2))`,['01611-phone',phoneHash]);
      const q=await db.query(`SELECT
        COUNT(*) FILTER (WHERE ip_hash=$1 AND created_at>now()-interval '1 hour')::int ip,
        COUNT(*) FILTER (WHERE visitor_hash=$2 AND created_at>now()-interval '1 hour')::int visitor,
        COUNT(*) FILTER (WHERE phone_hash=$3 AND created_at>now()-interval '1 hour')::int phone,
        COUNT(*) FILTER (WHERE visitor_hash=$2 AND phone_hash=$3 AND channel=$4 AND created_at>now()-interval '60 seconds')::int recent
        FROM shifttime_messenger_verification_challenges_01611
        WHERE created_at>now()-interval '1 hour' AND (ip_hash=$1 OR visitor_hash=$2 OR phone_hash=$3)`, [ipHash,s.visitorHash,phoneHash,channel]);
      const row=q.rows[0];
      if(row.ip>=limits.perIp||row.visitor>=limits.perVisitor||row.phone>=limits.perPhone||row.recent>0)throw messengerError01609('MESSENGER_VERIFY_RATE_LIMIT_01611',429);
      await db.query(`INSERT INTO shifttime_messenger_verification_challenges_01611(id,account_id,workspace_id,store_id,builder_site_id,visitor_hash,ip_hash,channel,phone_hash,phone_sealed,provider,expires_at,consent_fallback)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,now()+interval '5 minutes',$12)`,[id,...scopeArgs(s),ipHash,channel,phoneHash,sealed,channel==='telegram'?'telegram_gateway':'twilio_verify',input.consentFallback===true]);
      await db.query('COMMIT');
    }catch(e){await db.query('ROLLBACK');throw e;}
  });
  try{
    const result=await startProviderVerification01611(channel,phone);
    await withClient(db=>db.query(`UPDATE shifttime_messenger_verification_challenges_01611 SET status='sent',provider_request_id=$2 WHERE id=$1 AND status='pending'`,[id,result.requestId]));
    return {stage:'01611',challengeId:id,channel,maskedPhone:maskPhone01611(phone),expiresInSeconds:300};
  }catch(e){
    await withClient(db=>db.query(`UPDATE shifttime_messenger_verification_challenges_01611 SET status='failed' WHERE id=$1 AND status='pending'`,[id]));
    throw e;
  }
}
export async function verifyMessengerChannel01611(identity,visitorKey,input={}){
  const s=verificationScope01611(identity,visitorKey),key=verificationKey01611();
  const code=assertCode01611(input.code),id=String(input.challengeId||'');
  if(!/^[0-9a-f-]{36}$/i.test(id))throw messengerError01609('MESSENGER_CHALLENGE_INVALID_01611',400);
  const record=await withClient(async db=>{
    const q=await db.query(`UPDATE shifttime_messenger_verification_challenges_01611 SET attempts=attempts+1 WHERE id=$1 AND account_id=$2 AND workspace_id=$3 AND store_id=$4 AND builder_site_id=$5 AND visitor_hash=$6 AND status='sent' AND expires_at>now() AND attempts<5 RETURNING *`,[id,...scopeArgs(s)]);
    if(!q.rowCount)throw messengerError01609('MESSENGER_CHALLENGE_EXPIRED_01611',400);
    return q.rows[0];
  });
  const phone=openPhone01611(key,record.phone_sealed);
  const ok=await checkProviderVerification01611(record.channel,phone,record.provider_request_id,code);
  if(!ok)throw messengerError01609('MESSENGER_CODE_INCORRECT_01611',400);
  // Atomic consumption: the same challenge can establish one scoped proof only.
  await withClient(async db=>{
    await db.query('BEGIN');
    try{
      const consumed=await db.query(`UPDATE shifttime_messenger_verification_challenges_01611 SET status='verified',verified_at=now() WHERE id=$1 AND status='sent' AND expires_at>now() RETURNING id`,[id]);
      if(!consumed.rowCount)throw messengerError01609('MESSENGER_CHALLENGE_EXPIRED_01611',400);
      const contact=await ensureVerifiedContact01611A(db,s);
      await db.query(`INSERT INTO shifttime_messenger_verified_channels_01611(id,account_id,workspace_id,store_id,builder_site_id,visitor_hash,channel,phone_hash,phone_sealed,consent_fallback,contact_id)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
        ON CONFLICT (store_id,builder_site_id,visitor_hash,channel,phone_hash)
        DO UPDATE SET consent_fallback=EXCLUDED.consent_fallback,verified_at=now(),updated_at=now(),phone_sealed=EXCLUDED.phone_sealed,contact_id=EXCLUDED.contact_id`,
      [crypto.randomUUID(),...scopeArgs(s),record.channel,record.phone_hash,record.phone_sealed,record.consent_fallback,contact.id]);
      await attachExistingMessengerMessages01611A(db,s,contact.id);
      await db.query('COMMIT');
    }catch(e){await db.query('ROLLBACK');throw e;}
  });
  return {stage:'01611',verified:true,channel:record.channel,maskedPhone:maskPhone01611(phone),fallbackAllowed:record.consent_fallback};
}
