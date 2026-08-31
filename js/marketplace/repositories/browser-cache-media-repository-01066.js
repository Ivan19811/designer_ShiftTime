// 01066 · Browser development upload adapter.
// Physical File/Blob bytes live only in CacheStorage and are served by a Service Worker.
// MarketplaceStore still stores only Media metadata + logical URL. Swap this adapter for R2/S3 later.
import { MEDIA_ASSET_REPOSITORY_CONTRACT_VERSION_01059 } from './media-asset-repository-contract-01059.js?v=01059';

const CACHE_NAME='st-media-assets-v1-01066';
const MEDIA_SEGMENT='__st_media/01066';
function str(v){return String(v??'').trim();}
function cleanUrl(v){const url=str(v);if(!url)throw new Error('Вкажи URL або шлях до asset.');if(/^data:|^blob:/i.test(url))throw new Error('data:/blob: не є постійним медіа-посиланням.');return url;}
function safeName(name='file'){return str(name).replace(/[\\/:*?"<>|\u0000-\u001f]+/g,'-').replace(/\s+/g,' ').trim().slice(0,180)||'file';}
function guessFileName(url){try{return decodeURIComponent(url.split(/[?#]/)[0].split('/').pop()||'');}catch{return url.split(/[?#]/)[0].split('/').pop()||'';}}
function guessMime(fileName,kind){const ext=str(fileName).toLowerCase().split('.').pop();const map={jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',webp:'image/webp',gif:'image/gif',svg:'image/svg+xml',avif:'image/avif',bmp:'image/bmp',mp4:'video/mp4',webm:'video/webm',mov:'video/quicktime',pdf:'application/pdf'};return map[ext]||(kind==='image'?'image/*':kind==='video'?'video/*':'application/octet-stream');}
function uid(){try{return crypto.randomUUID();}catch{return `media_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,10)}`;}}
function projectRootUrl(){return new URL('../../../',import.meta.url);}
function absFor(url){return new URL(url,projectRootUrl()).href;}

export class BrowserCacheMediaRepository01066{
  constructor(){this.type='browser-cache';this.name='BrowserCacheMediaRepository01066';this.contractVersion=MEDIA_ASSET_REPOSITORY_CONTRACT_VERSION_01059;this._ready=null;}
  getInfo(){return {type:this.type,name:this.name,contractVersion:this.contractVersion,mode:'browser-cache-development',upload:true,persistent:true,description:'Computer files → CacheStorage; Service Worker serves stable local media URLs. R2/S3 later.'};}
  canUpload(){return typeof window!=='undefined'&&'caches' in window&&typeof navigator!=='undefined'&&'serviceWorker' in navigator&&/^https?:$/.test(location.protocol);}
  async ready(){
    if(this._ready)return this._ready;
    this._ready=(async()=>{
      if(!this.canUpload())throw new Error('Завантаження файлів потребує Chrome/Edge через http://localhost або https://.');
      const swUrl=new URL('../../../st-media-sw-01066.js',import.meta.url);
      const scopeUrl=projectRootUrl();
      const reg=await navigator.serviceWorker.register(swUrl.href,{scope:scopeUrl.pathname,updateViaCache:'none'});
      await navigator.serviceWorker.ready;
      if(!navigator.serviceWorker.controller){
        await new Promise(resolve=>{let done=false;const finish=()=>{if(done)return;done=true;resolve();};navigator.serviceWorker.addEventListener('controllerchange',finish,{once:true});setTimeout(finish,5000);});
      }
      if(!navigator.serviceWorker.controller)throw new Error('Media Service Worker ще не керує сторінкою. Онови сторінку один раз і повтори upload.');
      return reg;
    })();
    return this._ready;
  }
  async prepareReference(input={}){
    const kind=['image','video','document'].includes(str(input.kind))?str(input.kind):'image';
    const url=cleanUrl(input.url),fileName=str(input.fileName)||guessFileName(url),mime=str(input.mime)||guessMime(fileName,kind);
    return {url,fileName,mime,metadata:{...(input.metadata||{}),assetAdapter:this.name,assetMode:url.includes(`/${MEDIA_SEGMENT}/`)||url.includes(`${MEDIA_SEGMENT}/`)?'browser-cache':'reference'}};
  }
  async upload(file,input={}){
    if(!(file instanceof File))throw new TypeError('upload() очікує File з комп’ютера.');
    await this.ready();
    const id=uid(),fileName=safeName(input.fileName||file.name||'file'),kind=str(input.kind)||((file.type||'').startsWith('video/')?'video':(file.type||'').startsWith('image/')?'image':'document');
    const rootPath=projectRootUrl().pathname.replace(/\/$/,'');
    const path=`${rootPath}/${MEDIA_SEGMENT}/${encodeURIComponent(id)}/${encodeURIComponent(fileName)}`.replace(/\/+/g,'/');
    const absolute=absFor(path);
    const headers=new Headers({'Content-Type':file.type||guessMime(fileName,kind),'Cache-Control':'public, max-age=31536000, immutable','X-ShiftTime-Media':'01066'});
    const cache=await caches.open(CACHE_NAME);
    await cache.put(new Request(absolute,{method:'GET'}),new Response(file,{status:200,headers}));
    return {url:path,fileName,mime:file.type||guessMime(fileName,kind),metadata:{...(input.metadata||{}),assetAdapter:this.name,assetMode:'browser-cache',assetKey:absolute,assetId:id,size:Number(file.size)||0,lastModified:Number(file.lastModified)||0,originalFileName:file.name||fileName}};
  }
  async deleteAsset(media={}){
    const url=str(media?.metadata?.assetKey)||str(media?.url);if(!url)return {deleted:false,reason:'no-asset-key'};
    if(!String(url).includes(MEDIA_SEGMENT))return {deleted:false,reason:'external-reference'};
    try{const cache=await caches.open(CACHE_NAME);const deleted=await cache.delete(new Request(absFor(url)),{ignoreSearch:true});return {deleted,reason:deleted?'deleted':'not-found'};}catch(err){return {deleted:false,reason:err?.message||'cache-delete-failed'};}
  }
}
export function createBrowserCacheMediaRepository01066(){return new BrowserCacheMediaRepository01066();}
