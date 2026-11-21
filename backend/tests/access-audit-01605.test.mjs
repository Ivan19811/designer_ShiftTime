import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {classifyAuditedAction01605,effectiveAuditedAction01605} from '../src/access-audit-core-01605.mjs';
import {classifyProtectedAction01600} from '../src/access-enforcement-core-01600.mjs';
import {classifyExtendedAction01601} from '../src/access-enforcement-core-01601.mjs';
import {ACCESS_PERMISSIONS_01597} from '../src/access-policy-core-01597.mjs';
import {inspectProtectedAccess01600,assertLegacyForUnmanaged01600} from '../src/access-enforcement-service-01600.mjs';
const parts=p=>('/api/v1/'+p).split('/').filter(Boolean);
const all=(m,p)=>effectiveAuditedAction01605(m,parts(p),classifyProtectedAction01600(m,parts(p))||classifyExtendedAction01601(m,parts(p)));
const cases=[
 ['GET','marketplace/feeds','builder.integrations.view'],['GET','marketplace/feeds/f1','builder.integrations.view'],
 ['POST','marketplace/feeds','builder.integrations.manage'],['PATCH','marketplace/feeds/f1','builder.integrations.manage'],['DELETE','marketplace/feeds/f1','builder.integrations.manage'],
 ['GET','integrations/shipping-hub/stores/nova-poshta','builder.integrations.view'],
 ['PUT','integrations/shipping-hub/stores/nova-poshta','builder.integrations.manage'],
 ['DELETE','integrations/shipping-hub/stores/nova-poshta','builder.integrations.manage'],
 ['GET','integrations/shipping-hub/stores/nova-poshta/quote-settings','shop.shipping.view'],
 ['PUT','integrations/shipping-hub/stores/nova-poshta/quote-settings','shop.shipping.edit'],
 ['GET','integrations/shipping-hub/stores/nova-poshta/product-parcels','shop.shipping.view'],
 ['PUT','integrations/shipping-hub/stores/nova-poshta/product-parcels','shop.shipping.edit'],
 ['GET','notifications/orders','shop.orders.view'],['GET','notifications/payments','shop.payments.view'],
];
test('01605 corrected routes use existing catalog and match contract',()=>{
 const known=new Set(ACCESS_PERMISSIONS_01597.map(p=>p.code));
 for(const [m,p,expected] of cases){assert.equal(all(m,p)?.permission,expected,`${m} ${p}`);assert.ok(known.has(expected));}
});
test('01605 never expands unknown paths or public buyer/SSO routes',()=>{
 for(const [m,p] of [['GET','marketplace/feeds/f1/hidden'],['POST','marketplace/feeds/f1'],['POST','public/marketplace/orders'],['POST','shop/direct-checkout/place'],['PUT','integrations/shipping-hub/stores/nova-poshta/quote-settings/junk'],['GET','auth/sso/authorize'],['GET','notifications/sites']])assert.equal(classifyAuditedAction01605(m,parts(p)),null,p);
});
test('01605 custom role is restricted to precise grants even with legacy admin base role',async()=>{
 const scope={accountId:'acct_1',workspaceId:'ws_1',storeId:'store_1',role:'admin'};
 const run=async cb=>cb({query:async sql=>{
  if(sql.includes('FROM platform_access_enrollments_01600'))return {rowCount:1,rows:[{mode:'custom'}]};
  if(sql.includes('FROM platform_role_assignments_01597'))return {rowCount:1,rows:[{permissions:['shop.orders.view'],scopeKind:'store',siteId:null}]};
  throw Error('unknown query');
 }});
 assert.equal((await inspectProtectedAccess01600(scope,'usr_user',all('GET','notifications/orders'),{run})).mode,'custom');
 for(const [m,p] of [['GET','notifications/payments'],['PUT','integrations/shipping-hub/stores/nova-poshta'],['DELETE','marketplace/feeds/feed1'],['PUT','integrations/shipping-hub/stores/nova-poshta/product-parcels']])await assert.rejects(()=>inspectProtectedAccess01600(scope,'usr_user',all(m,p),{run}),{statusCode:403},p);
});
test('01605 owner retains access and legacy admin remains allowed on admin operations',async()=>{
 const owner={accountId:'acct_1',workspaceId:'ws_1',storeId:'store_1',role:'owner'};
 for(const [m,p] of cases){const d=await inspectProtectedAccess01600(owner,'usr_owner',all(m,p),{run:()=>{throw Error('owner queried DB')}});assert.equal(d.mode,'owner');}
 const legacy={...owner,role:'admin'},run=async fn=>fn({query:async sql=>{
  if(sql.includes('FROM platform_access_enrollments_01600'))return {rowCount:0,rows:[]};throw Error('unexpected query');
 }});
 const result=await inspectProtectedAccess01600(legacy,'usr_admin',all('PUT','integrations/shipping-hub/stores/nova-poshta'),{run});
 assert.equal(result.mode,'legacy');assert.doesNotThrow(()=>assertLegacyForUnmanaged01600(legacy,result,'admin'));
});
test('01605 gates run before route handlers and body parsing, and old branch checks are replaced safely',()=>{
 const s=fs.readFileSync(new URL('../src/server.mjs',import.meta.url),'utf8');
 assert.ok(s.indexOf('effectiveAuditedAction01605')<s.indexOf('const protectedDecision01600='));
 assert.ok(s.indexOf('const protectedDecision01600=')<s.indexOf("if(p[2]==='integrations'&&p[3]==='shipping-hub'){",s.indexOf('const protectedDecision01600=')));
 assert.match(s,/const protectedDecision01600=auditedAction01605\s*\? await inspectProtectedAccess01600\(scope,session.userId,auditedAction01605\)/);
 assert.match(s,/assertLegacyForUnmanaged01600\(scope,protectedDecision01600,'admin'\);\s*if\(req.method==='PUT'\)return sendJson\(res,200,\{\.\.\.\(await saveStoreShippingConnection01543/);
 assert.match(s,/if\(req.method==='GET'&&p\[3\]==='orders'&&p.length===4\)\{assertLegacyForUnmanaged01600\(scope,protectedDecision01600,'order'\)/);
});
test('01605 protected site and store grant logic remains scoped',()=>{
 assert.equal(all('PATCH','sites/site_1/metadata')?.siteId,'site_1');
 assert.equal(all('PATCH','network/orders/order1')?.siteId,'');
 assert.equal(all('POST','sites/site_1/publish')?.permission,'site.publish.execute');
});

test('01605 legacy-admin-only account topology operations reject enrolled admins without restoring old grants',async()=>{
 const {assertUnmanagedAdminOperation01605}=await import('../src/access-audit-service-01605.mjs');
 const scope={accountId:'acct_a',storeId:'store_a',workspaceId:'ws_a',role:'admin'};
 const run=enrolled=>async cb=>cb({query:async (_sql,params)=>{
  assert.deepEqual(params,['acct_a','store_a','usr_a']);return {rowCount:enrolled?1:0,rows:enrolled?[{mode:'custom'}]:[]};
 }});
 await assert.rejects(assertUnmanagedAdminOperation01605(scope,'usr_a',{run:run(true)}),{statusCode:403});
 assert.equal((await assertUnmanagedAdminOperation01605(scope,'usr_a',{run:run(false)})).mode,'legacy-admin');
 assert.equal((await assertUnmanagedAdminOperation01605({...scope,role:'owner'},'usr_a',{run:()=>{throw Error('owner should not query DB')}})).mode,'owner');
 await assert.rejects(assertUnmanagedAdminOperation01605({...scope,role:'viewer'},'usr_a',{run:run(false)}),{statusCode:403});
});
test('01605 risky topology and local-import operations are gated before parsing bodies',()=>{
 const source=fs.readFileSync(new URL('../src/server.mjs',import.meta.url),'utf8');
 for(const entry of ['createAuthorizedWorkspace','createAuthorizedStore','importLocalOperationalBundle01080']){
  const line=source.split('\n').find(l=>l.includes('await '+entry+'('));
  assert.ok(line?.includes('await assertUnmanagedAdminOperation01605(scope,session.userId)'),entry);
  assert.ok(line.indexOf('await assertUnmanagedAdminOperation01605')<line.indexOf('await readJson'),entry);
 }
});
