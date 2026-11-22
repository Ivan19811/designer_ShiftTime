import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {ACCESS_PERMISSIONS_01597,normalizeAccessPermissions01597} from '../src/access-policy-core-01597.mjs';
import {classifyProductAction01606B,assertProductAction01606B,productStatusAction01606B} from '../src/access-product-actions-core-01606b.mjs';
import {classifyProtectedAction01600} from '../src/access-enforcement-core-01600.mjs';
import {classifyExtendedAction01601} from '../src/access-enforcement-core-01601.mjs';
import {inspectProtectedAccess01600} from '../src/access-enforcement-service-01600.mjs';
const bits=path=>['api','v1',...path.split('/')];
const route=(m,path)=>classifyProductAction01606B(m,bits(path));
const grant=(permissions,mode='custom')=>({mode,permissions});
const denied=fn=>assert.throws(fn,e=>e.statusCode===403&&e.code==='ST_ACCESS_PRODUCT_ACTION_DENIED_01606B');
test('01606B catalog accepts new independent keys, no duplicates',()=>{
 const codes=ACCESS_PERMISSIONS_01597.map(x=>x.code);
 assert.equal(codes.length,new Set(codes).size);
 assert.ok(codes.includes('api.mode.product_actions'));
 assert.equal(codes.filter(x=>x.startsWith('shop.products.actions.')).length,10);
 assert.deepEqual(normalizeAccessPermissions01597(codes),[...codes].sort());
});
test('01606B exact static routes (and base permission requirement)',()=>{
 const cases=[
 ['GET','marketplace/snapshot/export','export','shop.products.view'],
 ['PUT','marketplace/snapshot','snapshot_replace','shop.products.import'],
 ['POST','marketplace/products/replacement-apply','replace_apply','shop.products.import'],
 ['POST','marketplace/import-rollbacks/job_1/restore','rollback_restore','shop.products.import'],
 ['POST','marketplace/variants','variants_create','shop.products.edit'],
 ['PATCH','marketplace/variants/var1','variants_edit','shop.products.edit'],
 ['DELETE','marketplace/variants/var1','variants_delete','shop.products.delete'],
 ];
 for(const [verb,path,code,expectedBase] of cases){
  assert.equal(route(verb,path)?.permission,'shop.products.actions.'+code,path);
  const parts=bits(path);
  const base=classifyProtectedAction01600(verb,parts)||classifyExtendedAction01601(verb,parts);
  assert.equal(base?.permission,expectedBase,path);
 }
});
test('01606B unknown, malformed and extra-segment paths cannot inherit permission',()=>{
 for(const [verb,path] of [['GET','marketplace/snapshot/export/extra'],['GET','marketplace/snapshot'],['POST','marketplace/snapshot/export'],['POST','marketplace/variants/id'],['PATCH','marketplace/variants'],['POST','marketplace/products/bulk-status'],['POST','marketplace/import-rollbacks/job/restore/extra'],['GET','public/marketplace/snapshot/export']])assert.equal(route(verb,path),null,verb+' '+path);
});
test('01606B two independent status permissions, including single-record write routes',()=>{
 for(const [status,name] of [['active','activate'],['draft','deactivate'],['archived','archive']]){
  assert.equal(productStatusAction01606B({status})?.permission,'shop.products.actions.'+name);
 }
 assert.equal(productStatusAction01606B({status:'archived'},{bulk:true}),null);
 assert.equal(productStatusAction01606B({status:'active'},{bulk:true})?.uiControl,'ui.control.categorybulkactivate');
 assert.equal(productStatusAction01606B({status:'draft'},{bulk:true})?.uiControl,'ui.control.categorybulkdeactivate');
 assert.equal(productStatusAction01606B({}),null);
 assert.equal(productStatusAction01606B(null),null);
 assert.equal(productStatusAction01606B({status:'invalid'})?.permission,'shop.products.actions.status_unsupported');
 denied(()=>assertProductAction01606B(grant(['api.mode.product_actions']),productStatusAction01606B({status:'invalid'})));
});
test('01606B base permission is required even with action grant',()=>{
 // This stage applies only as a secondary check. Main 01600 must authorize base mutation.
 const action=classifyProtectedAction01600('POST',bits('marketplace/products/bulk-status'));
 assert.equal(action.permission,'shop.products.edit');
 const grants=['api.mode.product_actions','shop.products.actions.activate'];
 assert.equal(grants.includes(action.permission),false);
});
test('01606B opt-in mode denies unselected action but allows the chosen one',()=>{
 const p=grant(['api.mode.product_actions','shop.products.actions.activate','shop.products.edit']);
 assert.equal(assertProductAction01606B(p,productStatusAction01606B({status:'active'})),true);
 denied(()=>assertProductAction01606B(p,productStatusAction01606B({status:'draft'})));
 denied(()=>assertProductAction01606B(p,route('PUT','marketplace/snapshot')));
 denied(()=>assertProductAction01606B(p,route('PATCH','marketplace/variants/a')));
});
test('01606B legacy roles, owners, and custom roles without any precise mode keep old semantics',()=>{
 const action=productStatusAction01606B({status:'draft'},{bulk:true});
 for(const mode of ['legacy','owner'])assert.equal(assertProductAction01606B(grant([],mode),action),true);
 assert.equal(assertProductAction01606B(grant(['shop.products.edit']),action),true);
});
test('01606B exact UI mode triggers server checks; UI checkmark alone is never authority',()=>{
 const a=productStatusAction01606B({status:'active'},{bulk:true});
 denied(()=>assertProductAction01606B(grant(['ui.mode.controls','ui.control.categorybulkactivate']),a));
 denied(()=>assertProductAction01606B(grant(['ui.mode.controls','shop.products.actions.activate']),a));
 assert.equal(assertProductAction01606B(grant(['ui.mode.controls','ui.control.categorybulkactivate','shop.products.actions.activate']),a),true);
 denied(()=>assertProductAction01606B(grant(['ui.mode.controls','shop.products.actions.deactivate','ui.control.categorybulkdeactivate']),a));
});
test('01606B server access reads currently assigned store-wide grants, not client flags',async()=>{
 const scope={accountId:'acct',workspaceId:'ws',storeId:'store',role:'viewer'},uid='user_1';
 const query=async sql=>{
  if(sql.includes('platform_access_enrollments_01600'))return {rowCount:1,rows:[{mode:'custom'}]};
  if(sql.includes('platform_role_assignments_01597'))return {rowCount:1,rows:[{scopeKind:'store',siteId:null,permissions:['shop.products.edit','api.mode.product_actions','shop.products.actions.activate']}]};
  throw Error('Unexpected SQL');
 };
 const dec=await inspectProtectedAccess01600(scope,uid,{permission:'shop.products.edit',siteId:'',legacy:'write'},{run:fn=>fn({query})});
 assert.equal(dec.mode,'custom');
 assert.ok(dec.permissions.includes('shop.products.actions.activate'));
 denied(()=>assertProductAction01606B(dec,productStatusAction01606B({status:'draft'})));
});
test('01606B core/server integration retains protected route order and checks input before mutations',()=>{
 const src=fs.readFileSync(new URL('../src/server.mjs',import.meta.url),'utf8');
 assert.ok(src.indexOf('const protectedDecision01600=')<src.indexOf('await assertProductGate01606B(classifyProductAction01606B'));
 assert.ok(src.indexOf('await assertProductGate01606B(classifyProductAction01606B')<src.indexOf("if(p[3]==='snapshot')"));
 assert.match(src,/const input=await readJson\(req,\{limit:1024\*1024\}\);await assertProductGate01606B\(productStatusAction01606B\(input,\{bulk:true\}\)\);return sendJson\(res,200,await bulkSetProductStatus01523/);
 assert.match(src,/if\(key==='products'\)await assertProductGate01606B\(productStatusAction01606B\(input\)\)/);
});
