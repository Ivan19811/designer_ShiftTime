import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectProtectedAccess01600} from '../src/access-enforcement-service-01600.mjs';
const scope={accountId:'acct_1',workspaceId:'ws_1',storeId:'store_1',role:'viewer'};
function mock({tiers={marketplace:'edit',messenger:'none',productPermissions:['photos']},custom=false}={}){
 return {run:async fn=>fn({query:async sql=>{
  if(sql.includes('platform_access_enrollments_01600'))return {rows:custom?[{}]:[{}],rowCount:1};
  if(sql.includes('FROM platform_delegated_module_grants_01613c4'))return {rows:tiers?[tiers]:[],rowCount:tiers?1:0};
  if(sql.includes('FROM platform_role_assignments_01597'))return {rows:[],rowCount:0};
  throw Error('unexpected SQL');
 }})};
}
const action={permission:'shop.products.edit',delegatedModuleRoute:true,legacy:'write'};
test('01622F: effective accepted photo grant authorizes editing product',async()=>{
 const result=await inspectProtectedAccess01600(scope,'usr_1',action,mock());assert.equal(result.allowed,true);
});
test('01622F: missing accepted photo grant remains denied with precise diagnostic',async()=>{
 await assert.rejects(()=>inspectProtectedAccess01600(scope,'usr_1',action,mock({tiers:{marketplace:'view',messenger:'none',productPermissions:[]}})),e=>e.code==='ST_ACCESS_ACTION_DENIED_01600'&&e.permission==='shop.products.edit'&&e.denialReason==='delegated-store-grant-not-effective');
});
