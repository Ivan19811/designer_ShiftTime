import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {listManualSiteTestTargets01618G as targets,listSelectableSiteTestChanges01618 as listed,composeSelectedSiteTestChanges01618 as compose,validateSiteTestChangeDecisions01618 as validate} from '../src/site-test-change-select-01618.mjs';
const sid='site_manual_01618g',pid='page_home',key=`${sid}:${pid}`;
function project(prefix,heading='СКОВОРІДКИ',options={}){
 const rid=prefix+'-root',hid=prefix+'-h1',cid=prefix+'-caption';
 const node=(kind,componentType,klass,text,children=[],tag='div')=>({kind,componentType,children,meta:{dom:{tag,className:klass}},content:{text,html:text?`<h1>${text}</h1>`:''},style:{color:'#fff'}});
 const nodes={[rid]:node('section','section','hero-section','',[hid,cid],'section'),
  [hid]:node('block','heading','hero-title',heading),[cid]:node('block','text','hero-caption','Опис')};
 if(options.extra){nodes[prefix+'-extra']=node('block','heading','other-title','ДРУГИЙ ТОВАР');nodes[rid].children.push(prefix+'-extra');}
 return {site:{id:sid,pages:[{id:pid,title:'Головна'}]},storage:{pageSnapshots:{[key]:{siteFrameMain01040:{rootIds:[rid],nodes}}}}};
}
function changed(base,text){const copy=structuredClone(base),node=copy.storage.pageSnapshots[key].siteFrameMain01040.nodes['old-h1'];node.content={text,html:`<h1>${text}</h1>`};return copy;}
const changes=(base,update,id)=>listed({baseline:base,submitted:update,siteId:sid,testId:id}).changes;
function choice(id,base,proposal,target){const ch=changes(base,proposal,id)[0], options=targets({baseline:base,current:target,submitted:proposal,siteId:sid,change:ch});return {ch, options};}
function batch(current,rows){return compose({current,siteId:sid,decisions:rows.map(row=>({testId:row.id,changeId:row.ch.id,decision:'accept',targetNodeId:row.target.nodeId,expectedTargetHash:row.target.expectedTargetHash})),changesByTest:new Map(rows.map(row=>[row.id,[row.ch]])),projectsByTest:new Map(rows.map(row=>[row.id,row.proposal])),baselinesByTest:new Map(rows.map(row=>[row.id,row.base]))});}
test('01618G owner selects a node with changed original content, and only that node is updated',()=>{
 const base=project('old'),proposal=changed(base,'СКОВОРІДКИ-1'),current=project('new','ЗАГОЛОВОК ВЛАСНИКА',{extra:true});
 const {ch,options}=choice('m1',base,proposal,current);
 assert.equal(options.length,1);assert.equal(options[0].nodeId,'new-h1');assert.equal(options[0].currentText,'ЗАГОЛОВОК ВЛАСНИКА');
 const result=batch(current,[{id:'m1',ch,proposal,base,target:options[0]}]);
 assert.equal(result.applied[0].matchMethod,'owner-confirmed-01618G');
 assert.equal(result.project.storage.pageSnapshots[key].siteFrameMain01040.nodes['new-h1'].content.text,'СКОВОРІДКИ-1');
 assert.equal(current.storage.pageSnapshots[key].siteFrameMain01040.nodes['new-h1'].content.text,'ЗАГОЛОВОК ВЛАСНИКА');
 assert.equal(result.project.storage.pageSnapshots[key].siteFrameMain01040.nodes['new-extra'].content.text,'ДРУГИЙ ТОВАР');
});
test('01618G two managers can explicitly approve competing revisions of one field in chosen order',()=>{
 const base1=project('old'),base2=project('old');base2.storage.pageSnapshots[key].siteFrameMain01040.nodes['old-caption'].style.color='#000';
 const proposal1=changed(base1,'СКОВОРІДКИ-1'),proposal2=changed(base2,'СКОВОРІДКИ-2');
 const original=project('new','НОВА НАЗВА');
 const a=choice('m1',base1,proposal1,original),b=choice('m2',base2,proposal2,original);
 const result=batch(original,[{id:'m1',ch:a.ch,base:base1,proposal:proposal1,target:a.options[0]},{id:'m2',ch:b.ch,base:base2,proposal:proposal2,target:b.options[0]}]);
 assert.equal(result.project.storage.pageSnapshots[key].siteFrameMain01040.nodes['new-h1'].content.text,'СКОВОРІДКИ-2');
 assert.equal(result.overwrites.length,1);
});
test('01618G replayed target proof cannot pass after current original changes',()=>{
 const base=project('old'),proposal=changed(base,'СКОВОРІДКИ-1'),original=project('new','МОЯ НАЗВА');
 const match=choice('m1',base,proposal,original),newOriginal=project('new','ЩЕ НОВІША НАЗВА');
 assert.throws(()=>batch(newOriginal,[{id:'m1',ch:match.ch,base,proposal,target:match.options[0]}]),e=>e.code==='ST_TEST_MANUAL_TARGET_STALE_01618G');
});
test('01618G rejects arbitrary mappings to a structurally unrelated node',()=>{
 const base=project('old'),proposal=changed(base,'СКОВОРІДКИ-1'),original=project('new','НОВА НАЗВА',{extra:true});
 const match=choice('m1',base,proposal,original);
 const invalid={...match.options[0],nodeId:'new-caption'};
 assert.throws(()=>batch(original,[{id:'m1',ch:match.ch,base,proposal,target:invalid}]),e=>e.code==='ST_TEST_MANUAL_TARGET_STALE_01618G');
});
test('01618G rejects tampered hash and partial mapping arguments',()=>{
 for(const value of [
  {testId:'m1',changeId:'ch_one',decision:'accept',targetNodeId:'new-h1'},
  {testId:'m1',changeId:'ch_one',decision:'accept',targetNodeId:'new-h1',expectedTargetHash:'no'},
  {testId:'m1',changeId:'ch_one',decision:'reject',targetNodeId:'new-h1',expectedTargetHash:'b'.repeat(64)}
 ])assert.throws(()=>validate([value]),e=>e.code==='ST_TEST_MANUAL_TARGET_INVALID_01618G');
});
test('01618G UI and backend use explicit owner choices, not automatic unsafe bypass',()=>{
 const workflow=readFileSync(new URL('../src/site-test-change-workflow-01618.mjs',import.meta.url),'utf8');
 const ui=readFileSync(new URL('../../js/sites/site-test-workflow-01613d.js',import.meta.url),'utf8');
 const state=readFileSync(new URL('../../js/sites/site-test-choice-state-01618d.js',import.meta.url),'utf8');
 assert.match(ui,/data-manual-test-id/);assert.match(ui,/manualTargets01618G/);assert.match(ui,/decision==='accept'&&c.matchStatus==='blocked'&&!manualReady/);
 assert.match(state,/expectedTargetHash/);assert.match(workflow,/manualTargets01618G/);assert.match(workflow,/FOR UPDATE/);assert.match(workflow,/pg_advisory_xact_lock/);
 assert.doesNotMatch(workflow,/deployFiles\(/);
});
