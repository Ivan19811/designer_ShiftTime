import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {normalizeSiteTestSelection01615B,composeSiteTestApply01615B,assertApprovedForApply01615B,siteTestApplyPlanToken01615B,assertCanRollbackSiteTest01615B} from '../src/site-test-apply-core-01615b.mjs';
import {projectSha01613D} from '../src/site-test-core-01613d.mjs';
import {classifyProtectedAction01600} from '../src/access-enforcement-core-01600.mjs';
import {assertOnlineSiteAccess01613B} from '../src/secure-online-site-01613b.mjs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const fail=(f,code)=>assert.throws(f,e=>e?.code===code,code);
const sid='site_test',key=id=>`${sid}:${id}`;
const main=text=>({siteFrameMain01040:{rootIds:['section'],nodes:{section:{content:{text}}}}});
const baseline=()=>({site:{id:sid,name:'Original',pages:[{id:'p1',title:'First'},{id:'p2',title:'Second'}]},storage:{pageSnapshots:{[key('p1')]:main('old p1'),[key('p2')]:main('old p2')},headerState:{global:{html:'original head'}},footerState:{global:{html:'original foot'}},globalStyleStore:{size:1},shoppingCart:{orders:['original']},secrets:{apiKey:'private'}},untouched:'original'});
const modified=()=>{const x=structuredClone(baseline());x.site.pages[0].title='Updated First';x.storage.pageSnapshots[key('p1')]=main('new p1');x.storage.pageSnapshots[key('p2')]=main('new p2');x.storage.headerState.global.html='updated head';x.storage.footerState.global.html='updated foot';x.storage.globalStyleStore.size=2;x.storage.shoppingCart.orders=['manager-data'];x.storage.secrets.apiKey='stolen';x.untouched='manager';return x;};
const apply=(selection,current=baseline())=>composeSiteTestApply01615B({baseline:baseline(),current,approved:modified(),siteId:sid,selection});
test('01615B selection is strictly allowlisted and sorted',()=>{
 assert.deepEqual(normalizeSiteTestSelection01615B({pages:['p2','p1'],header:true}),{pages:['p1','p2'],header:true,footer:false,styles:false});
 for(const v of [null,[],{pages:'p1'},{pages:['p1','p1']},{pages:['']},{pages:[],header:'true'},{pages:['p1'],extra:true}])fail(()=>normalizeSiteTestSelection01615B(v),'ST_TEST_APPLY_SELECTION_INVALID_01615B'); // empty uses a distinct error below
});
test('01615B empty selection denied',()=>fail(()=>normalizeSiteTestSelection01615B({pages:[]}), 'ST_TEST_APPLY_EMPTY_01615B'));
test('01615B selected pages applied, unrelated site data and other pages untouched',()=>{
 const a=apply({pages:['p1']}).project,b=baseline();
 assert.equal(a.site.pages[0].title,'Updated First');
 assert.deepEqual(a.storage.pageSnapshots[key('p1')],modified().storage.pageSnapshots[key('p1')]);
 assert.deepEqual(a.site.pages[1],b.site.pages[1]);
 assert.deepEqual(a.storage.pageSnapshots[key('p2')],b.storage.pageSnapshots[key('p2')]);
 for(const k of ['headerState','footerState','globalStyleStore','shoppingCart','secrets'])assert.deepEqual(a.storage[k],b.storage[k]);
 assert.equal(a.untouched,'original');
});
test('01615B selected header and footer do not change main, order, commerce or style',()=>{
 const a=apply({pages:[],header:true,footer:true}).project,b=baseline();
 assert.equal(a.storage.headerState.global.html,'updated head');assert.equal(a.storage.footerState.global.html,'updated foot');
 assert.deepEqual(a.site.pages,b.site.pages);assert.deepEqual(a.storage.pageSnapshots,b.storage.pageSnapshots);
 assert.deepEqual(a.storage.globalStyleStore,b.storage.globalStyleStore);assert.deepEqual(a.storage.shoppingCart,b.storage.shoppingCart);
});
test('01615B selected styles only; no other global or commerce fields are copied',()=>{
 const a=apply({styles:true}).project,b=baseline();
 assert.equal(a.storage.globalStyleStore.size,2);assert.equal(a.storage.headerState.global.html,'original head');
 assert.deepEqual(a.storage.pageSnapshots,b.storage.pageSnapshots);assert.deepEqual(a.storage.secrets,b.storage.secrets);
});
test('01615B unrelated owner edits are preserved while selected content matches base',()=>{
 const changed=baseline();changed.site.name='New brand name';changed.storage.shoppingCart.orders=['new original orders'];
 const a=apply({pages:['p1']},changed).project;
 assert.equal(a.site.name,'New brand name');assert.deepEqual(a.storage.shoppingCart.orders,['new original orders']);
});
test('01615B rejects changed selected page instead of overwriting owner edits',()=>{
 const changed=baseline();changed.storage.pageSnapshots[key('p1')]=main('owner changed');
 fail(()=>apply({pages:['p1']},changed),'ST_TEST_APPLY_CONFLICT_01615B');
});
test('01615B rejects changed selected header and styles',()=>{
 const changed=baseline();changed.storage.headerState.global.html='new owner head';
 fail(()=>apply({header:true},changed),'ST_TEST_APPLY_CONFLICT_01615B');
 const changed2=baseline();changed2.storage.globalStyleStore.size=4;
 fail(()=>apply({styles:true},changed2),'ST_TEST_APPLY_CONFLICT_01615B');
});
test('01615B rejects selected unchanged fields and mismatched site identities',()=>{
 fail(()=>apply({pages:['p-does-not-exist']}),'ST_TEST_APPLY_NOT_CHANGED_01615B');
 const altered=modified();altered.site.id='another';
 fail(()=>composeSiteTestApply01615B({baseline:baseline(),current:baseline(),approved:altered,siteId:sid,selection:{pages:['p1']}}),'ST_TEST_APPLY_PROJECT_INVALID_01615B');
});
test('01615B owner-only approved and hash-locked before composing',()=>{
 const row={state:'approved',revision_kind:'draft',base_project_revision:12,project_json:modified()};row.review_snapshot_sha=projectSha01613D(row.project_json);
 assert.equal(assertApprovedForApply01615B({row,role:'owner',currentRevision:12}),true);
 fail(()=>assertApprovedForApply01615B({row,role:'manager',currentRevision:12}),'ST_TEST_OWNER_REQUIRED_01613D');
 fail(()=>assertApprovedForApply01615B({row:{...row,state:'in_review'},role:'owner',currentRevision:12}),'ST_TEST_APPLY_NOT_APPROVED_01615B');
 fail(()=>assertApprovedForApply01615B({row:{...row,review_snapshot_sha:'changed'},role:'owner',currentRevision:12}),'ST_TEST_REVIEW_CONTENT_CHANGED_01615A');
 fail(()=>assertApprovedForApply01615B({row,role:'owner',currentRevision:13}),'ST_TEST_ORIGINAL_CHANGED_01613D');
});
test('01615B plan token binds source, target revision and selection',()=>{
 const p={testId:'abc',projectRevision:3,beforeSha:'sha1',draftSha:'sha2',selection:{pages:['p1'],header:false},afterSha:'sha3'};
 const t=siteTestApplyPlanToken01615B(p);
 assert.match(t,/^[a-f0-9]{64}$/);
 assert.notEqual(t,siteTestApplyPlanToken01615B({...p,projectRevision:4}));
 assert.notEqual(t,siteTestApplyPlanToken01615B({...p,selection:{pages:['p2'],header:false}}));
 assert.notEqual(t,siteTestApplyPlanToken01615B({...p,afterSha:'another'}));
});
test('01615B rollback requires same applied project fingerprint and revision',()=>{
 const p={state:'applied',backup_revision_id:'rev_backup',applied_project_sha:'sha',applied_project_revision:8};
 assert.equal(assertCanRollbackSiteTest01615B({row:p,role:'owner',revision:8,sha:'sha'}),true);
 fail(()=>assertCanRollbackSiteTest01615B({row:p,role:'manager',revision:8,sha:'sha'}),'ST_TEST_OWNER_REQUIRED_01613D');
 for(const row of [{...p,state:'approved'},{...p,applied_project_sha:'wrong'}, {...p,backup_revision_id:null}])fail(()=>assertCanRollbackSiteTest01615B({row,role:'owner',revision:8,sha:'sha'}),'ST_TEST_ROLLBACK_CONFLICT_01615B');
 fail(()=>assertCanRollbackSiteTest01615B({row:p,role:'owner',revision:9,sha:'sha'}),'ST_TEST_ROLLBACK_CONFLICT_01615B');
});
test('01615B new API routes owner-only even with delegated publish permission',()=>{
 const g={allowed:true,mode:'custom',permissions:['site.publish.execute','site.pages.edit','api.mode.site_actions']};
 for(const action of ['apply','apply-plan','rollback']){
  const p=['api','v1','sites',sid,'test','abc',action];
  assert.equal(classifyProtectedAction01600('POST',p)?.permission,'site.publish.execute');
  fail(()=>assertOnlineSiteAccess01613B({role:'manager'},g,'POST',p),'ST_TEST_OWNER_REQUIRED_01613D');
  assert.equal(assertOnlineSiteAccess01613B({role:'owner'},{allowed:true,mode:'owner'},'POST',p),true);
 }
});
test('01615B migration logs events and service has no deploy or published-site mutation in active apply path',()=>{
 const src=read('../src/site-test-workflow-01613d.mjs'),server=read('../src/server.mjs'),sql=read('../sql/076_site_test_selective_apply_01615b.sql');
 const active=src.slice(src.indexOf('export async function previewSelectiveSiteTestApply01615B'),src.indexOf('export async function promoteSiteTest01613D'));
 assert.match(active,/INSERT INTO shifttime_builder_site_revisions/);
 assert.match(active,/FOR UPDATE/);
 assert.match(active,/UPDATE shifttime_builder_site_projects/);
 assert.match(active,/INSERT INTO shifttime_site_test_apply_events_01615b/);
 assert.doesNotMatch(active,/netlify\.deployFiles|netlify\.restoreSiteDeploy|UPDATE shifttime_published_sites/);
 assert.match(server,/action==='apply-plan'/);assert.match(server,/action==='apply'/);assert.match(server,/action==='rollback'/);
 assert.match(sql,/CREATE TABLE IF NOT EXISTS shifttime_site_test_apply_events_01615b/);
 assert.match(sql,/WHERE action='applied'/);
});
