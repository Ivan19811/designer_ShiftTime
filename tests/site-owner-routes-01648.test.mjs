import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {classifyProtectedAction01600} from '../src/access-enforcement-core-01600.mjs';
import {classifySiteAction01606E} from '../src/access-site-actions-core-01606e.mjs';
import {assertOnlineSiteAccess01613B} from '../src/secure-online-site-01613b.mjs';
const p=part=>('/api/v1/'+part).split('/').filter(Boolean);
const owner={role:'owner',accountId:'test',workspaceId:'test',storeId:'test'};
const manager={...owner,role:'manager'};
const decision=(method,path)=>classifyProtectedAction01600(method,p(path));
const cases=[
 ['POST','sites/site_1/revisions/delete-all','site.pages.delete'],
 ['GET','sites/site_1/delete-check','site.publish.delete'],
 ['GET','sites/site_1/owner-history','site.pages.view'],
 ['POST','sites/site_1/owner-history/rev_123/save','site.pages.edit'],
 ['POST','sites/site_1/owner-history/1/restore','site.pages.edit'],
 ['POST','sites/site_1/revisions/rev_123/prepare-owner-publish','site.publish.execute']
];
test('01648 canonical 01600 classifier registers every owner route with an exact site permission',()=>{
 for(const [method,path,permission] of cases){
  const operation=decision(method,path);
  assert.ok(operation,`${method} ${path} was unclassified`);
  assert.equal(operation.permission,permission,`${path}: wrong permission`);
  assert.equal(operation.siteId,'site_1');
  assert.equal(assertOnlineSiteAccess01613B(owner,{allowed:true,mode:'owner'},method,p(path)),true);
 }
});
test('01648 non-owner cannot use these owner-only routes even with all site mutation grants',()=>{
 const allGrants={allowed:true,mode:'custom',permission:'site.pages.edit',permissions:[
  'site.pages.view','site.pages.edit','site.pages.delete','site.publish.execute','site.publish.delete',
  'api.mode.site_actions','site.design.actions.draft_delete','site.design.actions.publish'
 ]};
 for(const [method,path] of cases){
  assert.throws(()=>assertOnlineSiteAccess01613B(manager,allGrants,method,p(path)),e=>
    e?.statusCode===403&&e?.code==='ST_ONLINE_SITE_OWNER_APPROVAL_REQUIRED_01613B');
 }
});
test('01648 all unknown owner site API mutations still fail closed without a classifier',()=>{
 for(const [method,path] of [['POST','sites/site_1/revisions/new-secret-delete'],['POST','sites/site_1/owner-history/4/mystery'],['POST','sites/site_1/delete-check']]){
  assert.equal(decision(method,path),null);
  assert.throws(()=>assertOnlineSiteAccess01613B(owner,null,method,p(path)),e=>
    e?.code==='ST_ONLINE_SITE_UNCLASSIFIED_01613B');
 }
});
test('01648 precise site action permissions cover new owner revision mutations',()=>{
 const d=classifySiteAction01606E('POST',p('sites/site_1/revisions/delete-all'));
 assert.equal(d?.permission,'site.design.actions.draft_delete');
 assert.equal(classifySiteAction01606E('POST',p('sites/site_1/revisions/rev_1/prepare-owner-publish'))?.permission,'site.design.actions.publish');
});
test('01648 owner bulk-deletion handler still checks exact selected IDs and authenticated creator',()=>{
 const s=readFileSync(new URL('../src/server.mjs',import.meta.url),'utf8');
 const guard=readFileSync(new URL('../src/site-destructive-guards-01623m.mjs',import.meta.url),'utf8');
 assert.ok(s.indexOf('if(isOnlineSiteRoute01613B(p))')<s.indexOf('deleteAllDraftRevisions01623M(scope,siteId,payload'));
 assert.match(s,/deleteAllDraftRevisions01623M\(scope,siteId,payload,undefined,session.userId\)/);
 assert.match(guard,/ids\.length!==expected/);
 assert.match(guard,/created_by_user_id=\$3/);
 assert.match(guard,/ROLLBACK/);
});
