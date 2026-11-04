import test from 'node:test';
import assert from 'node:assert/strict';
import {validateSiteCollab01613C,SITE_COLLAB_PERMISSIONS_01613C,hashSiteInvite01613C,validSiteInvite01613C,createSiteInvite01613C,acceptSiteInvite01613C,revokeSiteInvite01613C,assertSiteOnlyBoundary01613C} from '../src/site-collaboration-01613c.mjs';
const scope={accountId:'acct_owner',workspaceId:'ws_owner',storeId:'store_owner',role:'owner'};
const token='A'.repeat(43);
const invite={id:'scinv_'+'1'.repeat(20),token_hash:hashSiteInvite01613C(token),status:'pending',account_id:scope.accountId,workspace_id:scope.workspaceId,store_id:scope.storeId,site_id:'site_sample',recipient_email:'guest@example.com',access_level:'editor',invited_by_user_id:'usr_'+'b'.repeat(20)};
const rows=value=>({rowCount:value.length,rows:value});
const mockRun=(handler)=>fn=>fn({query:async(sql,params)=>handler(String(sql),params||[])});
const errors=async(fn,code)=>assert.rejects(fn,e=>e.code===code);
test('01613C input and tokens validate, including user ID',()=>{
 assert.equal(validateSiteCollab01613C({siteId:'site_123',recipient:'MAIL@EXAMPLE.COM'}).accessLevel,'editor');
 assert.equal(validateSiteCollab01613C({siteId:'site_123',recipient:'usr_'+'a'.repeat(20)}).recipient.length,24);
 assert.throws(()=>validateSiteCollab01613C({siteId:'',recipient:'user@domain.com'}));
 assert.throws(()=>validateSiteCollab01613C({siteId:'site_123',recipient:'a@example.com',accessLevel:'owner'}));
 assert.ok(validSiteInvite01613C(token));assert.equal(validSiteInvite01613C('BAD'),false);
 assert.equal(hashSiteInvite01613C(token).length,64);
});
test('01613C editor role cannot publish, delete, access CRM, commerce, or admin',()=>{
 for(const p of [...SITE_COLLAB_PERMISSIONS_01613C.editor,...SITE_COLLAB_PERMISSIONS_01613C.viewer]){
  assert.equal(/^(admin|team|crm|shop|site\.publish\.(execute|delete)|site\.design\.actions\.(site_delete|publish|site_create))/.test(p),false,p);
 }
});
test('01613C only Account owner can create and revoke',async()=>{
 await errors(()=>createSiteInvite01613C({...scope,role:'manager'},'actor',{siteId:'site_sample',recipient:'guest@example.com'}, {run:mockRun(()=>rows([]))}),'ST_SITE_INVITE_OWNER_REQUIRED_01613C');
 await errors(()=>revokeSiteInvite01613C({...scope,role:'admin'},'actor',invite.id,{run:mockRun(()=>rows([]))}),'ST_SITE_INVITE_OWNER_REQUIRED_01613C');
});
test('01613C cannot invite to another tenant site',async()=>{
 await errors(()=>createSiteInvite01613C(scope,'actor',{siteId:'site_sample',recipient:'guest@example.com'}, {run:mockRun(sql=>/SELECT id FROM shifttime_builder_sites/.test(sql)?rows([]):rows([]))}),'ST_SITE_INVITE_SCOPE_DENIED_01613C');
});
test('01613C accept refuses mismatched authenticated account email',async()=>{
 const run=mockRun(sql=>{
  if(sql.includes('SELECT i.*'))return rows([invite]);
  if(sql.includes('SELECT email FROM platform_users'))return rows([{email:'different@example.com'}]);
  return rows([]);
 });
 await errors(()=>acceptSiteInvite01613C('usr_'+'a'.repeat(20),token,{run}),'ST_SITE_INVITE_EMAIL_MISMATCH_01613C');
});
test('01613C already-consumed/revoked invite cannot be accepted twice',async()=>{
 await errors(()=>acceptSiteInvite01613C('usr_'+'a'.repeat(20),token,{run:mockRun(()=>rows([]))}),'ST_SITE_INVITE_INVALID_01613C');
});
test('01613C accept creates site-only membership and scoped role assignment',async()=>{
 const seen=[];
 const run=mockRun((sql,params)=>{
  seen.push([sql,params]);
  if(sql.includes('SELECT i.*'))return rows([invite]);
  if(sql.includes('SELECT email FROM platform_users'))return rows([{email:'guest@example.com'}]);
  if(sql.includes('SELECT 1 FROM shifttime_builder_sites'))return rows([{1:1}]);
  if(sql.includes('SELECT 1 FROM platform_memberships'))return rows([]);
  if(sql.includes('SELECT id,role FROM platform_memberships'))return rows([]);
  if(sql.includes('SELECT id,permissions,status FROM platform_custom_roles'))return rows([]);
  if(sql.includes('SELECT id FROM platform_role_assignments_01597'))return rows([]);
  return rows([]);
 });
 const result=await acceptSiteInvite01613C('usr_'+'a'.repeat(20),token,{run});
 assert.equal(result.ok,true);assert.equal(result.siteId,invite.site_id);
 assert.ok(seen.some(([sql])=>sql.includes("'viewer','active'")),'new membership is minimal viewer');
 assert.ok(seen.some(([sql])=>sql.includes('INSERT INTO platform_site_collaboration_only_01613c')),'other modules blocked');
 const assignment=seen.find(([sql])=>sql.includes('INSERT INTO platform_role_assignments_01597'));
 assert.equal(assignment[1][5],invite.site_id);
 assert.ok(seen.some(([sql])=>sql.includes("status='accepted'")));
});
test('01613C site-only collaborator cannot access other services',async()=>{
 const marked=mockRun(()=>rows([{1:1}]));
 await assertSiteOnlyBoundary01613C({...scope,role:'viewer'},'guest',['api','v1','sites'],{run:marked});
 await errors(()=>assertSiteOnlyBoundary01613C({...scope,role:'viewer'},'guest',['api','v1','marketplace'],{run:marked}),'ST_SITE_COLLAB_RESOURCE_DENIED_01613C');
 await assertSiteOnlyBoundary01613C(scope,'owner',['api','v1','marketplace'],{run:()=>{throw Error('owner should bypass lookup');}});
});
test('01613C owner revoke disables linked site assignment',async()=>{
 const calls=[];
 const run=mockRun((sql,params)=>{
  calls.push([sql,params]);
  if(sql.includes('SELECT id,status,assignment_id,site_id'))return rows([{id:invite.id,status:'accepted',assignment_id:'agrant_'+'a'.repeat(20),site_id:'site_sample'}]);
  return rows([]);
 });
 const result=await revokeSiteInvite01613C(scope,'usr_'+'b'.repeat(20),invite.id,{run});
 assert.equal(result.ok,true);assert.ok(calls.some(([sql])=>sql.includes("UPDATE platform_role_assignments_01597 SET status='revoked'")));
});
