// 01219 · Safe cleanup for broken media metadata references. Never deletes R2 objects or traffic history.
import {loadAuthorizedSiteAccess01213} from './site-resource-access-01213.mjs';
import {refreshAuthorizedR2InventoryReferences01216,verifyAuthorizedR2ObjectMissing01219} from './storage-object-inventory-01210.mjs';
import {clearSiteResourceIndexCache01213,getOrBuildSiteResourceIndex01213} from './site-resource-inventory-01213.mjs';

const str=value=>String(value??'').trim();
const arr=value=>Array.isArray(value)?value:[];
const hasStatus=(item,status)=>arr(item?.statusFlags).some(value=>str(value).toLowerCase()===str(status).toLowerCase());
const hasSource=(item,source)=>arr(item?.metadataSource).some(value=>str(value)===str(source));

function fail(message,statusCode,code){throw Object.assign(new Error(message),{statusCode,code});}

export function validateBrokenReferenceCleanupCandidate01219(item={},siteId=''){
  const targetSiteId=str(siteId),assetId=str(item?.assetId),objectKey=str(item?.objectKey),usedBySiteIds=arr(item?.usedBySiteIds).map(str).filter(Boolean),originSiteId=str(item?.originSiteId);
  if(!hasStatus(item,'broken-reference'))fail('Resource is not a broken reference.',409,'ST_BROKEN_CLEANUP_NOT_BROKEN');
  if(str(item?.brokenReason)!=='missing-r2-object')fail('Only missing R2 object metadata can be cleaned by this action.',409,'ST_BROKEN_CLEANUP_REASON_NOT_ALLOWED');
  if(Boolean(item?.physical))fail('Physical storage object still exists.',409,'ST_BROKEN_CLEANUP_OBJECT_EXISTS');
  if(usedBySiteIds.length)fail('Resource is still referenced by one or more sites.',409,'ST_BROKEN_CLEANUP_RESOURCE_IN_USE');
  if(!assetId||!objectKey||!hasSource(item,'media_cloud_assets'))fail('Cleanup requires an existing media metadata record.',409,'ST_BROKEN_CLEANUP_METADATA_REQUIRED');
  if(targetSiteId&&originSiteId&&originSiteId!==targetSiteId)fail('Broken reference does not belong to the selected site origin.',409,'ST_BROKEN_CLEANUP_SITE_MISMATCH');
  return Object.freeze({assetId,objectKey,siteId:targetSiteId,originSiteId,fileName:str(item?.fileName),resourceIdentity:str(item?.resourceIdentity)});
}

function findCleanupCandidate01219(index={},siteId='',input={}){
  const entry=index?.bySiteId?.get?.(str(siteId));if(!entry)fail('Site Resource Inventory target is not available in the authorized scope.',404,'ST_SITE_RESOURCE_NOT_FOUND');
  const resourceIdentity=str(input?.resourceIdentity),assetId=str(input?.assetId),objectKey=str(input?.objectKey);
  const item=arr(entry.items).find(row=>
    (resourceIdentity&&str(row?.resourceIdentity)===resourceIdentity)||
    (assetId&&str(row?.assetId)===assetId)||
    (objectKey&&str(row?.objectKey)===objectKey)
  );
  if(!item)fail('Broken reference cleanup target was not found.',404,'ST_BROKEN_CLEANUP_NOT_FOUND');
  return item;
}

export async function cleanupAuthorizedBrokenReference01219(scope={},userId='',siteId='',input={},options={}){
  if(input?.confirm!==true)fail('Explicit cleanup confirmation is required.',400,'ST_BROKEN_CLEANUP_CONFIRM_REQUIRED');
  const id=str(siteId);if(!id)fail('Site id is required.',400,'ST_BROKEN_CLEANUP_SITE_REQUIRED');
  const [access,snapshot]=await Promise.all([
    loadAuthorizedSiteAccess01213(scope,userId,options.accessOptions||{}),
    refreshAuthorizedR2InventoryReferences01216(scope,options.inventoryOptions||{}),
  ]);
  if(!(access?.allowedSiteIds instanceof Set)||!access.allowedSiteIds.has(id))fail('Site Resource Inventory target is not available in the authorized scope.',404,'ST_SITE_RESOURCE_NOT_FOUND');
  clearSiteResourceIndexCache01213(scope?.accountId);
  const index=getOrBuildSiteResourceIndex01213(snapshot),candidate=validateBrokenReferenceCleanupCandidate01219(findCleanupCandidate01219(index,id,input),id);
  await verifyAuthorizedR2ObjectMissing01219(scope,candidate.objectKey,options.storageVerifyOptions||{});

  let tx=typeof options.withTransaction==='function'?options.withTransaction:null;if(!tx){const db=await import('./db.mjs');tx=db.withTransaction;}const cleanedAt=(typeof options.now==='function'?options.now():new Date()).toISOString(),actorUserId=str(options.actorUserId||userId||scope?.actorUserId);
  const result=await tx(async client=>{
    const q=await client.query(`SELECT id,account_id,workspace_id,store_id,status,object_key,file_name,size_bytes,metadata FROM media_cloud_assets WHERE id=$1 AND account_id=$2 FOR UPDATE`,[candidate.assetId,str(scope?.accountId)]);
    if(!q.rowCount)fail('Media metadata record no longer exists.',404,'ST_BROKEN_CLEANUP_METADATA_NOT_FOUND');
    const row=q.rows[0];
    if(str(row.object_key)!==candidate.objectKey)fail('Media metadata object key changed before cleanup.',409,'ST_BROKEN_CLEANUP_OBJECT_KEY_CHANGED');
    if(str(row.status)==='deleted')return {alreadyCleaned:true,assetId:candidate.assetId,objectKey:candidate.objectKey,fileName:str(row.file_name)};
    const cleanupMeta={brokenReferenceCleanup:{stage:'01219',cleanedAt,cleanedBy:actorUserId,siteId:id,reason:'missing-r2-object'}};
    await client.query(`UPDATE media_cloud_assets SET status='deleted',deleted_at=COALESCE(deleted_at,now()),metadata=metadata||$2::jsonb,updated_at=now() WHERE id=$1`,[candidate.assetId,JSON.stringify(cleanupMeta)]);
    await client.query(`INSERT INTO media_asset_events(media_asset_id,store_id,event_type,payload) VALUES($1,$2,$3,$4::jsonb)`,[candidate.assetId,str(row.store_id),'media.broken-reference.cleaned',JSON.stringify({stage:'01219',siteId:id,objectKey:candidate.objectKey,fileName:str(row.file_name),sizeBytes:Number(row.size_bytes)||0,actorUserId})]);
    return {alreadyCleaned:false,assetId:candidate.assetId,objectKey:candidate.objectKey,fileName:str(row.file_name)};
  });

  const refreshed=await refreshAuthorizedR2InventoryReferences01216(scope,options.inventoryOptions||{});
  clearSiteResourceIndexCache01213(scope?.accountId);
  getOrBuildSiteResourceIndex01213(refreshed);
  return Object.freeze({stage:'01219',cleaned:true,historyPreserved:true,r2Deleted:false,siteId:id,...result});
}
