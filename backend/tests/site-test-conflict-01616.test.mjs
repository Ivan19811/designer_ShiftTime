import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {composeSafeSiteTestApply01616,normalizeSiteTestOverrides01616,siteTestConflictPlanToken01616} from '../src/site-test-conflict-01616.mjs';
import {assertApprovedForApply01615B} from '../src/site-test-apply-core-01615b.mjs';
import {projectSha01613D} from '../src/site-test-core-01613d.mjs';
const src=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const siteId='my-site',key=`${siteId}:home`;
const original=()=>({site:{id:siteId,name:'Owner',pages:[{id:'home',title:'Home',url:'/'}]},storage:{pageSnapshots:{[key]:{siteFrameMain01040:{rootIds:['hero'],nodes:{hero:{content:{text:'СКОВОРІДКИ'},style:{color:'white',background:'green'}}}}}},headerState:{html:'original'},footerState:{html:'original'},globalStyleStore:{color:'old'},shoppingCart:{orders:[1]},privateApiKeys:{value:'must-not-copy'}}});
const manager=()=>{const a=original();a.storage.pageSnapshots[key].siteFrameMain01040.nodes.hero.content.text='СКОВОРІДКИ · ТЕСТ';a.storage.shoppingCart.orders=['manager-hijack'];a.privateApiKeys={value:'hijack'};return a;};
const apply=(current,other={},opt={})=>composeSafeSiteTestApply01616({baseline:original(),current,approved:manager(),siteId,selection:{pages:['home']},...opt,...other});
const fail=(fn,code)=>assert.throws(fn,e=>e?.code===code);
test('01616 three-way merge keeps independent owner changes in the very same node',()=>{
 const cur=original();cur.storage.pageSnapshots[key].siteFrameMain01040.nodes.hero.style.color='purple';
 const result=apply(cur);
 assert.equal(result.status,'ready');assert.ok(result.preservedAreas.includes('page:home'));
 const node=result.project.storage.pageSnapshots[key].siteFrameMain01040.nodes.hero;
 assert.equal(node.content.text,'СКОВОРІДКИ · ТЕСТ');assert.equal(node.style.color,'purple');
 assert.deepEqual(result.project.storage.shoppingCart,cur.storage.shoppingCart);
 assert.deepEqual(result.project.privateApiKeys,cur.privateApiKeys);
 assert.equal(result.project.site.name,'Owner');
});
test('01616 detects same-field owner/manager collision; generates no plan/project',()=>{
 const cur=original();cur.storage.pageSnapshots[key].siteFrameMain01040.nodes.hero.content.text='СКОВОРІДКИ OWNER';
 const out=apply(cur);assert.equal(out.status,'conflict');assert.deepEqual(out.conflictAreas,['page:home']);
 assert.equal(out.canApply,false);assert.equal(out.project,undefined);assert.ok(out.conflicts.some(c=>c.path.includes('content.text')));
 assert.equal(cur.storage.pageSnapshots[key].siteFrameMain01040.nodes.hero.content.text,'СКОВОРІДКИ OWNER');
});
test('01616 full-page conflict override requires owner acknowledgement and affects only selected allowlisted page',()=>{
 const cur=original();cur.storage.pageSnapshots[key].siteFrameMain01040.nodes.hero.content.text='OWNER';cur.storage.footerState.html='OWNER FOOTER';
 fail(()=>apply(cur,{overrides:{pages:['home']}}),'ST_TEST_APPLY_OVERRIDE_CONFIRM_REQUIRED_01616');
 const out=apply(cur,{overrides:{pages:['home']},acknowledgeConflicts:true});
 assert.equal(out.status,'ready');assert.equal(out.project.storage.pageSnapshots[key].siteFrameMain01040.nodes.hero.content.text,'СКОВОРІДКИ · ТЕСТ');
 assert.equal(out.project.storage.footerState.html,'OWNER FOOTER');
 assert.deepEqual(out.project.storage.shoppingCart,cur.storage.shoppingCart);
});
test('01616 invalid override outside the selected items is rejected',()=>{
 const s={pages:['home'],header:false,footer:false,styles:false};
 for(const bad of [{pages:['other']},{header:true},{styles:true},{pages:['home','home']},{pages:'home'},{secret:true}])fail(()=>normalizeSiteTestOverrides01616(bad,s),'ST_TEST_APPLY_RESOLUTION_INVALID_01616');
});
test('01616 respects deleted data and unchanged source conflicts',()=>{
 const cur=original();cur.storage.pageSnapshots[key].siteFrameMain01040.nodes.hero.content.text='SKOV';
 assert.equal(apply(cur).status,'conflict');
 const identical=manager();fail(()=>apply(identical),'ST_TEST_APPLY_EMPTY_01615B');
});
test('01616 safe rebase permits advanced project revision but strictly preserves old default rule',()=>{
 const row={state:'approved',revision_kind:'draft',base_project_revision:8,project_json:manager()};row.review_snapshot_sha=projectSha01613D(row.project_json);
 assert.equal(assertApprovedForApply01615B({row,role:'owner',currentRevision:12,allowSafeRebase:true}),true);
 fail(()=>assertApprovedForApply01615B({row,role:'owner',currentRevision:12}),'ST_TEST_ORIGINAL_CHANGED_01613D');
 fail(()=>assertApprovedForApply01615B({row,role:'manager',currentRevision:12,allowSafeRebase:true}),'ST_TEST_OWNER_REQUIRED_01613D');
});
test('01616 plan token locks current revision and exact conflict overrides',()=>{
 const o={testId:'test',projectRevision:8,sourceSha:'b',beforeSha:'c',draftSha:'d',selection:{pages:['home']},overrides:{pages:[]},afterSha:'e'};
 const v=siteTestConflictPlanToken01616(o);assert.match(v,/^[a-f0-9]{64}$/);
 assert.notEqual(v,siteTestConflictPlanToken01616({...o,projectRevision:9}));
 assert.notEqual(v,siteTestConflictPlanToken01616({...o,overrides:{pages:['home']}}));
 assert.notEqual(v,siteTestConflictPlanToken01616({...o,sourceSha:'f'}));
});
test('01616 owner-only workflow retains preflight token, CAS, database backup and rollback; no Netlify deploy',()=>{
 const service=src('../src/site-test-workflow-01613d.mjs');
 const start=service.indexOf('async function prepareSelectiveApply01615B');
 const end=service.indexOf('export async function promoteSiteTest01613D');
 const active=service.slice(start,end);
 assert.match(active,/composeSafeSiteTestApply01616/);
 assert.match(active,/composed.status==='conflict'/);
 assert.match(active,/siteTestConflictPlanToken01616/);
 assert.match(active,/sourceSha:projectSha01613D\(source.project\)/);
 assert.match(active,/if\(planToken!==input.planToken\)/);
 assert.match(active,/FOR UPDATE/);assert.match(active,/backupId=newRevisionId01613D/);
 assert.match(active,/UPDATE shifttime_builder_site_projects/);
 assert.match(active,/assertCanRollbackSiteTest01615B/);
 assert.doesNotMatch(active,/netlify\.deployFiles|netlify\.restoreSiteDeploy|UPDATE shifttime_published_sites/);
});
test('01616 UI provides clear choices and double confirmation (i18n)',()=>{
 const ui=src('../../js/sites/site-test-workflow-01613d.js'),locale=src('../../js/i18n/locales/uk-site-test-01613d.js');
 assert.match(ui,/applyPlan\.status==='conflict'/);
 assert.match(ui,/data-override-area/);
 assert.match(ui,/overridePrepareConfirm01616/);
 assert.match(ui,/overrideApplyConfirm01616/);
 assert.match(ui,/applyPlan\?\.status==='ready'/);
 assert.match(locale,/overwriteArea01616/);
});
