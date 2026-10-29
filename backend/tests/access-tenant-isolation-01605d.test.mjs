import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {classifyTenantIsolationAction01605D} from '../src/access-audit-core-01605d.mjs';
import {classifyProtectedAction01600} from '../src/access-enforcement-core-01600.mjs';
import {inspectProtectedAccess01600} from '../src/access-enforcement-service-01600.mjs';
const p=s=>('/api/v1/'+s).split('/').filter(Boolean);
const classify=(method,path)=>classifyTenantIsolationAction01605D(method,p(path));
const scope={accountId:'acct_demo',workspaceId:'ws_demo',storeId:'store_demo',userId:'usr_demo',role:'viewer'};
const actor='usr_'+'b'.repeat(24);
const siteAction=(siteId,permission='site.pages.edit')=>({siteId,permission,legacy:'write'});
const recordDb=({enrolled=true,valid=true,assignments=[]}={})=>{
  const calls=[];
  return {calls,run:async fn=>fn({query:async(sql,params)=>{
    calls.push({sql,params});
    if(sql.includes('FROM platform_access_enrollments_01600'))return {rowCount:enrolled?1:0,rows:enrolled?[{mode:'custom'}]:[]};
    if(sql.includes('FROM shifttime_builder_sites WHERE'))return {rowCount:valid?1:0,rows:valid?[{id:params[0]}]:[]};
    if(sql.includes('FROM platform_role_assignments_01597'))return {rowCount:assignments.length,rows:assignments};
    throw Error('UNEXPECTED_SQL');
  }})};
};
test('01605D owner cannot use a foreign site path, regardless of owner bypass',async()=>{
  const db=recordDb({valid:false});
  await assert.rejects(()=>inspectProtectedAccess01600({...scope,role:'owner'},actor,siteAction('site_other'),db),e=>e.statusCode===403&&e.code==='ST_ACCESS_SITE_SCOPE_DENIED_01600');
  assert.equal(db.calls.length,1);
  assert.deepEqual(db.calls[0].params,['site_other',scope.accountId,scope.workspaceId,scope.storeId]);
});
test('01605D authorized owner still works; owner does not need a custom role',async()=>{
  const db=recordDb({valid:true});
  const result=await inspectProtectedAccess01600({...scope,role:'owner'},actor,siteAction('site_mine'),db);
  assert.deepEqual(result,{allowed:true,mode:'owner',permission:'site.pages.edit'});
  assert.equal(db.calls.length,1);
});
test('01605D legacy manager cannot use foreign site even with broad old permissions',async()=>{
  const db=recordDb({enrolled:false,valid:false});
  await assert.rejects(()=>inspectProtectedAccess01600({...scope,role:'manager'},actor,siteAction('site_other'),db),e=>e.statusCode===403&&e.code==='ST_ACCESS_SITE_SCOPE_DENIED_01600');
  assert.equal(db.calls.length,2);
  assert.deepEqual(db.calls[1].params,['site_other',scope.accountId,scope.workspaceId,scope.storeId]);
});
test('01605D legacy manager retains authorized same-store site edit',async()=>{
  const db=recordDb({enrolled:false,valid:true});
  const result=await inspectProtectedAccess01600({...scope,role:'manager'},actor,siteAction('site_mine'),db);
  assert.equal(result.mode,'legacy');assert.equal(result.allowed,true);
});
test('01605D custom store role may not use a site belonging to another Store',async()=>{
  const db=recordDb({enrolled:true,valid:false,assignments:[{permissions:['site.pages.edit'],scopeKind:'store',siteId:null}]});
  await assert.rejects(()=>inspectProtectedAccess01600(scope,actor,siteAction('foreign_site'),db),{statusCode:403});
  assert.equal(db.calls.length,2,'must reject before reading assignments');
});
test('01605D custom site role cannot operate on a different valid site',async()=>{
  const db=recordDb({enrolled:true,valid:true,assignments:[]});
  await assert.rejects(()=>inspectProtectedAccess01600(scope,actor,siteAction('site_other'),db),{statusCode:403});
  assert.equal(db.calls.length,3);
  assert.deepEqual(db.calls[2].params.slice(-2),['site_other',false]);
});
test('01605D other Store cannot contribute custom role assignments',async()=>{
  const db=recordDb({enrolled:true,valid:true,assignments:[]});
  await assert.rejects(()=>inspectProtectedAccess01600(scope,actor,{permission:'shop.orders.view',siteId:'',legacy:'order-write'},db),{statusCode:403});
  assert.deepEqual(db.calls.at(-1).params.slice(0,4),[scope.accountId,scope.workspaceId,scope.storeId,actor]);
  assert.match(db.calls.at(-1).sql,/a\.store_id=\$3/);
  assert.match(db.calls.at(-1).sql,/s\.store_id=a\.store_id/);
});
test('01605D classifies private order review GET routes omitted in 01600',()=>{
  for(const route of ['orders-production','orders-review/managers','orders-review/orderdraft_123/production-order','orders-review/orderdraft_123/buyer-identity','orders-review/orderdraft_123/buyer-offer','orders-review/orderdraft_123/carrier-quote','orders-review/orderdraft_123/readiness','orders-review/orderdraft_123/activity','orders-review/orderdraft_123/history']){
    const a=classify('GET','integrations/shipping-hub/'+route);
    assert.equal(a?.permission,'shop.orders.view',route);assert.equal(a?.legacy,'order-write',route);
  }
});
test('01605D protects previously-unmapped order offer and carrier quote mutations',()=>{
  for(const route of ['buyer-offer','carrier-quote']){
    assert.equal(classify('POST','integrations/shipping-hub/orders-review/id/'+route)?.permission,'shop.orders.edit');
  }
});
test('01605D does not misclassify buyer checkout, public URLs or unknown verbs',()=>{
  for(const [m,route] of [['POST','shop/direct-checkout/place'],['POST','integrations/shipping-hub/nova-poshta/cart-quote'],['GET','integrations/shipping-hub/orders-review/id/unknown'],['DELETE','integrations/shipping-hub/orders-review/id/buyer-offer'],['GET','integrations/shipping-hub/orders-review/id/buyer-offer/extra'],['GET','public/marketplace/orders']])assert.equal(classify(m,route),null,route);
  assert.equal(classifyProtectedAction01600('POST',p('integrations/shipping-hub/orders-review/id/production-order'))?.permission,'shop.orders.edit');
});
test('01605D server uses the new classifier before older gates and request-body parsing',()=>{
  const source=fs.readFileSync(new URL('../src/server.mjs',import.meta.url),'utf8');
  assert.match(source,/import \{classifyTenantIsolationAction01605D\} from '\.\/access-audit-core-01605d\.mjs'/);
  assert.ok(source.indexOf('const protectedAction01600=classifyTenantIsolationAction01605D')<source.indexOf("if(p[4]==='orders-production'&&p.length===5)"));
});
