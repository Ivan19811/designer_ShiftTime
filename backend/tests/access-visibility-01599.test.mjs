import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {projectOwnNavigation01599} from '../src/access-visibility-core-01599.mjs';
import {createAccessPolicyService01597} from '../src/access-policy-service-01597.mjs';
const USER='usr_'+'a'.repeat(24);
const SCOPE={accountId:'acct_abc',workspaceId:'work_123',storeId:'store_456',role:'manager'};
const row=(scopeKind,permissions,siteId=null,overrides={})=>({roleId:'arole_test',status:'active',roleStatus:'active',scopeKind,siteId,permissions,...overrides});
test('01599 projection aggregates store and site only, no cross-site grants',()=>{
  const out=projectOwnNavigation01599([row('store',['shop.orders.view']),row('site',['shop.products.create'],'site_1'),row('site',['site.pages.edit'],'site_2')],{...SCOPE,userId:USER});
  assert.deepEqual(out.storePermissions,['shop.orders.view']);
  assert.deepEqual(out.siteGrants.map(x=>x.siteId),['site_1','site_2']);
  assert.deepEqual(out.siteGrants[0].permissions,['shop.orders.view','shop.products.create']);
  assert.deepEqual(out.siteGrants[1].permissions,['shop.orders.view','site.pages.edit']);
  assert.ok(!out.siteGrants[0].permissions.includes('site.pages.edit'));
});
test('01599 rejects disabled grants and unknown permission keys',()=>{
  const out=projectOwnNavigation01599([row('site',['team.roles.manage'],'site_1',{roleStatus:'disabled'}),row('store',['injected.admin.all'])]);
  assert.deepEqual(out.allPermissions,[]);
});
test('01599 own endpoint uses server session actor and restricts account/store/workspace',async()=>{
  let params,sql;
  const service=createAccessPolicyService01597({run:async fn=>fn({query:async(q,p)=>{sql=q;params=p;return {rows:[row('store',['shop.orders.view'])]};}})});
  const out=await service.myNavigation01599(SCOPE,USER);
  assert.deepEqual(params,[SCOPE.accountId,SCOPE.workspaceId,SCOPE.storeId,USER]);
  assert.match(sql,/m\.user_id=\$4/);
  assert.match(sql,/s\.workspace_id=\$2/);
  assert.match(sql,/a\.store_id=\$3/);
  assert.deepEqual(out.storePermissions,['shop.orders.view']);
  assert.equal(out.enforcement,'ui-only-until-01600');
});
test('01599 server route does not accept userId query param and disables caching',()=>{
  const src=fs.readFileSync(new URL('../src/server.mjs',import.meta.url),'utf8');
  assert.match(src,/p\[3\]==='my-navigation'/);
  assert.match(src,/myNavigation01599\(scope,session\.userId\)/);
  assert.match(src,/'cache-control':'private, no-store'/);
});
