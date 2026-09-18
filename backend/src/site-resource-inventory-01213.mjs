// 01213 · Per-site logical resource inventory derived from one canonical Account R2 snapshot.
import {getAuthorizedR2InventorySnapshot01210} from './storage-object-inventory-01210.mjs';
import {normalizeReferenceEdges01213,buildReferenceEdgeIndexes01213,referenceEdgesForResource01213,modulesForSiteResource01213} from './site-resource-reference-resolvers-01213.mjs';
import {loadAuthorizedSiteAccess01213} from './site-resource-access-01213.mjs';

const str=value=>String(value??'').trim();
const arr=value=>Array.isArray(value)?value:[];
const num=value=>Math.max(0,Number(value)||0);
const unique=values=>[...new Set(values.map(str).filter(Boolean))];
const indexCache01213=new Map();
const latestIndexByAccount01214=new Map();

function resourceIdentity01213(item={}){const objectKey=str(item.objectKey),assetId=str(item.assetId);if(objectKey)return `object:${objectKey}`;if(assetId)return `asset:${assetId}`;return `resource:${str(item.fileName)}:${str(item.lastModified)}:${str(item.module)}`;}
function physicalIdentity01213(item={}){return item?.physical?(str(item.objectKey)||str(item.assetId)||resourceIdentity01213(item)):'';}
function includesStatus01213(item={},status=''){return arr(item?.statusFlags).map(v=>str(v).toLowerCase()).includes(str(status).toLowerCase());}
function isDocumentType01213(type=''){return ['pdf','document','spreadsheet'].includes(str(type).toLowerCase());}
function brokenReason01213(item={}){
  if(!includesStatus01213(item,'broken-reference'))return '';
  const metadataStatus=str(item?.metadataStatus).toLowerCase(),sources=arr(item?.metadataSource).map(str);
  if(metadataStatus==='deleted')return 'deleted-media-metadata';
  if(str(item?.objectKey)&&sources.some(source=>source==='media_cloud_assets'||source==='media_asset_derivatives'))return 'missing-r2-object';
  if(str(item?.assetId)&&!sources.some(source=>source==='media_cloud_assets'||source==='media_asset_derivatives'))return 'missing-media-metadata';
  if(!str(item?.objectKey)&&str(item?.assetId))return 'missing-object-key';
  if(str(item?.objectKey))return 'missing-r2-object';
  return 'unknown';
}

function emptySiteSummary01213(){return {resourceCount:0,referencedResourceCount:0,uniquePhysicalObjectCount:0,referencedBytes:0,uniquePhysicalBytes:0,imageCount:0,imageBytes:0,videoCount:0,videoBytes:0,audioCount:0,audioBytes:0,pdfCount:0,pdfBytes:0,spreadsheetCount:0,spreadsheetBytes:0,documentCount:0,documentBytes:0,threeDCount:0,threeDBytes:0,fontCount:0,fontBytes:0,otherCount:0,otherBytes:0,archiveCount:0,archiveBytes:0,jsonDataCount:0,jsonDataBytes:0,unknownTypeCount:0,unknownTypeBytes:0,tableResourceCount:0,marketplaceResourceCount:0,presentationResourceCount:0,smartBlockResourceCount:0,unknownCount:0,brokenReferenceCount:0,unusedCount:0,sharedResourceCount:0};}

function summarizeSiteItems01213(items=[]){
  const summary=emptySiteSummary01213(),physicalAll=new Map(),physicalReferenced=new Map();
  for(const item of arr(items)){
    summary.resourceCount++;
    if(item.referencedBySite)summary.referencedResourceCount++;
    const pid=physicalIdentity01213(item);
    if(pid&&!physicalAll.has(pid))physicalAll.set(pid,item);
    if(pid&&item.referencedBySite&&!physicalReferenced.has(pid))physicalReferenced.set(pid,item);
    const type=str(item.resourceType).toLowerCase(),size=item.physical?num(item.sizeBytes):0;
    if(type==='image'){summary.imageCount++;summary.imageBytes+=size;}
    if(type==='video'){summary.videoCount++;summary.videoBytes+=size;}
    if(type==='audio'){summary.audioCount++;summary.audioBytes+=size;}
    if(type==='pdf'){summary.pdfCount++;summary.pdfBytes+=size;}
    if(type==='spreadsheet'){summary.spreadsheetCount++;summary.spreadsheetBytes+=size;}
    if(isDocumentType01213(type)){summary.documentCount++;summary.documentBytes+=size;}
    if(type==='3d'){summary.threeDCount++;summary.threeDBytes+=size;}
    if(type==='font'){summary.fontCount++;summary.fontBytes+=size;}
    if(type==='other'){summary.otherCount++;summary.otherBytes+=size;}
    if(type==='archive'){summary.archiveCount++;summary.archiveBytes+=size;}
    if(type==='json/data'){summary.jsonDataCount++;summary.jsonDataBytes+=size;}
    if(type==='unknown'){summary.unknownTypeCount++;summary.unknownTypeBytes+=size;}
    const modules=new Set(arr(item.siteModules).map(v=>str(v).toLowerCase()));
    if(modules.has('tables'))summary.tableResourceCount++;
    if(modules.has('marketplace'))summary.marketplaceResourceCount++;
    if(modules.has('presentation'))summary.presentationResourceCount++;
    if(modules.has('smartblocks'))summary.smartBlockResourceCount++;
    if(includesStatus01213(item,'unknown')||type==='unknown'||modules.has('unknown'))summary.unknownCount++;
    if(includesStatus01213(item,'broken-reference'))summary.brokenReferenceCount++;
    if(item.originForSite&&!item.referencedBySite)summary.unusedCount++;
    if(item.shared)summary.sharedResourceCount++;
  }
  summary.uniquePhysicalObjectCount=physicalAll.size;
  summary.uniquePhysicalBytes=[...physicalAll.values()].reduce((sum,item)=>sum+num(item.sizeBytes),0);
  summary.referencedBytes=[...physicalReferenced.values()].reduce((sum,item)=>sum+num(item.sizeBytes),0);
  return Object.freeze(summary);
}

function summarizeVisibleSites01213(entries=[]){
  const resourceMap=new Map();
  for(const entry of arr(entries))for(const item of arr(entry?.items))resourceMap.set(resourceIdentity01213(item),item);
  const values=[...resourceMap.values()];
  return Object.freeze({
    siteCount:arr(entries).length,
    resourceCount:values.length,
    referencedResourceCount:values.filter(item=>arr(item.usedBySiteIds).length>0).length,
    sharedResourceCount:values.filter(item=>item.shared).length,
    brokenReferenceCount:values.filter(item=>includesStatus01213(item,'broken-reference')).length,
    unknownCount:values.filter(item=>includesStatus01213(item,'unknown')||str(item.resourceType)==='unknown').length,
  });
}

function normalizeSite01213(site={}){return Object.freeze({id:str(site.id),name:str(site.name),workspaceId:str(site.workspaceId),workspaceName:str(site.workspaceName),storeId:str(site.storeId),storeName:str(site.storeName),status:str(site.status)});}

export function buildSiteResourceIndex01213(snapshot={}){
  const sites=arr(snapshot.sites).map(normalizeSite01213).filter(site=>site.id),siteById=new Map(sites.map(site=>[site.id,site]));
  const referenceEdges=normalizeReferenceEdges01213(snapshot.referenceEdges||[],sites),edgeIndexes=buildReferenceEdgeIndexes01213(referenceEdges);
  const bySiteId=new Map(sites.map(site=>[site.id,{site,items:[]}])) ,unassignedItems=[];
  for(const sourceItem of arr(snapshot.items)){
    const resourceEdges=referenceEdgesForResource01213(sourceItem,edgeIndexes);
    const exactReferenced=unique([...arr(sourceItem.referencedSiteIds),...resourceEdges.map(edge=>edge.siteId)]).filter(siteId=>siteById.has(siteId));
    const originSiteId=siteById.has(str(sourceItem.originSiteId))?str(sourceItem.originSiteId):'';
    const associatedSiteIds=unique([originSiteId,...exactReferenced]);
    const shared=exactReferenced.length>1,usedBySiteNames=exactReferenced.map(id=>siteById.get(id)?.name||id),originSiteName=originSiteId?(siteById.get(originSiteId)?.name||originSiteId):'';
    if(!associatedSiteIds.length){unassignedItems.push({...sourceItem,resourceIdentity:resourceIdentity01213(sourceItem),shared:false,usedBySiteIds:[],usedBySiteNames:[],originSiteName:'',brokenReason:brokenReason01213(sourceItem)});continue;}
    for(const siteId of associatedSiteIds){
      const referencedBySite=exactReferenced.includes(siteId),originForSite=originSiteId===siteId;
      let siteModules=modulesForSiteResource01213(sourceItem,siteId,resourceEdges);
      if(referencedBySite&&!siteModules.length)siteModules=unique([sourceItem.module,...arr(sourceItem.modules)]);
      const item={...sourceItem,resourceIdentity:resourceIdentity01213(sourceItem),siteId,siteModules,referencedBySite,originForSite,shared,usedBySiteIds:exactReferenced,usedBySiteNames,originSiteName,brokenReason:brokenReason01213(sourceItem)};
      bySiteId.get(siteId)?.items.push(Object.freeze(item));
    }
  }
  for(const entry of bySiteId.values())entry.summary=summarizeSiteItems01213(entry.items);
  const entries=[...bySiteId.values()],summary=summarizeVisibleSites01213(entries),unassignedPhysical=new Map();
  for(const item of unassignedItems){const pid=physicalIdentity01213(item);if(pid&&!unassignedPhysical.has(pid))unassignedPhysical.set(pid,item);}
  const unassigned=Object.freeze({resourceCount:unassignedItems.length,uniquePhysicalObjectCount:unassignedPhysical.size,uniquePhysicalBytes:[...unassignedPhysical.values()].reduce((sum,item)=>sum+num(item.sizeBytes),0),unknownCount:unassignedItems.filter(item=>includesStatus01213(item,'unknown')).length,orphanCount:unassignedItems.filter(item=>includesStatus01213(item,'orphan')).length,items:Object.freeze(unassignedItems)});
  return Object.freeze({stage:'01213',available:Boolean(snapshot.available),accountId:str(snapshot.accountId),measuredAt:str(snapshot.measuredAt),cached:Boolean(snapshot.cached),accountPhysicalObjectCount:num(snapshot.summary?.objectCount),accountPhysicalBytes:num(snapshot.summary?.totalBytes),sites:Object.freeze(sites),bySiteId,referenceEdges,summary,unassigned});
}

function sortSiteRows01213(rows=[],sort='resources',order='desc'){
  const key=str(sort).toLowerCase(),dir=str(order).toLowerCase()==='asc'?1:-1;
  const getter=row=>key==='name'?row.siteName:key==='workspace'?row.workspaceName:key==='store'?row.storeName:key==='size'?row.uniquePhysicalBytes:key==='shared'?row.sharedResourceCount:key==='broken'?row.brokenReferenceCount:row.resourceCount;
  return [...rows].sort((a,b)=>{const av=getter(a),bv=getter(b);if(typeof av==='number'&&typeof bv==='number')return(av-bv)*dir;return String(av||'').localeCompare(String(bv||''),'en',{numeric:true,sensitivity:'base'})*dir;});
}

function siteRow01213(entry={}){const site=entry.site||{},summary=entry.summary||emptySiteSummary01213();return {siteId:str(site.id),siteName:str(site.name),workspaceId:str(site.workspaceId),workspaceName:str(site.workspaceName),storeId:str(site.storeId),storeName:str(site.storeName),...summary};}

function allowedUnassignedItems01213(index={},access={}){
  if(access?.accountWide)return arr(index?.unassigned?.items);
  const allowedStores=access?.allowedStoreIds instanceof Set?access.allowedStoreIds:new Set(),allowedWorkspaces=access?.allowedWorkspaceIds instanceof Set?access.allowedWorkspaceIds:new Set();
  return arr(index?.unassigned?.items).filter(item=>allowedStores.has(str(item.storeId))||allowedWorkspaces.has(str(item.workspaceId)));
}

function summarizeUnassigned01213(items=[]){const physical=new Map();for(const item of arr(items)){const pid=physicalIdentity01213(item);if(pid&&!physical.has(pid))physical.set(pid,item);}return {resourceCount:arr(items).length,uniquePhysicalObjectCount:physical.size,uniquePhysicalBytes:[...physical.values()].reduce((sum,item)=>sum+num(item.sizeBytes),0),unknownCount:arr(items).filter(item=>includesStatus01213(item,'unknown')).length,orphanCount:arr(items).filter(item=>includesStatus01213(item,'orphan')).length};}

export function listSiteResourceInventoryFromIndex01213(index={},input={},access={}){
  const allowed=access?.allowedSiteIds instanceof Set?access.allowedSiteIds:new Set(arr(index.sites).map(site=>site.id));
  const workspaceId=str(input.workspaceId),storeId=str(input.storeId),q=str(input.q).toLowerCase(),offset=Math.max(0,Math.trunc(Number(input.offset)||0)),limit=Math.max(1,Math.min(500,Math.trunc(Number(input.limit)||100)));
  const authorizedEntries=[...index.bySiteId.values()].filter(entry=>allowed.has(entry.site.id));
  const workspaceMap=new Map(),storeMap=new Map();
  for(const entry of authorizedEntries){const site=entry.site||{};if(site.workspaceId&&!workspaceMap.has(site.workspaceId))workspaceMap.set(site.workspaceId,{id:site.workspaceId,name:site.workspaceName||site.workspaceId});if(site.storeId&&!storeMap.has(site.storeId))storeMap.set(site.storeId,{id:site.storeId,name:site.storeName||site.storeId,workspaceId:site.workspaceId});}
  const facets={workspaces:[...workspaceMap.values()].sort((a,b)=>str(a.name).localeCompare(str(b.name),'en',{numeric:true,sensitivity:'base'})),stores:[...storeMap.values()].sort((a,b)=>str(a.name).localeCompare(str(b.name),'en',{numeric:true,sensitivity:'base'}))};
  let entries=authorizedEntries;
  if(workspaceId)entries=entries.filter(entry=>entry.site.workspaceId===workspaceId);if(storeId)entries=entries.filter(entry=>entry.site.storeId===storeId);
  if(q)entries=entries.filter(entry=>[entry.site.name,entry.site.id,entry.site.workspaceName,entry.site.storeName].map(v=>str(v).toLowerCase()).join(' ').includes(q));
  let rows=entries.map(siteRow01213);rows=sortSiteRows01213(rows,input.sort||'resources',input.order||'desc');const total=rows.length,unassignedItems=allowedUnassignedItems01213(index,access);
  return {stage:'01213',available:Boolean(index.available),measuredAt:str(index.measuredAt),cached:Boolean(index.cached),accountPhysicalObjectCount:num(index.accountPhysicalObjectCount),accountPhysicalBytes:num(index.accountPhysicalBytes),summary:summarizeVisibleSites01213(entries),unassigned:summarizeUnassigned01213(unassignedItems),facets,total,offset,limit,sites:rows.slice(offset,offset+limit)};
}

function sortResourceItems01213(items=[],sort='size',order='desc'){
  const key=str(sort).toLowerCase(),dir=str(order).toLowerCase()==='asc'?1:-1;
  const getter=item=>key==='file'?item.fileName:key==='modified'?item.lastModified:key==='type'?item.resourceType:key==='module'?arr(item.siteModules).join(','):key==='status'?arr(item.statusFlags).join(','):item.sizeBytes;
  return [...items].sort((a,b)=>{const av=getter(a),bv=getter(b);if(typeof av==='number'&&typeof bv==='number')return(av-bv)*dir;return String(av||'').localeCompare(String(bv||''),'en',{numeric:true,sensitivity:'base'})*dir;});
}

export function getSiteResourceInventoryFromIndex01213(index={},siteId='',input={},access={}){
  const id=str(siteId),allowed=access?.allowedSiteIds instanceof Set?access.allowedSiteIds:new Set(arr(index.sites).map(site=>site.id));
  if(!id||!allowed.has(id)||!index.bySiteId.has(id))throw Object.assign(new Error('Site Resource Inventory target is not available in the authorized scope.'),{statusCode:404,code:'ST_SITE_RESOURCE_NOT_FOUND'});
  const entry=index.bySiteId.get(id),module=str(input.module).toLowerCase(),type=str(input.type).toLowerCase(),status=str(input.status).toLowerCase(),shared=str(input.shared).toLowerCase(),q=str(input.q).toLowerCase(),offset=Math.max(0,Math.trunc(Number(input.offset)||0)),limit=Math.max(1,Math.min(500,Math.trunc(Number(input.limit)||100)));
  let items=arr(entry.items).filter(item=>{
    if(module&&!arr(item.siteModules).map(v=>str(v).toLowerCase()).includes(module))return false;
    if(type&&str(item.resourceType).toLowerCase()!==type)return false;
    if(status&&!arr(item.statusFlags).map(v=>str(v).toLowerCase()).includes(status))return false;
    if(shared==='true'&&!item.shared)return false;if(shared==='false'&&item.shared)return false;
    if(q){const hay=[item.fileName,item.objectKey,item.assetId,item.resourceType,item.originSiteName,...arr(item.siteModules),...arr(item.usedBySiteNames),...arr(item.statusFlags)].map(v=>str(v).toLowerCase()).join(' ');if(!hay.includes(q))return false;}
    return true;
  });
  items=sortResourceItems01213(items,input.sort||'size',input.order||'desc');const total=items.length;
  return {stage:'01213',available:Boolean(index.available),measuredAt:str(index.measuredAt),cached:Boolean(index.cached),site:entry.site,summary:entry.summary,total,offset,limit,items:items.slice(offset,offset+limit)};
}

function cacheKey01213(snapshot={}){return `${str(snapshot.accountId)}|${str(snapshot.measuredAt)}|${num(snapshot.summary?.objectCount)}|${num(snapshot.summary?.totalBytes)}`;}
export function clearSiteResourceIndexCache01213(accountId=''){const id=str(accountId);if(!id){indexCache01213.clear();latestIndexByAccount01214.clear();return;}for(const key of indexCache01213.keys())if(key.startsWith(`${id}|`))indexCache01213.delete(key);latestIndexByAccount01214.delete(id);}
export function getLatestSiteResourceIndex01214(accountId=''){return latestIndexByAccount01214.get(str(accountId))||null;}
export function getOrBuildSiteResourceIndex01213(snapshot={}){const key=cacheKey01213(snapshot),accountId=str(snapshot.accountId);if(indexCache01213.has(key)){const cached=indexCache01213.get(key);if(accountId)latestIndexByAccount01214.set(accountId,cached);return cached;}const index=buildSiteResourceIndex01213(snapshot);for(const existing of indexCache01213.keys())if(existing.startsWith(`${accountId}|`)&&existing!==key)indexCache01213.delete(existing);indexCache01213.set(key,index);if(accountId)latestIndexByAccount01214.set(accountId,index);return index;}

export async function listAuthorizedSiteResourceInventory01213(scope={},userId='',input={},options={}){
  const [snapshot,access]=await Promise.all([getAuthorizedR2InventorySnapshot01210(scope,options.inventoryOptions||{}),loadAuthorizedSiteAccess01213(scope,userId,options.accessOptions||{})]);
  const index=getOrBuildSiteResourceIndex01213(snapshot),siteMetadata=new Map(access.sites.map(site=>[site.id,site]));
  for(const [id,entry] of index.bySiteId){const meta=siteMetadata.get(id);if(meta)entry.site={...entry.site,...meta};}
  return listSiteResourceInventoryFromIndex01213(index,input,access);
}

export async function getAuthorizedSiteResourceInventory01213(scope={},userId='',siteId='',input={},options={}){
  const accessPromise=loadAuthorizedSiteAccess01213(scope,userId,options.accessOptions||{});
  let index=getLatestSiteResourceIndex01214(scope?.accountId);
  if(!index){const snapshot=await getAuthorizedR2InventorySnapshot01210(scope,options.inventoryOptions||{});index=getOrBuildSiteResourceIndex01213(snapshot);}
  const access=await accessPromise,entry=index.bySiteId.get(str(siteId)),meta=access.sites.find(site=>site.id===str(siteId));if(entry&&meta)entry.site={...entry.site,...meta};
  return getSiteResourceInventoryFromIndex01213(index,siteId,input,access);
}
