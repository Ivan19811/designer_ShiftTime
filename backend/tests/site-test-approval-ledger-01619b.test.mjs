import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {assertUnusedAcceptances01619B,acceptanceKey01619B,acceptanceAudit01619B} from '../src/site-test-approval-ledger-01619b.mjs';
import {listSelectableSiteTestChanges01618,composeSelectedSiteTestChanges01618} from '../src/site-test-change-select-01618.mjs';

const siteId='site_safety';
function project(title='СКОВОРІДКИ'){
 return {site:{id:siteId,pages:[{id:'page_home',title:'Головна'}]},storage:{pageSnapshots:{
  [`${siteId}:page_home`]:{siteFrameMain01040:{rootIds:['a'],nodes:{a:{content:{text:title}}}}}
 }}};
}
const getChange=(testId,base,proposal)=>listSelectableSiteTestChanges01618({baseline:base,submitted:proposal,siteId,testId}).changes[0];

test('01619B: the same immutable manager revision cannot apply the same change twice',()=>{
 const revisionByTest=new Map([['manager1','rev_1']]);
 const choice={testId:'manager1',changeId:'ch_abc',decision:'accept'};
 assert.doesNotThrow(()=>assertUnusedAcceptances01619B([choice],revisionByTest,[]));
 const prior=[{revision_id:'rev_1',change_id:'ch_abc',status:'applied'}];
 assert.throws(()=>assertUnusedAcceptances01619B([choice],revisionByTest,prior),/ST_TEST_CHANGE_ALREADY_ACCEPTED_01619B/);
 assert.throws(()=>assertUnusedAcceptances01619B([choice],revisionByTest,[{...prior[0],status:'rolled_back'}]),/ST_TEST_CHANGE_ALREADY_ACCEPTED_01619B/);
 assert.equal(acceptanceKey01619B('rev_1','ch_abc'),'rev_1\u241fch_abc');
});

test('01619B: a NEW submitted manager revision may propose an updated version of the same block',()=>{
 const prior=[{revision_id:'rev_1',change_id:'ch_abc'}];
 assert.doesNotThrow(()=>assertUnusedAcceptances01619B([{testId:'manager1',changeId:'ch_abc',decision:'accept'}],new Map([['manager1','rev_2']]),prior));
 assert.doesNotThrow(()=>assertUnusedAcceptances01619B([{testId:'manager2',changeId:'ch_abc',decision:'accept'}],new Map([['manager2','rev_other']]),prior));
 assert.doesNotThrow(()=>assertUnusedAcceptances01619B([{testId:'manager1',changeId:'ch_abc',decision:'reject'}],new Map([['manager1','rev_1']]),prior));
});

test('01619B: manager 1 and 2 may sequentially change the same original block; audit preserves both values',()=>{
 const original=project(),proposal1=project('СКОВОРІДКИ-1'),proposal2=project('СКОВОРІДКИ-2');
 const first=getChange('m1',original,proposal1),second=getChange('m2',original,proposal2);
 const r1=composeSelectedSiteTestChanges01618({current:original,siteId,decisions:[{testId:'m1',changeId:first.id,decision:'accept'}],
  changesByTest:new Map([['m1',[first]]]),projectsByTest:new Map([['m1',proposal1]]),baselinesByTest:new Map([['m1',original]])});
 const audit1=acceptanceAudit01619B({siteId,applied:r1.applied,before:original,after:r1.project,revisionByTest:new Map([['m1','rev_1']])});
 assert.equal(audit1.length,1);assert.equal(audit1[0].beforePreview.includes('СКОВОРІДКИ'),true);
 assert.equal(audit1[0].afterPreview.includes('СКОВОРІДКИ-1'),true);
 const r2=composeSelectedSiteTestChanges01618({current:r1.project,siteId,decisions:[{testId:'m2',changeId:second.id,decision:'accept'}],
  changesByTest:new Map([['m2',[second]]]),projectsByTest:new Map([['m2',proposal2]]),baselinesByTest:new Map([['m2',original]])});
 const audit2=acceptanceAudit01619B({siteId,applied:r2.applied,before:r1.project,after:r2.project,revisionByTest:new Map([['m2','rev_2']])});
 assert.equal(audit2[0].beforePreview.includes('СКОВОРІДКИ-1'),true);
 assert.equal(audit2[0].afterPreview.includes('СКОВОРІДКИ-2'),true);
 assert.notEqual(audit2[0].beforeFieldSha,audit2[0].afterFieldSha);
});

test('01619B: atomic DB uniqueness, migration, rollback audit and no Netlify publication',()=>{
 const path=p=>readFileSync(new URL(p,import.meta.url),'utf8');
 const sql=path('../sql/078_site_test_approval_ledger_01619b.sql');
 const workflow=path('../src/site-test-change-workflow-01618.mjs');
 const whole=path('../src/site-test-workflow-01613d.mjs');
 assert.match(sql,/PRIMARY KEY \(site_id,revision_id,change_id\)/);
 assert.match(sql,/REFERENCES shifttime_site_test_change_batches_01618/);
 assert.match(workflow,/pg_advisory_xact_lock/);
 assert.match(workflow,/FOR UPDATE/);
 assert.match(workflow,/ON CONFLICT\(site_id,revision_id,change_id\) DO NOTHING/);
 assert.match(workflow,/assertUnusedAcceptances01619B/);
 assert.match(workflow,/UPDATE shifttime_site_test_change_ledger_01619b SET status='rolled_back'/);
 assert.match(whole,/ST_TEST_CHANGE_ALREADY_ACCEPTED_01619B/);
 assert.doesNotMatch(workflow,/deployFiles\(/);
});
