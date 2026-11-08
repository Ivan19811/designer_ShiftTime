// 01618J: request-level access regression for 01618H original Home repair.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {classifyProtectedAction01600} from '../src/access-enforcement-core-01600.mjs';
import {assertOnlineSiteAccess01613B} from '../src/secure-online-site-01613b.mjs';

const site='site_1';
const parts=route=>`/api/v1/${route}`.split('/').filter(Boolean);
const repair=action=>parts(`sites/${site}/test/changes/repair/${action}`);

test('01618J: both repair endpoints pass the owner-scoped 01600/01613B gates',()=>{
 for(const action of ['plan','apply']){
  const path=repair(action),decision=classifyProtectedAction01600('POST',path);
  assert.deepEqual(decision,{permission:'site.publish.execute',siteId:site,legacy:'write'});
  assert.equal(assertOnlineSiteAccess01613B({role:'owner'},{allowed:true,mode:'owner',permission:decision.permission},'POST',path),true);
 }
});

test('01618J: manager cannot invoke repair even with delegated edit + publish grants',()=>{
 for(const action of ['plan','apply'])
  assert.throws(()=>assertOnlineSiteAccess01613B({role:'manager'},{
   allowed:true,mode:'custom',permission:'site.publish.execute',
   permissions:['site.pages.edit','site.pages.view','site.publish.execute','api.mode.site_actions']
  },'POST',repair(action)),error=>error.statusCode===403&&error.code==='ST_TEST_ACTION_DENIED_01613D');
});

test('01618J: unknown or mistyped repair operations remain fail-closed',()=>{
 const invalid=[
  ['GET',repair('plan')],['GET',repair('apply')],['DELETE',repair('apply')],
  ['POST',repair('unknown')],['POST',parts(`sites/${site}/test/changes/repair`)],
  ['POST',parts(`sites/${site}/test/changes/repair/plan/extra`)]
 ];
 for(const [method,path] of invalid){
  assert.equal(classifyProtectedAction01600(method,path),null,`${method} ${path.join('/')}`);
  assert.throws(()=>assertOnlineSiteAccess01613B({role:'owner'},null,method,path),error=>error.statusCode===403&&error.code==='ST_ONLINE_SITE_UNCLASSIFIED_01613B');
 }
});

test('01618J: server registration maps repair paths to owner-checking workflow',()=>{
 const server=readFileSync(new URL('../src/server.mjs',import.meta.url),'utf8');
 const workflow=readFileSync(new URL('../src/site-test-change-workflow-01618.mjs',import.meta.url),'utf8');
 for(const action of ['plan','apply'])
  assert.match(server,new RegExp(`p\\.length===8&&testId==='changes'&&action==='repair'&&p\\[7\\]==='${action}'`));
 for(const name of ['planSiteTestOriginalRepair01618H','applySiteTestOriginalRepair01618H'])
  assert.match(workflow,new RegExp(`export async function ${name}\\(scope,userId,siteId,input=\\{\\}\\)\\{\\n owner\\(scope\\)`));
 assert.match(workflow,/ST_TEST_ORIGINAL_REPAIR_CONFIRM_REQUIRED_01618H/);
 assert.match(workflow,/ST_TEST_ORIGINAL_REPAIR_SOURCE_UNVERIFIED_01618H/);
});
