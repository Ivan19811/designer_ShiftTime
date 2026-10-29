import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {ACCESS_PERMISSIONS_01597,normalizeAccessPermissions01597,normalizeAccessRoleInput01597,normalizeAccessAssignment01597,assertAccessPolicyManager01597,mergeAccessGrants01597,accessCatalog01597} from '../src/access-policy-core-01597.mjs';
import {createAccessPolicyService01597} from '../src/access-policy-service-01597.mjs';
const owner={accountId:'acct_one',workspaceId:'ws_one',storeId:'store_one',role:'owner'};
const member='member_0123456789abcdef',roleId='arole_0123456789abcdefabcd',user='usr_0123456789abcdefabcd';
const input={roleId,membershipId:member,scopeKind:'site',siteId:'site_a'};
const check=e=>{throw e;};
function mock(runQuery){const events=[];const client={query:async(sql,params=[])=>{events.push({sql,params});return runQuery(sql,params);}};return {events,service:createAccessPolicyService01597({run:fn=>fn(client)})};}
const qrows=rows=>({rows,rowCount:rows.length});

test('01597 permission catalog uses stable, unique machine codes and i18n keys',()=>{
  const ids=ACCESS_PERMISSIONS_01597.map(p=>p.code);
  assert.equal(ids.length,new Set(ids).size);
  for(const p of ACCESS_PERMISSIONS_01597){assert.match(p.labelKey,/^access\.permissions\./);assert.match(p.code,/^[a-z][a-z.]+$/);}
  for(const expected of ['site.pages.view','site.pages.edit','site.publish.execute','shop.orders.view','shop.products.create','shop.products.import','team.members.invite'])assert.ok(ids.includes(expected));
  assert.equal(accessCatalog01597().enforcement,'foundation-only');
});
test('01597 unknown grants and malformed permission lists fail closed',()=>{
  assert.deepEqual(normalizeAccessPermissions01597([' shop.orders.view ','shop.orders.view','site.pages.view']),['shop.orders.view','site.pages.view']);
  assert.throws(()=>normalizeAccessPermissions01597(['admin.roles.manage']),{code:'ST_ACCESS_PERMISSION_UNKNOWN_01597'});
  assert.throws(()=>normalizeAccessPermissions01597('shop.orders.view'),{code:'ST_ACCESS_PERMISSIONS_INVALID_01597'});
  assert.throws(()=>normalizeAccessPermissions01597(Array(201).fill('shop.orders.view')),{code:'ST_ACCESS_PERMISSIONS_INVALID_01597'});
});
test('01597 role names and descriptions are validated',()=>{
  assert.deepEqual(normalizeAccessRoleInput01597({name:'Products',permissions:['shop.products.create']}),{name:'Products',description:'',permissions:['shop.products.create']});
  assert.throws(()=>normalizeAccessRoleInput01597({name:' ',permissions:[]}),{code:'ST_ACCESS_ROLE_NAME_INVALID_01597'});
  assert.throws(()=>normalizeAccessRoleInput01597({name:'test',permissions:['*']}),{code:'ST_ACCESS_PERMISSION_UNKNOWN_01597'});
});
test('01597 assignments reject arbitrary identifiers, scope switching and missing site',()=>{
  assert.deepEqual(normalizeAccessAssignment01597(input),input);
  assert.throws(()=>normalizeAccessAssignment01597({...input,siteId:''}),{code:'ST_ACCESS_SITE_REQUIRED_01597'});
  assert.throws(()=>normalizeAccessAssignment01597({...input,scopeKind:'store'}),{code:'ST_ACCESS_STORE_SITE_CONFLICT_01597'});
  assert.throws(()=>normalizeAccessAssignment01597({...input,scopeKind:'account'}),{code:'ST_ACCESS_ASSIGNMENT_INVALID_01597'});
  assert.throws(()=>normalizeAccessAssignment01597({...input,roleId:'owner'}),{code:'ST_ACCESS_ASSIGNMENT_INVALID_01597'});
  assert.deepEqual(normalizeAccessAssignment01597({...input,scopeKind:'store',siteId:''}),{...input,scopeKind:'store',siteId:null});
});
test('01597 only a scoped account owner can mutate access policy',()=>{
  assert.equal(assertAccessPolicyManager01597(owner),true);
  for(const role of ['admin','manager','editor','viewer'])assert.throws(()=>assertAccessPolicyManager01597({...owner,role}),{statusCode:403});
  assert.throws(()=>assertAccessPolicyManager01597({...owner,storeId:''}),{statusCode:403});
});
test('01597 store grants never include site grants without a matching site id',()=>{
  const grants=[
    {roleId:'store-role',roleStatus:'active',status:'active',scopeKind:'store',permissions:['shop.orders.view']},
    {roleId:'site-role',roleStatus:'active',status:'active',scopeKind:'site',siteId:'site_a',permissions:['site.pages.edit']},
    {roleId:'revoked-role',roleStatus:'active',status:'revoked',scopeKind:'store',permissions:['shop.products.delete']},
    {roleId:'disabled-role',roleStatus:'disabled',status:'active',scopeKind:'store',permissions:['shop.products.import']},
    {roleId:'foreign-site',roleStatus:'active',status:'active',scopeKind:'site',siteId:'site_other',permissions:['shop.orders.cancel']}
  ];
  assert.deepEqual(mergeAccessGrants01597(grants).permissions,['shop.orders.view']);
  assert.deepEqual(mergeAccessGrants01597(grants,{siteId:'site_a'}).permissions,['shop.orders.view','site.pages.edit']);
  assert.deepEqual(mergeAccessGrants01597(grants,{siteId:'site_other'}).permissions,['shop.orders.cancel','shop.orders.view']);
});
test('01597 role creation is account-scoped, parameterized, transactionally audited',async()=>{
  const {events,service}=mock((sql,params)=>{
    if(sql.includes('INSERT INTO platform_custom_roles_01597')){assert.equal(params[1],owner.accountId);return qrows([{id:params[0],name:params[2],permissions:JSON.parse(params[4])}]);}
    return qrows([]);
  });
  const role=await service.createRole(owner,user,{name:'Fulfillment',permissions:['shop.orders.view']});
  assert.equal(role.name,'Fulfillment');assert.deepEqual(role.permissions,['shop.orders.view']);
  assert.ok(events.some(e=>e.sql==='BEGIN'));assert.ok(events.some(e=>e.sql==='COMMIT'));
  assert.ok(events.some(e=>e.sql.includes('platform_admin_audit_log')&&e.params[0]===owner.accountId));
});
test('01597 role creation rejects non-owner before touching database',async()=>{
  const {events,service}=mock(()=>{throw Error('should never query');});
  await assert.rejects(service.createRole({...owner,role:'admin'},user,{name:'bad'}),{statusCode:403});
  assert.equal(events.length,0);
});
test('01597 role assignment rejects cross-account role by requiring account-filtered lookup',async()=>{
  const {events,service}=mock(sql=>sql.includes('FROM platform_custom_roles_01597')?qrows([]):qrows([]));
  await assert.rejects(service.assign(owner,user,input),{code:'ST_ACCESS_ROLE_NOT_FOUND_01597'});
  assert.ok(events.some(e=>e.sql.includes('platform_custom_roles_01597 WHERE account_id=$1')&&e.params[0]===owner.accountId));
  assert.ok(events.some(e=>e.sql==='ROLLBACK'));
});
test('01597 role assignment validates target membership belongs to actor selected store',async()=>{
  const {events,service}=mock(sql=>{
    if(sql.includes('FROM platform_custom_roles_01597'))return qrows([{id:roleId,status:'active'}]);
    if(sql.includes('FROM platform_memberships'))return qrows([]);
    return qrows([]);
  });
  await assert.rejects(service.assign(owner,user,input),{code:'ST_ACCESS_MEMBERSHIP_SCOPE_DENIED_01597'});
  assert.ok(events.some(e=>e.sql.includes('m.account_id=$2')&&e.sql.includes('m.store_id IS NULL OR m.store_id=$4')));
});
test('01597 site assignment rejects a site from another store',async()=>{
  const {events,service}=mock(sql=>{
    if(sql.includes('FROM platform_custom_roles_01597'))return qrows([{id:roleId,status:'active'}]);
    if(sql.includes('FROM platform_memberships'))return qrows([{id:member,user_id:user}]);
    return qrows([]);
  });
  await assert.rejects(service.assign(owner,user,input),{code:'ST_ACCESS_SITE_SCOPE_DENIED_01597'});
  assert.ok(events.some(e=>e.sql.includes('shifttime_builder_sites WHERE id=$1')&&e.params.join(',').includes(owner.storeId)));
});
test('01597 valid role assignment writes chosen store from session, not request',async()=>{
  const {events,service}=mock((sql,params)=>{
    if(sql.includes('FROM platform_custom_roles_01597'))return qrows([{id:roleId,status:'active'}]);
    if(sql.includes('FROM platform_memberships'))return qrows([{id:member,user_id:user}]);
    if(sql.includes('FROM shifttime_builder_sites'))return qrows([{id:'site_a'}]);
    if(sql.includes('INSERT INTO platform_role_assignments_01597'))return qrows([{id:params[0],storeId:params[4],scopeKind:params[6]}]);
    return qrows([]);
  });
  const result=await service.assign(owner,user,{...input,storeId:'store_foreign',accountId:'acct_foreign'});
  assert.equal(result.storeId,owner.storeId);
  assert.ok(events.some(e=>e.sql.includes('INSERT INTO platform_role_assignments_01597')&&e.params[4]===owner.storeId));
});
test('01597 self-only grants do not accept tenant or actor ids from client',async()=>{
  const {events,service}=mock((sql,params)=>{
    if(sql.includes('FROM shifttime_builder_sites'))return qrows([{id:'site_a'}]);
    if(sql.includes('FROM platform_role_assignments_01597'))return qrows([{roleId,roleStatus:'active',status:'active',scopeKind:'store',permissions:['shop.orders.view']}]);
    return qrows([]);
  });
  const result=await service.myAccess(owner,user,'site_a');
  assert.deepEqual(result.permissions,['shop.orders.view']);
  assert.ok(events.some(e=>e.sql.includes('m.user_id=$3')&&e.params[2]===user&&e.params[0]===owner.accountId));
});
test('01597 preview rejects users lacking a valid membership within selected store',async()=>{
  const {service}=mock(sql=>sql.includes('FROM shifttime_builder_sites')?qrows([{id:'site_a'}]):qrows([]));
  await assert.rejects(service.preview(owner,user,'site_a'),{code:'ST_ACCESS_MEMBERSHIP_SCOPE_DENIED_01597'});
});
test('01597 migration is additive, scoped, and includes cascade cleanup',()=>{
  const sql=fs.readFileSync(new URL('../sql/061_role_access_center_01597.sql',import.meta.url),'utf8');
  assert.match(sql,/CREATE TABLE IF NOT EXISTS platform_custom_roles_01597/);
  assert.match(sql,/CREATE TABLE IF NOT EXISTS platform_role_assignments_01597/);
  assert.match(sql,/FOREIGN KEY\(role_id,account_id\)/);
  assert.match(sql,/WHERE status='active'/);
  assert.match(sql,/ON DELETE CASCADE/);
  assert.doesNotMatch(sql,/DROP TABLE|ALTER TABLE platform_memberships/i);
});
test('01597 routes inherit session-bound store and owner-only role management',()=>{
  const s=fs.readFileSync(new URL('../src/server.mjs',import.meta.url),'utf8');
  assert.match(s,/accessPolicyService01597\.myAccess\(scope,session\.userId/);
  assert.match(s,/accessPolicyService01597\.createRole\(scope,session\.userId/);
  assert.match(s,/accessPolicyService01597\.assign\(scope,session\.userId/);
  assert.match(s,/if\(p\[2\]==='admin'\)\{\s*assertAdminView01087\(scope\)/);
});
