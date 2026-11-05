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
test('01613D3 create test copy archives only author-owned editable draft, not reviewed or original',()=>{
 const workflow=read('../src/site-test-workflow-01613d.mjs');
 const source=read('../src/site-test-source-01613d2.mjs');
 const route=read('../src/server.mjs');
 assert.match(workflow,/b\.author_user_id=\$5 AND b\.state IN \('editing','preview'\)/);
 assert.match(workflow,/AND r\.kind='draft'/);
 assert.match(workflow,/ORDER BY b\.updated_at DESC,b\.id DESC LIMIT 1 FOR UPDATE OF b,r/);
 assert.match(workflow,/UPDATE shifttime_builder_site_revisions SET kind='archived',slot=0/);
 assert.match(workflow,/UPDATE shifttime_site_test_branches_01613d[\s\S]*?revision_id=\$2/);
 assert.match(workflow,/replacedRevisionId:previous\?\.revision_id\|\|null/);
 assert.match(workflow,/source\.sourceKind!=='published'/);
 assert.match(source,/published\.valid/);
 assert.match(route,/requireSiteTestRevisionAccess01613D/);
});
test('01613D3 UI asks before replacing and keeps original publication owner-only',()=>{
 const ui=read('../../js/sites/site-test-workflow-01613d.js');
 const i18n=read('../../js/i18n/locales/uk-site-test-01613d.js');
 assert.match(ui,/window\.confirm\(T\('confirmCreateReplace'\)\)/);
 assert.match(i18n,/confirmCreateReplace:/);
 assert.match(ui,/action==='promote'[\s\S]*?if\(!isOwner\(\)\)/);
});
