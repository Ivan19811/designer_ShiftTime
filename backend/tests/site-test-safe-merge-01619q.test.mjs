import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {listSelectableSiteTestChanges01618 as list,composeSelectedSiteTestChanges01618 as compose,siteTestSelectionPlanToken01618 as token} from '../src/site-test-change-select-01618.mjs';
import {assertSelectedMainScope01619Q,assertSelectiveApplyScope01619Q,assertRepairPageScope01619Q} from '../src/site-test-scope-guard-01619q.mjs';
const sid='site_q';
const snap=(text)=>({siteFrameMain01040:{version:'st-main-area-snapshot-v1-01040',rootIds:['root'],nodes:{root:{kind:'block',content:{text}}}}});
function project(text='БАЗА'){
 return {version:'01170',site:{id:sid,pages:[{id:'page_home',title:'Головна'},{id:'page_shop01530_account',title:'Мій акаунт'}]},storage:{pageSnapshots:{[`${sid}:page_home`]:snap(text),[`${sid}:page_shop01530_account`]:snap('Особистий кабінет')},headerState:{global:{html:'header'},pages:{}},globalStyleStore:{theme:'safe'}}};
}
function changes(id,baseline,submitted){return list({baseline,submitted,siteId:sid,testId:id}).changes;}
function prepare(id,base,submitted,current){const c=changes(id,base,submitted);
 return compose({current,siteId:sid,decisions:[{testId:id,changeId:c[0].id,decision:'accept'}],changesByTest:new Map([[id,c]]),projectsByTest:new Map([[id,submitted]]),baselinesByTest:new Map([[id,base]])});
}
const home=p=>p.storage.pageSnapshots[`${sid}:page_home`].siteFrameMain01040.nodes.root.content.text;
test('01619Q: a second manager editing the same field is flagged even if lineage matches',()=>{
 const base=project(),one=project('ПЕРШИЙ'),two=project('ДРУГИЙ');
 const first=prepare('one',base,one,base),second=prepare('two',base,two,first.project);
 assert.equal(home(second.project),'ДРУГИЙ');
 assert.equal(second.concurrentConflicts01619Q.length,1);
 assert.equal(second.concurrentConflicts01619Q[0].current.includes('ПЕРШИЙ'),true);
 assert.equal(second.concurrentConflicts01619Q[0].proposed.includes('ДРУГИЙ'),true);
 assertSelectedMainScope01619Q({before:first.project,after:second.project,siteId:sid,applied:second.applied});
 assert.deepEqual(second.project.storage.pageSnapshots[`${sid}:page_shop01530_account`],base.storage.pageSnapshots[`${sid}:page_shop01530_account`]);
});
test('01619Q: different manager changes on unrelated fields do not cause a conflict',()=>{
 const base=project(),one=project('ПЕРШИЙ'),two=project('БАЗА');
 two.storage.pageSnapshots[`${sid}:page_shop01530_account`].siteFrameMain01040.nodes.root.content.text='Оновлено кабінет';
 const first=prepare('one',base,one,base),second=prepare('two',base,two,first.project);
 assert.equal(second.concurrentConflicts01619Q.length,0);
 assertSelectedMainScope01619Q({before:first.project,after:second.project,siteId:sid,applied:second.applied});
});
test('01619Q: never mutate unselected system page or global settings through selected changes',()=>{
 const base=project(),updated=structuredClone(base);
 updated.storage.pageSnapshots[`${sid}:page_home`].siteFrameMain01040.nodes.root.content.text='Нова';
 const applied=[{pageId:'page_home',nodeId:'root',field:'content'}];
 assertSelectedMainScope01619Q({before:base,after:updated,siteId:sid,applied});
 updated.storage.pageSnapshots[`${sid}:page_shop01530_account`].siteFrameMain01040.nodes.root.content.text='ГОЛОВНА ПОМИЛКОВО';
 assert.throws(()=>assertSelectedMainScope01619Q({before:base,after:updated,siteId:sid,applied}),{code:'ST_TEST_UNEXPECTED_PAGE_MUTATION_01619Q'});
 updated.storage.pageSnapshots[`${sid}:page_shop01530_account`]=structuredClone(base.storage.pageSnapshots[`${sid}:page_shop01530_account`]);
 updated.storage.globalStyleStore.theme='wrong';
 assert.throws(()=>assertSelectedMainScope01619Q({before:base,after:updated,siteId:sid,applied}),{code:'ST_TEST_UNEXPECTED_PAGE_MUTATION_01619Q'});
});
test('01619Q: whole page apply cannot silently mutate unselected pages, and one-page repair cannot touch metadata',()=>{
 const base=project(),updated=project('NEW');
 assertSelectiveApplyScope01619Q({before:base,after:updated,siteId:sid,selection:{pages:['page_home'],header:false,footer:false,styles:false}});
 assertRepairPageScope01619Q({before:base,after:updated,siteId:sid,pageId:'page_home'});
 updated.site.pages[1].title='HACK';
 assert.throws(()=>assertSelectiveApplyScope01619Q({before:base,after:updated,siteId:sid,selection:{pages:['page_home']}}),{code:'ST_TEST_UNEXPECTED_PAGE_MUTATION_01619Q'});
 assert.throws(()=>assertRepairPageScope01619Q({before:base,after:updated,siteId:sid,pageId:'page_home'}),{code:'ST_TEST_UNEXPECTED_PAGE_MUTATION_01619Q'});
});
test('01619Q: signed plan includes the explicit conflict consent and server revalidates after lock',()=>{
 const options={siteId:sid,revision:123,beforeSha:'x',afterSha:'y',decisions:[{testId:'one',changeId:'ch',decision:'accept'}],sourceShas:[['one','z']]};
 assert.notEqual(token({...options,allowOverwrite01619Q:false}),token({...options,allowOverwrite01619Q:true}));
 const workflow=readFileSync(new URL('../src/site-test-change-workflow-01618.mjs',import.meta.url),'utf8');
 assert.match(workflow,/ST_TEST_CHANGE_CONFLICT_CONFIRM_REQUIRED_01619Q/);
 assert.match(workflow,/pg_advisory_xact_lock/);
 assert.match(workflow,/FOR UPDATE/);
 assert.match(workflow,/assertSelectedMainScope01619Q/);
});
