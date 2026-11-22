import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {listSelectableSiteTestChanges01618 as list,composeSelectedSiteTestChanges01618 as compose,resolveSiteTestChangeTarget01618E as resolve} from '../src/site-test-change-select-01618.mjs';
const sid='site_01618e',key=`${sid}:page_home`;
const node=(id,componentType,text,children=[],className='')=>({id,kind:children.length?'container':'block',componentType,children,content:{text},style:{color:'white'},meta:{dom:{tag:'div',className}}});
function project(prefix='old',title='СКОВОРІДКИ',options={}){
 const root=`${prefix}-root`,id=`${prefix}-hero`,other=`${prefix}-other`;
 const nodes={
  [root]:node(root,'layout','',options.addSibling?[id,other,`${prefix}-extra`]:[id,other],'root-element'),
  [id]:node(id,'heading',title,[],'hero-heading'),
  [other]:node(other,'text','Унікальний опис',[],'support-text')
 };
 if(options.addSibling)nodes[`${prefix}-extra`]=node(`${prefix}-extra`,'text','НОВИЙ ЕЛЕМЕНТ',[],'new');
 return {site:{id:sid,pages:[{id:'page_home',title:'Головна'}]},storage:{pageSnapshots:{[key]:{siteFrameMain01040:{version:'st-main-area-snapshot-v1-01040',rootIds:[root],nodes,areaMeta:{}}}}}};
}
const decisions=(change,testId='manager1')=>[{testId,changeId:change.id,decision:'accept'}];
function plan(base,draft,current){const changes=list({baseline:base,submitted:draft,siteId:sid,testId:'manager1'}).changes;
 return compose({current,siteId:sid,decisions:decisions(changes[0]),changesByTest:new Map([['manager1',changes]]),projectsByTest:new Map([['manager1',draft]]),baselinesByTest:new Map([['manager1',base]])});}

test('01618E: remap wholly regenerated but structurally identical original ids by source and uniquely unchanged content',()=>{
 const base=project(),edited=structuredClone(base),current=project('new');
 edited.storage.pageSnapshots[key].siteFrameMain01040.nodes['old-hero'].content.text='СКОВОРІДКИ-1';
 const before=structuredClone(current),result=plan(base,edited,current);
 assert.deepEqual(current,before,'composition must not mutate original');
 assert.equal(result.project.storage.pageSnapshots[key].siteFrameMain01040.nodes['new-hero'].content.text,'СКОВОРІДКИ-1');
 assert.equal(result.applied[0].sourceNodeId,'old-hero');assert.equal(result.applied[0].nodeId,'new-hero');
 assert.equal(result.applied[0].matchMethod,'verified-lineage');
});

test('01618E: strict current id always beats a rebasing guess; second manager can explicitly replace first',()=>{
 const base=project(),draft1=structuredClone(base),draft2=structuredClone(base),current=project('new');
 draft1.storage.pageSnapshots[key].siteFrameMain01040.nodes['old-hero'].content.text='СКОВОРІДКИ-1';
 draft2.storage.pageSnapshots[key].siteFrameMain01040.nodes['old-hero'].content.text='СКОВОРІДКИ-2';
 const c1=list({baseline:base,submitted:draft1,siteId:sid,testId:'one'}).changes;
 const c2=list({baseline:base,submitted:draft2,siteId:sid,testId:'two'}).changes;
 const one=compose({current,siteId:sid,decisions:decisions(c1[0],'one'),changesByTest:new Map([['one',c1]]),projectsByTest:new Map([['one',draft1]]),baselinesByTest:new Map([['one',base]])});
 // The first accepted remap stored an immutable-source lineage token in the
 // current original; that is the only safe way to permit a second overwrite.
 const two=compose({current:one.project,siteId:sid,decisions:decisions(c2[0],'two'),changesByTest:new Map([['two',c2]]),projectsByTest:new Map([['two',draft2]]),baselinesByTest:new Map([['two',base]])});
 assert.equal(two.project.storage.pageSnapshots[key].siteFrameMain01040.nodes['new-hero'].content.text,'СКОВОРІДКИ-2');
 assert.equal(two.applied[0].matchMethod,'preserved-lineage');
});

test('01618E: same node ids allow sequential manager choices on changed current content',()=>{
 const base=project(),draft=structuredClone(base),current=project('old','СКОВОРІДКИ-1');
 draft.storage.pageSnapshots[key].siteFrameMain01040.nodes['old-hero'].content.text='СКОВОРІДКИ-2';
 assert.equal(plan(base,draft,current).project.storage.pageSnapshots[key].siteFrameMain01040.nodes['old-hero'].content.text,'СКОВОРІДКИ-2');
});

test('01618F: insertion of an unrelated sibling does not block a uniquely anchored heading',()=>{
 const base=project(),edited=structuredClone(base),current=project('new','СКОВОРІДКИ',{addSibling:true});
 edited.storage.pageSnapshots[key].siteFrameMain01040.nodes['old-hero'].content.text='СКОВОРІДКИ-1';
 assert.equal(plan(base,edited,current).project.storage.pageSnapshots[key].siteFrameMain01040.nodes['new-hero'].content.text,'СКОВОРІДКИ-1');
});

test('01618E: user-modified current text cannot be remapped using a stale source anchor',()=>{
 const base=project(),edited=structuredClone(base),current=project('new','СКОВОРІДКИ-3');
 edited.storage.pageSnapshots[key].siteFrameMain01040.nodes['old-hero'].content.text='СКОВОРІДКИ-1';
 assert.throws(()=>plan(base,edited,current),/ST_TEST_CHANGE_REMAP_UNSAFE_01618E/);
});

test('01618E: structurally ambiguous repeated blocks reject remap',()=>{
 const base=project(),edited=structuredClone(base),current=project('new');
 const mb=base.storage.pageSnapshots[key].siteFrameMain01040.nodes;
 const mc=current.storage.pageSnapshots[key].siteFrameMain01040.nodes;
 mb['old-other'].content.text='СКОВОРІДКИ';
 mc['new-other'].content.text='СКОВОРІДКИ';
 mb['old-other'].componentType='heading';mc['new-other'].componentType='heading';
 mb['old-other'].meta.dom.className='hero-heading';mc['new-other'].meta.dom.className='hero-heading';
 edited.storage.pageSnapshots[key].siteFrameMain01040.nodes['old-hero'].content.text='СКОВОРІДКИ-1';
 assert.throws(()=>plan(base,edited,current),/ST_TEST_CHANGE_REMAP_UNSAFE_01618E/);
});

test('01618E: missing source baseline or missing current main must remain blocked',()=>{
 const base=project(),edited=structuredClone(base),current=project('new');
 edited.storage.pageSnapshots[key].siteFrameMain01040.nodes['old-hero'].content.text='СКОВОРІДКИ-1';
 const change=list({baseline:base,submitted:edited,siteId:sid,testId:'m'}).changes[0];
 assert.throws(()=>resolve({baseline:null,current,submitted:edited,siteId:sid,change}),/ST_TEST_CHANGE_NODE_MISSING_01618/);
 const empty=structuredClone(current);delete empty.storage.pageSnapshots[key];
 assert.throws(()=>resolve({baseline:base,current:empty,submitted:edited,siteId:sid,change}),/ST_TEST_CHANGE_NODE_MISSING_01618/);
});

test('01618E: unsafe change of same-id component type is not an accepted matching block',()=>{
 const base=project(),edited=structuredClone(base),current=project();
 edited.storage.pageSnapshots[key].siteFrameMain01040.nodes['old-hero'].content.text='СКОВОРІДКИ-1';
 current.storage.pageSnapshots[key].siteFrameMain01040.nodes['old-hero'].componentType='image';
 assert.throws(()=>plan(base,edited,current),/ST_TEST_CHANGE_REMAP_UNSAFE_01618E/);
});

test('01618E: requests remain owner-only, transactional, unpublishing; UI receives diagnostics through canonical i18n',()=>{
 const workflow=readFileSync(new URL('../src/site-test-change-workflow-01618.mjs',import.meta.url),'utf8');
 const ui=readFileSync(new URL('../../js/sites/site-test-workflow-01613d.js',import.meta.url),'utf8');
 const locale=readFileSync(new URL('../../js/i18n/locales/uk-site-test-01613d.js',import.meta.url),'utf8');
 assert.match(workflow,/owner\(scope\)/);assert.match(workflow,/FOR UPDATE/);
 assert.match(workflow,/baselinesByTest/);assert.doesNotMatch(workflow,/deployFiles\(/);
 assert.match(ui,/changeRelinked01618E/);assert.match(ui,/changeNotMatched01618E/);
 assert.match(locale,/ST_TEST_CHANGE_REMAP_UNSAFE_01618E/);
});

test('01618E: two managers accepted in one ordered batch target one rebased node; last selected value wins',()=>{
 const base=project(),draft1=structuredClone(base),draft2=structuredClone(base),current=project('new');
 draft1.storage.pageSnapshots[key].siteFrameMain01040.nodes['old-hero'].content.text='СКОВОРІДКИ-1';
 draft2.storage.pageSnapshots[key].siteFrameMain01040.nodes['old-hero'].content.text='СКОВОРІДКИ-2';
 const c1=list({baseline:base,submitted:draft1,siteId:sid,testId:'one'}).changes[0];
 const c2=list({baseline:base,submitted:draft2,siteId:sid,testId:'two'}).changes[0];
 const result=compose({current,siteId:sid,decisions:[...decisions(c1,'one'),...decisions(c2,'two')],
  changesByTest:new Map([['one',[c1]],['two',[c2]]]),projectsByTest:new Map([['one',draft1],['two',draft2]]),
  baselinesByTest:new Map([['one',base],['two',base]])});
 assert.equal(result.project.storage.pageSnapshots[key].siteFrameMain01040.nodes['new-hero'].content.text,'СКОВОРІДКИ-2');
 assert.equal(result.overwrites.length,1);assert.equal(result.overwrites[0].previousTestId,'one');
 assert.equal(result.overwrites[0].nextTestId,'two');assert.equal(result.applied[1].matchMethod,'preserved-lineage');
});

test('01618E: an invented marker on submitted draft cannot change the chosen original target',()=>{
 const base=project(),draft=structuredClone(base),current=project('new','ІНША НАЗВА');
 const n=draft.storage.pageSnapshots[key].siteFrameMain01040.nodes['old-hero'];
 n.content.text='СКОВОРІДКИ-1';n.meta.siteTestLineage01618E=['f'.repeat(64)];
 assert.throws(()=>plan(base,draft,current),/ST_TEST_CHANGE_REMAP_UNSAFE_01618E/);
});
