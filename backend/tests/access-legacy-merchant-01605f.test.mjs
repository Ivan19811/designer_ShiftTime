import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {classifyLegacyMerchantAction01605F} from '../src/access-audit-core-01605f.mjs';
import {classifyExtendedAction01601} from '../src/access-enforcement-core-01601.mjs';
import {ACCESS_PERMISSIONS_01597} from '../src/access-policy-core-01597.mjs';
import {inspectProtectedAccess01600} from '../src/access-enforcement-service-01600.mjs';
const parts=p=>`/api/v1/${p}`.split('/').filter(Boolean);
const decision=(method,path)=>classifyLegacyMerchantAction01605F(method,parts(path));
const extended=(method,path)=>classifyExtendedAction01601(method,parts(path));
const source=fs.readFileSync(new URL('../src/server.mjs',import.meta.url),'utf8');
const known=new Set(ACCESS_PERMISSIONS_01597.map(r=>r.code));

test('01605F exact merchant context and category merge preview permission',()=>{
  for(const [method,path] of [['GET','network/context'],['POST','marketplace/category-merge/preview']]){
    assert.deepEqual({...decision(method,path)},{permission:'shop.products.view',siteId:'',legacy:'read'});
    assert.ok(known.has(decision(method,path).permission));
  }
});
test('01605F rejects public endpoints, writes, unauthorized URL aliases',()=>{
  for(const [method,path] of [
    ['GET','public/network/context'],['GET','network/context/extra'],['PATCH','network/context'],
    ['POST','marketplace/category-merge/preview/extra'],['POST','marketplace/category-merge/apply'],
    ['GET','marketplace/category-merge/preview'],['POST','shop/direct-checkout/place'],
    ['GET','public/marketplace/products'],['POST','marketplace/import-rollbacks/id/restore']
  ]) assert.equal(decision(method,path),null,method+' '+path);
});
test('01605F narrow grants: orders view does not disclose private seller network or category snapshot',async()=>{
  const scope={accountId:'acct_A',workspaceId:'ws_A',storeId:'store_A',role:'viewer'};
  const run=async fn=>fn({query:async sql=>{
    if(sql.includes('FROM platform_access_enrollments_01600'))return {rowCount:1,rows:[{mode:'custom'}]};
    if(sql.includes('FROM platform_role_assignments_01597'))return {rowCount:1,rows:[{permissions:['shop.orders.view'],scopeKind:'store',siteId:null}]};
    throw Error('Unexpected SQL');
  }});
  for(const [method,path] of [['GET','network/context'],['POST','marketplace/category-merge/preview']]){
    await assert.rejects(inspectProtectedAccess01600(scope,'usr_test',decision(method,path),{run}),{statusCode:403});
  }
});
test('01605F narrow grants permit product-view for both read-only operations',async()=>{
  const scope={accountId:'acct_A',workspaceId:'ws_A',storeId:'store_A',role:'viewer'};
  const run=async fn=>fn({query:async sql=>{
    if(sql.includes('FROM platform_access_enrollments_01600'))return {rowCount:1,rows:[{mode:'custom'}]};
    if(sql.includes('FROM platform_role_assignments_01597'))return {rowCount:1,rows:[{permissions:['shop.products.view'],scopeKind:'store',siteId:null}]};
    throw Error('Unexpected SQL');
  }});
  for(const [method,path] of [['GET','network/context'],['POST','marketplace/category-merge/preview']]){
    const result=await inspectProtectedAccess01600(scope,'usr_test',decision(method,path),{run});
    assert.equal(result.allowed,true);
  }
});
test('01605F owner and legacy viewer retain familiar merchant reads',async()=>{
  const owner={accountId:'acct_A',workspaceId:'ws_A',storeId:'store_A',role:'owner'};
  const legacy={...owner,role:'viewer'};
  for(const [method,path] of [['GET','network/context'],['POST','marketplace/category-merge/preview']]){
    const d=decision(method,path);
    assert.equal((await inspectProtectedAccess01600(owner,'usr_owner',d,{run:()=>{throw Error('owner should not need database for store-level read');}})).mode,'owner');
    const out=await inspectProtectedAccess01600(legacy,'usr_view',d,{run:async fn=>fn({query:async()=>({rowCount:0,rows:[]})})});
    assert.equal(out.mode,'legacy');
  }
});
test('01605F supplier read + approval detail remain classified and compatible',()=>{
  for(const path of ['marketplace/supplier-sync-schedules','marketplace/supplier-sync-alerts','marketplace/supplier-sync-alert-rules','marketplace/supplier-sync-approvals','marketplace/supplier-sync-approvals/approval1'])
    assert.equal(extended('GET',path)?.permission,'shop.suppliersync.view',path);
});
test('01605F unknown supplier and merchant aliases are not recognized by exact 01601 classifier',()=>{
  const aliases=[['PUT','marketplace/supplier-sync-schedules/s1/unexpected'],['POST','marketplace/supplier-sync-approvals/a1/approve/trailing'],['POST','marketplace/import-rollbacks/a1/restore/trailing'],['PATCH','network/shipping/d1/trailing'],['PATCH','network/payments/p1/trailing'],['POST','network/shipping/d1/simulate/trailing'],['GET','marketplace/supplier-sync-approvals/a1/extra']];
  for(const [method,path] of aliases)assert.equal(extended(method,path),null,`${method} ${path}`);
});
test('01605F gate is before merchant handlers and request bodies',()=>{
  assert.match(source,/const protectedAction01600=classifyLegacyMerchantAction01605F\(req\.method,p\)\|\|classifyLegacyReadAction01605E/);
  const gate=source.indexOf('const protectedAction01600=');
  assert.ok(gate>=0&&gate<source.indexOf("if(p[2]==='network'&&p[3]==='inventory')"));
  assert.ok(gate<source.indexOf("if(p[3]==='category-merge'&&p[4]==='preview'"));
  assert.match(source,/if\(req\.method==='GET'&&p\[3\]==='context'&&p\.length===4\)/);
  assert.match(source,/if\(p\[3\]==='category-merge'&&p\[4\]==='preview'&&p\.length===5&&req\.method==='POST'\)/);
});
test('01605F forbidden URL aliases cannot reach legacy supplier, seller or rollback handlers',()=>{
  const required=[
    "if(req.method==='PUT'&&sourceId&&p.length===5)",
    "if(req.method==='POST'&&sourceId&&p[5]==='run'&&p.length===6)",
    "if(req.method==='POST'&&approvalId&&p[5]==='approve'&&p.length===6)",
    "if(req.method==='POST'&&p[4]&&p[5]==='restore'&&p.length===6)",
    "if(req.method==='GET'&&p[4]&&p[5]==='preview'&&p.length===6)",
    "if(req.method==='PATCH'&&p[3]==='seller'&&p.length===4)",
    "if(req.method==='PATCH'&&p[4]&&p.length===5){assertLegacyForUnmanaged01600(scope,protectedDecision01600);return sendJson(res,200,await transitionAuthorizedPayment",
    "if(req.method==='POST'&&p[3]==='products'&&p[4]&&p[5]==='publish'&&p.length===6)",
    "if(req.method==='GET'&&id&&p.length===5)"
  ];
  for(const snippet of required)assert.ok(source.includes(snippet),snippet);
});

test('01605F SQL seller offers are restricted by the actual active Store as well as listing-derived IDs',()=>{
  const network=fs.readFileSync(new URL('../src/marketplace-network-service.mjs',import.meta.url),'utf8');
  assert.match(network,/FROM marketplace_seller_offers WHERE id=ANY\(\$1::text\[\]\) AND store_id=\$2`,\[offerIds,scope\.storeId\]/);
  assert.match(network,/FROM marketplace_listings l WHERE l\.marketplace_id=\$1 AND l\.store_id=\$2/);
  assert.match(network,/FROM marketplace_seller_profiles WHERE marketplace_id=\$1 AND store_id=\$2/);
});
