// 01210 · Read-only PostgreSQL/resource reference resolvers for universal R2 inventory.
const str=value=>String(value??'').trim();
const arr=value=>Array.isArray(value)?value:[];
const unique=values=>[...new Set(values.map(str).filter(Boolean))];

function objectKeyFromUrl01210(value){
  const raw=str(value);if(!/^https?:\/\//i.test(raw))return '';
  try{const url=new URL(raw);const path=decodeURIComponent(url.pathname||'').replace(/^\/+/, '');const at=path.indexOf('accounts/');return at>=0?path.slice(at):'';}catch{return '';}
}

function decodeReferenceText01218(value){
  return str(value).replace(/&quot;|&#34;|&#x22;/gi,'"').replace(/&apos;|&#39;|&#x27;/gi,"'").replace(/&amp;/gi,'&');
}

function assetIdsFromDeliveryText01218(value){
  const decoded=decodeReferenceText01218(value);if(!decoded)return [];
  let text=decoded;try{text=decodeURIComponent(text);}catch{}
  const out=[];const re=/(?:^|[\s(=:'"]|https?:\/\/[^\s'"<>)]*)\/api\/v1\/public\/media\/([A-Za-z0-9._~-]+)/gi;
  let match;while((match=re.exec(text)))if(match[1])out.push(str(match[1]));
  return unique(out);
}

function assetIdFromDeliveryUrl01212(value){return assetIdsFromDeliveryText01218(value)[0]||'';}

export function inferResourceModule01210(path=[],fallback='unknown'){
  const hint=[str(fallback),...arr(path).map(str)].filter(Boolean).join('.').toLowerCase();
  if(/presentation|slides?/.test(hint))return 'presentation';
  if(/smart.?blocks?|graph/.test(hint))return 'smartblocks';
  if(/tables?|records?/.test(hint))return 'tables';
  if(/marketplace|commerce|products?|categories|variants?/.test(hint))return 'marketplace';
  if(/documents?|docs?/.test(hint))return 'documents';
  if(/gallery|media|image|video|audio/.test(hint))return 'media';
  if(/sites?|pages?|header|footer/.test(hint))return 'sites';
  return str(fallback)||'unknown';
}

export function collectStorageReferences01210(value,context={},out=[],path=[]){
  if(value==null)return out;
  if(Array.isArray(value)){value.forEach((item,index)=>collectStorageReferences01210(item,context,out,[...path,String(index)]));return out;}
  if(typeof value==='object'){for(const [key,item] of Object.entries(value))collectStorageReferences01210(item,context,out,[...path,key]);return out;}
  if(typeof value!=='string')return out;
  const raw=str(value);if(!raw)return out;
  const key=str(path[path.length-1]).toLowerCase();
  const module=inferResourceModule01210(path,context.module||'unknown');
  const base={module,siteId:str(context.siteId),siteName:str(context.siteName),workspaceId:str(context.workspaceId),storeId:str(context.storeId),resourceId:str(context.resourceId),sourcePath:path.join('.')};
  let assetId='',objectKey='';
  if(/(^|_)(assetid|mediaassetid|cloudassetid)$/.test(key)||key==='assetid'||key==='mediaassetid'||key==='cloudassetid')assetId=raw;
  if(key==='objectkey'||key==='object_key'||raw.startsWith('accounts/'))objectKey=raw.startsWith('accounts/')?raw:'';
  if(!objectKey)objectKey=objectKeyFromUrl01210(raw);
  if(assetId||objectKey)out.push({...base,assetId,objectKey});
  if(!assetId){for(const deliveryAssetId of assetIdsFromDeliveryText01218(raw))out.push({...base,assetId:deliveryAssetId,objectKey:''});}
  return out;
}


function parseJsonValue01218(value,fallback={}){
  if(value&&typeof value==='object')return value;
  try{const parsed=JSON.parse(str(value));return parsed&&typeof parsed==='object'?parsed:fallback;}catch{return fallback;}
}

function pageIdsFromProject01218(project={}){
  return new Set(arr(project?.site?.pages).map(page=>str(page?.id)).filter(Boolean));
}

function readProjectMode01218(storage={},area='',pageId=''){
  const globalMode=str(storage?.[`${area}GlobalMode`])==='page'?'page':'global';
  const pageModes=parseJsonValue01218(storage?.[`${area}PageModes`],storage?.[`${area}PageModes`]||{});
  const pageMode=str(pageModes?.[str(pageId)]);
  return pageMode==='page'||pageMode==='global'?pageMode:globalMode;
}

function collectCanonicalAreaState01218(projectStorage={},area='',context={},out=[]){
  if(str(projectStorage?.[`${area}Hidden`])==='1')return out;
  const state=parseJsonValue01218(projectStorage?.[`${area}State`],projectStorage?.[`${area}State`]||{});
  const globalHtml=str(state?.global?.html);
  const ids=pageIdsFromProject01218({site:context.site});
  for(const pageId of ids){
    const mode=readProjectMode01218(projectStorage,area,pageId),pageHtml=str(state?.pages?.[pageId]?.html);
    const html=mode==='page'&&pageHtml?pageHtml:(globalHtml||pageHtml);
    if(html)collectStorageReferences01210(html,{...context,module:'sites',resourceId:pageId},out,[area,pageId,'html']);
  }
  if(!ids.size&&globalHtml)collectStorageReferences01210(globalHtml,{...context,module:'sites'},out,[area,'global','html']);
  return out;
}

function canonicalLegacyMainValue01218(snapshot={}){
  for(const key of ['pageHTML','rootHTML','previewHtml']){const value=str(snapshot?.[key]);if(value)return value;}
  const site=snapshot?.__st_bundle_v1===true&&snapshot?.site&&typeof snapshot.site==='object'?snapshot.site:null;
  if(site)for(const key of ['pageHTML','rootHTML','previewHtml']){const value=str(site?.[key]);if(value)return value;}
  return '';
}

export function collectSiteProjectStorageReferences01218(projectJson={},context={}){
  const project=projectJson&&typeof projectJson==='object'?projectJson:{},out=[],site=project?.site&&typeof project.site==='object'?project.site:{},storage=project?.storage&&typeof project.storage==='object'?project.storage:{};
  const base={...context,module:'sites',site:site};

  // Site/page metadata is canonical, but deployment metadata and caches are not resource usage.
  for(const page of arr(site?.pages)){
    if(!page||typeof page!=='object')continue;
    const meta={...page};delete meta.html;delete meta.previewHtml;delete meta.rootHTML;delete meta.pageHTML;
    collectStorageReferences01210(meta,{...base,resourceId:str(page?.id)||str(context.resourceId)},out,['site','pages',str(page?.id)||'page']);
  }

  const snapshots=storage?.pageSnapshots&&typeof storage.pageSnapshots==='object'&&!Array.isArray(storage.pageSnapshots)?storage.pageSnapshots:{};
  const prefix=str(context.siteId)?`${str(context.siteId)}:`:'';
  for(const [snapshotKey,snapshot] of Object.entries(snapshots)){
    if(prefix&&!str(snapshotKey).startsWith(prefix))continue;
    if(!snapshot||typeof snapshot!=='object')continue;
    const pageId=str(snapshotKey).slice(prefix.length)||str(context.resourceId);
    if(snapshot.siteFrameMain01040&&typeof snapshot.siteFrameMain01040==='object'&&!Array.isArray(snapshot.siteFrameMain01040)){
      collectStorageReferences01210(snapshot.siteFrameMain01040,{...base,resourceId:pageId},out,['pageSnapshots',snapshotKey,'siteFrameMain01040']);
    }else{
      const legacy=canonicalLegacyMainValue01218(snapshot);
      if(legacy)collectStorageReferences01210(legacy,{...base,resourceId:pageId},out,['pageSnapshots',snapshotKey,'legacyMain']);
    }
  }

  collectCanonicalAreaState01218(storage,'header',base,out);
  collectCanonicalAreaState01218(storage,'footer',base,out);
  if(storage.globalStyleStore&&typeof storage.globalStyleStore==='object')collectStorageReferences01210(storage.globalStyleStore,{...base,resourceId:str(context.resourceId)},out,['globalStyleStore']);
  return out;
}

function collectMarketplaceMediaIds01210(value,out=new Set(),path=[]){
  if(value==null)return out;
  if(Array.isArray(value)){value.forEach((item,index)=>collectMarketplaceMediaIds01210(item,out,[...path,String(index)]));return out;}
  if(typeof value==='object'){
    for(const [key,item] of Object.entries(value)){
      if(path.length===0&&key==='media')continue;
      const low=key.toLowerCase();
      if((low==='mediaids'||low.endsWith('mediaids'))&&Array.isArray(item))item.forEach(v=>{if(str(v))out.add(str(v));});
      else if(low==='primarymediaid'||low==='imagemediaid'||low==='defaultimagemediaid'||low.endsWith('mediaid')){if(str(item))out.add(str(item));}
      collectMarketplaceMediaIds01210(item,out,[...path,key]);
    }
  }
  return out;
}

export function collectMarketplaceStorageReferences01210(snapshot={},context={}){
  const refs=[];
  const media=arr(snapshot?.media),mediaById=new Map(media.map(item=>[str(item?.id),item]).filter(([id])=>id));
  const usedIds=collectMarketplaceMediaIds01210(snapshot);
  for(const id of usedIds){const item=mediaById.get(id);if(!item)continue;collectStorageReferences01210(item,{...context,module:'marketplace',resourceId:id},refs,['media',id]);}
  const shell={...snapshot};delete shell.media;
  collectStorageReferences01210(shell,{...context,module:'marketplace',resourceId:str(context.resourceId)||'snapshot'},refs,['snapshot']);
  return refs;
}

async function safeRows01210(query,sql,args=[]){
  try{return (await query(sql,args))?.rows||[];}
  catch(error){if(['42P01','42703'].includes(str(error?.code)))return [];throw error;}
}

export async function loadAuthorizedStorageReferenceState01210(scope={},options={}){
  const accountId=str(scope.accountId);if(!accountId)throw Object.assign(new Error('Account scope is required for R2 inventory.'),{statusCode:400});
  let query=typeof options.query==='function'?options.query:null;if(!query){const {pool}=await import('./db.mjs');query=(sql,args)=>pool.query(sql,args);}
  const [mediaRows,derivativeRows,siteRows,marketRows,tableRows]=await Promise.all([
    safeRows01210(query,`SELECT id,account_id,workspace_id,store_id,provider,bucket,object_key,kind,file_name,mime_type,size_bytes,status,metadata,updated_at,completed_at,deleted_at FROM media_cloud_assets WHERE account_id=$1`,[accountId]),
    safeRows01210(query,`SELECT d.id,d.media_asset_id,d.derivative_kind,d.width,d.height,d.mime_type,d.object_key,d.status,d.metadata,d.updated_at,a.account_id,a.workspace_id,a.store_id,a.provider,a.bucket,a.file_name AS source_file_name FROM media_asset_derivatives d JOIN media_cloud_assets a ON a.id=d.media_asset_id WHERE a.account_id=$1`,[accountId]),
    safeRows01210(query,`SELECT s.id AS site_id,s.name AS site_name,s.workspace_id,s.store_id,s.status,p.project_json FROM shifttime_builder_sites s LEFT JOIN shifttime_builder_site_projects p ON p.site_id=s.id WHERE s.account_id=$1`,[accountId]),
    safeRows01210(query,`SELECT cs.store_id,w.id AS workspace_id,cs.snapshot FROM commerce_store_snapshots cs JOIN platform_stores st ON st.id=cs.store_id JOIN platform_workspaces w ON w.id=st.workspace_id WHERE w.account_id=$1`,[accountId]),
    safeRows01210(query,`SELECT t.id AS table_id,t.workspace_id,t.store_id,r.id AS record_id,r.values FROM shifttime_tables t JOIN shifttime_table_records r ON r.table_id=t.id WHERE t.account_id=$1 AND t.status<>'deleted'`,[accountId]),
  ]);
  const sites=siteRows.map(row=>({id:str(row.site_id),name:str(row.site_name),workspaceId:str(row.workspace_id),storeId:str(row.store_id),status:str(row.status)}));
  const siteById=new Map(sites.map(site=>[site.id,site]));
  const references=[];
  for(const row of siteRows)references.push(...collectSiteProjectStorageReferences01218(row.project_json||{}, {module:'sites',siteId:row.site_id,siteName:row.site_name,workspaceId:row.workspace_id,storeId:row.store_id,resourceId:row.site_id}));
  for(const row of marketRows)references.push(...collectMarketplaceStorageReferences01210(row.snapshot||{}, {module:'marketplace',workspaceId:row.workspace_id,storeId:row.store_id,resourceId:row.store_id}));
  for(const row of tableRows)collectStorageReferences01210(row.values||{}, {module:'tables',workspaceId:row.workspace_id,storeId:row.store_id,resourceId:`${str(row.table_id)}:${str(row.record_id)}`},references,['tableRecord']);
  return {
    accountId,
    sites,
    siteById,
    mediaAssets:mediaRows.map(row=>({id:str(row.id),accountId:str(row.account_id),workspaceId:str(row.workspace_id),storeId:str(row.store_id),provider:str(row.provider),bucket:str(row.bucket),objectKey:str(row.object_key),kind:str(row.kind),fileName:str(row.file_name),mimeType:str(row.mime_type),sizeBytes:Math.max(0,Number(row.size_bytes)||0),status:str(row.status),metadata:row.metadata&&typeof row.metadata==='object'?row.metadata:{},updatedAt:row.updated_at instanceof Date?row.updated_at.toISOString():str(row.updated_at),completedAt:row.completed_at instanceof Date?row.completed_at.toISOString():str(row.completed_at),deletedAt:row.deleted_at instanceof Date?row.deleted_at.toISOString():str(row.deleted_at)})),
    derivativeAssets:derivativeRows.map(row=>({id:str(row.id),mediaAssetId:str(row.media_asset_id),derivativeKind:str(row.derivative_kind),accountId:str(row.account_id),workspaceId:str(row.workspace_id),storeId:str(row.store_id),provider:str(row.provider),bucket:str(row.bucket),objectKey:str(row.object_key),kind:'image',fileName:str(row.object_key).split('/').pop()||str(row.source_file_name),sourceFileName:str(row.source_file_name),mimeType:str(row.mime_type),sizeBytes:0,status:str(row.status),metadata:row.metadata&&typeof row.metadata==='object'?row.metadata:{},updatedAt:row.updated_at instanceof Date?row.updated_at.toISOString():str(row.updated_at)})),
    references:references.map(ref=>({...ref,module:str(ref.module)||'unknown',assetId:str(ref.assetId),objectKey:str(ref.objectKey),siteId:str(ref.siteId),siteName:str(ref.siteName),workspaceId:str(ref.workspaceId),storeId:str(ref.storeId),resourceId:str(ref.resourceId),sourcePath:str(ref.sourcePath)})),
  };
}

export function mergeReferenceRows01210(rows=[]){
  const keyOf=ref=>[str(ref.module),str(ref.siteId),str(ref.workspaceId),str(ref.storeId),str(ref.resourceId),str(ref.assetId),str(ref.objectKey),str(ref.sourcePath)].join('|');
  const seen=new Set(),out=[];for(const ref of arr(rows)){const key=keyOf(ref);if(!key||seen.has(key))continue;seen.add(key);out.push(ref);}return out;
}

export function referenceSiteIds01210(references=[]){return unique(arr(references).map(ref=>ref.siteId));}
