// 01543 · Central delivery directory routing and limited CRM service bridge.
// Provider secrets live only on Render, NEVER in published pages, CRM JS, or logs.
import crypto from 'node:crypto';
import {novaPoshtaDirectory01542,novaPoshtaDirectoryConfigured01542,assertNovaPoshtaRateLimit01542} from './nova-poshta-directory-01542.mjs';
const clean=x=>String(x??'').trim();
const err=(code,statusCode)=>Object.assign(new Error(code),{statusCode});
const events=[];
const counters=new Map();
const globalTraffic=new Map();
function assertAggregateLimit01543(source,now=Date.now()) {
  const minute=Math.floor(now/60000),key=source+':'+minute;
  const count=(globalTraffic.get(key)||0)+1;globalTraffic.set(key,count);
  if(globalTraffic.size>30)for(const k of globalTraffic.keys())if(!k.endsWith(':'+minute))globalTraffic.delete(k);
  if(count>600)throw err('SHIPPING_HUB_GLOBAL_RATE_LIMIT_01543',429);
}
function metric(source,kind,ok,code=''){
  const index=source+':'+kind,old=counters.get(index)||{requests:0,failed:0};
  old.requests++;if(!ok)old.failed++;counters.set(index,old);
  events.push({at:new Date().toISOString(),source,kind,ok,code});if(events.length>100)events.shift();
}
export function shippingHubMetrics01543(){return {totals:Array.from(counters,([route,value])=>({route,...value})),recent:events.slice(-30)};}
export function verifyCrmBridgeToken01543(value,expected=process.env.ST_SHIPPING_CRM_BRIDGE_TOKEN){
  const token=clean(value),reference=clean(expected);
  if(reference.length<32||token.length!==reference.length)return false;
  return crypto.timingSafeEqual(Buffer.from(token),Buffer.from(reference));
}
export function shippingHubStatus01543(){return {stage:'01543',directoryConfigured:novaPoshtaDirectoryConfigured01542(),crmBridgeConfigured:clean(process.env.ST_SHIPPING_CRM_BRIDGE_TOKEN).length>=32,storeEncryptionConfigured:isShippingEncryptionConfigured01543(),features:{directory:true,publicSiteDirectory:true,crmDirectoryBridge:true,storeCredentials:true,ttn:false,priceQuote:true}};}
export async function hubDirectory01543(kind,value,{source,clientId}){
  const tier=source==='crm'?'crm':source==='published'?'published':'builder';
  // 01542 throttle provides an independent cap for *every* route/peer.
  assertAggregateLimit01543(tier);
  assertNovaPoshtaRateLimit01542(tier+':'+clean(clientId));
  try{
    const out=await novaPoshtaDirectory01542(kind,value);
    metric(tier,kind,true);
    return {...out,stage:'01543'};
  }catch(error){metric(tier,kind,false,clean(error?.message).slice(0,90));throw error;}
}
const B64_KEY=/^[A-Za-z0-9+/]{43}=$/;
export function shippingEncryptionKey01543(value=process.env.ST_SHIPPING_ENCRYPTION_KEY){
  const x=clean(value);
  if(!B64_KEY.test(x)||Buffer.from(x,'base64').length!==32)throw err('SHIPPING_ENCRYPTION_NOT_CONFIGURED_01543',503);
  return Buffer.from(x,'base64');
}
export function isShippingEncryptionConfigured01543(){try{shippingEncryptionKey01543();return true;}catch{return false;}}
export function encryptStoreCarrierKey01543(key,storeId,{encryptionKey=shippingEncryptionKey01543(),randomBytes=crypto.randomBytes}={}){
  const secret=clean(key),store=clean(storeId);
  if(secret.length<12||secret.length>256||!store)throw err('SHIPPING_KEY_INVALID_01543',400);
  const iv=randomBytes(12),cipher=crypto.createCipheriv('aes-256-gcm',encryptionKey,iv);
  cipher.setAAD(Buffer.from('shifttime:shipping:nova-poshta:'+store));
  const encrypted=Buffer.concat([cipher.update(secret,'utf8'),cipher.final()]);
  return ['v1',iv.toString('base64url'),cipher.getAuthTag().toString('base64url'),encrypted.toString('base64url')].join('.');
}
export function decryptStoreCarrierKey01543(value,storeId,{encryptionKey=shippingEncryptionKey01543()}={}){
  const [version,iv,tag,text,...extra]=clean(value).split('.');
  if(version!=='v1'||!iv||!tag||!text||extra.length)throw err('SHIPPING_CREDENTIAL_FORMAT_INVALID_01543',400);
  const decipher=crypto.createDecipheriv('aes-256-gcm',encryptionKey,Buffer.from(iv,'base64url'));
  decipher.setAAD(Buffer.from('shifttime:shipping:nova-poshta:'+clean(storeId)));
  decipher.setAuthTag(Buffer.from(tag,'base64url'));
  return Buffer.concat([decipher.update(Buffer.from(text,'base64url')),decipher.final()]).toString('utf8');
}
