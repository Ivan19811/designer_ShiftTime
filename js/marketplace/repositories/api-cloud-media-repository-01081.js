// 01081 · Browser -> authenticated ShiftTime API -> presigned R2/S3 PUT.
// S3 credentials never enter browser code.
import {MEDIA_ASSET_REPOSITORY_CONTRACT_VERSION_01059} from './media-asset-repository-contract-01059.js?v=01059';
import {getMarketplaceBackendConfig01071} from '../data/marketplace-backend-config-01071.js?v=01071';
import {getMarketplaceApiAuth01089} from '../data/marketplace-api-auth-01089.js?v=01089';
import {bindMarketplaceFetch01082} from './fetch-binding-01082.js?v=01082';
function str(v){return String(v??'').trim();}
function cleanUrl(v){const url=str(v);if(!url)throw new Error('Вкажи URL або шлях до asset.');if(/^data:|^blob:/i.test(url))throw new Error('data:/blob: не є постійним медіа-посиланням.');return url;}
function guessFileName(url){try{return decodeURIComponent(url.split(/[?#]/)[0].split('/').pop()||'');}catch{return url.split(/[?#]/)[0].split('/').pop()||'';}}
function guessMime(fileName,kind){const ext=str(fileName).toLowerCase().split('.').pop();const map={jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',webp:'image/webp',gif:'image/gif',svg:'image/svg+xml',avif:'image/avif',bmp:'image/bmp',mp4:'video/mp4',webm:'video/webm',mov:'video/quicktime',pdf:'application/pdf'};return map[ext]||(kind==='image'?'image/*':kind==='video'?'video/*':'application/octet-stream');}
async function sha256(file){if(!crypto?.subtle)return'';const buf=await file.arrayBuffer();const out=await crypto.subtle.digest('SHA-256',buf);return [...new Uint8Array(out)].map(b=>b.toString(16).padStart(2,'0')).join('');}
function absDelivery(url,apiBase){const raw=str(url);if(!raw)return'';if(/^https?:/i.test(raw))return raw;try{return new URL(raw,new URL(apiBase).origin).href;}catch{return raw;}}
export class ApiCloudMediaRepository01081{
  constructor({fetchImpl=globalThis.fetch}={}){this.type='api-cloud-media';this.name='ApiCloudMediaRepository01081';this.contractVersion=MEDIA_ASSET_REPOSITORY_CONTRACT_VERSION_01059;this.fetchImpl=bindMarketplaceFetch01082(fetchImpl);this._status=null;}
  getInfo(){const s=this._status||{};return {type:this.type,name:this.name,contractVersion:this.contractVersion,mode:'api-r2-s3',upload:!!s.configured,persistent:true,configured:!!s.configured,provider:s.type||'',bucket:s.bucket||'',publicDelivery:!!s.publicDelivery,description:'Computer files → presigned R2/S3 PUT; PostgreSQL stores metadata only.'};}
  canUpload(){return !!this._status?.configured&&!!getMarketplaceApiAuth01089().token;}
  async _fetch(url,options={},timeoutMs=12000,label='Media request'){
    if(typeof this.fetchImpl!=='function')throw new Error(`${label}: Fetch API is unavailable.`);
    const ms=Math.max(1000,Number(timeoutMs)||12000),Controller=globalThis.AbortController;
    if(typeof Controller!=='function')return this.fetchImpl(url,options);
    const controller=new Controller(),externalSignal=options.signal;
    let relayAbort=null;
    if(externalSignal){if(externalSignal.aborted)controller.abort(externalSignal.reason);else{relayAbort=()=>controller.abort(externalSignal.reason);externalSignal.addEventListener('abort',relayAbort,{once:true});}}
    const timer=setTimeout(()=>controller.abort(),ms);
    try{return await this.fetchImpl(url,{...options,signal:controller.signal});}
    catch(err){if(externalSignal?.aborted)throw err;if(controller.signal.aborted)throw new Error(`${label} timeout after ${ms} ms.`);if(err instanceof TypeError)throw new Error(`${label} network/CORS error: ${err.message||'request failed'}`);throw err;}
    finally{clearTimeout(timer);if(relayAbort)externalSignal.removeEventListener('abort',relayAbort);}
  }
  async _request(path,options={}){const cfg=getMarketplaceBackendConfig01071(),requestAuth=getMarketplaceApiAuth01089(),token=str(requestAuth.token);const headers={...(options.headers||{}),'x-st-request-id':`media_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`};if(requestAuth.storeId)headers['x-st-store-id']=requestAuth.storeId;if(requestAuth.workspaceId)headers['x-st-workspace-id']=requestAuth.workspaceId;if(token)headers.authorization=`Bearer ${token}`;const res=await this._fetch(`${cfg.apiBaseUrl}${path}`,{...options,headers},cfg.requestTimeoutMs,'Media API');const text=await res.text();let data=null;if(text){try{data=JSON.parse(text);}catch{data={error:text};}}if(!res.ok)throw new Error(data?.error||`Media API ${res.status}`);return data;}
  async ready(){this._status=await this._request('/media/storage/status');return this._status;}
  async listAssets(){return this._request('/media/assets');}
  async prepareReference(input={}){const kind=['image','video','document'].includes(str(input.kind))?str(input.kind):'image',url=cleanUrl(input.url),fileName=str(input.fileName)||guessFileName(url),mime=str(input.mime)||guessMime(fileName,kind);return {url,fileName,mime,metadata:{...(input.metadata||{}),assetAdapter:this.name,assetMode:'reference'}};}
  async upload(file,input={}){if(!(file instanceof File))throw new TypeError('upload() очікує File з комп’ютера.');if(!this._status)await this.ready();if(!this.canUpload())throw new Error('Cloud Media Storage не налаштований або Marketplace працює не в API mode.');const cfg=getMarketplaceBackendConfig01071(),hash=str(input?.metadata?.assetHash)||await sha256(file),folder=str(input?.metadata?.folder||input.folder),kind=str(input.kind)||((file.type||'').startsWith('video/')?'video':(file.type||'').startsWith('image/')?'image':'document');const prepared=await this._request('/media/uploads',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({fileName:file.name||'file',mimeType:file.type||guessMime(file.name,kind),sizeBytes:Number(file.size)||0,sha256:hash,kind,folder,productId:str(input.productId)})});let asset=prepared.asset,reused=!!prepared.reused;if(!prepared.reused){const uploadTimeoutMs=Math.min(10*60*1000,Math.max(60*1000,Number(cfg.requestTimeoutMs||12000)*10)),put=await this._fetch(prepared.upload.url,{method:'PUT',headers:prepared.upload.headers||{'Content-Type':file.type||'application/octet-stream'},body:file},uploadTimeoutMs,'Cloud object PUT');if(!put.ok)throw new Error(`Cloud object PUT failed: HTTP ${put.status}`);const completed=await this._request(`/media/uploads/${encodeURIComponent(asset.id)}/complete`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({width:Number(input.width)||0,height:Number(input.height)||0,lastModified:Number(file.lastModified)||0,originalFileName:file.name||''})});asset=completed.asset;reused=!!completed.reused;}
    return {url:absDelivery(asset.url,cfg.apiBaseUrl),fileName:asset.fileName||file.name,mime:asset.mimeType||file.type||guessMime(file.name,kind),metadata:{...(input.metadata||{}),assetAdapter:this.name,assetMode:'cloud-object-01081',assetId:asset.id,objectKey:asset.objectKey,provider:asset.provider,bucket:asset.bucket,assetHash:asset.sha256||hash,size:Number(asset.sizeBytes)||Number(file.size)||0,etag:asset.etag||'',publicUrl:asset.publicUrl||'',verified:true,reused}};
  }
  async deleteAsset(media={}){const assetId=str(media?.metadata?.assetId);if(!assetId||str(media?.metadata?.assetMode)!=='cloud-object-01081')return {deleted:false,reason:'not-cloud-asset'};try{return await this._request(`/media/assets/${encodeURIComponent(assetId)}`,{method:'DELETE'});}catch(err){return {deleted:false,reason:err?.message||'cloud-delete-failed'};}}
}
export function createApiCloudMediaRepository01081(options){return new ApiCloudMediaRepository01081(options);}
