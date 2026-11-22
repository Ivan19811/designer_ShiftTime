import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {classifyProtectedAction01600,grantDecision01600,requireProtectedAccess01600} from '../src/access-enforcement-core-01600.mjs';
import {inspectProtectedAccess01600,assertLegacyForUnmanaged01600} from '../src/access-enforcement-service-01600.mjs';
const parts=p=>'/api/v1/'+p;
const action=(method,path)=>classifyProtectedAction01600(method,parts(path).split('/').filter(Boolean));
const scope={accountId:'acct_1',workspaceId:'workspace_1',storeId:'store_1',role:'manager'};
const actor='usr_'+'a'.repeat(24);
const row=(permissions,scopeKind='store',siteId=null)=>({permissions,scopeKind,siteId});
function mockDb({enrolled=true,siteValid=true,grants=[]}={}){
  const calls=[];
  return {calls,run:async fn=>fn({query:async(sql,params)=>{
    calls.push({sql,params});
    if(sql.includes('FROM platform_access_enrollments_01600'))return {rowCount:enrolled?1:0,rows:enrolled?[{mode:'custom'}]:[]};
    if(sql.includes('FROM shifttime_builder_sites WHERE'))return {rowCount:siteValid?1:0,rows:siteValid?[{id:params[0]}]:[]};
    if(sql.includes('FROM platform_role_assignments_01597')){const filtered=grants.filter(r=>r.scopeKind==='store'||r.scopeKind==='site'&&(params[5]===true||r.siteId===params[4]));return {rowCount:filtered.length,rows:filtered};}
    throw Error('Unexpected query '+sql);
  }})};
}
test('01600 classifier covers site create/edit/delete/publish and revisions',()=>{
  for(const [m,path,permission] of [['POST','sites','site.pages.create'],['PUT','sites/site_1','site.pages.edit'],['PATCH','sites/site_1/metadata','site.pages.edit'],['DELETE','sites/site_1','site.publish.delete'],['POST','sites/site_1/publish','site.publish.execute'],['POST','sites/site_1/revisions/rev_1/publish','site.publish.execute'],['DELETE','sites/site_1/revisions/rev_1','site.pages.delete'],['GET','sites/site_1','site.pages.view']]) assert.equal(action(m,path)?.permission,permission,path);
  assert.equal(action('POST','sites/site_1/publish')?.siteId,'site_1');
});
test('01600 classifier covers direct catalog and snapshot bypass candidates',()=>{
  for(const [m,path,permission] of [['POST','marketplace/products','shop.products.create'],['PATCH','marketplace/products/id','shop.products.edit'],['DELETE','marketplace/products/id','shop.products.delete'],['PATCH','marketplace/variants/id','shop.products.edit'],['POST','marketplace/feeds','shop.products.edit'],['PUT','marketplace/snapshot','shop.products.import'],['DELETE','marketplace/snapshot','shop.products.delete'],['POST','marketplace/products/replacement-apply','shop.products.import'],['POST','marketplace/products/bulk-status','shop.products.edit'],['GET','marketplace/products','shop.products.view'],['GET','marketplace/snapshot','shop.products.view'],['POST','network/products/id/sync','shop.products.edit']]) assert.equal(action(m,path)?.permission,permission,path);
});
test('01600 classifier covers seller orders and internal review mutations',()=>{
  for(const [m,path,permission] of [['GET','network/orders','shop.orders.view'],['PATCH','network/orders/id','shop.orders.edit'],['GET','integrations/shipping-hub/orders-review','shop.orders.view'],['GET','integrations/shipping-hub/orders-review/id/activity','shop.orders.view'],['PATCH','integrations/shipping-hub/orders-review/id/workflow','shop.orders.status'],['POST','integrations/shipping-hub/orders-review/id/notes','shop.orders.edit'],['POST','integrations/shipping-hub/orders-review/id/production-order','shop.orders.edit']]) assert.equal(action(m,path)?.permission,permission,path);
  assert.equal(action('POST','public/marketplace/orders'),null,'public checkout is a separate buyer flow');
  assert.equal(action('POST','shop/direct-checkout/place'),null,'buyer direct checkout remains separately protected');
});
test('01600 appended path segments cannot bypass legacy lax route conditions',()=>{
  for(const [method,path,permission] of [['POST','sites/site_1/publish/junk','site.publish.execute'],['PATCH','network/orders/order_1/junk','shop.orders.edit'],['PATCH','marketplace/products/id/extra','shop.products.edit'],['DELETE','marketplace/products/id/extra','shop.products.delete'],['POST','network/products/id/publish/extra','shop.products.edit'],['POST','network/listings/id/unpublish/extra','shop.products.edit']]){
    assert.equal(action(method,path)?.permission,permission,path);
  }
});
test('01600 custom role disallows everything not explicitly granted; owner unchanged',()=>{
  assert.deepEqual(grantDecision01600({role:'owner',enrolled:true,permission:'site.publish.execute'}),{allowed:true,mode:'owner'});
  assert.deepEqual(grantDecision01600({role:'admin',enrolled:true,permissions:['shop.orders.view'],permission:'site.publish.execute'}),{allowed:false,mode:'custom'});
  assert.deepEqual(grantDecision01600({role:'viewer',enrolled:true,permissions:['shop.orders.view'],permission:'shop.orders.view'}),{allowed:true,mode:'custom'});
  assert.throws(()=>requireProtectedAccess01600({allowed:false},'shop.orders.edit'),e=>e.statusCode===403&&e.code==='ST_ACCESS_ACTION_DENIED_01600');
});
test('01600 managed store grants allow the assigned permission even for legacy viewer',async()=>{
  const db=mockDb({grants:[row(['shop.orders.view'])]});
  const result=await inspectProtectedAccess01600({...scope,role:'viewer'},actor,action('GET','network/orders'),db);
  assert.equal(result.mode,'custom');assert.equal(result.allowed,true);
  assert.deepEqual(db.calls[0].params,[scope.accountId,scope.storeId,actor]);
  assert.doesNotThrow(()=>assertLegacyForUnmanaged01600({...scope,role:'viewer'},result,'order'));
});
test('01600 revoked custom role does not restore manager legacy privileges',async()=>{
  const db=mockDb({grants:[]});
  await assert.rejects(()=>inspectProtectedAccess01600(scope,actor,action('PATCH','network/orders/id'),db),{statusCode:403});
  assert.equal(db.calls.length,2);
});
test('01600 non-enrolled existing store admin retains legacy behavior',async()=>{
  const db=mockDb({enrolled:false});
  const res=await inspectProtectedAccess01600({...scope,role:'admin'},actor,action('PATCH','network/orders/id'),db);
  assert.equal(res.mode,'legacy');assert.equal(res.allowed,true);
});
test('01600 managed role cannot use site grant on another site or without site',async()=>{
  const db=mockDb({grants:[row(['site.pages.edit'],'site','site_1')]});
  await assert.rejects(()=>inspectProtectedAccess01600(scope,actor,action('PUT','sites/site_2'),db),{statusCode:403});
  assert.deepEqual(db.calls.at(-1).params.slice(-2),['site_2',false]);
  const good=mockDb({grants:[row(['site.pages.edit'],'site','site_1')]});
  assert.equal((await inspectProtectedAccess01600(scope,actor,action('PUT','sites/site_1'),good)).allowed,true);
});
test('01600 rejects foreign site even if store-level permission granted',async()=>{
  const db=mockDb({siteValid:false,grants:[row(['site.pages.edit'])]});
  await assert.rejects(()=>inspectProtectedAccess01600(scope,actor,action('PUT','sites/foreign_site'),db),{statusCode:403});
});
test('01600 restricts site listing to explicitly allowed site IDs',async()=>{
  const db=mockDb({grants:[row(['site.pages.view'],'site','site_1'),row(['site.pages.edit'],'site','site_2')]});
  const res=await inspectProtectedAccess01600(scope,actor,action('GET','sites'),db);
  assert.deepEqual(res.allowedSiteIds,['site_1']);
  assert.equal(db.calls.at(-1).params[5],true);
  const storeWide=mockDb({grants:[row(['site.pages.view'])]});
  const unrestricted=await inspectProtectedAccess01600(scope,actor,action('GET','sites'),storeWide);
  assert.equal(unrestricted.allowedSiteIds,null);
});
test('01600 role assignment and SQL migration preserve sticky enrollment',()=>{
  const service=fs.readFileSync(new URL('../src/access-policy-service-01597.mjs',import.meta.url),'utf8');
  const migration=fs.readFileSync(new URL('../sql/062_access_enrollments_01600.sql',import.meta.url),'utf8');
  assert.match(service,/INSERT INTO platform_access_enrollments_01600/);
  assert.match(migration,/INSERT INTO platform_access_enrollments_01600\(account_id,store_id,user_id\)/);
  assert.match(migration,/ON CONFLICT .* DO NOTHING/);
});
test('01600 gates run after authentication and before resource route',()=>{
  const source=fs.readFileSync(new URL('../src/server.mjs',import.meta.url),'utf8');
  assert.ok(source.indexOf('const protectedAction01600=')>source.indexOf('const scope=await resolveAuthorizedStore'));
  assert.ok(source.indexOf('const protectedAction01600=')<source.indexOf("if(p[2]==='sites'&&p[3]&&p[4]==='revisions')"));
  assert.match(source,/sites\.filter\(s=>onlySites\.includes\(s\.id\)\)/);
});
