import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validateBrokenReferenceCleanupCandidate01219,cleanupAuthorizedBrokenReference01219} from '../src/site-resource-cleanup-01219.mjs';
import {verifyAuthorizedR2ObjectMissing01219} from '../src/storage-object-inventory-01210.mjs';

const safeItem={
  physical:false,
  assetId:'mediaasset_safe',
  objectKey:'accounts/acct_1/workspaces/ws_1/stores/store_1/media/gallery/mediaasset_safe/file.jpg',
  fileName:'file.jpg',
  originSiteId:'site_1',
  usedBySiteIds:[],
  statusFlags:['broken-reference'],
  brokenReason:'missing-r2-object',
  metadataSource:['media_cloud_assets'],
  resourceIdentity:'object:accounts/acct_1/workspaces/ws_1/stores/store_1/media/gallery/mediaasset_safe/file.jpg'
};

test('01219 cleanup guard accepts only unreferenced missing R2 media metadata',()=>{
  const result=validateBrokenReferenceCleanupCandidate01219(safeItem,'site_1');
  assert.equal(result.assetId,'mediaasset_safe');
  assert.equal(result.siteId,'site_1');
  assert.throws(()=>validateBrokenReferenceCleanupCandidate01219({...safeItem,usedBySiteIds:['site_2']},'site_1'),error=>error?.code==='ST_BROKEN_CLEANUP_RESOURCE_IN_USE');
  assert.throws(()=>validateBrokenReferenceCleanupCandidate01219({...safeItem,brokenReason:'missing-media-metadata'},'site_1'),error=>error?.code==='ST_BROKEN_CLEANUP_REASON_NOT_ALLOWED');
  assert.throws(()=>validateBrokenReferenceCleanupCandidate01219({...safeItem,physical:true},'site_1'),error=>error?.code==='ST_BROKEN_CLEANUP_OBJECT_EXISTS');
});

test('01219 cleanup verifies the physical R2 object is still missing before metadata cleanup',async()=>{
  const missingProvider={isConfigured:()=>true,headObject:async()=>{const error=new Error('missing');error.$metadata={httpStatusCode:404};throw error;}};
  const result=await verifyAuthorizedR2ObjectMissing01219({accountId:'acct_1'},safeItem.objectKey,{provider:missingProvider});
  assert.equal(result.missing,true);
  const existingProvider={isConfigured:()=>true,headObject:async()=>({sizeBytes:10})};
  await assert.rejects(()=>verifyAuthorizedR2ObjectMissing01219({accountId:'acct_1'},safeItem.objectKey,{provider:existingProvider}),error=>error?.code==='ST_BROKEN_CLEANUP_OBJECT_EXISTS');
});

test('01219 storage reference loader excludes soft-cleaned media metadata while keeping audit rows intact',()=>{
  const source=fs.readFileSync(new URL('../src/storage-reference-resolvers-01210.mjs',import.meta.url),'utf8');
  assert.match(source,/media_cloud_assets WHERE account_id=\$1 AND status<>'deleted'/);
  assert.match(source,/a\.account_id=\$1 AND a\.status<>'deleted'/);
  const cleanup=fs.readFileSync(new URL('../src/site-resource-cleanup-01219.mjs',import.meta.url),'utf8');
  assert.match(cleanup,/status='deleted'/);
  assert.match(cleanup,/media\.broken-reference\.cleaned/);
  assert.doesNotMatch(cleanup,/DELETE FROM media_cloud_assets/i);
  assert.doesNotMatch(cleanup,/deleteObject\s*\(/);
});


test('01219 cleanup soft-deletes stale media metadata, preserves history, and never deletes storage bytes',async()=>{
  let deleted=false,deleteObjectCalls=0,updateCalls=0,eventCalls=0;
  const assetRow={id:'mediaasset_safe',account_id:'acct_1',workspace_id:'ws_1',store_id:'store_1',provider:'r2',bucket:'bucket',object_key:safeItem.objectKey,kind:'image',file_name:'file.jpg',mime_type:'image/jpeg',size_bytes:123,status:'ready',metadata:{trafficSiteId:'site_1'},updated_at:new Date('2026-09-19T00:00:00Z'),completed_at:new Date('2026-09-19T00:00:00Z'),deleted_at:null};
  const siteProjectRow={site_id:'site_1',site_name:'Site One',workspace_id:'ws_1',store_id:'store_1',status:'active',project_json:{site:{pages:[]},storage:{}}};
  const inventoryQuery=async sql=>{
    if(sql.includes('FROM media_cloud_assets WHERE account_id='))return {rows:deleted?[]:[assetRow]};
    if(sql.includes('FROM media_asset_derivatives'))return {rows:[]};
    if(sql.includes('FROM shifttime_builder_sites s LEFT JOIN shifttime_builder_site_projects'))return {rows:[siteProjectRow]};
    if(sql.includes('FROM commerce_store_snapshots'))return {rows:[]};
    if(sql.includes('FROM shifttime_tables'))return {rows:[]};
    throw new Error(`Unexpected inventory SQL: ${sql}`);
  };
  const accessQuery=async sql=>{
    if(sql.includes('FROM platform_memberships'))return {rows:[{account_id:'acct_1',workspace_id:'',store_id:'',role:'owner',permissions:[]}]};
    if(sql.includes('FROM shifttime_builder_sites s LEFT JOIN platform_workspaces'))return {rows:[{site_id:'site_1',site_name:'Site One',workspace_id:'ws_1',store_id:'store_1',status:'active',workspace_name:'Workspace',store_name:'Store'}]};
    throw new Error(`Unexpected access SQL: ${sql}`);
  };
  const provider={
    isConfigured:()=>true,
    getInfo:()=>({type:'r2',bucket:'bucket'}),
    listObjects01210:async()=>({items:[],pages:1}),
    headObject:async()=>{const error=new Error('missing');error.$metadata={httpStatusCode:404};throw error;},
    deleteObject:async()=>{deleteObjectCalls++;return {deleted:true};},
  };
  const withTransaction=async fn=>fn({query:async(sql,args)=>{
    if(sql.startsWith('SELECT id,account_id'))return {rowCount:1,rows:[{...assetRow,object_key:assetRow.object_key,file_name:assetRow.file_name,size_bytes:assetRow.size_bytes,store_id:'store_1'}]};
    if(sql.startsWith('UPDATE media_cloud_assets')){deleted=true;updateCalls++;return {rowCount:1,rows:[]};}
    if(sql.startsWith('INSERT INTO media_asset_events')){eventCalls++;assert.equal(args[2],'media.broken-reference.cleaned');return {rowCount:1,rows:[]};}
    throw new Error(`Unexpected transaction SQL: ${sql}`);
  }});
  const out=await cleanupAuthorizedBrokenReference01219({accountId:'acct_1',workspaceId:'ws_1',storeId:'store_1'},'user_1','site_1',{resourceIdentity:safeItem.resourceIdentity,assetId:'mediaasset_safe',objectKey:safeItem.objectKey,confirm:true},{inventoryOptions:{provider,query:inventoryQuery},storageVerifyOptions:{provider},accessOptions:{query:accessQuery},withTransaction,now:()=>new Date('2026-09-19T01:00:00Z')});
  assert.equal(out.cleaned,true);
  assert.equal(out.historyPreserved,true);
  assert.equal(out.r2Deleted,false);
  assert.equal(updateCalls,1);
  assert.equal(eventCalls,1);
  assert.equal(deleteObjectCalls,0);
});

test('01219 server exposes guarded cleanup route with database-row capability',()=>{
  const source=fs.readFileSync(new URL('../src/server.mjs',import.meta.url),'utf8');
  assert.match(source,/site-resource-inventory'.*p\[5\].*p\[6\]==='cleanup'/s);
  assert.match(source,/admin\.database\.rows/);
  assert.match(source,/cleanupTrafficSiteBrokenReference01219/);
});
