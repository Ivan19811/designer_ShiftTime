import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {classifyExtendedAction01601} from '../src/access-enforcement-core-01601.mjs';
import {ACCESS_PERMISSIONS_01597,normalizeAccessPermissions01597} from '../src/access-policy-core-01597.mjs';
import {inspectProtectedAccess01600} from '../src/access-enforcement-service-01600.mjs';
import {projectVisibility01599} from '../../js/access/permission-visibility-policy-01599.js';
const classify=(method,path)=>classifyExtendedAction01601(method,`/api/v1/${path}`.split('/').filter(Boolean));
const cases=[
 ['GET','media/storage/status','builder.media.view'],['GET','media/assets','builder.media.view'],
 ['POST','media/remote-image/fetch','builder.media.upload'],['POST','media/uploads','builder.media.upload'],
 ['POST','media/uploads/proxy','builder.media.upload'],['POST','media/uploads/u123/complete','builder.media.upload'],
 ['DELETE','media/assets/a123','builder.media.delete'],
 ['GET','tables','builder.tables.view'],['GET','tables/t1','builder.tables.view'],
 ['POST','tables','builder.tables.edit'],['PATCH','tables/t1','builder.tables.edit'],
 ['POST','tables/t1/fields','builder.tables.edit'],['PATCH','tables/t1/fields/f1','builder.tables.edit'],
 ['POST','tables/t1/records','builder.tables.edit'],['PATCH','tables/t1/records/r1','builder.tables.edit'],
 ['POST','tables/t1/views','builder.tables.edit'],['PATCH','tables/t1/views/v1','builder.tables.edit'],
 ['DELETE','tables/t1','builder.tables.delete'],['DELETE','tables/t1/fields/f1','builder.tables.delete'],
 ['DELETE','tables/t1/records/r1','builder.tables.delete'],['DELETE','tables/t1/views/v1','builder.tables.delete'],
 ['GET','network/inventory','shop.inventory.view'],['GET','network/inventory/reservations','shop.inventory.view'],
 ['POST','network/inventory/expire','shop.inventory.manage'],['PATCH','network/inventory/reservations/r1','shop.inventory.manage'],
 ['GET','network/shipping','shop.shipping.view'],['GET','network/shipping/providers','shop.shipping.view'],
 ['PATCH','network/shipping/d1','shop.shipping.edit'],['POST','network/shipping/d1/simulate','shop.shipping.simulate'],
 ['GET','network/payments','shop.payments.view'],['POST','network/payments/order/o1','shop.payments.create'],
 ['PATCH','network/payments/p1','shop.payments.edit'],
 ['GET','network/payouts','shop.payouts.view'],['PATCH','network/payouts/p1','shop.payouts.edit'],
 ['POST','network/join','shop.settings.manage'],['PATCH','network/seller','shop.settings.manage'],
 ['PATCH','network/policy','shop.settings.manage'],
 ['GET','integrations/google-sheets/oauth/status','builder.integrations.view'],
 ['POST','integrations/google-sheets/read','builder.integrations.view'],
 ['POST','integrations/google-sheets/oauth/start','builder.integrations.manage'],
 ['POST','integrations/google-sheets/oauth/disconnect','builder.integrations.manage'],
 ['PUT','ai-assistant/settings','builder.ai.configure'],['POST','ai-assistant/action-run','builder.ai.configure'],
 ['PUT','ai-consultant/settings','builder.ai.configure'],
 ['POST','ai-consultant/sales-rules','builder.ai.configure'],
 ['PUT','ai-consultant/sales-rules/r1','builder.ai.configure'],
 ['DELETE','ai-consultant/sales-rules/r1','builder.ai.configure'],
 ['GET','marketplace/seo','builder.seo.view'],['PATCH','marketplace/seo','builder.seo.edit'],
 ['GET','marketplace/supplier-sync-schedules','shop.suppliersync.view'],
 ['PUT','marketplace/supplier-sync-schedules/source1','shop.suppliersync.manage'],
 ['DELETE','marketplace/supplier-sync-schedules/source1','shop.suppliersync.manage'],
 ['POST','marketplace/supplier-sync-schedules/source1/run','shop.suppliersync.manage'],
 ['GET','marketplace/supplier-sync-alerts','shop.suppliersync.view'],
 ['POST','marketplace/supplier-sync-alerts/a1/read','shop.suppliersync.manage'],
 ['POST','marketplace/supplier-sync-alerts/a1/dismiss','shop.suppliersync.manage'],
 ['GET','marketplace/supplier-sync-alert-rules','shop.suppliersync.view'],
 ['PUT','marketplace/supplier-sync-alert-rules','shop.suppliersync.manage'],
 ['DELETE','marketplace/supplier-sync-alert-rules','shop.suppliersync.manage'],
 ['GET','marketplace/supplier-sync-approvals','shop.suppliersync.view'],
 ['GET','marketplace/supplier-sync-approvals/a1','shop.suppliersync.view'],
 ['POST','marketplace/supplier-sync-approvals/a1/approve','shop.suppliersync.approve'],
 ['POST','marketplace/supplier-sync-approvals/a1/reject','shop.suppliersync.approve'],
 ['GET','marketplace/import-rollbacks','shop.products.import'],
 ['GET','marketplace/import-rollbacks/j1/preview','shop.products.import'],
 ['POST','marketplace/import-rollbacks/j1/restore','shop.products.import'],
];
test('01601 every classified merchant endpoint has explicit catalog permission',()=>{
  const known=new Set(ACCESS_PERMISSIONS_01597.map(r=>r.code));
  for(const [m,path,permission] of cases){
    assert.equal(classify(m,path)?.permission,permission,`${m} ${path}`);
    assert.ok(known.has(permission),`catalog missing ${permission}`);
  }
  assert.equal(normalizeAccessPermissions01597([...new Set(cases.map(c=>c[2]))]).length,new Set(cases.map(c=>c[2])).size);
});
test('01601 excludes public checkout, callbacks, SSO and unknown private APIs',()=>{
 for(const [method,path] of [['POST','public/marketplace/orders'],['POST','shop/direct-checkout/place'],['GET','integrations/google-sheets/oauth/callback'],['POST','auth/sso/handoff'],['POST','media/uploads/u123/invalid'],['POST','access/roles'],['GET','platform/admin/users']])
  assert.equal(classify(method,path),null,`${method} ${path}`);
});
test('01601 finance: orders view does not grant payment change or payout edit',async()=>{
 const scope={accountId:'acct_a',workspaceId:'ws_a',storeId:'store_a',role:'viewer'},user='usr_test';
 const seen=[];
 const run=async fn=>fn({query:async (sql,params)=>{
  seen.push({sql,params});
  if(sql.includes('FROM platform_access_enrollments_01600'))return {rowCount:1,rows:[{mode:'custom'}]};
  if(sql.includes('FROM platform_role_assignments_01597'))return {rowCount:1,rows:[{permissions:['shop.orders.view'],scopeKind:'store',siteId:null}]};
  throw Error('Unexpected SQL');
 }});
 await assert.rejects(inspectProtectedAccess01600(scope,user,classify('PATCH','network/payments/payment1'),{run}),{statusCode:403});
 await assert.rejects(inspectProtectedAccess01600(scope,user,classify('PATCH','network/payouts/payout1'),{run}),{statusCode:403});
 await assert.rejects(inspectProtectedAccess01600(scope,user,classify('PATCH','network/shipping/parcel1'),{run}),{statusCode:403});
 assert.ok(seen.every(({params})=>params[0]===scope.accountId));
});
test('01601 view and edit are independent rights',async()=>{
 const scope={accountId:'acct_a',workspaceId:'ws_a',storeId:'store_a',role:'viewer'};
 const run=async fn=>fn({query:async sql=>{
  if(sql.includes('FROM platform_access_enrollments_01600'))return {rowCount:1,rows:[{mode:'custom'}]};
  if(sql.includes('FROM platform_role_assignments_01597'))return {rowCount:1,rows:[{permissions:['shop.shipping.view','builder.media.view'],scopeKind:'store',siteId:null}]};
  throw Error('Unexpected SQL');
 }});
 assert.equal((await inspectProtectedAccess01600(scope,'usr_test',classify('GET','network/shipping'),{run})).allowed,true);
 await assert.rejects(inspectProtectedAccess01600(scope,'usr_test',classify('PATCH','network/shipping/one'),{run}),{statusCode:403});
 assert.equal((await inspectProtectedAccess01600(scope,'usr_test',classify('GET','media/assets'),{run})).allowed,true);
 await assert.rejects(inspectProtectedAccess01600(scope,'usr_test',classify('POST','media/uploads'),{run}),{statusCode:403});
});
test('01601 legacy owner remains fully authorized without database access',async()=>{
 const scope={accountId:'acct_a',workspaceId:'ws_a',storeId:'store_a',role:'owner'};
 for(const [m,path] of [['PATCH','network/payouts/p1'],['POST','media/uploads'],['POST','marketplace/supplier-sync-approvals/a1/approve']]){
  const ok=await inspectProtectedAccess01600(scope,'usr_owner',classify(m,path),{run:()=>{throw Error('owner should bypass DB');}});
  assert.equal(ok.mode,'owner');
 }
});
test('01601 backend gate executes after auth and before request parsing and route handlers',()=>{
 const source=fs.readFileSync(new URL('../src/server.mjs',import.meta.url),'utf8');
 assert.match(source,/classifyProtectedAction01600\(req\.method,p\)\|\|classifyExtendedAction01601\(req\.method,p\)/);
 const gate=source.indexOf('const protectedAction01600=');
 assert.ok(gate>source.indexOf('const scope=await resolveAuthorizedStore'));
 assert.ok(gate<source.indexOf("if(p[2]==='media')"));
 assert.ok(gate<source.indexOf("if(p[2]==='tables')"));
 assert.ok(gate<source.indexOf("if(p[2]==='network'&&p[3]==='payments')"));
 assert.ok(gate<source.indexOf("if(p[3]==='supplier-sync-approvals')"));
 assert.match(source,/if\(req\.method==='POST'&&p\[3\]==='uploads'&&p\[4\]==='proxy'\)\{assertLegacyForUnmanaged01600\(scope,protectedDecision01600\);const u=/);
 assert.match(source,/if\(req\.method==='PATCH'&&p\[4\]\)\{assertLegacyForUnmanaged01600\(scope,protectedDecision01600\);return sendJson\(res,200,await transitionAuthorizedPayment/);
});
test('01601 new UI labels are canonical i18n, no text literal in permission definitions',()=>{
 const src=fs.readFileSync(new URL('../../js/i18n/locales/uk-role-center-01598.js',import.meta.url),'utf8');
 for(const group of ['shop.shipping','shop.payments','shop.payouts','shop.inventory','shop.suppliersync','shop.settings','builder.integrations'])assert.ok(src.includes(`'${group.replaceAll('.', '_')}':`),group);
 for(const action of ['simulate','approve'])assert.ok(src.includes(`${action}:`));
});
test('01601 navigation gives logistics and accounting roles an appropriate visible menu',()=>{
 for(const p of ['shop.shipping.view','shop.payments.view','shop.payouts.view','shop.suppliersync.view']){
  const view=projectVisibility01599({authenticated:true,owner:false,storePermissions:[p]});
  assert.ok(view.allowedPanels.includes('shop'),p);
 }
});
