// 01210 · Read-only PostgreSQL/resource reference resolvers for universal R2 inventory.
const str=value=>String(value??'').trim();
const arr=value=>Array.isArray(value)?value:[];
const unique=values=>[...new Set(values.map(str).filter(Boolean))];

function objectKeyFromUrl01210(value){
  const raw=str(value);if(!/^https?:\/\//i.test(raw))return '';
  try{const url=new URL(raw);const path=decodeURIComponent(url.pathname||'').replace(/^\/+/, '');const at=path.indexOf('accounts/');return at>=0?path.slice(at):'';}catch{return '';}
}

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
  for(const row of siteRows)collectStorageReferences01210(row.project_json||{}, {module:'sites',siteId:row.site_id,siteName:row.site_name,workspaceId:row.workspace_id,storeId:row.store_id,resourceId:row.site_id},references,['siteProject']);
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
