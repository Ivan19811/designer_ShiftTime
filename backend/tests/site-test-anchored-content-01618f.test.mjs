import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolveSiteTestChangeTarget01618E as match,listSelectableSiteTestChanges01618 as list,composeSelectedSiteTestChanges01618 as compose} from '../src/site-test-change-select-01618.mjs';
const siteId='site_f',pageId='page_home',key=`${siteId}:${pageId}`;
const make=(p='old',opts={})=>{
 const root=p+'-root',hero=p+'-hero',caption=p+'-caption';
 const node=(id,kind,componentType,children,text,klass,html)=>({id,kind,componentType,children,content:{text,html},meta:{dom:{tag:kind==='section'?'section':'div',className:klass}},style:{color:'white'}});
 const children=[hero,caption];
 if(opts.addSibling)children.push(p+'-extra');
 const nodes={
  [root]:node(root,'section','section',children,'','shifttime02-main',''),
  [hero]:node(hero,'block','heading',[],opts.text??'СКОВОРІДКИ','sf-main-selection-block hero-heading',opts.html??'<h1>СКОВОРІДКИ</h1>'),
  [caption]:node(caption,'block','text',[],'Крафтові товари','hero-caption','Крафтові товари')
 };
 if(opts.addSibling)nodes[p+'-extra']=node(p+'-extra','block','button',[],'Гортай','hero-actions','Гортай');
 if(opts.duplicate)nodes[p+'-duplicate']=node(p+'-duplicate','block','heading',[],'СКОВОРІДКИ','hero-heading','<h1>СКОВОРІДКИ</h1>');
 if(opts.duplicate)nodes[root].children.push(p+'-duplicate');
 return {site:{id:siteId,pages:[{id:pageId,title:'Головна'}]},storage:{pageSnapshots:{[key]:{siteFrameMain01040:{rootIds:[root],nodes}}}}};
};
function choice(base,submitted,current,testId='one'){
 const changes=list({baseline:base,submitted,siteId,testId}).changes;
 return compose({current,siteId,decisions:[{testId,changeId:changes[0].id,decision:'accept'}],
  changesByTest:new Map([[testId,changes]]),projectsByTest:new Map([[testId,submitted]]),baselinesByTest:new Map([[testId,base]])});
}
function edit(base,newText){const proposal=structuredClone(base),node=proposal.storage.pageSnapshots[key].siteFrameMain01040.nodes['old-hero'];node.content={text:newText,html:`<h1>${newText}</h1>`};return proposal;}
test('01618F: fresh original ids, extra unrelated node, and transient UI class safely rebind',()=>{
 const base=make(),proposal=edit(base,'СКОВОРІДКИ-1'),current=make('new',{addSibling:true});
 current.storage.pageSnapshots[key].siteFrameMain01040.nodes['new-hero'].meta.dom.className='hero-heading is-selected';
 const result=choice(base,proposal,current);
 assert.equal(result.applied[0].matchMethod,'anchored-lineage');
 assert.equal(result.project.storage.pageSnapshots[key].siteFrameMain01040.nodes['new-hero'].content.text,'СКОВОРІДКИ-1');
 assert.equal(result.project.storage.pageSnapshots[key].siteFrameMain01040.nodes['new-extra'].content.text,'Гортай');
});
test('01618F: the same regenerated node may be chosen by two branches based on different source revision hashes',()=>{
 const baseline1=make(),baseline2=structuredClone(baseline1);
 baseline2.storage.pageSnapshots[key].siteFrameMain01040.nodes['old-caption'].style.color='blue';
 const m1=edit(baseline1,'СКОВОРІДКИ-1'),m2=edit(baseline2,'СКОВОРІДКИ-2');
 const current=make('new',{addSibling:true});
 const first=choice(baseline1,m1,current);
 const second=choice(baseline2,m2,first.project,'two');
 assert.equal(second.applied[0].matchMethod,'preserved-lineage');
 assert.equal(second.project.storage.pageSnapshots[key].siteFrameMain01040.nodes['new-hero'].content.text,'СКОВОРІДКИ-2');
});
test('01618F: unrelated owner text edit blocks automatic rebase, with actionable reason',()=>{
 const base=make(),proposal=edit(base,'СКОВОРІДКИ-1'),current=make('new',{text:'МОЯ НОВА НАЗВА',html:'<h1>МОЯ НОВА НАЗВА</h1>'});
 assert.throws(()=>choice(base,proposal,current),e=>e.code==='ST_TEST_CHANGE_REMAP_UNSAFE_01618E'&&e.matchReason01618F==='no-current-anchor');
});
test('01618F: same matching text in several candidate headings must never be guessed',()=>{
 const base=make(),proposal=edit(base,'СКОВОРІДКИ-1'),current=make('new',{duplicate:true});
 assert.throws(()=>choice(base,proposal,current),e=>e.matchReason01618F==='ambiguous-target');
});
test('01618F: authored markup alteration without a recorded lineage is blocked even when visible text is unchanged',()=>{
 const base=make(),proposal=edit(base,'СКОВОРІДКИ-1'),current=make('new',{html:'<h1 class="owner-custom">СКОВОРІДКИ</h1>'});
 assert.throws(()=>choice(base,proposal,current),e=>e.matchReason01618F==='no-current-anchor');
});
test('01618F: regenerated heading inside a different kind of parent must not auto-rebind',()=>{
 const base=make(),proposal=edit(base,'СКОВОРІДКИ-1'),current=make('new');
 current.storage.pageSnapshots[key].siteFrameMain01040.nodes['new-root'].kind='container';
 assert.throws(()=>choice(base,proposal,current),e=>e.matchReason01618F==='parent-changed');
});
test('01618F: errors distinguish absent Render Main snapshot from absent unique content',()=>{
 const base=make(),proposal=edit(base,'СКОВОРІДКИ-1'),current=make('new');
 delete current.storage.pageSnapshots[key];
 const change=list({baseline:base,submitted:proposal,siteId,testId:'x'}).changes[0];
 assert.throws(()=>match({baseline:base,submitted:proposal,current,siteId,change}),e=>e.code==='ST_TEST_CHANGE_NODE_MISSING_01618'&&e.matchReason01618F==='original-main-missing');
});
test('01618F: UI explains why current value is unknown, disables unsafe accept, backend revalidates inside transaction',()=>{
 const ui=readFileSync(new URL('../../js/sites/site-test-workflow-01613d.js',import.meta.url),'utf8');
 const locale=readFileSync(new URL('../../js/i18n/locales/uk-site-test-01613d.js',import.meta.url),'utf8');
 const workflow=readFileSync(new URL('../src/site-test-change-workflow-01618.mjs',import.meta.url),'utf8');
 assert.match(ui,/changeCurrentUnavailable01618F/);
 assert.match(ui,/decision==='accept'&&c.matchStatus==='blocked'/);
 assert.match(ui,/reason_'\+c.matchReason01618F/);
 assert.match(locale,/reason_no-current-anchor/);
 assert.match(workflow,/matchReason01618F/);
 assert.match(workflow,/pg_advisory_xact_lock/);
 assert.match(workflow,/FOR UPDATE/);
});
