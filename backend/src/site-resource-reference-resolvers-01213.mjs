// 01213 · Normalized resource reference edges for per-site inventory.
const str=value=>String(value??'').trim();
const arr=value=>Array.isArray(value)?value:[];
const unique=values=>[...new Set(values.map(str).filter(Boolean))];

export function normalizeReferenceEdges01213(references=[],sites=[]){
  const siteById=new Map(arr(sites).map(site=>[str(site?.id),site]).filter(([id])=>id));
  const seen=new Set(),out=[];
  for(const raw of arr(references)){
    const siteId=str(raw?.siteId),site=siteId?siteById.get(siteId):null;
    const edge={
      module:str(raw?.module)||'unknown',
      siteId:site?siteId:'',
      siteName:site?str(site?.name):str(raw?.siteName),
      workspaceId:str(raw?.workspaceId)||str(site?.workspaceId),
      storeId:str(raw?.storeId)||str(site?.storeId),
      resourceId:str(raw?.resourceId),
      assetId:str(raw?.assetId),
      objectKey:str(raw?.objectKey),
      sourcePath:str(raw?.sourcePath),
    };
    if(!edge.assetId&&!edge.objectKey)continue;
    const key=[edge.module,edge.siteId,edge.workspaceId,edge.storeId,edge.resourceId,edge.assetId,edge.objectKey,edge.sourcePath].join('|');
    if(seen.has(key))continue;
    seen.add(key);out.push(Object.freeze(edge));
  }
  return Object.freeze(out);
}

export function buildReferenceEdgeIndexes01213(referenceEdges=[]){
  const byAssetId=new Map(),byObjectKey=new Map(),bySiteId=new Map(),unscoped=[];
  const push=(map,key,edge)=>{if(!key)return;if(!map.has(key))map.set(key,[]);map.get(key).push(edge);};
  for(const edge of arr(referenceEdges)){
    push(byAssetId,str(edge?.assetId),edge);
    push(byObjectKey,str(edge?.objectKey),edge);
    if(str(edge?.siteId))push(bySiteId,str(edge.siteId),edge);else unscoped.push(edge);
  }
  return Object.freeze({byAssetId,byObjectKey,bySiteId,unscoped:Object.freeze(unscoped)});
}

export function referenceEdgesForResource01213(item={},indexes={}){
  const rows=[...(indexes?.byObjectKey?.get?.(str(item?.objectKey))||[]),...(indexes?.byAssetId?.get?.(str(item?.assetId))||[])];
  const seen=new Set(),out=[];
  for(const edge of rows){const key=[edge.module,edge.siteId,edge.resourceId,edge.assetId,edge.objectKey,edge.sourcePath].join('|');if(seen.has(key))continue;seen.add(key);out.push(edge);}
  return out;
}

export function modulesForSiteResource01213(item={},siteId='',resourceEdges=[]){
  const target=str(siteId),exact=arr(resourceEdges).filter(edge=>str(edge?.siteId)===target),unscoped=arr(resourceEdges).filter(edge=>!str(edge?.siteId));
  const exactModules=exact.map(edge=>edge.module),contextModules=[];
  if(exact.length){
    for(const edge of unscoped){
      const workspaceMatch=!str(edge.workspaceId)||!str(item?.workspaceId)||str(edge.workspaceId)===str(item?.workspaceId);
      const storeMatch=!str(edge.storeId)||!str(item?.storeId)||str(edge.storeId)===str(item?.storeId);
      if(workspaceMatch&&storeMatch)contextModules.push(edge.module);
    }
  }
  const fallback=exact.length?[]:str(item?.originSiteId)===target?arr(item?.modules):[];
  return unique([...exactModules,...contextModules,...fallback]).filter(Boolean);
}
