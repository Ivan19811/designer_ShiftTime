// 01611: pure, testable verification primitives. Never log or return raw phone numbers.
import crypto from 'node:crypto';
import {hashMessengerVisitor01609,messengerError01609} from './messenger-core-01609.mjs';
export const CHANNELS_01611=Object.freeze(['sms','telegram','viber','whatsapp']);
export function normalizePhone01611(value){
  const text=String(value??'').replace(/[\s()\-]/g,'');
  const number=/^0\d{9}$/.test(text)?'+38'+text:text;
  if(!/^\+[1-9]\d{7,14}$/.test(number))throw messengerError01609('MESSENGER_PHONE_INVALID_01611',400);
  return number;
}
export function normalizeChannel01611(value){
  if(!CHANNELS_01611.includes(value))throw messengerError01609('MESSENGER_CHANNEL_INVALID_01611',400);
  return value;
}
export function verificationScope01611(identity,visitorKey){
  if(!identity?.siteId||!identity?.storeId||!identity?.workspaceId||!identity?.accountId)throw messengerError01609('MESSENGER_SITE_REQUIRED_01609',401);
  return {accountId:identity.accountId,workspaceId:identity.workspaceId,storeId:identity.storeId,siteId:identity.siteId,visitorHash:hashMessengerVisitor01609(visitorKey)};
}
export function verificationKey01611(env=process.env){
  const raw=String(env.MESSENGER_CONTACT_SECRET_01611||'');
  if(raw.length<32)throw messengerError01609('MESSENGER_VERIFICATION_NOT_CONFIGURED_01611',503);
  return crypto.createHash('sha256').update(raw).digest();
}
export function hmac01611(key,value){return crypto.createHmac('sha256',key).update(String(value)).digest('hex');}
export function sealPhone01611(key,phone){
  const iv=crypto.randomBytes(12),cipher=crypto.createCipheriv('aes-256-gcm',key,iv);
  const encrypted=Buffer.concat([cipher.update(phone,'utf8'),cipher.final()]);
  return [iv.toString('base64url'),cipher.getAuthTag().toString('base64url'),encrypted.toString('base64url')].join('.');
}
export function openPhone01611(key,sealed){
  const [iv,tag,data]=String(sealed).split('.');
  if(!iv||!tag||!data)throw messengerError01609('MESSENGER_PHONE_SEAL_INVALID_01611',500);
  const cipher=crypto.createDecipheriv('aes-256-gcm',key,Buffer.from(iv,'base64url'));
  cipher.setAuthTag(Buffer.from(tag,'base64url'));
  return Buffer.concat([cipher.update(Buffer.from(data,'base64url')),cipher.final()]).toString('utf8');
}
export function maskPhone01611(value){const phone=String(value);return phone.slice(0,3)+'•••'+phone.slice(-3);}
export function assertCode01611(value){const code=String(value||'').trim();if(!/^\d{4,8}$/.test(code))throw messengerError01609('MESSENGER_CODE_INVALID_01611',400);return code;}

export function verificationEnforced01611(env=process.env){return String(env.MESSENGER_VERIFY_ENFORCE_01611||'')==='1';}
