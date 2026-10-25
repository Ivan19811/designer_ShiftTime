// 01581 · URL allowlist, PKCE and signed first-party SSO cookie primitives.
import crypto from 'node:crypto';
const clean=x=>String(x??'').trim();
const tokenHash=x=>crypto.createHash('sha256').update(String(x||'')).digest('hex');
const mac=(key,value)=>crypto.createHmac('sha256',key).update(value).digest('base64url');
export function ssoRedirectAllowed01581(clientId,redirectUri,allowed=process.env.SSO_ALLOWED_CALLBACKS||''){
  if(!['crm','builder'].includes(clean(clientId)))return false;
  let u;try{u=new URL(clean(redirectUri));}catch{return false;}
  if(!['http:','https:'].includes(u.protocol)||u.username||u.password||u.hash)return false;
  if(u.protocol!=='https:'&&!['localhost','127.0.0.1'].includes(u.hostname))return false;
  // Only specific, operator-registered callback paths. No wildcard, open redirect, or request origin fallback.
  const entries=clean(allowed).split(',').map(x=>x.trim()).filter(Boolean);
  return entries.some(entry=>{const index=entry.indexOf('=');if(index<1||entry.slice(0,index)!==clientId)return false;try{const a=new URL(entry.slice(index+1));return a.href===u.href;}catch{return false;}});
}
export function ssoChallenge01581(verifier){return crypto.createHash('sha256').update(String(verifier||'')).digest('base64url');}
export function validChallenge01581(challenge){return /^[A-Za-z0-9_-]{43}$/.test(clean(challenge));}
export function validVerifier01581(verifier){return /^[A-Za-z0-9._~-]{43,128}$/.test(clean(verifier));}
export function validState01581(state){return /^[A-Za-z0-9._~-]{22,150}$/.test(clean(state));}
export function newSsoCode01581(){return crypto.randomBytes(32).toString('base64url');}
export function hashSsoCode01581(code){return tokenHash(code);}
export function ssoCookieValue01581(sessionId,secret){
  if(clean(secret).length<32)throw new Error('SSO_COOKIE_SECRET not configured');
  const id=clean(sessionId);if(!/^[A-Za-z0-9_-]{10,100}$/.test(id))throw new Error('Invalid session');
  return id+'.'+mac(secret,'sso-v1:'+id);
}
export function readSsoCookie01581(value,secret){
  if(clean(secret).length<32)return '';
  const raw=clean(value),index=raw.lastIndexOf('.');if(index<1)return '';
  const id=raw.slice(0,index),signature=raw.slice(index+1);
  if(!/^[A-Za-z0-9_-]{10,100}$/.test(id)||!/^[A-Za-z0-9_-]{43}$/.test(signature))return '';
  const expected=mac(secret,'sso-v1:'+id);
  const a=Buffer.from(signature),b=Buffer.from(expected);
  return a.length===b.length&&crypto.timingSafeEqual(a,b)?id:'';
}
export function ssoCookieHeader01581(sessionId,secret,{secure=true}={}){
  return `st_sso=${encodeURIComponent(ssoCookieValue01581(sessionId,secret))}; Path=/api/v1/auth/sso; HttpOnly; SameSite=Lax${secure?'; Secure':''}; Max-Age=2592000`;
}
export const clearSsoCookie01581=({secure=true}={})=>`st_sso=; Path=/api/v1/auth/sso; HttpOnly; SameSite=Lax${secure?'; Secure':''}; Max-Age=0`;
export function ssoCookieFromRequest01581(req){const found=String(req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith('st_sso='));if(!found)return '';try{return decodeURIComponent(found.slice(7));}catch{return '';}}
export function appendSsoCallback01581(uri,params){const u=new URL(uri);for(const [key,value] of Object.entries(params))u.searchParams.set(key,String(value));return u.href;}
