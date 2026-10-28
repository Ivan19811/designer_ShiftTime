import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createTestWorkerRoleService01603} from '../src/test-worker-role-service-01603.mjs';
const owner={accountId:'acct_one',workspaceId:'ws_one',storeId:'store_one',role:'owner'};
const actor='usr_aaaaaaaaaaaaaaaaaaaa',worker='usr_bbbbbbbbbbbbbbbbbbbb',member='member_0123456789abcdef',role='arole_0123456789abcdefabcd';
const rows=r=>({rows:r,rowCount:r.length});
function setup(overrides={}){
 const calls=[];
 const c={query:async(sql,params=[])=>{
  calls.push({sql,params});
  if(overrides.onQuery){const r=overrides.onQuery(sql,params);if(r!==undefined)return r;}
  if(sql.includes('FROM platform_test_workers_01603 t'))return rows(overrides.testWorker?[{membershipId:member,userId:worker,memberRole:'viewer',assignmentId:overrides.assignmentId||''}]:[]);
  if(sql.includes('FROM platform_role_assignments_01597 a JOIN'))return rows(overrides.activeGrants||[]);
  if(sql.includes('FROM platform_memberships m'))return rows([{id:member,userId:worker,role:'viewer'}]);
  if(sql.includes("status='active' AND role<>'viewer'"))return rows(overrides.broadRole?[{}]:[]);
  if(sql.includes('FROM platform_custom_roles_01597'))return rows(overrides.roleEnabled===false?[{id:role,status:'disabled'}]:[{id:role,status:'active'}]);
  if(sql.includes('FROM shifttime_builder_sites'))return rows(overrides.siteValid?[{id:'site_one'}]:[]);
  return rows([]);
 }};
 return {calls,svc:createTestWorkerRoleService01603({run:fn=>fn(c)})};
}
test('01603 only owner has access, before SQL',async()=>{
 const {svc,calls}=setup();
 await assert.rejects(svc.current({...owner,role:'admin'}),{statusCode:403});
 await assert.rejects(svc.enroll({...owner,role:'viewer'},actor,{membershipId:member}),{statusCode:403});
 await assert.rejects(svc.replace({...owner,role:'manager'},actor,{roleId:role}),{statusCode:403});
 assert.equal(calls.length,0);
});
test('01603 enrolls separate viewer, only with zero preexisting grants, and audit within TX',async()=>{
 const {svc,calls}=setup();const r=await svc.enroll(owner,actor,{membershipId:member});
 assert.equal(r.enrolled,true);assert.equal(r.userId,worker);
 assert.ok(calls.some(x=>x.sql.includes('INSERT INTO platform_test_workers_01603')&&x.params[1]==='store_one'));
 assert.ok(calls.some(x=>x.sql.includes('platform_admin_audit_log')));
 assert.equal(calls[0].sql,'BEGIN');assert.equal(calls.at(-1).sql,'COMMIT');
});
test('01603 refuses to enroll worker with existing custom grants or broad role',async()=>{
 const a=setup({activeGrants:[{id:'agrant_other'}]});
 await assert.rejects(a.svc.enroll(owner,actor,{membershipId:member}),{code:'ST_TEST_WORKER_EXISTING_GRANTS_01603'});
 assert.equal(a.calls.at(-1).sql,'ROLLBACK');
 const b=setup({broadRole:true});
 await assert.rejects(b.svc.enroll(owner,actor,{membershipId:member}),{code:'ST_TEST_WORKER_BROAD_ROLE_01603'});
});
test('01603 validates active role and site BEFORE revoking old test grant',async()=>{
 const a=setup({testWorker:true,assignmentId:'agrant_old',activeGrants:[{id:'agrant_old',roleId:'arole_old'}],roleEnabled:false});
 await assert.rejects(a.svc.replace(owner,actor,{roleId:role,scopeKind:'store'}),{code:'ST_TEST_WORKER_ROLE_INVALID_01603'});
 assert.ok(!a.calls.some(x=>x.sql.includes('UPDATE platform_role_assignments_01597 SET status')));
 const b=setup({testWorker:true,assignmentId:'agrant_old',activeGrants:[{id:'agrant_old',roleId:'arole_old'}],siteValid:false});
 await assert.rejects(b.svc.replace(owner,actor,{roleId:role,scopeKind:'site',siteId:'site_wrong'}),{code:'ST_TEST_WORKER_SITE_DENIED_01603'});
 assert.ok(!b.calls.some(x=>x.sql.includes('UPDATE platform_role_assignments_01597 SET status')));
});
test('01603 replacement revokes previous grant, inserts next, updates pointer and audits atomically',async()=>{
 const {svc,calls}=setup({testWorker:true,assignmentId:'agrant_old',activeGrants:[{id:'agrant_old',roleId:'arole_old'}]});
 const r=await svc.replace(owner,actor,{roleId:role,scopeKind:'store'});
 assert.equal(r.roleId,role);assert.match(r.assignmentId,/^agrant_[a-f0-9]{20}$/);
 const events=calls.map(x=>x.sql);
 const revoke=events.findIndex(x=>x.includes("UPDATE platform_role_assignments_01597 SET status='revoked'"));
 const insert=events.findIndex(x=>x.includes('INSERT INTO platform_role_assignments_01597'));
 const pointer=events.findIndex(x=>x.includes('UPDATE platform_test_workers_01603 SET assignment_id'));
 assert.ok(revoke>0&&insert>revoke&&pointer>insert);
 assert.equal(events[0],'BEGIN');assert.equal(events.at(-1),'COMMIT');
 assert.ok(events.some(x=>x.includes('platform_access_enrollments_01600')));
});
test('01603 reset revokes last assignment without creating a new one',async()=>{
 const {svc,calls}=setup({testWorker:true,assignmentId:'agrant_old',activeGrants:[{id:'agrant_old'}]});
 const r=await svc.replace(owner,actor,{roleId:'',scopeKind:'store'});
 assert.equal(r.assignmentId,'');assert.equal(r.roleId,'');
 assert.ok(calls.some(x=>x.sql.includes("UPDATE platform_role_assignments_01597 SET status='revoked'")));
 assert.ok(!calls.some(x=>x.sql.includes('INSERT INTO platform_role_assignments_01597')));
});
test('01603 refuses to silently revoke extra real grants',async()=>{
 const {svc,calls}=setup({testWorker:true,assignmentId:'agrant_old',activeGrants:[{id:'agrant_old'},{id:'agrant_other'}]});
 await assert.rejects(svc.replace(owner,actor,{roleId:role,scopeKind:'store'}),{code:'ST_TEST_WORKER_UNMANAGED_GRANTS_01603'});
 assert.ok(!calls.some(x=>x.sql.includes("UPDATE platform_role_assignments_01597 SET status='revoked'")));
});
test('01603 router and migration are scoped; UI has a confirmation and i18n',()=>{
 const server=fs.readFileSync(new URL('../src/server.mjs',import.meta.url),'utf8');
 const sql=fs.readFileSync(new URL('../sql/063_test_worker_role_switch_01603.sql',import.meta.url),'utf8');
 const ui=fs.readFileSync(new URL('../../js/admin/role-center-01598.js',import.meta.url),'utf8');
 const api=fs.readFileSync(new URL('../../js/admin/admin-api-01087.js',import.meta.url),'utf8');
 const loc=fs.readFileSync(new URL('../../js/i18n/locales/uk-test-worker-01603.js',import.meta.url),'utf8');
 assert.match(server,/testWorkerRoleService01603\.enroll\(scope,session\.userId/);
 assert.match(server,/testWorkerRoleService01603\.replace\(scope,session\.userId/);
 assert.match(server,/assertAdminView01087\(scope\)/);
 assert.match(sql,/PRIMARY KEY\(account_id,store_id\)/);
 assert.doesNotMatch(sql,/DROP TABLE|ALTER TABLE platform_memberships/i);
 assert.match(ui,/data-rc-test-confirm/);
 assert.match(ui,/state\.testPending/);
 assert.match(api,/replaceTestWorker01603/);
 assert.match(loc,/testHelp/);
});
