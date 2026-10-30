import test from 'node:test';
import assert from 'node:assert/strict';
import {ACCESS_PERMISSIONS_01597,normalizeAccessPermissions01597,mergeAccessGrants01597} from '../src/access-policy-core-01597.mjs';
import {classifyProtectedAction01600,grantDecision01600} from '../src/access-enforcement-core-01600.mjs';
const keys=ACCESS_PERMISSIONS_01597.map(p=>p.code).filter(code=>code.startsWith('ui.'));
test('01606 catalog persists exactly all supported user-interface gates without duplicate codes',()=>{
 const actual=new Set(ACCESS_PERMISSIONS_01597.map(x=>x.code));
 assert.equal(keys.length,82);
 for(const key of keys)assert.ok(actual.has(key),key);
 assert.deepEqual(normalizeAccessPermissions01597(keys),[...keys].sort());
});
test('01606 UI-only grants cannot bypass protected backend operations',()=>{
 const action=classifyProtectedAction01600('PATCH',['api','v1','marketplace','products','p1']);
 assert.equal(action.permission,'shop.products.edit');
 const uiOnly=['ui.mode.controls','ui.control.productedit'];
 assert.equal(grantDecision01600({role:'viewer',enrolled:true,permissions:uiOnly,permission:action.permission}).allowed,false);
 assert.equal(grantDecision01600({role:'viewer',enrolled:true,permissions:[...uiOnly,'shop.products.edit'],permission:action.permission}).allowed,true);
});
test('01606 site-scoped UI gates cannot cross to a different site',()=>{
 const rows=[{status:'active',roleStatus:'active',scopeKind:'site',siteId:'siteA',roleId:'roleA',permissions:['ui.mode.controls','ui.control.pagecreate','site.pages.create']}];
 assert.ok(mergeAccessGrants01597(rows,{siteId:'siteA'}).permissions.includes('ui.mode.controls'));
 assert.equal(mergeAccessGrants01597(rows,{siteId:'siteB'}).permissions.length,0);
});
