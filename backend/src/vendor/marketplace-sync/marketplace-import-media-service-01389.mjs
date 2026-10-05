// 01406 · Backend-safe canonical media resolver for Supplier Sync.
// Mirrors 01389 reference semantics without importing browser MediaAssetRepository/runtime.
import { createMarketplaceMedia01052 } from './marketplace-schema-01052.mjs';

const str=v=>String(v??'').trim();
const arr=v=>Array.isArray(v)?v:[];
const slug=v=>str(v).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/['’`]/g,'').replace(/[^a-z0-9\u0400-\u04ff]+/gi,'-').replace(/^-+|-+$/g,'').slice(0,80)||'category';
export const MARKETPLACE_IMPORT_MEDIA_STAGE_01389='01389';

export function normalizeMarketplaceMediaReference01389(value){
  return str(value).replace(/\\/g,'/').replace(/([^:]\/)\/{2,}/g,'$1');
}
export function validateMarketplaceMediaReference01389(value){
  const raw=str(value);if(!raw)return {ok:false,code:'empty'};
  if(/^(?:data|blob|javascript):/i.test(raw))return {ok:false,code:'ephemeral'};
  if(/^https?:/i.test(raw)){try{const u=new URL(raw);if(!u.hostname)return {ok:false,code:'invalid'};}catch{return {ok:false,code:'invalid'};}}
  return {ok:true,value:raw};
}
function categoryMap(snapshot){return new Map(arr(snapshot?.categories).map(c=>[str(c.id),c]));}
function categoryChain(snapshot,categoryId){const map=categoryMap(snapshot),out=[];let cur=map.get(str(categoryId)),guard=0;while(cur&&guard++<40){out.unshift(cur);cur=cur.parentId?map.get(str(cur.parentId)):null;}return out;}
function categoryDepth(snapshot,categoryId){return categoryChain(snapshot,categoryId).length;}
function deepestCategory(snapshot,categoryIds){return arr(categoryIds).map(str).filter(Boolean).sort((a,b)=>categoryDepth(snapshot,b)-categoryDepth(snapshot,a))[0]||'';}
function importMediaContext(snapshot,product={}){const categoryId=deepestCategory(snapshot,product?.categoryIds),chain=categoryChain(snapshot,categoryId),productId=str(product?.id),productName=str(product?.name)||str(product?.sku);return {categoryId01344:categoryId,categoryPathIds01344:chain.map(c=>str(c.id)),categoryPathNames01344:chain.map(c=>str(c.name||c.slug||c.id)),categoryPathSlugs01344:chain.map(c=>slug(c.slug||c.name||c.id)),folder01344:chain.length?`products/${chain.map(c=>slug(c.slug||c.name||c.id)).join('/')}`:'uploads',productId01344:productId,productKey01344:productId||`${categoryId}:${productName.toLowerCase()}`,productName01344:productName};}
function mediaMap(snapshot){const map=new Map();for(const media of arr(snapshot?.media)){const key=normalizeMarketplaceMediaReference01389(media?.url);if(key&&!map.has(key))map.set(key,media);}return map;}
function fileNameFromReference(value){const raw=str(value);try{return decodeURIComponent(raw.split(/[?#]/)[0].split('/').pop()||'');}catch{return raw.split(/[?#]/)[0].split('/').pop()||'';}}
export async function resolveCanonicalImportMedia01389(_store,snapshot,references,{product={},alt='',role='product',sourceName='',stats=null,copyExternal=false}={}){
  // Scheduled Supplier Sync intentionally forces copyExternal=false (01399 safety contract).
  if(copyExternal){const e=new Error('SUPPLIER_SYNC_MEDIA_COPY_DISABLED_01406');e.code='SUPPLIER_SYNC_MEDIA_COPY_DISABLED_01406';throw e;}
  snapshot.media=arr(snapshot.media);const context=importMediaContext(snapshot,product),folder=context.folder01344||'uploads',byUrl=mediaMap(snapshot),ids=[],seen=new Set();
  for(const raw of arr(references)){const check=validateMarketplaceMediaReference01389(raw);if(!check.ok)continue;const key=normalizeMarketplaceMediaReference01389(check.value);if(!key||seen.has(key))continue;seen.add(key);let media=byUrl.get(key);if(media){if(!ids.includes(media.id))ids.push(media.id);if(stats)stats.reused=(stats.reused||0)+1;continue;}media=createMarketplaceMedia01052({kind:'image',url:check.value,alt:str(alt),fileName:fileNameFromReference(check.value),metadata:{...context,folder,source:'marketplace-import-01389',importStage01389:MARKETPLACE_IMPORT_MEDIA_STAGE_01389,importRole01389:str(role),importSourceName01389:str(sourceName)}});snapshot.media.push(media);byUrl.set(key,media);if(stats)stats.created=(stats.created||0)+1;if(!ids.includes(media.id))ids.push(media.id);}
  return ids;
}
export function summarizeImportMediaReferences01389(canonicalRows,state){const existing=mediaMap(state),seen=new Set();let sourceRefs=0,reusedRefs=0,newRefs=0,invalidRefs=0;for(const row of arr(canonicalRows))for(const raw of [...arr(row?.images),...arr(row?.variant?.images)]){sourceRefs++;const check=validateMarketplaceMediaReference01389(raw);if(!check.ok){invalidRefs++;continue;}const key=normalizeMarketplaceMediaReference01389(check.value);if(!key||seen.has(key))continue;seen.add(key);if(existing.has(key))reusedRefs++;else newRefs++;}return {sourceRefs,uniqueRefs:seen.size,reusedRefs,newRefs,invalidRefs};}
