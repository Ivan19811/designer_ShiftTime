import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildSiteResourceIndex01213,
  listSiteResourceInventoryFromIndex01213,
  getSiteResourceInventoryFromIndex01213,
  getOrBuildSiteResourceIndex01213,
  getLatestSiteResourceIndex01214,
  clearSiteResourceIndexCache01213,
} from '../src/site-resource-inventory-01213.mjs';
import {filterAuthorizedSitesByMemberships01213} from '../src/site-resource-access-01213.mjs';
import {normalizeReferenceEdges01213} from '../src/site-resource-reference-resolvers-01213.mjs';

const sites=[
  {id:'site_a',name:'Site A',workspaceId:'ws_1',workspaceName:'Workspace 1',storeId:'store_1',storeName:'Store 1'},
  {id:'site_b',name:'Site B',workspaceId:'ws_1',workspaceName:'Workspace 1',storeId:'store_1',storeName:'Store 1'},
  {id:'site_c',name:'Site C',workspaceId:'ws_2',workspaceName:'Workspace 2',storeId:'store_2',storeName:'Store 2'},
];

const sharedKey='accounts/acct_1/workspaces/ws_1/stores/store_1/media/gallery/shared.jpg';
const unusedKey='accounts/acct_1/workspaces/ws_1/stores/store_1/media/gallery/unused.jpg';
const orphanKey='accounts/acct_1/workspaces/ws_1/stores/store_1/media/gallery/orphan.bin';

const snapshot={
  stage:'01213',available:true,accountId:'acct_1',measuredAt:'2026-09-19T10:00:00.000Z',cached:false,
  summary:{objectCount:3,totalBytes:175},sites,
  referenceEdges:[
    {module:'sites',siteId:'site_a',workspaceId:'ws_1',storeId:'store_1',resourceId:'site_a',assetId:'asset_shared',objectKey:'',sourcePath:'siteProject.hero.assetId'},
    {module:'presentation',siteId:'site_b',workspaceId:'ws_1',storeId:'store_1',resourceId:'site_b',assetId:'asset_shared',objectKey:'',sourcePath:'siteProject.presentation.assetId'},
    {module:'marketplace',siteId:'',workspaceId:'ws_1',storeId:'store_1',resourceId:'store_1',assetId:'asset_shared',objectKey:'',sourcePath:'snapshot.products.0.mediaId'},
    {module:'media',siteId:'site_a',workspaceId:'ws_1',storeId:'store_1',resourceId:'site_a',assetId:'asset_missing',objectKey:'',sourcePath:'siteProject.gallery.assetId'},
  ],
  items:[
    {physical:true,objectKey:sharedKey,fileName:'shared.jpg',sizeBytes:100,resourceType:'image',module:'media',modules:['media','marketplace'],workspaceId:'ws_1',storeId:'store_1',originSiteId:'site_a',referencedSiteIds:['site_a','site_b'],assetId:'asset_shared',statusFlags:['linked'],lastModified:'2026-09-19T09:00:00.000Z',metadataSource:['r2','media_cloud_assets','sites','presentation','marketplace']},
    {physical:true,objectKey:unusedKey,fileName:'unused.jpg',sizeBytes:50,resourceType:'image',module:'media',modules:['media'],workspaceId:'ws_1',storeId:'store_1',originSiteId:'site_a',referencedSiteIds:[],assetId:'asset_unused',statusFlags:['unused'],lastModified:'2026-09-19T08:00:00.000Z',metadataSource:['r2','media_cloud_assets']},
    {physical:false,objectKey:'',fileName:'asset_missing',sizeBytes:0,resourceType:'unknown',module:'media',modules:['media'],workspaceId:'ws_1',storeId:'store_1',originSiteId:'',referencedSiteIds:['site_a'],assetId:'asset_missing',statusFlags:['broken-reference','unknown'],lastModified:'',metadataSource:['sites']},
    {physical:true,objectKey:orphanKey,fileName:'orphan.bin',sizeBytes:25,resourceType:'other',module:'media',modules:['media'],workspaceId:'ws_1',storeId:'store_1',originSiteId:'',referencedSiteIds:[],assetId:'',statusFlags:['orphan'],lastModified:'2026-09-19T07:00:00.000Z',metadataSource:['r2']},
  ]
};

test('01213 normalizes exact and store-level reference edges without inventing site ids',()=>{
  const edges=normalizeReferenceEdges01213(snapshot.referenceEdges,sites);
  assert.equal(edges.length,4);
  assert.equal(edges.find(x=>x.module==='marketplace').siteId,'');
  assert.equal(edges.find(x=>x.module==='presentation').siteId,'site_b');
});

test('01213 builds per-site usage, origin, shared and unassigned indexes without duplicating account physical bytes',()=>{
  const index=buildSiteResourceIndex01213(snapshot);
  assert.equal(index.accountPhysicalBytes,175);
  assert.equal(index.unassigned.resourceCount,1);
  assert.equal(index.unassigned.uniquePhysicalBytes,25);
  const a=index.bySiteId.get('site_a');
  const b=index.bySiteId.get('site_b');
  assert.equal(a.summary.resourceCount,3);
  assert.equal(a.summary.referencedResourceCount,2);
  assert.equal(a.summary.referencedBytes,100);
  assert.equal(a.summary.uniquePhysicalBytes,150);
  assert.equal(a.summary.sharedResourceCount,1);
  assert.equal(a.summary.unusedCount,1);
  assert.equal(a.summary.brokenReferenceCount,1);
  assert.equal(a.summary.imageCount,2);
  assert.equal(a.summary.unknownTypeCount,1);
  assert.equal(b.summary.resourceCount,1);
  assert.equal(b.summary.referencedBytes,100);
  assert.equal(b.summary.sharedResourceCount,1);
  assert.equal(index.summary.sharedResourceCount,1);
});

test('01213 preserves exact site modules and adds matching store-level module context only to sites that actually reference the resource',()=>{
  const index=buildSiteResourceIndex01213(snapshot);
  const a=index.bySiteId.get('site_a').items.find(x=>x.assetId==='asset_shared');
  const b=index.bySiteId.get('site_b').items.find(x=>x.assetId==='asset_shared');
  assert.ok(a.siteModules.includes('sites'));
  assert.ok(a.siteModules.includes('marketplace'));
  assert.ok(b.siteModules.includes('presentation'));
  assert.ok(b.siteModules.includes('marketplace'));
  assert.equal(index.bySiteId.get('site_c').items.length,0);
});

test('01213 site detail supports module/type/status/shared/search/sort/pagination filters',()=>{
  const index=buildSiteResourceIndex01213(snapshot);
  const detail=getSiteResourceInventoryFromIndex01213(index,'site_a',{module:'marketplace',shared:'true',q:'shared',sort:'file',order:'asc',limit:1,offset:0},{allowedSiteIds:new Set(['site_a'])});
  assert.equal(detail.total,1);
  assert.equal(detail.items[0].fileName,'shared.jpg');
  assert.equal(detail.site.id,'site_a');
  assert.throws(()=>getSiteResourceInventoryFromIndex01213(index,'site_b',{}, {allowedSiteIds:new Set(['site_a'])}),error=>error?.statusCode===404);
});

test('01213 site list applies workspace/store/search pagination and allowed-site isolation',()=>{
  const index=buildSiteResourceIndex01213(snapshot);
  const list=listSiteResourceInventoryFromIndex01213(index,{workspaceId:'ws_1',storeId:'store_1',q:'Site',limit:10},{allowedSiteIds:new Set(['site_a'])});
  assert.equal(list.total,1);
  assert.equal(list.sites[0].siteId,'site_a');
  assert.equal(list.summary.siteCount,1);
  assert.deepEqual(list.facets.workspaces.map(x=>x.id),['ws_1']);
  assert.deepEqual(list.facets.stores.map(x=>x.id),['store_1']);
});

test('01213 access filtering uses only memberships that themselves grant traffic view capability',()=>{
  const memberships=[
    {accountId:'acct_1',workspaceId:'',storeId:'store_1',role:'admin',permissions:[]},
    {accountId:'acct_1',workspaceId:'',storeId:'',role:'viewer',permissions:[]},
  ];
  const allowed=filterAuthorizedSitesByMemberships01213({accountId:'acct_1',sites,memberships});
  assert.deepEqual(allowed.map(x=>x.id),['site_a','site_b']);
  const explicit=filterAuthorizedSitesByMemberships01213({accountId:'acct_1',sites,memberships:[{accountId:'acct_1',workspaceId:'ws_2',storeId:'',role:'viewer',permissions:['admin.traffic.view']}]});
  assert.deepEqual(explicit.map(x=>x.id),['site_c']);
});

test('01213 server routes Site Resource Inventory through traffic capability and authenticated user id',async()=>{
  const fs=await import('node:fs');
  const server=fs.readFileSync(new URL('../src/server.mjs',import.meta.url),'utf8');
  const service=fs.readFileSync(new URL('../src/traffic-service-01194.mjs',import.meta.url),'utf8');
  assert.match(server,/p\[4\]===['"]site-resource-inventory['"]/);
  assert.match(server,/assertCapability01087\(scope,['"]admin\.traffic\.view['"]/);
  assert.match(server,/listTrafficSiteResourceInventory01213\(scope,session\.userId/);
  assert.match(server,/getTrafficSiteResourceInventory01213\(scope,session\.userId/);
  assert.match(service,/listAuthorizedSiteResourceInventory01213\(scope,userId,input\)/);
  assert.match(service,/getAuthorizedSiteResourceInventory01213\(scope,userId,siteId,input\)/);
});

test('01213 canonical public R2 response does not expose internal reference edge graph',async()=>{
  const {filterInventorySnapshot01210}=await import('../src/storage-object-inventory-01210.mjs');
  const out=filterInventorySnapshot01210({...snapshot,referenceEdges:[{siteId:'site_a',assetId:'secret_internal_edge'}]},{limit:10});
  assert.equal(Object.hasOwn(out,'referenceEdges'),false);
});


test('01214 keeps the latest Account Site Resource Index available for detail navigation without another R2 snapshot build',()=>{
  clearSiteResourceIndexCache01213('acct_1');
  assert.equal(getLatestSiteResourceIndex01214('acct_1'),null);
  const index=getOrBuildSiteResourceIndex01213(snapshot);
  assert.equal(getLatestSiteResourceIndex01214('acct_1'),index);
  clearSiteResourceIndexCache01213('acct_1');
  assert.equal(getLatestSiteResourceIndex01214('acct_1'),null);
});

test('01214 detail path prefers the latest Site Resource Index and manual R2 refresh invalidates that index',async()=>{
  const fs=await import('node:fs');
  const inventory=fs.readFileSync(new URL('../src/site-resource-inventory-01213.mjs',import.meta.url),'utf8');
  const traffic=fs.readFileSync(new URL('../src/traffic-service-01194.mjs',import.meta.url),'utf8');
  assert.match(inventory,/let index=getLatestSiteResourceIndex01214\(scope\?\.accountId\)/);
  assert.match(inventory,/if\(!index\)\{const snapshot=await getAuthorizedR2InventorySnapshot01210/);
  assert.match(traffic,/clearSiteResourceIndexCache01213\(scope\.accountId\)/);
});
