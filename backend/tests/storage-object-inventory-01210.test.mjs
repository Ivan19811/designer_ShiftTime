import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildInventorySnapshot01210,classifyResourceType01210,filterInventorySnapshot01210,parseStorageObjectPath01210,getAuthorizedR2InventorySnapshot01210,clearR2InventoryCache01210} from '../src/storage-object-inventory-01210.mjs';
import {collectStorageReferences01210,collectMarketplaceStorageReferences01210} from '../src/storage-reference-resolvers-01210.mjs';

const scope={accountId:'acct_1',workspaceId:'ws_1',storeId:'store_1'};
const path=name=>`accounts/acct_1/workspaces/ws_1/stores/store_1/media/gallery/${name}`;

test('01210 resource classifier covers primary storage families and keeps extension-only unknowns visible as other',()=>{
  assert.equal(classifyResourceType01210({mimeType:'image/webp',objectKey:'x.bin'}),'image');
  assert.equal(classifyResourceType01210({objectKey:'x/report.pdf'}),'pdf');
  assert.equal(classifyResourceType01210({objectKey:'x/model.glb'}),'3d');
  assert.equal(classifyResourceType01210({objectKey:'x/data.json'}),'json/data');
  assert.equal(classifyResourceType01210({objectKey:'x/future.xyzabc'}),'other');
  assert.equal(classifyResourceType01210({objectKey:'x/no-extension'}),'unknown');
});

test('01210 object path parser resolves account/workspace/store/module without inventing siteId',()=>{
  assert.deepEqual(parseStorageObjectPath01210(path('a.webp')),{accountId:'acct_1',workspaceId:'ws_1',storeId:'store_1',module:'media',pathParts:['accounts','acct_1','workspaces','ws_1','stores','store_1','media','gallery','a.webp']});
});

test('01210 generic reference collector extracts cloud asset ids, object keys and CDN object paths',()=>{
  const refs=collectStorageReferences01210({cloudMetadata:{assetId:'media_1',objectKey:path('a.webp')},url:`https://cdn.example/${path('a.webp')}`},{module:'sites',siteId:'site_1'});
  assert.ok(refs.some(x=>x.assetId==='media_1'));
  assert.ok(refs.some(x=>x.objectKey===path('a.webp')));
  assert.ok(refs.every(x=>x.siteId==='site_1'));
});

test('01212 site resolver recognizes canonical public media delivery URLs as asset references',()=>{
  const refs=collectStorageReferences01210({hero:{imageUrl:'https://designer-shifttime.onrender.com/api/v1/public/media/mediaasset_gallery123'}},{module:'sites',siteId:'site_1',siteName:'Site One'});
  assert.ok(refs.some(x=>x.assetId==='mediaasset_gallery123'));
  assert.ok(refs.some(x=>x.siteId==='site_1'));
});

test('01212 Gallery delivery URL changes a ready R2 object from Unused to Linked',()=>{
  const key=path('gallery.jpg');
  const refs=collectStorageReferences01210({fill:{url:'https://designer-shifttime.onrender.com/api/v1/public/media/mediaasset_gallery123'}},{module:'sites',siteId:'site_1',siteName:'Site One'});
  const referenceState={sites:[{id:'site_1',name:'Site One',workspaceId:'ws_1',storeId:'store_1'}],siteById:new Map([['site_1',{id:'site_1',name:'Site One'}]]),mediaAssets:[{id:'mediaasset_gallery123',workspaceId:'ws_1',storeId:'store_1',objectKey:key,kind:'image',fileName:'gallery.jpg',mimeType:'image/jpeg',sizeBytes:123,status:'ready',metadata:{trafficSiteId:'site_1'}}],derivativeAssets:[],references:refs};
  const snapshot=buildInventorySnapshot01210({scope,objects:[{objectKey:key,sizeBytes:123}],referenceState,providerInfo:{provider:'r2',bucket:'b',prefix:'accounts/acct_1/',pages:1}});
  const row=snapshot.items.find(item=>item.assetId==='mediaasset_gallery123');
  assert.ok(row);
  assert.deepEqual(row.statusFlags,['linked']);
  assert.deepEqual(row.referencedSiteIds,['site_1']);
});

test('01210 Marketplace resolver links only media ids that are actually referenced outside the media library',()=>{
  const snapshot={products:[{id:'p1',mediaIds:['m_used'],primaryMediaId:'m_used'}],media:[{id:'m_used',metadata:{assetId:'asset_used',objectKey:path('used.webp')}},{id:'m_unused',metadata:{assetId:'asset_unused',objectKey:path('unused.webp')}}]};
  const refs=collectMarketplaceStorageReferences01210(snapshot,{storeId:'store_1'});
  assert.ok(refs.some(x=>x.assetId==='asset_used'));
  assert.ok(refs.filter(x=>x.assetId==='asset_used').every(x=>x.module==='marketplace'));
  assert.ok(!refs.some(x=>x.assetId==='asset_unused'));
});

test('01210 inventory reconciles Linked, Unused, Orphan, Unknown and Broken Reference in one canonical snapshot',()=>{
  const linked=path('linked.webp'),unused=path('unused.webp'),orphan=path('orphan.mp4'),unknown=path('no-extension'),broken=path('missing.pdf');
  const referenceState={
    sites:[{id:'site_1',name:'Site One',workspaceId:'ws_1',storeId:'store_1'}],siteById:new Map([['site_1',{id:'site_1',name:'Site One'}]]),
    mediaAssets:[
      {id:'asset_linked',workspaceId:'ws_1',storeId:'store_1',objectKey:linked,kind:'image',fileName:'linked.webp',mimeType:'image/webp',sizeBytes:10,status:'ready',metadata:{trafficSiteId:'site_1'}},
      {id:'asset_unused',workspaceId:'ws_1',storeId:'store_1',objectKey:unused,kind:'image',fileName:'unused.webp',mimeType:'image/webp',sizeBytes:20,status:'ready',metadata:{}},
      {id:'asset_broken',workspaceId:'ws_1',storeId:'store_1',objectKey:broken,kind:'document',fileName:'missing.pdf',mimeType:'application/pdf',sizeBytes:99,status:'ready',metadata:{}},
    ],
    references:[{module:'sites',siteId:'site_1',siteName:'Site One',workspaceId:'ws_1',storeId:'store_1',resourceId:'site_1',assetId:'asset_linked',objectKey:linked,sourcePath:'project.hero'}]
  };
  const snapshot=buildInventorySnapshot01210({scope,objects:[{objectKey:linked,sizeBytes:10},{objectKey:unused,sizeBytes:20},{objectKey:orphan,sizeBytes:30},{objectKey:unknown,sizeBytes:40}],referenceState,providerInfo:{provider:'r2',bucket:'bucket',prefix:'accounts/acct_1/',pages:1},measuredAt:'2026-09-18T10:00:00.000Z'});
  const byKey=new Map(snapshot.items.map(x=>[x.objectKey,x]));
  assert.deepEqual(byKey.get(linked).statusFlags,['linked']);
  assert.deepEqual(byKey.get(unused).statusFlags,['unused']);
  assert.deepEqual(byKey.get(orphan).statusFlags,['orphan']);
  assert.ok(byKey.get(unknown).statusFlags.includes('orphan')&&byKey.get(unknown).statusFlags.includes('unknown'));
  assert.ok(byKey.get(broken).statusFlags.includes('broken-reference'));
  assert.equal(byKey.get(linked).originSiteId,'site_1');
  assert.deepEqual(byKey.get(linked).referencedSiteIds,['site_1']);
  assert.equal(snapshot.summary.objectCount,4);
  assert.equal(snapshot.summary.totalBytes,100);
  assert.equal(snapshot.summary.byStatus['broken-reference'].count,1);
});

test('01210 inventory filters/search/sorts server-side response model',()=>{
  const snapshot={available:true,provider:'r2',bucket:'b',prefix:'accounts/a/',pages:1,measuredAt:'x',summary:{},sites:[],items:[
    {fileName:'small.jpg',objectKey:'x/small.jpg',sizeBytes:10,resourceType:'image',module:'media',modules:['media'],statusFlags:['linked'],originSiteId:'site_1',referencedSiteIds:['site_1'],siteLabels:['Alpha']},
    {fileName:'big.mp4',objectKey:'x/big.mp4',sizeBytes:500,resourceType:'video',module:'sites',modules:['sites'],statusFlags:['orphan'],originSiteId:'',referencedSiteIds:[],siteLabels:[]},
  ]};
  const out=filterInventorySnapshot01210(snapshot,{status:'orphan',sort:'size',order:'desc',limit:10});
  assert.equal(out.total,1);assert.equal(out.items[0].fileName,'big.mp4');
  assert.equal(filterInventorySnapshot01210(snapshot,{q:'alpha'}).items[0].fileName,'small.jpg');
});

test('01210 S3-compatible provider exposes one canonical paginated list primitive reused by usage measurement',()=>{
  const source=fs.readFileSync(new URL('../src/storage-providers/s3-compatible-storage-provider.mjs',import.meta.url),'utf8');
  assert.match(source,/listObjects01210/);assert.match(source,/ListObjectsV2Command/);assert.match(source,/MaxKeys:1000/);assert.match(source,/ContinuationToken/);assert.match(source,/NextContinuationToken/);assert.match(source,/measurePrefixUsage01209\(\{prefix/);assert.match(source,/this\.listObjects01210\(\{prefix\}\)/);
});

test('01210 account cache is single-flight for concurrent inventory requests',async()=>{
  clearR2InventoryCache01210();let listCalls=0,queryCalls=0;
  const provider={isConfigured:()=>true,getInfo:()=>({type:'r2',bucket:'b'}),listObjects01210:async()=>{listCalls++;await new Promise(r=>setTimeout(r,20));return {items:[],pages:1};}};
  const query=async()=>{queryCalls++;return {rows:[]};};
  const [a,b]=await Promise.all([getAuthorizedR2InventorySnapshot01210(scope,{provider,query}),getAuthorizedR2InventorySnapshot01210(scope,{provider,query})]);
  assert.equal(listCalls,1);assert.equal(queryCalls,5);assert.equal(a.stage,'01212');assert.equal(b.stage,'01212');
});

test('01210 inventory never surfaces a physical object outside the authorized account prefix',()=>{
  const snapshot=buildInventorySnapshot01210({scope,objects:[{objectKey:path('inside.jpg'),sizeBytes:5},{objectKey:'accounts/acct_2/workspaces/ws_2/stores/store_2/media/gallery/outside.jpg',sizeBytes:999}],referenceState:{mediaAssets:[],references:[],sites:[],siteById:new Map()},providerInfo:{provider:'r2',bucket:'b',prefix:'accounts/acct_1/',pages:1}});
  assert.equal(snapshot.summary.objectCount,1);
  assert.equal(snapshot.summary.totalBytes,5);
  assert.equal(snapshot.items.length,1);
  assert.equal(snapshot.items[0].objectKey,path('inside.jpg'));
});

test('01210 server routes inventory only through admin Traffic capability and traffic service',()=>{
  const server=fs.readFileSync(new URL('../src/server.mjs',import.meta.url),'utf8');
  const trafficService=fs.readFileSync(new URL('../src/traffic-service-01194.mjs',import.meta.url),'utf8');
  assert.match(server,/p\[3\]===['"]traffic['"][^\n]*p\[4\]===['"]r2-inventory['"]/);
  assert.match(server,/p\[5\]===['"]refresh['"]/);
  assert.match(server,/assertAdminView01087\(scope\)/);
  assert.match(server,/assertCapability01087\(scope,['"]admin\.traffic\.view['"]/);
  assert.match(trafficService,/listTrafficR2Inventory01210/);
  assert.match(trafficService,/refreshTrafficR2Inventory01210/);
});


test('01210 selectively HEADs only objects whose type cannot be resolved from metadata or extension',async()=>{
  clearR2InventoryCache01210();let headCalls=0;
  const provider={isConfigured:()=>true,getInfo:()=>({type:'r2',bucket:'b'}),listObjects01210:async()=>({items:[{objectKey:path('known.jpg'),sizeBytes:1},{objectKey:path('extensionless'),sizeBytes:2}],pages:1}),headObject:async({key})=>{headCalls++;assert.match(key,/extensionless$/);return {mimeType:'video/mp4'};}};
  const query=async()=>({rows:[]});
  const snapshot=await getAuthorizedR2InventorySnapshot01210(scope,{provider,query,forceRefresh:true});
  assert.equal(headCalls,1);
  const row=snapshot.items.find(item=>item.objectKey.endsWith('/extensionless'));
  assert.equal(row.resourceType,'video');
});

test('01210 derivative metadata prevents known derivative objects from being mislabeled as orphan and detects missing ready derivatives',()=>{
  const parent=path('parent.jpg'),thumb=path('parent-thumb.webp'),missing=path('missing-thumb.webp');
  const referenceState={sites:[],siteById:new Map(),mediaAssets:[{id:'asset_parent',workspaceId:'ws_1',storeId:'store_1',objectKey:parent,kind:'image',fileName:'parent.jpg',mimeType:'image/jpeg',status:'ready',metadata:{}}],derivativeAssets:[{id:'derivative_1',mediaAssetId:'asset_parent',workspaceId:'ws_1',storeId:'store_1',objectKey:thumb,kind:'image',fileName:'parent-thumb.webp',mimeType:'image/webp',status:'ready'},{id:'derivative_2',mediaAssetId:'asset_parent',workspaceId:'ws_1',storeId:'store_1',objectKey:missing,kind:'image',fileName:'missing-thumb.webp',mimeType:'image/webp',status:'ready'}],references:[]};
  const snapshot=buildInventorySnapshot01210({scope,objects:[{objectKey:parent,sizeBytes:10},{objectKey:thumb,sizeBytes:3}],referenceState,providerInfo:{provider:'r2',bucket:'b',prefix:'accounts/acct_1/',pages:1}});
  const byKey=new Map(snapshot.items.map(item=>[item.objectKey,item]));
  assert.deepEqual(byKey.get(thumb).statusFlags,['unused']);
  assert.equal(byKey.get(thumb).derivativeId,'derivative_1');
  assert.ok(byKey.get(missing).statusFlags.includes('broken-reference'));
  assert.equal(byKey.get(missing).derivativeId,'derivative_2');
});

test('01210 active references to deleted metadata assets are surfaced as Broken Reference',()=>{
  const deleted=path('deleted.jpg');
  const referenceState={sites:[{id:'site_1',name:'Site One'}],siteById:new Map([['site_1',{id:'site_1',name:'Site One'}]]),mediaAssets:[{id:'asset_deleted',workspaceId:'ws_1',storeId:'store_1',objectKey:deleted,kind:'image',fileName:'deleted.jpg',mimeType:'image/jpeg',status:'deleted',metadata:{}}],derivativeAssets:[],references:[{module:'sites',siteId:'site_1',resourceId:'site_1',assetId:'asset_deleted',objectKey:'',sourcePath:'hero.assetId'}]};
  const snapshot=buildInventorySnapshot01210({scope,objects:[],referenceState,providerInfo:{provider:'r2',bucket:'b',prefix:'accounts/acct_1/',pages:1}});
  const row=snapshot.items.find(item=>item.assetId==='asset_deleted');
  assert.ok(row);
  assert.ok(row.statusFlags.includes('broken-reference'));
  assert.deepEqual(row.referencedSiteIds,['site_1']);
});
