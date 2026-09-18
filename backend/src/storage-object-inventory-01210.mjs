// 01210 · Universal read-only R2 object inventory and PostgreSQL reference reconciliation.
import {config} from './config.mjs';
import {loadAuthorizedStorageReferenceState01210,mergeReferenceRows01210,referenceSiteIds01210} from './storage-reference-resolvers-01210.mjs';

const str=value=>String(value??'').trim();
const arr=value=>Array.isArray(value)?value:[];
const num=value=>Math.max(0,Number(value)||0);
const unique=values=>[...new Set(values.map(str).filter(Boolean))];
const safeSegment=value=>str(value).replace(/[^a-zA-Z0-9._-]+/g,'-').replace(/^-+|-+$/g,'').slice(0,100)||'x';
const CACHE_TTL_MS_01210=60_000;
const cache01210=new Map();

const EXTENSIONS_01210=Object.freeze({
  image:new Set(['jpg','jpeg','png','webp','gif','svg','avif','bmp','tif','tiff','ico']),
  video:new Set(['mp4','webm','mov','m4v','avi','mkv','mpeg','mpg']),
  audio:new Set(['mp3','wav','ogg','m4a','aac','flac','opus']),
  pdf:new Set(['pdf']),
  document:new Set(['doc','docx','odt','rtf','txt','md']),
  spreadsheet:new Set(['xls','xlsx','ods','csv','tsv']),
  archive:new Set(['zip','rar','7z','tar','gz','tgz','bz2']),
  'json/data':new Set(['json','jsonl','xml','yaml','yml','geojson']),
  '3d':new Set(['glb','gltf','obj','fbx','stl','dae','3ds','usdz']),
  font:new Set(['woff','woff2','ttf','otf','eot']),
});

async function provider01210(){
  const type=config.mediaStorageProvider;if(!['r2','s3','s3-compatible'].includes(type))return null;
  const [{assertStorageProvider01081},{createS3CompatibleStorageProvider01081}]=await Promise.all([import('./storage-provider-contract.mjs'),import('./storage-providers/s3-compatible-storage-provider.mjs')]);
  return assertStorageProvider01081(createS3CompatibleStorageProvider01081({providerType:type,endpoint:config.mediaS3Endpoint,region:config.mediaS3Region,bucket:config.mediaS3Bucket,accessKeyId:config.mediaS3AccessKeyId,secretAccessKey:config.mediaS3SecretAccessKey,publicBaseUrl:config.mediaPublicBaseUrl,uploadExpiresIn:config.mediaUploadUrlTtlSeconds,downloadExpiresIn:config.mediaDownloadUrlTtlSeconds,forcePathStyle:config.mediaS3ForcePathStyle}));
}

export function extensionFromObjectKey01210(objectKey=''){const file=str(objectKey).split('/').pop()||'';const at=file.lastIndexOf('.');return at>0&&at<file.length-1?file.slice(at+1).toLowerCase():'';}
export function fileNameFromObjectKey01210(objectKey=''){const file=str(objectKey).split('/').pop()||'';try{return decodeURIComponent(file);}catch{return file;}}

export function parseStorageObjectPath01210(objectKey=''){
  const parts=str(objectKey).split('/').filter(Boolean),out={accountId:'',workspaceId:'',storeId:'',module:'unknown',pathParts:parts};
  const ai=parts.indexOf('accounts'),wi=parts.indexOf('workspaces'),si=parts.indexOf('stores');
  if(ai>=0)out.accountId=str(parts[ai+1]);if(wi>=0)out.workspaceId=str(parts[wi+1]);if(si>=0){out.storeId=str(parts[si+1]);const hint=str(parts[si+2]).toLowerCase();out.module=moduleFromHint01210(hint);}
  return out;
}

export function moduleFromHint01210(hint=''){
  const v=str(hint).toLowerCase();if(!v)return 'unknown';
  if(v==='media'||v.includes('gallery'))return 'media';if(v.includes('marketplace')||v.includes('commerce')||v.includes('product')||v.includes('catalog'))return 'marketplace';if(v.includes('table'))return 'tables';if(v.includes('presentation')||v.includes('slide'))return 'presentation';if(v.includes('smart')||v.includes('graph'))return 'smartblocks';if(v.includes('site')||v.includes('page'))return 'sites';if(v.includes('doc'))return 'documents';return 'unknown';
}

export function classifyResourceType01210({mimeType='',kind='',objectKey='',fileName=''}={}){
  const mime=str(mimeType).toLowerCase(),assetKind=str(kind).toLowerCase();
  if(mime==='application/pdf')return 'pdf';
  if(mime.startsWith('image/'))return 'image';if(mime.startsWith('video/'))return 'video';if(mime.startsWith('audio/'))return 'audio';if(mime.startsWith('font/')||/font|woff|truetype|opentype/.test(mime))return 'font';
  if(/spreadsheet|excel|csv|tab-separated/.test(mime))return 'spreadsheet';if(/zip|rar|7z|tar|gzip|compressed/.test(mime))return 'archive';if(/json|xml|yaml/.test(mime))return 'json/data';if(/word|opendocument.text|rtf|text\//.test(mime))return 'document';
  if(assetKind==='image'||assetKind==='video')return assetKind;if(assetKind==='document'&&mime)return mime==='application/pdf'?'pdf':'document';
  const ext=extensionFromObjectKey01210(fileName||objectKey);for(const [type,set] of Object.entries(EXTENSIONS_01210))if(set.has(ext))return type;
  if(ext)return 'other';return 'unknown';
}

function normalizeObject01210(item={}){return {provider:str(item.provider),bucket:str(item.bucket),objectKey:str(item.objectKey??item.Key),sizeBytes:num(item.sizeBytes??item.Size),lastModified:item.lastModified instanceof Date?item.lastModified.toISOString():str(item.lastModified??item.LastModified),etag:str(item.etag??item.ETag).replace(/^"|"$/g,''),storageClass:str(item.storageClass??item.StorageClass),mimeType:str(item.mimeType??item.ContentType)};}
function refKey01210(ref={}){return [str(ref.module),str(ref.siteId),str(ref.resourceId),str(ref.assetId),str(ref.objectKey),str(ref.sourcePath)].join('|');}
function refsForObject01210(objectKey,assetId,refsByObject,refsByAsset){const rows=[...(refsByObject.get(objectKey)||[]),...(assetId?refsByAsset.get(assetId)||[]:[])],seen=new Set();return rows.filter(ref=>{const key=refKey01210(ref);if(seen.has(key))return false;seen.add(key);return true;});}
function siteLabels01210(siteIds,siteById){return unique(siteIds.map(id=>siteById.get(id)?.name||id));}
function summaryBucket01210(){return {count:0,bytes:0};}

export function buildInventorySnapshot01210({scope={},objects=[],referenceState={},providerInfo={},measuredAt=new Date().toISOString()}={}){
  const accountId=str(scope.accountId),mediaAssets=arr(referenceState.mediaAssets),derivativeAssets=arr(referenceState.derivativeAssets),references=mergeReferenceRows01210(referenceState.references||[]),siteById=referenceState.siteById instanceof Map?referenceState.siteById:new Map(arr(referenceState.sites).map(site=>[str(site.id),site]));
  const assetByObject=new Map(),assetById=new Map(),derivativeByObject=new Map();
  for(const asset of mediaAssets){if(asset.objectKey)assetByObject.set(asset.objectKey,asset);if(asset.id)assetById.set(asset.id,asset);}
  for(const derivative of derivativeAssets)if(derivative.objectKey)derivativeByObject.set(derivative.objectKey,derivative);
  const refsByObject=new Map(),refsByAsset=new Map();for(const ref of references){if(ref.objectKey){if(!refsByObject.has(ref.objectKey))refsByObject.set(ref.objectKey,[]);refsByObject.get(ref.objectKey).push(ref);}if(ref.assetId){if(!refsByAsset.has(ref.assetId))refsByAsset.set(ref.assetId,[]);refsByAsset.get(ref.assetId).push(ref);}}
  const physicalKeys=new Set(),items=[];
  for(const raw of arr(objects)){
    const object=normalizeObject01210(raw);if(!object.objectKey)continue;
    const parsed=parseStorageObjectPath01210(object.objectKey);if(accountId&&parsed.accountId&&parsed.accountId!==safeSegment(accountId))continue;physicalKeys.add(object.objectKey);
    const directAsset=assetByObject.get(object.objectKey)||null,derivative=derivativeByObject.get(object.objectKey)||null,parentAsset=derivative?assetById.get(str(derivative.mediaAssetId))||null:null,asset=directAsset||parentAsset||null,referenceAssetId=str(directAsset?.id||derivative?.mediaAssetId),refs=refsForObject01210(object.objectKey,referenceAssetId,refsByObject,refsByAsset),referencedSiteIds=referenceSiteIds01210(refs).filter(id=>siteById.has(id));
    const originCandidate=str(asset?.metadata?.trafficSiteId),originSiteId=originCandidate&&siteById.has(originCandidate)?originCandidate:'';
    const refModules=unique(refs.map(ref=>ref.module).filter(v=>v&&v!=='unknown')),modules=unique([...refModules,parsed.module,(directAsset||derivative)?'media':''].filter(v=>v&&v!=='unknown'));
    const module=modules[0]||parsed.module||'unknown',fileName=directAsset?.fileName||derivative?.fileName||fileNameFromObjectKey01210(object.objectKey),mimeType=str(directAsset?.mimeType||derivative?.mimeType||object.mimeType||parentAsset?.mimeType),resourceType=classifyResourceType01210({mimeType,kind:directAsset?.kind||derivative?.kind||parentAsset?.kind,objectKey:object.objectKey,fileName}),extension=extensionFromObjectKey01210(fileName||object.objectKey);
    const validDirect=directAsset&&directAsset.status!=='deleted'&&directAsset.status!=='failed',validDerivative=derivative&&derivative.status!=='failed',knownMetadata=Boolean(validDirect||validDerivative),statusFlags=[];
    if(refs.length)statusFlags.push('linked');else if(knownMetadata)statusFlags.push('unused');else statusFlags.push('orphan');
    if(resourceType==='unknown'||module==='unknown')statusFlags.push('unknown');
    items.push({physical:true,provider:object.provider||str(directAsset?.provider||derivative?.provider)||str(providerInfo.provider),bucket:object.bucket||str(directAsset?.bucket||derivative?.bucket)||str(providerInfo.bucket),objectKey:object.objectKey,fileName,extension,sizeBytes:object.sizeBytes,lastModified:object.lastModified,etag:object.etag,storageClass:object.storageClass,mimeType,resourceType,module,modules,accountId,workspaceId:str(directAsset?.workspaceId||derivative?.workspaceId||parentAsset?.workspaceId)||parsed.workspaceId,storeId:str(directAsset?.storeId||derivative?.storeId||parentAsset?.storeId)||parsed.storeId,originSiteId,referencedSiteIds,siteLabels:siteLabels01210(referencedSiteIds,siteById),assetId:referenceAssetId,derivativeId:str(derivative?.id),referenceIds:unique(refs.map(ref=>ref.resourceId)),statusFlags:unique(statusFlags),metadataSource:unique(['r2',directAsset?'media_cloud_assets':'',derivative?'media_asset_derivatives':'',parentAsset?'media_cloud_assets':'',...refs.map(ref=>ref.module)].filter(Boolean))});
  }
  const brokenKeys=new Set();
  const pushBroken=(meta={},ref=null,{derivative=false}={})=>{
    const parent=derivative?assetById.get(str(meta?.mediaAssetId))||null:null,asset=derivative?parent:meta,objectKey=str(meta?.objectKey||ref?.objectKey||asset?.objectKey),assetId=str(derivative?meta?.mediaAssetId:meta?.id||ref?.assetId),derivativeId=derivative?str(meta?.id):'',dedupe=`${objectKey}|${assetId}|${derivativeId}`;if(brokenKeys.has(dedupe))return;brokenKeys.add(dedupe);
    const refs=refsForObject01210(objectKey,assetId,refsByObject,refsByAsset);if(ref&&!refs.includes(ref))refs.push(ref);const referencedSiteIds=referenceSiteIds01210(refs).filter(id=>siteById.has(id)),originCandidate=str(asset?.metadata?.trafficSiteId),originSiteId=originCandidate&&siteById.has(originCandidate)?originCandidate:'',parsed=parseStorageObjectPath01210(objectKey),modules=unique([...refs.map(x=>x.module),parsed.module,(asset||derivative)?'media':''].filter(v=>v&&v!=='unknown')),module=modules[0]||parsed.module||'unknown',fileName=meta?.fileName||asset?.fileName||fileNameFromObjectKey01210(objectKey)||assetId,mimeType=str(meta?.mimeType||asset?.mimeType),resourceType=classifyResourceType01210({mimeType,kind:meta?.kind||asset?.kind,objectKey,fileName}),statusFlags=['broken-reference'];if(resourceType==='unknown'||module==='unknown')statusFlags.push('unknown');
    items.push({physical:false,provider:str(meta?.provider||asset?.provider)||str(providerInfo.provider),bucket:str(meta?.bucket||asset?.bucket)||str(providerInfo.bucket),objectKey,fileName,extension:extensionFromObjectKey01210(fileName||objectKey),sizeBytes:num(meta?.sizeBytes||asset?.sizeBytes),lastModified:str(meta?.updatedAt||asset?.updatedAt),etag:'',storageClass:'',mimeType,resourceType,module,modules,accountId,workspaceId:str(meta?.workspaceId||asset?.workspaceId)||parsed.workspaceId||str(ref?.workspaceId),storeId:str(meta?.storeId||asset?.storeId)||parsed.storeId||str(ref?.storeId),originSiteId,referencedSiteIds,siteLabels:siteLabels01210(referencedSiteIds,siteById),assetId,derivativeId,referenceIds:unique(refs.map(x=>x.resourceId)),statusFlags,metadataSource:unique([derivative?'media_asset_derivatives':'',asset?'media_cloud_assets':'',...refs.map(x=>x.module)].filter(Boolean))});
  };
  for(const asset of mediaAssets)if(asset.status==='ready'&&asset.objectKey&&!physicalKeys.has(asset.objectKey))pushBroken(asset);
  for(const derivative of derivativeAssets)if(derivative.status==='ready'&&derivative.objectKey&&!physicalKeys.has(derivative.objectKey))pushBroken(derivative,null,{derivative:true});
  for(const ref of references){
    if(ref.assetId){const asset=assetById.get(ref.assetId);if(!asset)pushBroken({},ref);else if(asset.objectKey&&!physicalKeys.has(asset.objectKey))pushBroken(asset,ref);}
    else if(ref.objectKey&&!physicalKeys.has(ref.objectKey)){const asset=assetByObject.get(ref.objectKey);const derivative=derivativeByObject.get(ref.objectKey);if(asset)pushBroken(asset,ref);else if(derivative)pushBroken(derivative,ref,{derivative:true});else pushBroken({},ref);}
  }
  const byType={},byStatus={};for(const type of [...Object.keys(EXTENSIONS_01210),'other','unknown'])byType[type]=summaryBucket01210();for(const status of ['linked','unused','orphan','unknown','broken-reference'])byStatus[status]=summaryBucket01210();
  let objectCount=0,totalBytes=0;for(const item of items){if(item.physical){objectCount++;totalBytes+=num(item.sizeBytes);const bucket=byType[item.resourceType]||(byType[item.resourceType]=summaryBucket01210());bucket.count++;bucket.bytes+=num(item.sizeBytes);}for(const status of item.statusFlags){const bucket=byStatus[status]||(byStatus[status]=summaryBucket01210());bucket.count++;if(item.physical)bucket.bytes+=num(item.sizeBytes);}}
  const physicalItems=items.filter(item=>item.physical),topLargest=[...physicalItems].sort((a,b)=>b.sizeBytes-a.sizeBytes).slice(0,10),topUnknown=physicalItems.filter(item=>item.statusFlags.includes('unknown')).sort((a,b)=>b.sizeBytes-a.sizeBytes).slice(0,10),topOrphan=physicalItems.filter(item=>item.statusFlags.includes('orphan')).sort((a,b)=>b.sizeBytes-a.sizeBytes).slice(0,10);
  return Object.freeze({stage:'01212',available:true,accountId,provider:str(providerInfo.provider),bucket:str(providerInfo.bucket),prefix:str(providerInfo.prefix),pages:num(providerInfo.pages),measuredAt:str(measuredAt),summary:Object.freeze({objectCount,totalBytes,byType,byStatus,topLargest,topUnknown,topOrphan}),items:Object.freeze(items)});
}

function sortItems01210(items,sort='size',order='desc'){
  const key=str(sort).toLowerCase(),dir=str(order).toLowerCase()==='asc'?1:-1;
  const getter=item=>key==='file'?item.fileName:key==='modified'?item.lastModified:key==='type'?item.resourceType:key==='module'?item.module:key==='status'?item.statusFlags.join(','):item.sizeBytes;
  return [...items].sort((a,b)=>{const av=getter(a),bv=getter(b);if(typeof av==='number'&&typeof bv==='number')return (av-bv)*dir;return String(av||'').localeCompare(String(bv||''),'uk',{numeric:true,sensitivity:'base'})*dir;});
}

export function filterInventorySnapshot01210(snapshot={},input={}){
  const q=str(input.q).toLowerCase(),siteId=str(input.siteId),module=str(input.module).toLowerCase(),type=str(input.type).toLowerCase(),status=str(input.status).toLowerCase(),offset=Math.max(0,Math.trunc(Number(input.offset)||0)),limit=Math.max(1,Math.min(500,Math.trunc(Number(input.limit)||100)));
  let items=arr(snapshot.items).filter(item=>{
    if(siteId&&item.originSiteId!==siteId&&!arr(item.referencedSiteIds).includes(siteId))return false;
    if(module&&!arr(item.modules).map(v=>str(v).toLowerCase()).includes(module)&&str(item.module).toLowerCase()!==module)return false;
    if(type&&str(item.resourceType).toLowerCase()!==type)return false;
    if(status&&!arr(item.statusFlags).map(v=>str(v).toLowerCase()).includes(status))return false;
    if(q){const hay=[item.fileName,item.objectKey,item.assetId,item.module,item.resourceType,...arr(item.siteLabels),...arr(item.referencedSiteIds)].map(v=>str(v).toLowerCase()).join(' ');if(!hay.includes(q))return false;}
    return true;
  });
  items=sortItems01210(items,input.sort||'size',input.order||'desc');const total=items.length;
  return {stage:'01212',available:Boolean(snapshot.available),provider:str(snapshot.provider),bucket:str(snapshot.bucket),prefix:str(snapshot.prefix),pages:num(snapshot.pages),measuredAt:str(snapshot.measuredAt),cached:Boolean(snapshot.cached),summary:snapshot.summary||{},sites:arr(snapshot.sites),total,offset,limit,items:items.slice(offset,offset+limit)};
}

async function enrichUnknownMimeTypes01210(objects=[],referenceState={},provider=null){
  if(typeof provider?.headObject!=='function')return arr(objects);
  const mimeByObject=new Map();for(const asset of arr(referenceState.mediaAssets))if(asset.objectKey&&asset.mimeType)mimeByObject.set(asset.objectKey,asset.mimeType);for(const derivative of arr(referenceState.derivativeAssets))if(derivative.objectKey&&derivative.mimeType)mimeByObject.set(derivative.objectKey,derivative.mimeType);
  const rows=arr(objects).map(item=>({...item})),candidates=[];for(let i=0;i<rows.length;i++){const item=rows[i],objectKey=str(item.objectKey??item.Key),knownMime=str(mimeByObject.get(objectKey)||item.mimeType||item.ContentType);if(classifyResourceType01210({mimeType:knownMime,objectKey})==='unknown')candidates.push(i);}
  const concurrency=8;for(let at=0;at<candidates.length;at+=concurrency){await Promise.all(candidates.slice(at,at+concurrency).map(async index=>{const objectKey=str(rows[index].objectKey??rows[index].Key);try{const head=await provider.headObject({key:objectKey});const mimeType=str(head?.mimeType);if(mimeType)rows[index].mimeType=mimeType;}catch{}}));}
  return rows;
}

async function buildAuthorizedSnapshot01210(scope={},options={}){
  const p=options.provider||await provider01210(),measuredAt=new Date().toISOString(),accountId=str(scope.accountId),prefix=`accounts/${safeSegment(accountId)}/`;
  if(!p||!p.isConfigured?.())return {stage:'01212',available:false,provider:config.mediaStorageProvider||'',bucket:'',prefix, pages:0,measuredAt,summary:{objectCount:0,totalBytes:0,byType:{},byStatus:{},topLargest:[],topUnknown:[],topOrphan:[]},items:[],sites:[],source:'not-configured'};
  if(typeof p.listObjects01210!=='function')return {stage:'01212',available:false,provider:p.getInfo?.().type||'',bucket:p.getInfo?.().bucket||'',prefix,pages:0,measuredAt,summary:{objectCount:0,totalBytes:0,byType:{},byStatus:{},topLargest:[],topUnknown:[],topOrphan:[]},items:[],sites:[],source:'unsupported'};
  try{
    const [listed,state]=await Promise.all([p.listObjects01210({prefix}),loadAuthorizedStorageReferenceState01210(scope,options)]),info=p.getInfo?.()||{},objects=await enrichUnknownMimeTypes01210(listed.items,state,p);
    const snapshot=buildInventorySnapshot01210({scope,objects,referenceState:state,providerInfo:{provider:info.type||p.type,bucket:info.bucket||p.bucket,prefix,pages:listed.pages},measuredAt:new Date().toISOString()});
    return {...snapshot,sites:arr(state.sites),source:'provider-prefix-list+postgresql'};
  }catch(error){return {stage:'01212',available:false,provider:p.getInfo?.().type||p.type||'',bucket:p.getInfo?.().bucket||p.bucket||'',prefix,pages:0,measuredAt:new Date().toISOString(),summary:{objectCount:0,totalBytes:0,byType:{},byStatus:{},topLargest:[],topUnknown:[],topOrphan:[]},items:[],sites:[],source:'measurement-failed',error:str(error?.message||error)};}
}

export async function getAuthorizedR2InventorySnapshot01210(scope={},options={}){
  const accountId=str(scope.accountId);if(!accountId)throw Object.assign(new Error('Account scope is required for R2 inventory.'),{statusCode:400});
  const now=Date.now(),force=Boolean(options.forceRefresh),current=cache01210.get(accountId);
  if(!force&&current?.snapshot&&current.expiresAt>now)return {...current.snapshot,cached:true};
  if(current?.promise)return {...(await current.promise),cached:true};
  const promise=buildAuthorizedSnapshot01210(scope,options).then(snapshot=>{cache01210.set(accountId,{snapshot,expiresAt:Date.now()+CACHE_TTL_MS_01210,promise:null});return snapshot;}).catch(error=>{cache01210.delete(accountId);throw error;});
  cache01210.set(accountId,{snapshot:current?.snapshot||null,expiresAt:current?.expiresAt||0,promise});return {...(await promise),cached:false};
}

export async function listAuthorizedR2ObjectInventory01210(scope={},input={},options={}){return filterInventorySnapshot01210(await getAuthorizedR2InventorySnapshot01210(scope,options),input);}
export async function refreshAuthorizedR2ObjectInventory01210(scope={},input={},options={}){return filterInventorySnapshot01210(await getAuthorizedR2InventorySnapshot01210(scope,{...options,forceRefresh:true}),input);}
export function clearR2InventoryCache01210(accountId=''){const id=str(accountId);if(id)cache01210.delete(id);else cache01210.clear();}
export const R2_INVENTORY_CACHE_TTL_MS_01210=CACHE_TTL_MS_01210;
