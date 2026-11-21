// 01607 · deterministic multi-tenant / multi-user authorization matrix.
// This is a DB-fake integration test, NOT evidence of a successful Render/PostgreSQL deployment.
import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectProtectedAccess01600} from '../src/access-enforcement-service-01600.mjs';
import {classifyProtectedAction01600} from '../src/access-enforcement-core-01600.mjs';
import {classifySiteAction01606E,assertSiteAction01606E} from '../src/access-site-actions-core-01606e.mjs';
import {assertCanvasActions01606F} from '../src/access-canvas-actions-core-01606f.mjs';
import {classifyExtendedAction01601} from '../src/access-enforcement-core-01601.mjs';

const scope=(accountId,storeId,role='viewer')=>({accountId,workspaceId:`ws_${accountId}`,storeId,role});
const a=scope('account_a','store_a');
const b=scope('account_b','store_b');
const sameAccountOtherStore=scope('account_a','store_a_2');
const ownerA={...a,role:'owner'},ownerB={...b,role:'owner'};
const workerA='user_worker_a',workerB='user_worker_b';
const ownerAId='user_owner_a',ownerBId='user_owner_b';
const route=(method,path)=>classifyProtectedAction01600(method,`/api/v1/${path}`.split('/').filter(Boolean)) || classifyExtendedAction01601(method,`/api/v1/${path}`.split('/').filter(Boolean));
const siteRoute=(method,id)=>route(method,`sites/${id}`);
const rows=x=>({rows:x,rowCount:x.length});
const fixture=()=>({
 sites:[{id:'site_a',accountId:'account_a',workspaceId:'ws_account_a',storeId:'store_a'},
   {id:'site_a_second_store',accountId:'account_a',workspaceId:'ws_account_a',storeId:'store_a_2'},
   {id:'site_b',accountId:'account_b',workspaceId:'ws_account_b',storeId:'store_b'}],
 enrolled:new Set(['account_a|store_a|user_worker_a','account_b|store_b|user_worker_b']),
 assignments:[
   {accountId:'account_a',storeId:'store_a',userId:workerA,scopeKind:'site',siteId:'site_a',active:true,permissions:['site.pages.view','site.pages.edit','api.mode.site_actions','site.design.canvas.update','site.design.actions.draft_create']},
   {accountId:'account_b',storeId:'store_b',userId:workerB,scopeKind:'store',siteId:null,active:true,permissions:['site.pages.view','shop.orders.view']},
 ],calls:[]
});
function dbFor(state){return {run:async callback=>callback({query:async(sql,params=[])=>{
 state.calls.push({sql,params});
 if(sql.includes('FROM platform_access_enrollments_01600'))return rows(state.enrolled.has(`${params[0]}|${params[1]}|${params[2]}`)?[{mode:'custom'}]:[]);
 if(sql.includes('FROM shifttime_builder_sites WHERE')){
  const [siteId,accountId,workspaceId,storeId]=params;
  return rows(state.sites.filter(s=>s.id===siteId&&s.accountId===accountId&&s.workspaceId===workspaceId&&s.storeId===storeId).map(s=>({id:s.id})));
 }
 if(sql.includes('FROM platform_role_assignments_01597')){
  const [accountId,workspaceId,storeId,userId,siteId,siteList]=params;
  return rows(state.assignments.filter(r=>r.active&&r.accountId===accountId&&r.storeId===storeId&&r.userId===userId&&workspaceId===`ws_${accountId}`&&
    (r.scopeKind==='store'||(r.scopeKind==='site'&&(r.siteId===siteId||siteList)&&state.sites.some(s=>s.id===r.siteId&&s.accountId===accountId&&s.workspaceId===workspaceId&&s.storeId===storeId))))
   .map(r=>({scopeKind:r.scopeKind,siteId:r.siteId,permissions:r.permissions})));
 }
 throw new Error('01607 unexpected query (test does not silently allow missing checks): '+sql.slice(0,90));
 }})};}
const denied=(call,code)=>assert.rejects(call,e=>e.statusCode===403&&(!code||e.code===code));
const inspect=(f,s,user,action)=>inspectProtectedAccess01600(s,user,action,dbFor(f));

test('01607 owner permissions are tenant-bound on both sites and across stores of one account',async()=>{
 const f=fixture();
 assert.equal((await inspect(f,ownerA,ownerAId,siteRoute('GET','site_a'))).mode,'owner');
 assert.equal((await inspect(f,ownerB,ownerBId,siteRoute('GET','site_b'))).mode,'owner');
 await denied(()=>inspect(f,ownerA,ownerAId,siteRoute('GET','site_b')),'ST_ACCESS_SITE_SCOPE_DENIED_01600');
 await denied(()=>inspect(f,ownerB,ownerBId,siteRoute('GET','site_a')),'ST_ACCESS_SITE_SCOPE_DENIED_01600');
 await denied(()=>inspect(f,ownerA,ownerAId,siteRoute('GET','site_a_second_store')),'ST_ACCESS_SITE_SCOPE_DENIED_01600');
 assert.equal((await inspect(f,{...sameAccountOtherStore,role:'owner'},ownerAId,siteRoute('GET','site_a_second_store'))).allowed,true);
});

test('01607 two workers cannot read or update a site in another account even with broad permissions',async()=>{
 const f=fixture();
 assert.equal((await inspect(f,a,workerA,siteRoute('GET','site_a'))).mode,'custom');
 assert.equal((await inspect(f,b,workerB,siteRoute('GET','site_b'))).mode,'custom');
 await denied(()=>inspect(f,a,workerA,siteRoute('GET','site_b')),'ST_ACCESS_SITE_SCOPE_DENIED_01600');
 await denied(()=>inspect(f,b,workerB,siteRoute('PUT','site_a')),'ST_ACCESS_SITE_SCOPE_DENIED_01600');
 await denied(()=>inspect(f,a,workerA,siteRoute('PUT','site_a_second_store')),'ST_ACCESS_SITE_SCOPE_DENIED_01600');
 assert.ok(f.calls.filter(c=>c.sql.includes('FROM shifttime_builder_sites WHERE')).every(c=>c.params.length===4));
});

test('01607 site-only role does not grant store orders, and store orders-view cannot edit orders',async()=>{
 const f=fixture();
 await denied(()=>inspect(f,a,workerA,route('GET','network/orders')));
 assert.equal((await inspect(f,b,workerB,route('GET','network/orders'))).allowed,true);
 await denied(()=>inspect(f,b,workerB,route('PATCH','network/orders/order_1')));
 assert.equal((await inspect(f,b,workerB,siteRoute('GET','site_b'))).allowed,true);
 await denied(()=>inspect(f,b,workerB,siteRoute('PUT','site_b')));
});

test('01607 exact Canvas update does not grant create, delete, move, full snapshot or publish',async()=>{
 const f=fixture(), decision=await inspect(f,a,workerA,siteRoute('PUT','site_a'));
 assert.equal(assertCanvasActions01606F(decision,[{type:'update'}]),true);
 for(const type of ['create','move','delete'])assert.throws(()=>assertCanvasActions01606F(decision,[{type}]),{statusCode:403});
 assert.throws(()=>assertCanvasActions01606F(decision,[{type:'update'},{type:'delete'}]),{statusCode:403});
 const full=classifySiteAction01606E('PUT',['api','v1','sites','site_a']);
 assert.throws(()=>assertSiteAction01606E(decision,full),{statusCode:403});
 const published=classifySiteAction01606E('POST',['api','v1','sites','site_a','revisions','rev_1','publish']);
 assert.throws(()=>assertSiteAction01606E(decision,published),{statusCode:403});
});

test('01607 permission revocation takes effect on the very next request using the SAME actor session',async()=>{
 const f=fixture();
 assert.equal((await inspect(f,a,workerA,siteRoute('GET','site_a'))).allowed,true);
 f.assignments[0].active=false; // Same user and same session, DB grants changed.
 await denied(()=>inspect(f,a,workerA,siteRoute('GET','site_a')));
 await denied(()=>inspect(f,a,workerA,siteRoute('PUT','site_a')));
 assert.ok(f.enrolled.has('account_a|store_a|user_worker_a'),'enrollment remains sticky after revocation');
});

test('01607 role edit/removal never restores broad pre-enrollment legacy permissions',async()=>{
 const f=fixture();
 f.assignments[0].permissions=['site.pages.view'];
 await denied(()=>inspect(f,{...a,role:'manager'},workerA,siteRoute('PUT','site_a')));
 f.assignments[0].active=false;
 await denied(()=>inspect(f,{...a,role:'manager'},workerA,siteRoute('PUT','site_a')));
});

test('01607 cross-store assignment is not merged even when same account and user id match',async()=>{
 const f=fixture();
 f.assignments.push({accountId:'account_a',storeId:'store_a_2',userId:workerA,scopeKind:'store',siteId:null,active:true,permissions:['shop.orders.view','site.pages.edit']});
 await denied(()=>inspect(f,a,workerA,route('GET','network/orders')));
 f.enrolled.add('account_a|store_a_2|user_worker_a');
 assert.equal((await inspect(f,sameAccountOtherStore,workerA,route('GET','network/orders'))).allowed,true);
 await denied(()=>inspect(f,a,workerA,siteRoute('GET','site_a_second_store')),'ST_ACCESS_SITE_SCOPE_DENIED_01600');
});

test('01607 siteList grants only scoped site IDs and store-level grants retain all-sites projection',async()=>{
 const f=fixture();
 const list=route('GET','sites');
 const own=await inspect(f,a,workerA,list);
 assert.deepEqual(own.allowedSiteIds,['site_a']);
 const store=await inspect(f,b,workerB,list);
 assert.equal(store.allowedSiteIds,null);
 f.assignments[0].active=false;
 await denied(()=>inspect(f,a,workerA,list));
});

test('01607 all protected requests are scoped by Account / Workspace / Store / authenticated user, not client-supplied body',async()=>{
 const f=fixture();
 await inspect(f,a,workerA,siteRoute('GET','site_a'));
 const lookups=f.calls.filter(x=>x.sql.includes('FROM platform_role_assignments_01597'));
 assert.equal(lookups.length,1);
 assert.deepEqual(lookups[0].params.slice(0,4),['account_a','ws_account_a','store_a',workerA]);
 assert.match(lookups[0].sql,/a\.store_id=\$3/);
 assert.match(lookups[0].sql,/m\.user_id=\$4/);
});
