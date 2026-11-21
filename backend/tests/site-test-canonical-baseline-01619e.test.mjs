import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {chooseOriginalSource01613D2} from '../src/site-test-source-01613d2.mjs';
import {classifyProtectedAction01600} from '../src/access-enforcement-core-01600.mjs';
import {assertOnlineSiteAccess01613B} from '../src/secure-online-site-01613b.mjs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const sid='site_123';
const project=heading=>({site:{id:sid,pages:[{id:'page_home'}]},storage:{pageSnapshots:{[sid+':page_home']:{siteFrameMain01040:{rootIds:['hero'],nodes:{hero:{text:heading}}}}}}});

test('01619E separate Render original and historical published source, no stale seed',()=>{
 const current=project('СКОВОРІДКИ-2'),published=project('СКОВОРІДКИ');
 const result=chooseOriginalSource01613D2({siteId:sid,siteProject:current,publishedProject:published,publishedRevisionId:'rev_old'});
 assert.equal(result.sourceKind,'canonical');assert.equal(result.project,current);assert.equal(result.publishedRevisionId,'rev_old');
});
test('01619E source archived in same transaction and linked to immutable draft',()=>{
 const source=read('../src/site-test-workflow-01613d.mjs');
 const capture=source.slice(source.indexOf('async function captureCanonicalBaseline01619E'),source.indexOf('export async function compareSiteTest01614B'));
 assert.match(capture,/VALUES\(\$1,\$2,'archived',0/);assert.match(capture,/source\.publishedRevisionId\|\|null/);
 const create=source.slice(source.indexOf('export async function createSiteTest01613D'),source.indexOf('// An existing copy can be safely restarted'));
 assert.match(create,/const baselineId=await captureCanonicalBaseline01619E/);
 assert.match(create,/JSON\.stringify\(source\.project\),baselineId,userId/);
 assert.match(create,/INSERT INTO shifttime_site_test_branches_01613d/);
 assert.doesNotMatch(create,/UPDATE shifttime_builder_site_projects|UPDATE shifttime_published_sites/);
});
test('01619E compare and visual preview require exact branch baseline',()=>{
 const source=read('../src/site-test-workflow-01613d.mjs'),ui=read('../../js/sites/site-test-workflow-01613d.js');
 const compare=source.slice(source.indexOf('export async function compareSiteTest01614B'),source.indexOf('export async function createSiteTest01613D'));
 assert.match(compare,/immediateTestBaseline01619E/);
 assert.match(compare,/baseline\.project_json,b\.project_json/);
 assert.match(source,/assertTestActor01613D\(scope,userId,b\);\s*const baseline=await immediateTestBaseline01619E/);
 const visual=ui.slice(ui.indexOf('async function visualComparison01614B1'),ui.indexOf('async function visualComparisonPair01618'));
 assert.match(visual,/api\(\)\.baseline\(result\.site\.id,b\.id\)/);
 assert.doesNotMatch(visual,/revisionApi\.list|publishedRow/);
});
test('01619E baseline endpoint is protected, scoped, GET-only',()=>{
 const parts=['api','v1','sites',sid,'test','test_1','baseline'];
 assert.equal(classifyProtectedAction01600('GET',parts)?.permission,'site.pages.view');
 assert.equal(classifyProtectedAction01600('POST',parts),null);
 const grant={allowed:true,mode:'custom',permissions:['api.mode.site_actions','site.pages.view']};
 assert.equal(assertOnlineSiteAccess01613B({role:'manager'},grant,'GET',parts),true);
 assert.match(read('../src/server.mjs'),/action==='baseline'\)return sendJson\(res,200,await getSiteTestBaseline01619E/);
});
test('01619E whole-branch apply and selected changes retain immutable source and conflicts',()=>{
 const workflow=read('../src/site-test-workflow-01613d.mjs');
 const prepare=workflow.slice(workflow.indexOf('async function prepareSelectiveApply01615B'),workflow.indexOf('export async function previewSelectiveSiteTestApply01615B'));
 assert.match(prepare,/immediateTestBaseline01619E/);
 assert.match(prepare,/assertOriginalLineage01615B/);
 assert.match(prepare,/baseline:baseline\.project_json,current:site\.project_json/);
 const choices=read('../src/site-test-change-workflow-01618.mjs');
 assert.match(choices,/JOIN shifttime_builder_site_revisions s ON s\.id=r\.source_revision_id/);
 assert.match(choices,/assertUnusedAcceptances01619B/);
});

test('01619E frontend flushes active draft before switching to a new independent copy',()=>{
 const ui=read('../../js/sites/site-test-workflow-01613d.js');
 const create=ui.slice(ui.indexOf("if(action==='create')"),ui.indexOf("if(!b)throw new Error(T('failed'))"));
 assert.match(create,/flushActive\('shifttime-test-new-copy-preserve-current-01619e'/);
 assert.match(create,/canvasSave\?\.state==='blocked'/);
 assert.match(create,/api\(\)\.create\(s\.id\)/);
 assert.ok(create.indexOf('flushActive')<create.indexOf('api().create(s.id)'));
});
