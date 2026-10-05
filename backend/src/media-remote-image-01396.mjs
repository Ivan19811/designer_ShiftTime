// 01396 · Authenticated supplier-image fetch bridge for optional Marketplace media ingestion.
// Downloads remote image bytes only. Browser keeps canonical compression/upload pipeline.
import dns from 'node:dns/promises';
import net from 'node:net';
import {config} from './config.mjs';

const STAGE='01396';
const MAX_REDIRECTS=4;
const DEFAULT_TIMEOUT_MS=25000;
const ALLOWED_MIME=/^image\/(?:jpeg|png|webp|avif|gif|bmp)$/i;
function str(v){return String(v??'').trim();}
function safeName(value='image'){return (str(value)||'image').replace(/[\\/:*?"<>|\x00-\x1f]+/g,'_').slice(0,180)||'image';}
function fileNameFromUrl(value){try{const u=new URL(value);return safeName(decodeURIComponent(u.pathname.split('/').pop()||'image'));}catch{return'image';}}
function privateIpv4(ip){const p=ip.split('.').map(Number);if(p.length!==4||p.some(x=>!Number.isInteger(x)||x<0||x>255))return true;const[a,b]=p;return a===0||a===10||a===127||(a===100&&b>=64&&b<=127)||(a===169&&b===254)||(a===172&&b>=16&&b<=31)||(a===192&&b===168)||(a===192&&b===0)||(a===198&&(b===18||b===19))||a>=224;}
function privateIpv6(ip){const x=str(ip).toLowerCase().split('%')[0];if(!x)return true;if(x==='::'||x==='::1')return true;if(x.startsWith('fc')||x.startsWith('fd')||/^fe[89ab]/.test(x))return true;if(x.startsWith('ff'))return true;const mapped=x.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/);return mapped?privateIpv4(mapped[1]):false;}
export function isPrivateRemoteAddress01396(address){const type=net.isIP(str(address));if(type===4)return privateIpv4(str(address));if(type===6)return privateIpv6(str(address));return true;}
export async function assertSafeRemoteImageUrl01396(value,{lookup=dns.lookup}={}){
  let url;try{url=new URL(str(value));}catch{throw Object.assign(new Error('Remote image URL is invalid.'),{statusCode:400,code:'ST_REMOTE_IMAGE_URL_INVALID'});}
  if(!['http:','https:'].includes(url.protocol))throw Object.assign(new Error('Remote image URL must use http or https.'),{statusCode:400,code:'ST_REMOTE_IMAGE_URL_PROTOCOL'});
  const host=str(url.hostname).toLowerCase();if(!host||host==='localhost'||host.endsWith('.localhost')||host.endsWith('.local')||host.endsWith('.internal'))throw Object.assign(new Error('Remote image host is not allowed.'),{statusCode:400,code:'ST_REMOTE_IMAGE_HOST_BLOCKED'});
  if(net.isIP(host)){if(isPrivateRemoteAddress01396(host))throw Object.assign(new Error('Private-network image addresses are not allowed.'),{statusCode:400,code:'ST_REMOTE_IMAGE_PRIVATE_ADDRESS'});}
  else{let rows;try{rows=await lookup(host,{all:true,verbatim:true});}catch{throw Object.assign(new Error('Remote image host cannot be resolved.'),{statusCode:400,code:'ST_REMOTE_IMAGE_DNS_FAILED'});}if(!rows?.length||rows.some(row=>isPrivateRemoteAddress01396(row.address)))throw Object.assign(new Error('Remote image resolved to a private or unsafe address.'),{statusCode:400,code:'ST_REMOTE_IMAGE_PRIVATE_ADDRESS'});}
  url.username='';url.password='';return url;
}
async function readLimitedBody01396(response,maxBytes){const declared=Number(response.headers.get('content-length')||0);if(declared>maxBytes)throw Object.assign(new Error(`Remote image is too large (${declared} bytes).`),{statusCode:413,code:'ST_REMOTE_IMAGE_TOO_LARGE'});if(!response.body){const bytes=Buffer.from(await response.arrayBuffer());if(bytes.length>maxBytes)throw Object.assign(new Error('Remote image exceeds the configured size limit.'),{statusCode:413,code:'ST_REMOTE_IMAGE_TOO_LARGE'});return bytes;}const chunks=[];let total=0;for await(const chunk of response.body){const buf=Buffer.from(chunk);total+=buf.length;if(total>maxBytes)throw Object.assign(new Error('Remote image exceeds the configured size limit.'),{statusCode:413,code:'ST_REMOTE_IMAGE_TOO_LARGE'});chunks.push(buf);}return Buffer.concat(chunks,total);}
export async function fetchRemoteImage01396(value,{fetchImpl=globalThis.fetch,lookup=dns.lookup,maxBytes=Math.min(Number(config.mediaMaxUploadBytes)||64*1024*1024,32*1024*1024),timeoutMs=DEFAULT_TIMEOUT_MS}={}){
  if(typeof fetchImpl!=='function')throw Object.assign(new Error('Fetch API unavailable.'),{statusCode:503,code:'ST_REMOTE_IMAGE_FETCH_UNAVAILABLE'});
  let url=await assertSafeRemoteImageUrl01396(value,{lookup});
  for(let redirect=0;redirect<=MAX_REDIRECTS;redirect++){
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),Math.max(3000,Number(timeoutMs)||DEFAULT_TIMEOUT_MS));let response;
    try{response=await fetchImpl(url,{method:'GET',redirect:'manual',headers:{accept:'image/avif,image/webp,image/png,image/jpeg,image/gif,image/bmp;q=0.9,*/*;q=0.1','user-agent':'ShiftTime-Marketplace-Media-Ingest/01396'},signal:controller.signal});}
    catch(error){if(controller.signal.aborted)throw Object.assign(new Error('Remote image request timed out.'),{statusCode:504,code:'ST_REMOTE_IMAGE_TIMEOUT'});throw Object.assign(new Error(`Remote image request failed: ${error?.message||error}`),{statusCode:502,code:'ST_REMOTE_IMAGE_FETCH_FAILED'});}finally{clearTimeout(timer);}
    if(response.status>=300&&response.status<400){const location=response.headers.get('location');if(!location)throw Object.assign(new Error('Remote image redirect has no Location header.'),{statusCode:502,code:'ST_REMOTE_IMAGE_REDIRECT_INVALID'});if(redirect===MAX_REDIRECTS)throw Object.assign(new Error('Too many remote image redirects.'),{statusCode:502,code:'ST_REMOTE_IMAGE_REDIRECT_LIMIT'});url=await assertSafeRemoteImageUrl01396(new URL(location,url).href,{lookup});continue;}
    if(!response.ok)throw Object.assign(new Error(`Remote image returned HTTP ${response.status}.`),{statusCode:502,code:'ST_REMOTE_IMAGE_HTTP_ERROR'});
    const mimeType=str(response.headers.get('content-type')).split(';')[0].toLowerCase();if(!ALLOWED_MIME.test(mimeType))throw Object.assign(new Error(`Remote resource is not a supported raster image (${mimeType||'unknown MIME'}).`),{statusCode:415,code:'ST_REMOTE_IMAGE_MIME_UNSUPPORTED'});
    const bytes=await readLimitedBody01396(response,maxBytes);if(!bytes.length)throw Object.assign(new Error('Remote image body is empty.'),{statusCode:502,code:'ST_REMOTE_IMAGE_EMPTY'});
    return Object.freeze({stage:STAGE,bytes,mimeType,sizeBytes:bytes.length,fileName:fileNameFromUrl(url.href),sourceUrl:str(value),finalUrl:url.href});
  }
  throw Object.assign(new Error('Remote image fetch failed.'),{statusCode:502,code:'ST_REMOTE_IMAGE_FETCH_FAILED'});
}
