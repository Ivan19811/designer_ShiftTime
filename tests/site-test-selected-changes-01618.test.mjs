import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 listSelectableSiteTestChanges01618 as list,
 composeSelectedSiteTestChanges01618 as compose,
 validateSiteTestChangeDecisions01618 as validate,
 siteTestSelectionPlanToken01618 as token
} from '../src/site-test-change-select-01618.mjs';
const sid='site_test_1';
function project(text='СКОВОРІДКИ',other='СТАРИЙ ОПИС'){
 return {version:'01170',site:{id:sid,pages:[{id:'page_home',title:'Головна'}]},storage:{pageSnapshots:{[`${sid}:page_home`]:{siteFrameMain01040:{rootIds:['a','b'],nodes:{a:{content:{text}},b:{content:{text:other}}}}}}}};
}
function selected(id,baseline,updated){return list({baseline,submitted:updated,siteId:sid,testId:id,authorUserId:id}).changes;}
const index=(choices)=>new Map(choices.map(c=>[c[0],c[1]]));
const nodeText=p=>p.storage.pageSnapshots[`${sid}:page_home`].siteFrameMain01040.nodes.a.content.text;

test('01618: accepted manager 1 then manager 2 replaces the same current original field deliberately, without a technical conflict',()=>{
 const base=project(),first=project('СКОВОРІДКИ — 1'),second=project('СКОВОРІДКИ — 2');
 const ch1=selected('manager1',base,first),ch2=selected('manager2',base,second);
 assert.equal(ch1.length,1);assert.equal(ch2.length,1);
 const manager1=compose({current:base,siteId:sid,decisions:[{testId:'manager1',changeId:ch1[0].id,decision:'accept'}],changesByTest:index([['manager1',ch1]]),projectsByTest:index([['manager1',first]])});
 assert.equal(nodeText(manager1.project),'СКОВОРІДКИ — 1');
 const manager2=compose({current:manager1.project,siteId:sid,decisions:[{testId:'manager2',changeId:ch2[0].id,decision:'accept'}],changesByTest:index([['manager2',ch2]]),projectsByTest:index([['manager2',second]])});
 assert.equal(nodeText(manager2.project),'СКОВОРІДКИ — 2');
 assert.equal(nodeText(base),'СКОВОРІДКИ');
});

test('01618: accepting two overlapping changes in one batch is ordered; the last explicit choice wins',()=>{
 const base=project(),first=project('СКОВОРІДКИ — 1'),second=project('СКОВОРІДКИ — 2');
 const ch1=selected('manager1',base,first),ch2=selected('manager2',base,second);
 const result=compose({current:base,siteId:sid,decisions:[{testId:'manager1',changeId:ch1[0].id,decision:'accept'},{testId:'manager2',changeId:ch2[0].id,decision:'accept'}],changesByTest:index([['manager1',ch1],['manager2',ch2]]),projectsByTest:index([['manager1',first],['manager2',second]])});
 assert.equal(nodeText(result.project),'СКОВОРІДКИ — 2');
 assert.equal(result.overwrites.length,1);
 assert.equal(result.applied.length,2);
});

test('01618: manager 1 change #1 and manager 2 change #2 can be mixed; explicit rejections never write',()=>{
 const base=project(),first=project('СКОВОРІДКИ — 1','Опис 1'),second=project('СКОВОРІДКИ — 2','Опис 2');
 const ch1=selected('manager1',base,first),ch2=selected('manager2',base,second);
 const a1=ch1.find(c=>c.nodeId==='a'),a2=ch2.find(c=>c.nodeId==='a'),b2=ch2.find(c=>c.nodeId==='b');
 const decisions=[{testId:'manager1',changeId:a1.id,decision:'accept'},{testId:'manager2',changeId:a2.id,decision:'reject'},{testId:'manager2',changeId:b2.id,decision:'accept'}];
 const result=compose({current:base,siteId:sid,decisions,changesByTest:index([['manager1',ch1],['manager2',ch2]]),projectsByTest:index([['manager1',first],['manager2',second]])});
 assert.equal(nodeText(result.project),'СКОВОРІДКИ — 1');
 assert.equal(result.project.storage.pageSnapshots[`${sid}:page_home`].siteFrameMain01040.nodes.b.content.text,'Опис 2');
 assert.equal(result.rejected.length,1);
});

test('01618: changed text is identified by stable page and node IDs, not array display numbers',()=>{
 const out=selected('manager2',project(),project('NEW'));
 assert.equal(out[0].nodeId,'a');assert.equal(out[0].pageId,'page_home');assert.equal(out[0].field,'content');
 assert.match(out[0].id,/^ch_[0-9a-f]{28}$/);
});

test('01618: selections cannot inject arbitrary keys, duplicate choices or non-submitted IDs',()=>{
 assert.throws(()=>validate([{testId:'a',changeId:'x',decision:'accept'},{testId:'a',changeId:'x',decision:'reject'}]),/ST_TEST_CHANGE_SELECTION_INVALID_01618/);
 assert.throws(()=>validate([{testId:'a',changeId:'x',decision:'delete'}]),/ST_TEST_CHANGE_SELECTION_INVALID_01618/);
 assert.throws(()=>compose({current:project(),siteId:sid,decisions:[{testId:'other',changeId:'ch_unknown',decision:'accept'}],changesByTest:index([]),projectsByTest:index([])}),/ST_TEST_CHANGE_SELECTION_STALE_01618/);
});

test('01618: a changed original version changes the signed plan token',()=>{
 const options={siteId:sid,revision:12,beforeSha:'a',afterSha:'b',decisions:[{testId:'a',changeId:'x',decision:'accept'}],sourceShas:[['a','s']]};
 assert.notEqual(token(options),token({...options,revision:13}));
 assert.notEqual(token(options),token({...options,decisions:[{testId:'a',changeId:'x',decision:'reject'}]}));
});

test('01618: owner only server endpoints and SQL migration, no Netlify side effects',()=>{
 const workflow=readFileSync(new URL('../src/site-test-change-workflow-01618.mjs',import.meta.url),'utf8');
 const server=readFileSync(new URL('../src/server.mjs',import.meta.url),'utf8');
 const sql=readFileSync(new URL('../sql/077_site_test_selected_changes_01618.sql',import.meta.url),'utf8');
 assert.match(workflow,/owner\(scope\)/);assert.match(workflow,/FOR UPDATE/);
 assert.match(workflow,/backup_revision_id/);assert.doesNotMatch(workflow,/deployFiles\(/);
 assert.match(server,/getSiteTestChangeChoices01618/);assert.match(server,/applySiteTestSelectedChanges01618/);
 assert.match(sql,/CREATE TABLE IF NOT EXISTS shifttime_site_test_change_batches_01618/);
});
