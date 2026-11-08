import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {inspectSiteTestOriginalDrift01618H as inspect,composeSiteTestOriginalRepair01618H as compose,siteTestOriginalRepairToken01618H as token} from '../src/site-test-original-repair-01618h.mjs';
const sid='site_real_01618h',id='page_home',k=`${sid}:${id}`,other=`${sid}:page_about`;
function sample(prefix,n){
 const nodes={},rootIds=[];
 for(let i=0;i<n;i++){const key=`${prefix}${i}`;rootIds.push(key);nodes[key]={kind:'block',componentType:'text',content:{text:`Text ${i}`,html:`<h1>Text ${i}</h1>`},children:[]};}
 return {site:{id:sid,pages:[{id,title:'Головна'},{id:'page_about',title:'Про нас'}]},storage:{pageSnapshots:{[k]:{siteFrameMain01040:{nodes,rootIds},otherSettings:{slider:true}},[other]:{siteFrameMain01040:{nodes:{about:{kind:'block',content:'keep'}},rootIds:['about']}}}},meta:{currency:'UAH'}};
}
test('01618H detects incomplete Render Main compared with published canonical',()=>{
 const current=sample('placeholder',2),published=sample('canonical',60),d=inspect({current,published,siteId:sid,pageId:id,publishedRevisionId:'rev_live'});
 assert.equal(d.stale,true);assert.equal(d.currentNodes,2);assert.equal(d.publishedNodes,60);
});
test('01618H restores only one page snapshot and preserves all other owner data',()=>{
 const current=sample('placeholder',2),published=sample('canonical',60);
 current.meta.currency='USD';current.storage.pageSnapshots[other].ownerNote='KEEP';
 const before=structuredClone(current),result=compose({current,published,siteId:sid,pageId:id,publishedRevisionId:'rev_live'});
 assert.equal(Object.keys(result.project.storage.pageSnapshots[k].siteFrameMain01040.nodes).length,60);
 assert.deepEqual(result.project.storage.pageSnapshots[other],before.storage.pageSnapshots[other]);
 assert.equal(result.project.meta.currency,'USD');assert.deepEqual(current,before);assert.notEqual(result.beforeSha,result.afterSha);
});
test('01618H does not replace real redesigned original that is similar in size',()=>{
 const current=sample('owner',55),published=sample('publish',60);
 assert.equal(inspect({current,published,siteId:sid,pageId:id}).stale,false);
 assert.throws(()=>compose({current,published,siteId:sid,pageId:id}),/ST_TEST_ORIGINAL_REPAIR_NOT_NEEDED_01618H/);
});
test('01618H rejects empty, unmatched or same-site-invalid revision instead of guessing',()=>{
 const current=sample('placeholder',2),published=sample('canonical',60);published.site.id='another-site';
 assert.equal(inspect({current,published,siteId:sid,pageId:id}).stale,false);
 assert.throws(()=>compose({current,published,siteId:sid,pageId:id}));
});
test('01618H plan token binds both project revision and published revision',()=>{
 const args={siteId:sid,pageId:id,projectRevision:7,revisionId:'rev_live',beforeSha:'a'.repeat(64),afterSha:'b'.repeat(64)};
 assert.notEqual(token(args),token({...args,projectRevision:8}));
 assert.notEqual(token(args),token({...args,revisionId:'rev_other'}));
});
test('01618H API is owner-only, audited and Netlify-free',()=>{
 const workflow=readFileSync(new URL('../src/site-test-change-workflow-01618.mjs',import.meta.url),'utf8');
 const server=readFileSync(new URL('../src/server.mjs',import.meta.url),'utf8');
 const ui=readFileSync(new URL('../../js/sites/site-test-workflow-01613d.js',import.meta.url),'utf8');
 assert.match(workflow,/source\.rowCount/);assert.match(workflow,/pg_advisory_xact_lock/);
 assert.match(workflow,/FOR UPDATE/);assert.match(workflow,/kind='published'/);assert.match(workflow,/kind:'original-page-repair-01618H'/);
 assert.match(workflow,/ST_TEST_ORIGINAL_PAGE_NOT_SYNCED_01618H/);
 assert.match(server,/action==='repair'&&p\[7\]==='plan'/);assert.match(server,/action==='repair'&&p\[7\]==='apply'/);
 assert.match(ui,/repairConfirmWarning01618H/);assert.match(ui,/mixerRepairPlan01618H/);
 assert.doesNotMatch(workflow,/deployFiles\(/);
});
