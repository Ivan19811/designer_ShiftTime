import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectProtectedAccess01600,assertLegacyForUnmanaged01600} from '../src/access-enforcement-service-01600.mjs';
import {assertSiteOnlyBoundary01613C} from '../src/site-collaboration-01613c.mjs';
import {moduleRoutePermission01613C4,moduleRouteAllowed01613C4} from '../src/delegated-modules-01613c4.mjs';
import {assertProductMutation01621} from '../src/delegated-product-fields-01621.mjs';
import {delegatedProductPatch01622} from '../../js/marketplace/delegated-product-photo-patch-01622.js';
const scope={accountId:'acct_1',workspaceId:'ws_1',storeId:'store_1',role:'viewer'};
const t=(permissions=[],marketplace='edit')=>({marketplace,messenger:'none',productPermissions:permissions});
const q=rows=>({rows,rowCount:rows.length});
const mockRun=(tiers,{enrolled=false,accepted=true,custom=[]}={})=>async fn=>fn({query:async sql=>{
  const s=String(sql);
  if(s.includes('FROM shifttime_builder_sites'))return q([{}]);
  if(s.includes('FROM platform_site_collaboration_only_01613c'))return q([{}]);
  if(s.includes('platform_access_enrollments_01600'))return q(enrolled?[{mode:'custom'}]:[]);
  if(s.includes('FROM platform_delegated_module_grants_01613c4'))return q(accepted?[tiers]:[]);
  if(s.includes('FROM platform_role_assignments_01597'))return q(custom.length?[{permissions:custom,scopeKind:'store'}]:[]);
  throw Error('Unexpected mock SQL: '+s.slice(0,90));
}});
const permittedAction=(method,route)=>({permission:moduleRoutePermission01613C4(method,route),siteId:'',legacy:'write',delegatedModuleRoute:true});
const patchRoute=['api','v1','marketplace','products','prod_1'];
const mediaRoute=['api','v1','marketplace','media'];

test('01622A: accepted invited viewer without custom-role enrollment may save a product photo',async()=>{
  const tiers=t(['photos']);
  const action=permittedAction('PATCH',patchRoute);
  assert.equal(action.permission,'shop.products.edit');
  assert.equal(moduleRouteAllowed01613C4('PATCH',patchRoute,tiers),true);
  const decision=await inspectProtectedAccess01600(scope,'usr_1',action,{run:mockRun(tiers)});
  assert.equal(decision.allowed,true);
  assert.equal(decision.mode,'custom');
  assert.equal(decision.source,'accepted-site-delegation-01622A');
  assert.doesNotThrow(()=>assertLegacyForUnmanaged01600(scope,decision));
  const current={id:'prod_1',name:'Решітка',price:320,primaryMediaId:'old',mediaIds:[],status:'active',sku:'A-12'};
  const patch=delegatedProductPatch01622(current,{name:'Решітка',price:320,status:'active',sku:'A-12'},{primaryMediaId:'new',mediaIds:[]});
  assert.deepEqual(patch,{primaryMediaId:'new'});
  assert.doesNotThrow(()=>assertProductMutation01621(tiers,patch,{before:current}));
});

test('01622A: invited viewer photo grant permits resource media record creation, not deleting it',async()=>{
  const tiers=t(['photos']);
  const action=permittedAction('POST',mediaRoute);
  assert.equal(action.permission,'shop.products.edit');
  const decision=await inspectProtectedAccess01600(scope,'usr_1',action,{run:mockRun(tiers)});
  assert.equal(decision.allowed,true);
  assert.doesNotThrow(()=>assertLegacyForUnmanaged01600(scope,decision));
  assert.equal(moduleRouteAllowed01613C4('DELETE',[...mediaRoute,'asset_1'],tiers),false);
});

test('01622A: missing accepted invitation, missing photo permission or missing route marker stays denied',async()=>{
  const action=permittedAction('PATCH',patchRoute);
  await assert.rejects(()=>inspectProtectedAccess01600(scope,'usr_1',action,{run:mockRun(t(['photos']),{accepted:false})}),{statusCode:403});
  await assert.rejects(()=>inspectProtectedAccess01600(scope,'usr_1',action,{run:mockRun(t([]))}),{statusCode:403});
  await assert.rejects(()=>inspectProtectedAccess01600(scope,'usr_1',{...action,delegatedModuleRoute:false},{run:mockRun(t(['photos']))}),{statusCode:403});
  await assert.rejects(()=>inspectProtectedAccess01600(scope,'usr_1',{...action,permission:'shop.products.import'},{run:mockRun(t(['photos']))}),{statusCode:403});
  await assert.rejects(()=>inspectProtectedAccess01600(scope,'usr_1',{...action,permission:'shop.products.delete'},{run:mockRun(t(['photos']))}),{statusCode:403});
  await assert.rejects(()=>inspectProtectedAccess01600(scope,'usr_1',{...action,siteId:'site_1'},{run:mockRun(t(['photos']))}),{statusCode:403});
});

test('01622A: enrolled managers also retain their existing delegated photo rights',async()=>{
  const action=permittedAction('PATCH',patchRoute);
  const decision=await inspectProtectedAccess01600(scope,'usr_1',action,{run:mockRun(t(['photos']),{enrolled:true})});
  assert.equal(decision.allowed,true);
  assert.equal(decision.mode,'custom');
  assert.ok(decision.permissions.includes('shop.products.edit'));
});

test('01622A: text-only editors cannot change photo fields',()=>{
  const tiers=t(['texts']);
  assert.throws(()=>assertProductMutation01621(tiers,{primaryMediaId:'new'},{before:{primaryMediaId:'old'}}),{statusCode:403});
  assert.doesNotThrow(()=>assertProductMutation01621(tiers,{name:'Новий опис'},{before:{name:'Старий опис'}}));
  assert.equal(moduleRouteAllowed01613C4('POST',['api','v1','marketplace','products'],tiers),false);
});

test('01622A: site-only fence and central authorization both accept the same photo-only manager',async()=>{
  const tiers=t(['photos']);
  const run=mockRun(tiers);
  await assertSiteOnlyBoundary01613C(scope,'usr_1',patchRoute,{run,method:'PATCH'});
  const decision=await inspectProtectedAccess01600(scope,'usr_1',permittedAction('PATCH',patchRoute),{run});
  assert.equal(decision.allowed,true);
  await assert.rejects(()=>assertSiteOnlyBoundary01613C(scope,'usr_1',['api','v1','marketplace','products','prod_1'],{run,method:'DELETE'}),{statusCode:403});
});
