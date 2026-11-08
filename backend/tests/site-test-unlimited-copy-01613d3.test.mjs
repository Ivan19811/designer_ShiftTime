import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {nextFreeDraftSlot01613D3} from '../src/site-revision-slots-01613d3.mjs';

const read=file=>readFileSync(new URL(file,import.meta.url),'utf8');
test('01613D3 free-slot allocation works beyond five without recycling another draft',()=>{
 assert.equal(nextFreeDraftSlot01613D3([]),1);
 assert.equal(nextFreeDraftSlot01613D3([1,2,3,4,5].map(slot=>({slot}))),6);
 assert.equal(nextFreeDraftSlot01613D3([1,3,6].map(slot=>({slot}))),2);
 assert.equal(nextFreeDraftSlot01613D3(Array.from({length:30},(_,i)=>({slot:i+1}))),31);
});
test('01619E create uses a fresh slot and never changes older manager draft',()=>{
 const workflow=read('../src/site-test-workflow-01613d.mjs');
 const create=workflow.slice(workflow.indexOf('export async function createSiteTest01613D'),workflow.indexOf('// An existing copy can be safely restarted'));
 assert.match(create,/source\.sourceKind!=='canonical'/);
 assert.match(create,/nextFreeDraftSlot01613D3\(drafts\.rows\)/);
 assert.match(create,/captureCanonicalBaseline01619E\(c,site,userId,source\)/);
 assert.match(create,/SELECT revision FROM shifttime_builder_site_projects WHERE site_id=\$1 FOR UPDATE/);
 assert.doesNotMatch(create,/UPDATE shifttime_builder_site_revisions|UPDATE shifttime_site_test_branches_01613d/);
 assert.match(create,/replacedRevisionId:null/);
 const source=read('../src/site-test-source-01613d2.mjs');
 assert.match(source,/if\(cloud\.valid\)/);
 assert.match(source,/sourceKind:'canonical'/);
});
test('01613D3 UI asks before replacing and keeps original publication owner-only',()=>{
 const ui=read('../../js/sites/site-test-workflow-01613d.js');
 const i18n=read('../../js/i18n/locales/uk-site-test-01613d.js');
 assert.match(ui,/window\.confirm\(T\('confirmCreateNew01619E'\)\)/);
 assert.match(i18n,/confirmCreateNew01619E:/);
 assert.match(ui,/action==='promote'[\s\S]*?if\(!isOwner\(\)\)/);
});
