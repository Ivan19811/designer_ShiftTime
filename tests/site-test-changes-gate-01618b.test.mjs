import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {classifyProtectedAction01600} from '../src/access-enforcement-core-01600.mjs';
import {assertOnlineSiteAccess01613B} from '../src/secure-online-site-01613b.mjs';

const parts=route=>`/api/v1/${route}`.split('/').filter(Boolean);
const grant=(permission)=>({allowed:true,mode:'owner',permission});
const site='site_1';
const routes=[
 ['GET',`sites/${site}/test/changes`,'site.pages.view'],
 ['POST',`sites/${site}/test/changes/plan`,'site.publish.execute'],
 ['POST',`sites/${site}/test/changes/apply`,'site.publish.execute'],
 ['POST',`sites/${site}/test/changes/rollback/batch_1`,'site.publish.execute'],
];

test('01618B: all four selected-changes routes are classified before fail-closed online-site boundary',()=>{
 for(const [verb,route,expectedPermission] of routes){
  const p=parts(route),decision=classifyProtectedAction01600(verb,p);
  assert.equal(decision?.permission,expectedPermission,`${verb} ${route}`);
  assert.equal(decision?.siteId,site);
  assert.equal(assertOnlineSiteAccess01613B({role:'owner'},grant(decision.permission),verb,p),true);
 }
});

test('01618B: delegated managers cannot mutate selected changes even with site write grants',()=>{
 for(const [verb,route] of routes.filter(x=>x[0]==='POST')){
  assert.throws(()=>assertOnlineSiteAccess01613B({role:'manager'},
   {allowed:true,mode:'custom',permissions:['site.pages.edit','site.pages.view','site.publish.execute','api.mode.site_actions']},
   verb,parts(route)),err=>err.statusCode===403&&['ST_TEST_ACTION_DENIED_01613D','ST_TEST_OWNER_REQUIRED_01613D'].includes(err.code));
 }
 const service=readFileSync(new URL('../src/site-test-change-workflow-01618.mjs',import.meta.url),'utf8');
 assert.match(service,/function owner\(scope\)/);
 for(const fn of ['getSiteTestChangeChoices01618','planSiteTestSelectedChanges01618','applySiteTestSelectedChanges01618','rollbackSiteTestSelectedChanges01618']){
  const body=service.split(`export async function ${fn}(`)[1]?.split('\n}')[0];
  assert.match(body||'',/owner\(scope\)/,fn);
 }
});

test('01618B: unknown changes endpoints remain unclassified and denied',()=>{
 for(const [verb,route] of [['GET',`sites/${site}/test/changes/unlisted`],['POST',`sites/${site}/test/changes/unlisted`],['DELETE',`sites/${site}/test/changes`],['POST',`sites/${site}/test/changes/rollback`]]){
  assert.equal(classifyProtectedAction01600(verb,parts(route)),null,route);
  assert.throws(()=>assertOnlineSiteAccess01613B({role:'owner'},null,verb,parts(route)),err=>err.statusCode===403&&err.code==='ST_ONLINE_SITE_UNCLASSIFIED_01613B');
 }
});

test('01618B: UI distinguishes not-loaded data from genuine empty server changes',()=>{
 const ui=readFileSync(new URL('../../js/sites/site-test-workflow-01613d.js',import.meta.url),'utf8');
 const locale=readFileSync(new URL('../../js/i18n/locales/uk-site-test-01613d.js',import.meta.url),'utf8');
 assert.match(ui,/data\?`<p>\$\{safe\(T\('changeNoItems01618'\)\)/);
 assert.match(ui,/mixerData01618=null;mixerPlan01618=null;changeDecisions01618=\[\]/);
 assert.match(locale,/changesLoadFailed01618/);
 assert.match(locale,/changesNotLoaded01618/);
});
