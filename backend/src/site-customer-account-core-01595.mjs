// 01595 · Public customer session is NOT a Builder/CRM API session.
import crypto from 'node:crypto';
const clean=value=>String(value??'').trim();
export const siteAccountFault01595=(code,statusCode=400)=>Object.assign(new Error(code),{statusCode,code});
export const customerEmail01595=value=>clean(value).toLowerCase();
export function customerInput01595(input={},registration=false){
  const email=customerEmail01595(input.email),password=String(input.password??''),name=clean(input.name);
  if(email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw siteAccountFault01595('SITE_ACCOUNT_EMAIL_01595');
  if(!password||password.length>256)throw siteAccountFault01595('SITE_ACCOUNT_CREDENTIALS_01595',401);
  if(registration){
    if(password.length<10)throw siteAccountFault01595('SITE_ACCOUNT_PASSWORD_01595');
    if(name.length<2||name.length>120)throw siteAccountFault01595('SITE_ACCOUNT_NAME_01595');
    if(input.acceptTerms!==true)throw siteAccountFault01595('SITE_ACCOUNT_TERMS_REQUIRED_01595');
    if(clean(input.website))throw siteAccountFault01595('SITE_ACCOUNT_REGISTRATION_UNAVAILABLE_01595',400); // honeypot
  }
  return {email,password,name};
}
export function customerSiteScope01595(site){
  if(!/^site_[a-z0-9_-]{4,96}$/i.test(clean(site?.siteId))||!clean(site?.accountId)||!clean(site?.publishedSiteId))throw siteAccountFault01595('SITE_ACCOUNT_SITE_REQUIRED_01595',401);
  return {siteId:site.siteId,storeId:clean(site.storeId),publishedSiteId:site.publishedSiteId};
}
export function customerSessionHash01595(token){return crypto.createHash('sha256').update(String(token||'')).digest('hex');}
export function newCustomerToken01595(){return `stc_${crypto.randomBytes(32).toString('base64url')}`;}
export function customerPublicUser01595(row){return {id:row.id,name:row.name,email:row.email,emailVerified:Boolean(row.email_verified_at),createdAt:row.created_at};}
const limits=new Map();
// Best-effort in-memory throttle; production requires shared WAF/Redis limits at scale.
export function limitCustomerAuth01595(siteId,remoteIp='',clock=Date.now){
  const bucket=customerSessionHash01595(String(siteId)+'|'+String(remoteIp)).slice(0,24),now=clock(),prev=limits.get(bucket),next=!prev||now-prev.start>900000?{start:now,count:1}:{...prev,count:prev.count+1};
  limits.set(bucket,next);
  if(limits.size>6000){for(const [key,item] of limits){if(now-item.start>900000)limits.delete(key);if(limits.size<3000)break;}}
  if(next.count>12)throw siteAccountFault01595('SITE_ACCOUNT_RATE_LIMITED_01595',429);
}
