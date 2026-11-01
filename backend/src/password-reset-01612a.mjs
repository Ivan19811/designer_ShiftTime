// 01612A · Existing-user password recovery, one-time expiring links, all sessions revoked.
import crypto from 'node:crypto';
import {withClient} from './db.mjs';
import {config} from './config.mjs';
import {hashPassword01084} from './auth-service-01084.mjs';
import {sendPlatformEmail01612B,emailTransportOptions01612B} from './email-transport-01612b.mjs';
import uk from './locales/password-reset-01612a.uk.mjs';
const clean=v=>String(v??'').trim();
const fail=(code,statusCode=400)=>Object.assign(new Error(code),{statusCode,code});
export const hashResetToken01612A=token=>crypto.createHash('sha256').update(String(token??'')).digest('hex');
export const validResetToken01612A=token=>/^[A-Za-z0-9_-]{43}$/.test(clean(token));
export const normalizeResetEmail01612A=email=>clean(email).toLowerCase();
export const genericResetResponse01612A=Object.freeze({ok:true,stage:'01612A'});
const memoryRates=new Map();
export function limitResetRequest01612A(address,now=Date.now()){
 const key=crypto.createHash('sha256').update(String(address||'unknown').slice(0,180)).digest('hex');
 for(const [k,v] of memoryRates)if(now-v.since>3600_000)memoryRates.delete(k);
 const prev=memoryRates.get(key);
 const item=prev&&now-prev.since<3600_000?prev:{since:now,count:0};
 if(item.count>=25)throw fail('PASSWORD_RESET_RATE_LIMIT_01612A',429);
 item.count++;memoryRates.set(key,item);
}
function origin01612A(env=process.env){
 const value=clean(env.PASSWORD_RESET_PUBLIC_ORIGIN_01612A);
 let url;try{url=new URL(value);}catch{throw fail('PASSWORD_RESET_NOT_CONFIGURED_01612A',503);}
 if(url.protocol!=='https:'||url.username||url.password||url.pathname!=='/'||url.search||url.hash)throw fail('PASSWORD_RESET_NOT_CONFIGURED_01612A',503);
 return url.origin;
}
function transport01612B(settings=config){
 try{return emailTransportOptions01612B(settings);}catch{throw fail('PASSWORD_RESET_NOT_CONFIGURED_01612A',503);}
}
export async function requestPasswordReset01612A(email,{query=withClient,send=sendPlatformEmail01612B,settings=config,env=process.env}={}){
 const e=normalizeResetEmail01612A(email);
 if(!e||e.length>254||!/^\S+@\S+\.\S+$/.test(e))throw fail('PASSWORD_RESET_EMAIL_01612A');
 // Fail closed if email cannot actually be sent. Never claim delivery without SMTP.
 const emailOptions=transport01612B(settings),base=origin01612A(env);
 const token=crypto.randomBytes(32).toString('base64url');
 const row=await query(async db=>{
  await db.query('BEGIN');
  try{
   const u=await db.query(`SELECT id,email FROM platform_users WHERE lower(email)=lower($1) AND status='active' LIMIT 1 FOR UPDATE`,[e]);
   if(!u.rowCount){await db.query('COMMIT');return null;}
   const user=u.rows[0];
   const limiter=await db.query(`SELECT COUNT(*)::integer AS count, MAX(created_at) AS last
     FROM platform_password_resets_01612a WHERE user_id=$1 AND created_at>now()-interval '1 hour'`,[user.id]);
   const r=limiter.rows[0]||{};
   if(Number(r.count)>=3||(r.last&&Date.now()-new Date(r.last).getTime()<60_000)){
    await db.query('COMMIT');return null;
   }
   const inserted=await db.query(`INSERT INTO platform_password_resets_01612a(user_id,token_hash,expires_at)
      VALUES($1,$2,now()+interval '15 minutes') RETURNING id`,[user.id,hashResetToken01612A(token)]);
   await db.query('COMMIT');return {id:inserted.rows[0].id,email:user.email};
  }catch(err){await db.query('ROLLBACK').catch(()=>{});throw err;}
 });
 if(!row)return {...genericResetResponse01612A};
 const link=base+'/identity/reset/#token='+encodeURIComponent(token);
 try{
  await send(emailOptions,{from:settings.notificationEmailFrom,to:row.email,subject:uk.subject,text:uk.body.replace('{link}',link)});
  await query(db=>db.query('UPDATE platform_password_resets_01612a SET sent_at=now() WHERE id=$1',[row.id]));
 }catch(error){
  // Avoid falsely counting a delivery failure as successful; no secret in errors.
  await query(db=>db.query('DELETE FROM platform_password_resets_01612a WHERE id=$1 AND consumed_at IS NULL',[row.id])).catch(()=>{});
  throw fail('PASSWORD_RESET_DELIVERY_FAILED_01612A',503);
 }
 return {...genericResetResponse01612A};
}
export async function completePasswordReset01612A({token,password}={}, {query=withClient}={}){
 if(!validResetToken01612A(token))throw fail('PASSWORD_RESET_INVALID_01612A',400);
 const newHash=await hashPassword01084(password); // existing policy; never return raw password.
 return query(async db=>{
  await db.query('BEGIN');
  try{
   const q=await db.query(`SELECT r.id,r.user_id FROM platform_password_resets_01612a r
      JOIN platform_users u ON u.id=r.user_id AND u.status='active'
      WHERE r.token_hash=$1 AND r.consumed_at IS NULL AND r.sent_at IS NOT NULL AND r.expires_at>now()
      LIMIT 1 FOR UPDATE OF r`,[hashResetToken01612A(token)]);
   if(!q.rowCount)throw fail('PASSWORD_RESET_INVALID_01612A',400);
   const row=q.rows[0];
   const changed=await db.query(`UPDATE platform_user_credentials SET secret_hash=$2,algorithm='scrypt-v1',updated_at=now()
      WHERE user_id=$1 AND kind='password'`,[row.user_id,newHash]);
   if(!changed.rowCount)throw fail('PASSWORD_RESET_INVALID_01612A',400);
   await db.query(`UPDATE platform_password_resets_01612a SET consumed_at=now() WHERE user_id=$1 AND consumed_at IS NULL`,[row.user_id]);
   // Builder, CRM and SSO all resolve through api_sessions.
   await db.query(`UPDATE api_sessions SET status='revoked',last_seen_at=now() WHERE user_id=$1 AND status='active'`,[row.user_id]);
   // Published shop sessions are intentionally separate and must also be revoked.
   await db.query(`UPDATE platform_site_customer_sessions_01595 SET status='revoked',revoked_at=now()
      WHERE user_id=$1 AND status='active'`,[row.user_id]);
   await db.query('COMMIT');return {ok:true,stage:'01612A'};
  }catch(error){await db.query('ROLLBACK').catch(()=>{});throw error;}
 });
}
