import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {assertOnlineSiteAccess01613B,isOnlineSiteRoute01613B} from '../src/secure-online-site-01613b.mjs';
import {inspectProtectedAccess01600} from '../src/access-enforcement-service-01600.mjs';
import {classifyProtectedAction01600} from '../src/access-enforcement-core-01600.mjs';
import {assertAdminView01087} from '../src/admin-access-01087.mjs';
import {assertUnmanagedAdminOperation01605} from '../src/access-audit-service-01605.mjs';
const path=x=>`/api/v1/${x}`.split('/').filter(Boolean);
const permission=(route,method)=>classifyProtectedAction01600(method,path(route));
const scope={accountId:'acct_a',workspaceId:'ws_a',storeId:'store_a',role:'manager'};
const owner={...scope,role:'owner'};
const deny=(fn,code)=>assert.throws(fn,e=>e?.statusCode===403&&(!code||e.code===code));
const grant=(...perms)=>({allowed:true,mode:'custom',permission:'site.pages.edit',permissions:perms});
const precise=['api.mode.site_actions'];
const editor=grant(...precise,'site.design.actions.project_replace','site.design.actions.draft_create','site.design.actions.draft_replace','site.design.actions.metadata_edit');
const db=({enrolled=false,siteExists=true,permissions=[]}={})=>({run:async callback=>callback({query:async(sql)=>{
  if(sql.includes('FROM platform_access_enrollments_01600'))return {rowCount:enrolled?1:0,rows:enrolled?[{mode:'custom'}]:[]};
  if(sql.includes('FROM shifttime_builder_sites WHERE'))return {rowCount:siteExists?1:0,rows:siteExists?[{id:'site_a'}]:[]};
  if(sql.includes('FROM platform_role_assignments_01597'))return {rowCount:permissions.length?1:0,rows:permissions.length?[{permissions,scopeKind:'site',siteId:'site_a'}]:[]};
  throw new Error('Unexpected DB query');
}})});
test('01613B recognizes site and revision lists, not cart or public routes',()=>{
  for(const item of ['sites','sites/site_a','sites/site_a/revisions/rev_1/publish','site-revisions'])assert.equal(isOnlineSiteRoute01613B(path(item)),true);
  for(const item of ['marketplace/products','public/marketplace/cart','admin/overview','platform/stores'])assert.equal(isOnlineSiteRoute01613B(path(item)),false);
});
test('01613B legacy non-owner manager/editor/admin receives no site access even when older role allowed it',async()=>{
  for(const role of ['manager','editor','admin','viewer']){
    await assert.rejects(()=>inspectProtectedAccess01600({...scope,role},'user_a',permission('sites/site_a','GET'),db()),{
      code:'ST_ONLINE_SITE_EXPLICIT_GRANT_REQUIRED_01613B',statusCode:403
    });
    await assert.rejects(()=>inspectProtectedAccess01600({...scope,role},'user_a',permission('sites','GET'),db()),{
      code:'ST_ONLINE_SITE_EXPLICIT_GRANT_REQUIRED_01613B',statusCode:403
    });
  }
});
test('01613B legacy non-site merchant permissions are untouched',async()=>{
  const operation={permission:'shop.orders.view',siteId:'',legacy:'order-read'};
  const result=await inspectProtectedAccess01600(scope,'user_a',operation,db());
  assert.equal(result.mode,'legacy');
});
test('01613B owner remains able to read and edit sites from own tenant',async()=>{
  const result=await inspectProtectedAccess01600(owner,'user_a',permission('sites/site_a','GET'),db());
  assert.equal(result.mode,'owner');
  for(const [method,route] of [['GET','sites'],['PUT','sites/site_a'],['POST','sites'],['DELETE','sites/site_a'],['POST','sites/site_a/publish']]){
    assert.equal(assertOnlineSiteAccess01613B(owner,{allowed:true,mode:'owner'},method,path(route)),true);
  }
});
test('01613B owner cannot bypass a foreign site scope',async()=>{
  await assert.rejects(()=>inspectProtectedAccess01600(owner,'user_a',permission('sites/site_foreign','GET'),db({siteExists:false})),{statusCode:403});
});
test('01613B enrolled editors can read granted site and cannot read absent grants',async()=>{
  const result=await inspectProtectedAccess01600(scope,'user_a',permission('sites/site_a','GET'),db({enrolled:true,permissions:['site.pages.view']}));
  assert.equal(assertOnlineSiteAccess01613B(scope,result,'GET',path('sites/site_a')),true);
  await assert.rejects(()=>inspectProtectedAccess01600(scope,'user_a',permission('sites/site_a','GET'),db({enrolled:true})),{statusCode:403});
});
test('01613B site lists must return a site allowlist marker',()=>{
  deny(()=>assertOnlineSiteAccess01613B(scope,grant('site.pages.view'),'GET',path('sites')),'ST_ONLINE_SITE_LIST_UNSCOPED_01613B');
  assert.equal(assertOnlineSiteAccess01613B(scope,{allowed:true,mode:'custom',allowedSiteIds:['site_a']},'GET',path('sites')),true);
  assert.equal(assertOnlineSiteAccess01613B(scope,{allowed:true,mode:'custom',allowedSiteIds:null},'GET',path('sites')),true);
});
test('01613B full-project snapshots require precise server mode and exact action',()=>{
  deny(()=>assertOnlineSiteAccess01613B(scope,grant('site.design.actions.project_replace'),'PUT',path('sites/site_a')),'ST_ONLINE_SITE_PRECISE_MODE_REQUIRED_01613B');
  deny(()=>assertOnlineSiteAccess01613B(scope,grant('api.mode.site_actions'),'PUT',path('sites/site_a')),'ST_ACCESS_SITE_ACTION_DENIED_01606E');
  assert.equal(assertOnlineSiteAccess01613B(scope,editor,'PUT',path('sites/site_a')),true);
});
test('01613B UI controls alone cannot authorize server site mutations',()=>{
  deny(()=>assertOnlineSiteAccess01613B(scope,grant('ui.mode.controls','ui.control.pagesave','site.design.actions.project_replace'),'PUT',path('sites/site_a')),'ST_ONLINE_SITE_PRECISE_MODE_REQUIRED_01613B');
});
test('01613B draft and metadata actions separately enforced',()=>{
  assert.equal(assertOnlineSiteAccess01613B(scope,editor,'POST',path('sites/site_a/revisions')),true);
  assert.equal(assertOnlineSiteAccess01613B(scope,editor,'PATCH',path('sites/site_a/metadata')),true);
  deny(()=>assertOnlineSiteAccess01613B(scope,grant(...precise,'site.design.actions.project_replace'),'POST',path('sites/site_a/revisions')),'ST_ACCESS_SITE_ACTION_DENIED_01606E');
});
test('01613B editor cannot create sites in owner shared scope, delete site or bypass approval publishing',()=>{
  for(const [method,route] of [['POST','sites'],['DELETE','sites/site_a'],['POST','sites/site_a/publish'],['POST','sites/site_a/revisions/rev_1/publish']]){
    deny(()=>assertOnlineSiteAccess01613B(scope,grant(...precise,'site.design.actions.publish','site.publish.execute','site.design.actions.site_create'),'POST'===method?'POST':method,path(route)),'ST_ONLINE_SITE_OWNER_APPROVAL_REQUIRED_01613B');
  }
});
test('01613B Canvas operations require precise mode; action-level grants checked downstream',()=>{
  assert.equal(assertOnlineSiteAccess01613B(scope,grant(...precise),'POST',path('sites/site_a/canvas')),true);
  assert.equal(assertOnlineSiteAccess01613B(scope,grant(...precise),'POST',path('sites/site_a/revisions/rev_1/canvas')),true);
  deny(()=>assertOnlineSiteAccess01613B(scope,grant('site.pages.edit'),'POST',path('sites/site_a/canvas')),'ST_ONLINE_SITE_PRECISE_MODE_REQUIRED_01613B');
});
test('01613B prevents unclassified mutations of site routes and no-decision read',()=>{
  deny(()=>assertOnlineSiteAccess01613B(scope,grant(...precise),'PUT',path('sites/site_a/mystery')),'ST_ONLINE_SITE_ACTION_UNCLASSIFIED_01613B');
  deny(()=>assertOnlineSiteAccess01613B(scope,null,'GET',path('sites/site_a')),'ST_ONLINE_SITE_UNCLASSIFIED_01613B');
});
test('01613B global revision listing rejects legacy decision even if previously authenticated',()=>{
  deny(()=>assertOnlineSiteAccess01613B(scope,{allowed:true,mode:'legacy'},'GET',path('site-revisions')),'ST_ONLINE_SITE_EXPLICIT_GRANT_REQUIRED_01613B');
  assert.equal(assertOnlineSiteAccess01613B(scope,{allowed:true,mode:'custom',allowedSiteIds:['site_a']},'GET',path('site-revisions')),true);
});
test('01613B guard precedes JSON parsing, Netlify publish and all site mutations',()=>{
  const code=fs.readFileSync(new URL('../src/server.mjs',import.meta.url),'utf8');
  const guard=code.indexOf('if(isOnlineSiteRoute01613B(p))');
  assert.ok(guard>code.indexOf('const scope=await resolveAuthorizedStore'));
  assert.ok(guard<code.indexOf('const siteAction01606E='));
  assert.ok(guard<code.indexOf('readSitePublishingJson01609C(req)'));
  assert.ok(guard<code.indexOf('saveBuilderSite01170('));
  assert.ok(guard<code.indexOf('applySiteCanvas01606F('));
});

test('01613B a manager/editor may never open /admin merely through an existing site role',async()=>{
  for(const role of ['manager','editor','viewer']){
    deny(()=>assertAdminView01087({...scope,role}),'ST_ADMIN_PERMISSION_DENIED');
    await assert.rejects(()=>assertUnmanagedAdminOperation01605({...scope,role,permissions:['admin.view']},'user_a'),{
      code:'ST_ACCESS_UNMANAGED_ADMIN_DENIED_01605',statusCode:403
    });
  }
});
test('01613B storefront tenant owner still has account admin view',()=>{
  assert.equal(assertAdminView01087(owner),true);
});
